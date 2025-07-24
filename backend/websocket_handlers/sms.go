package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleSmsLog processes SMS log messages from devices
func HandleSmsLog(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.SmsLogData) {
	log.Printf("SMS log from %s: %s to %s - %s", deviceID, data.Status, data.PhoneNumber, data.Message)

	// Update SMS log in database
	var smsLog models.SmsLog
	if err := database.GetDB().Where("device_id = ? AND destination_addr = ? AND message = ?",
		deviceID, data.PhoneNumber, data.Message).Order("created_at DESC").First(&smsLog).Error; err == nil {

		now := time.Now()
		updates := map[string]interface{}{
			"status": data.Status,
		}

		switch data.Status {
		case "sent":
			updates["sent_at"] = &now
		case "delivered":
			updates["delivered_at"] = &now
			updates["delivery_report_received_at"] = &now
			updates["delivery_report_status"] = "delivered"
		case "failed":
			updates["error_message"] = "SMS sending failed"
		}

		database.GetDB().Model(&smsLog).Updates(updates)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sms_log",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleSmsMessage processes SMS message notifications
func HandleSmsMessage(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.SmsMessageData) {
	log.Printf("SMS message from %s: %s from %s", deviceID, data.Direction, data.PhoneNumber)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sms_message",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleSmsDeliveryReport processes SMS delivery report messages
func HandleSmsDeliveryReport(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.SmsDeliveryReportData) {
	log.Printf("SMS delivery report from %s: %s to %s - %s", deviceID, data.Status, data.PhoneNumber, data.MessageID)

	// Update SMS log in database
	var smsLog models.SmsLog
	if err := database.GetDB().Where("message_id = ?", data.MessageID).First(&smsLog).Error; err == nil {
		now := time.Now()
		updates := map[string]interface{}{
			"delivery_report_status":      data.Status,
			"delivery_report_received_at": &now,
		}

		if data.Status == "delivered" {
			updates["status"] = "delivered"
			updates["delivered_at"] = &now
		} else if data.Status == "failed" {
			updates["status"] = "failed"
			updates["error_message"] = "Delivery failed"
		}

		database.GetDB().Model(&smsLog).Updates(updates)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sms_delivery_report",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
