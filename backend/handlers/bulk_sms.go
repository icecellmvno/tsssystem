package handlers

import (
	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/utils"
	"tsimsocketserver/websocket"

	"github.com/gofiber/fiber/v2"
)

type BulkSmsHandler struct {
	wsServer *websocket.WebSocketServer
}

func NewBulkSmsHandler(wsServer *websocket.WebSocketServer) *BulkSmsHandler {
	return &BulkSmsHandler{
		wsServer: wsServer,
	}
}

// BulkSmsRequest represents the request structure for bulk SMS sending
type BulkSmsRequest struct {
	DeviceGroupID uint     `json:"device_group_id" validate:"required"`
	PhoneNumbers  []string `json:"phone_numbers" validate:"required,min=1"`
	Message       string   `json:"message" validate:"required"`
	SimSlot       int      `json:"sim_slot" validate:"required,min=1,max=2"`
	Priority      string   `json:"priority"`
	CampaignID    *string  `json:"campaign_id"`
	BatchID       *string  `json:"batch_id"`
}

// BulkSmsResponse represents the response structure for bulk SMS sending
type BulkSmsResponse struct {
	Success     bool     `json:"success"`
	Message     string   `json:"message"`
	TotalSent   int      `json:"total_sent"`
	TotalFailed int      `json:"total_failed"`
	MessageIDs  []string `json:"message_ids"`
	Failed      []string `json:"failed_numbers"`
}

// SendBulkSms sends SMS to multiple phone numbers using devices from a device group
func (h *BulkSmsHandler) SendBulkSms(c *fiber.Ctx) error {
	var req BulkSmsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Get device group information
	var deviceGroup models.DeviceGroup
	if err := database.GetDB().First(&deviceGroup, req.DeviceGroupID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device group not found",
		})
	}

	// Get online devices from the device group
	var devices []models.Device
	if err := database.GetDB().Where("device_group_id = ? AND is_online = ? AND is_active = ?",
		req.DeviceGroupID, true, true).Find(&devices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch devices",
		})
	}

	if len(devices) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "No online devices found in the device group",
		})
	}

	// Generate batch ID if not provided
	if req.BatchID == nil {
		batchID := "batch_" + utils.GenerateMessageID()
		req.BatchID = &batchID
	}

	response := BulkSmsResponse{
		Success:     true,
		Message:     "Bulk SMS processing completed",
		TotalSent:   0,
		TotalFailed: 0,
		MessageIDs:  []string{},
		Failed:      []string{},
	}

	// Distribute SMS across available devices
	deviceIndex := 0
	for _, phoneNumber := range req.PhoneNumbers {
		// Select device in round-robin fashion
		device := devices[deviceIndex%len(devices)]
		deviceIndex++

		// Generate unique message ID
		messageID := utils.GenerateMessageID()

		// Create SMS log entry
		smsLog := models.SmsLog{
			MessageID:               messageID,
			DeviceID:                &device.IMEI,
			DeviceName:              &device.Name,
			SimSlot:                 &req.SimSlot,
			DestinationAddr:         &phoneNumber,
			Message:                 &req.Message,
			MessageLength:           len(req.Message),
			Direction:               "outbound",
			Priority:                req.Priority,
			Status:                  "pending",
			DeviceGroupID:           &req.DeviceGroupID,
			CampaignID:              req.CampaignID,
			BatchID:                 req.BatchID,
			DeliveryReportRequested: true,
		}

		if err := database.GetDB().Create(&smsLog).Error; err != nil {
			response.TotalFailed++
			response.Failed = append(response.Failed, phoneNumber)
			continue
		}

		// Send SMS via WebSocket
		data := models.SendSmsData{
			SimSlot:     req.SimSlot,
			PhoneNumber: phoneNumber,
			Message:     req.Message,
			Priority:    req.Priority,
		}

		if err := h.wsServer.SendSms(device.IMEI, data); err != nil {
			// Update SMS log status to failed
			database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
				"status":        "failed",
				"error_message": "Failed to send SMS via WebSocket",
			})

			response.TotalFailed++
			response.Failed = append(response.Failed, phoneNumber)
		} else {
			response.TotalSent++
			response.MessageIDs = append(response.MessageIDs, messageID)
		}
	}

	return c.JSON(response)
}

// GetBulkSmsStatus retrieves the status of bulk SMS operations
func (h *BulkSmsHandler) GetBulkSmsStatus(c *fiber.Ctx) error {
	batchID := c.Query("batch_id")
	if batchID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Batch ID is required",
		})
	}

	var smsLogs []models.SmsLog
	if err := database.GetDB().Where("batch_id = ?", batchID).Find(&smsLogs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch SMS logs",
		})
	}

	// Calculate statistics
	total := len(smsLogs)
	sent := 0
	delivered := 0
	failed := 0
	pending := 0

	for _, log := range smsLogs {
		switch log.Status {
		case "sent":
			sent++
		case "delivered":
			delivered++
		case "failed":
			failed++
		default:
			pending++
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"batch_id":  batchID,
			"total":     total,
			"sent":      sent,
			"delivered": delivered,
			"failed":    failed,
			"pending":   pending,
			"logs":      smsLogs,
		},
	})
}
