package handlers

import (
	"time"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/utils"
	"tsimsocketserver/websocket"

	"github.com/gofiber/fiber/v2"
)

type DeviceHandler struct {
	wsServer *websocket.WebSocketServer
}

func NewDeviceHandler(wsServer *websocket.WebSocketServer) *DeviceHandler {
	return &DeviceHandler{
		wsServer: wsServer,
	}
}

// GetConnectedDevices returns all connected devices
func (h *DeviceHandler) GetConnectedDevices(c *fiber.Ctx) error {
	devices := h.wsServer.GetConnectedDevices()
	return c.JSON(fiber.Map{
		"success": true,
		"data":    devices,
	})
}

// GetAllDevices returns all devices from database
func (h *DeviceHandler) GetAllDevices(c *fiber.Ctx) error {
	var devices []models.Device

	if err := database.GetDB().Find(&devices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"devices": devices,
	})
}

// SendSms sends SMS to a device
func (h *DeviceHandler) SendSms(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		SimSlot     int    `json:"sim_slot"`
		PhoneNumber string `json:"phone_number"`
		Message     string `json:"message"`
		Priority    string `json:"priority"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("device_id = ?", deviceID).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Generate unique message ID
	messageID := utils.GenerateMessageID()

	// Create SMS log entry
	smsLog := models.SmsLog{
		MessageID:               messageID,
		DeviceID:                &deviceID,
		DeviceName:              &device.Name,
		SimSlot:                 &request.SimSlot,
		DestinationAddr:         &request.PhoneNumber,
		Message:                 &request.Message,
		MessageLength:           len(request.Message),
		Direction:               "outbound",
		Priority:                request.Priority,
		Status:                  "pending",
		DeviceGroupID:           &device.DeviceGroupID,
		DeliveryReportRequested: true,
	}

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create SMS log",
		})
	}

	data := models.SendSmsData{
		SimSlot:     request.SimSlot,
		PhoneNumber: request.PhoneNumber,
		Message:     request.Message,
		Priority:    request.Priority,
	}

	if err := h.wsServer.SendSms(deviceID, data); err != nil {
		// Update SMS log status to failed
		database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": "Failed to send SMS via WebSocket",
		})

		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send SMS",
		})
	}

	return c.JSON(fiber.Map{
		"success":    true,
		"message":    "SMS sent successfully",
		"message_id": messageID,
	})
}

// SendUssd sends USSD command to a device
func (h *DeviceHandler) SendUssd(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		SimSlot   int    `json:"sim_slot"`
		UssdCode  string `json:"ussd_code"`
		SessionID string `json:"session_id,omitempty"`
		Delay     int    `json:"delay"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.SendUssdData{
		SimSlot:   request.SimSlot,
		UssdCode:  request.UssdCode,
		SessionID: request.SessionID,
		Delay:     request.Delay,
	}

	if err := h.wsServer.SendUssd(deviceID, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send USSD command",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "USSD command sent successfully",
	})
}

// FindDevice sends find device command
func (h *DeviceHandler) FindDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		Message string `json:"message"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.FindDeviceData{
		Message: request.Message,
	}

	if err := h.wsServer.FindDevice(deviceID, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send find device command",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Find device command sent successfully",
	})
}

// StartAlarm sends alarm start command
func (h *DeviceHandler) StartAlarm(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		AlarmType string `json:"alarm_type"`
		Message   string `json:"message"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.AlarmStartData{
		AlarmType: request.AlarmType,
		Message:   request.Message,
	}

	if err := h.wsServer.StartAlarm(deviceID, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to start alarm",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Alarm started successfully",
	})
}

// StopAlarm sends alarm stop command
func (h *DeviceHandler) StopAlarm(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	if err := h.wsServer.StopAlarm(deviceID); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to stop alarm",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Alarm stopped successfully",
	})
}

// UpdateDeviceName updates device name
func (h *DeviceHandler) UpdateDeviceName(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		Name string `json:"name"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if request.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device name is required",
		})
	}

	// Update device name in database
	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Update("name", request.Name).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update device name",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device name updated successfully",
	})
}

// GetDeviceByID returns a specific device by ID
func (h *DeviceHandler) GetDeviceByID(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var device models.Device
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	return c.JSON(device)
}

// ToggleDevice toggles device active status
func (h *DeviceHandler) ToggleDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		Action string `json:"action"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("device_id = ?", deviceID).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device status
	var isActive bool
	switch request.Action {
	case "ENABLE":
		isActive = true
	case "DISABLE":
		isActive = false
	default:
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid action. Must be 'ENABLE' or 'DISABLE'",
		})
	}

	if err := database.GetDB().Model(&device).Update("is_active", isActive).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update device status",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device status updated successfully",
		"data": fiber.Map{
			"device_id": deviceID,
			"is_active": isActive,
		},
	})
}

// ExitMaintenanceMode exits maintenance mode for a device
func (h *DeviceHandler) ExitMaintenanceMode(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("device_id = ?", deviceID).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device to exit maintenance mode
	updates := map[string]interface{}{
		"maintenance_mode":       false,
		"maintenance_reason":     "",
		"maintenance_started_at": "",
		"is_active":              true, // Re-enable device when exiting maintenance
	}

	if err := database.GetDB().Model(&device).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to exit maintenance mode",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device exited maintenance mode successfully",
		"data": fiber.Map{
			"device_id":        deviceID,
			"maintenance_mode": false,
			"is_active":        true,
		},
	})
}

// EnterMaintenanceMode enters maintenance mode for a device
func (h *DeviceHandler) EnterMaintenanceMode(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	var request struct {
		Reason string `json:"reason"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if request.Reason == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Maintenance reason is required",
		})
	}

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("device_id = ?", deviceID).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device to enter maintenance mode
	updates := map[string]interface{}{
		"maintenance_mode":       true,
		"maintenance_reason":     request.Reason,
		"maintenance_started_at": time.Now().Format("2006-01-02 15:04:05"),
		"is_active":              false, // Disable device when entering maintenance
	}

	if err := database.GetDB().Model(&device).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to enter maintenance mode",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device entered maintenance mode successfully",
		"data": fiber.Map{
			"device_id":          deviceID,
			"maintenance_mode":   true,
			"maintenance_reason": request.Reason,
			"is_active":          false,
		},
	})
}

// DeleteDevice deletes a device
func (h *DeviceHandler) DeleteDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	if deviceID == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device ID is required",
		})
	}

	// Delete device from database
	if err := database.GetDB().Where("imei = ?", deviceID).Delete(&models.Device{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to delete device",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device deleted successfully",
	})
}
