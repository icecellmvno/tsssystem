package rabbitmq

import (
	"encoding/json"
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/utils"
	"tsimsocketserver/websocket"
)

// SmsMessage represents the SMS message structure for RabbitMQ
type SmsMessage struct {
	SystemID    string `json:"system_id"`
	DeviceID    string `json:"device_id"`
	PhoneNumber string `json:"phone_number"`
	Message     string `json:"message"`
	SimSlot     int    `json:"sim_slot"`
	Priority    string `json:"priority"`
	MessageID   string `json:"message_id"`
}

// SmsResponse represents the SMS response structure
type SmsResponse struct {
	SystemID  string `json:"system_id"`
	MessageID string `json:"message_id"`
	Status    string `json:"status"`
	Error     string `json:"error,omitempty"`
}

// SmsConsumer handles SMS messages from RabbitMQ
type SmsConsumer struct {
	rabbitMQ *RabbitMQHandler
	wsServer *websocket.WebSocketServer
}

// NewSmsConsumer creates a new SMS consumer
func NewSmsConsumer(rabbitMQ *RabbitMQHandler, wsServer *websocket.WebSocketServer) *SmsConsumer {
	return &SmsConsumer{
		rabbitMQ: rabbitMQ,
		wsServer: wsServer,
	}
}

// StartConsuming starts consuming SMS messages from RabbitMQ
func (sc *SmsConsumer) StartConsuming(queueName string) error {
	log.Printf("Starting SMS consumer for queue: %s", queueName)

	return sc.rabbitMQ.ConsumeQueue(queueName, func(message []byte) error {
		return sc.processSmsMessage(message)
	})
}

// processSmsMessage processes a single SMS message
func (sc *SmsConsumer) processSmsMessage(message []byte) error {
	var smsMsg SmsMessage
	if err := json.Unmarshal(message, &smsMsg); err != nil {
		log.Printf("Error unmarshaling SMS message: %v", err)
		return err
	}

	log.Printf("Processing SMS message: %s to %s", smsMsg.MessageID, smsMsg.PhoneNumber)

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("imei = ?", smsMsg.DeviceID).First(&device).Error; err != nil {
		log.Printf("Device not found: %s", smsMsg.DeviceID)
		return sc.sendSmsResponse(smsMsg, "failed", "Device not found")
	}

	// Generate message ID if not provided
	if smsMsg.MessageID == "" {
		smsMsg.MessageID = utils.GenerateMessageID()
	}

	// Create SMS log entry
	smsLog := models.SmsLog{
		MessageID:               smsMsg.MessageID,
		DeviceID:                &smsMsg.DeviceID,
		DeviceName:              &device.Name,
		SimSlot:                 &smsMsg.SimSlot,
		DestinationAddr:         &smsMsg.PhoneNumber,
		Message:                 &smsMsg.Message,
		MessageLength:           len(smsMsg.Message),
		Direction:               "outbound",
		Priority:                smsMsg.Priority,
		Status:                  "pending",
		DeviceGroupID:           &device.DeviceGroupID,
		DeliveryReportRequested: true,
		QueuedAt:                &time.Time{},
	}

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		log.Printf("Error creating SMS log: %v", err)
		return sc.sendSmsResponse(smsMsg, "failed", "Failed to create SMS log")
	}

	// Send SMS via WebSocket
	data := models.SendSmsData{
		SimSlot:     smsMsg.SimSlot,
		PhoneNumber: smsMsg.PhoneNumber,
		Message:     smsMsg.Message,
		Priority:    smsMsg.Priority,
	}

	if err := sc.wsServer.SendSms(smsMsg.DeviceID, data); err != nil {
		// Update SMS log status to failed
		database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": "Failed to send SMS via WebSocket",
		})

		log.Printf("Error sending SMS via WebSocket: %v", err)
		return sc.sendSmsResponse(smsMsg, "failed", "Failed to send SMS")
	}

	// Update SMS log status to queued
	database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
		"status": "queued",
	})

	log.Printf("SMS message sent successfully: %s", smsMsg.MessageID)
	return sc.sendSmsResponse(smsMsg, "queued", "")
}

// sendSmsResponse sends a response back to RabbitMQ
func (sc *SmsConsumer) sendSmsResponse(smsMsg SmsMessage, status, error string) error {
	response := SmsResponse{
		SystemID:  smsMsg.SystemID,
		MessageID: smsMsg.MessageID,
		Status:    status,
		Error:     error,
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling SMS response: %v", err)
		return err
	}

	// Send response to response queue
	responseQueueName := smsMsg.SystemID + "_response"
	if err := sc.rabbitMQ.PublishMessage(responseQueueName, responseBytes); err != nil {
		log.Printf("Error publishing SMS response: %v", err)
		return err
	}

	return nil
}
