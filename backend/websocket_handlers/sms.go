package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
	"tsimsocketserver/services"
	"tsimsocketserver/utils"
)

// Global delivery report service instance
var deliveryReportService *services.DeliveryReportService

// SetDeliveryReportService sets the global delivery report service
func SetDeliveryReportService(service *services.DeliveryReportService) {
	deliveryReportService = service
}

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

	// Only process received SMS messages
	if data.Direction == "received" {
		// Get device information
		var device models.Device
		if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err != nil {
			log.Printf("Device not found for IMEI %s: %v", deviceID, err)
			return
		}

		// Get SIM card information for the specified slot
		var deviceSimCard models.DeviceSimCard
		var simcardName, simcardNumber, simcardICCID, deviceIMSI *string

		if err := database.GetDB().Where("device_imei = ? AND slot_index = ?", deviceID, data.SimSlot).First(&deviceSimCard).Error; err == nil {
			simcardName = &deviceSimCard.CarrierName
			simcardNumber = &deviceSimCard.PhoneNumber
			simcardICCID = &deviceSimCard.ICCID
			deviceIMSI = &deviceSimCard.IMSI
		}

		// Generate unique message ID for inbound SMS
		messageID := utils.GenerateMessageID()

		// Create SMS log entry for inbound message
		smsLog := models.SmsLog{
			MessageID:               messageID,
			DeviceID:                &deviceID,
			DeviceName:              &device.Name,
			DeviceIMEI:              &device.IMEI,
			DeviceIMSI:              deviceIMSI,
			SimcardName:             simcardName,
			SimSlot:                 &data.SimSlot,
			SimcardNumber:           simcardNumber,
			SimcardICCID:            simcardICCID,
			SourceAddr:              &data.PhoneNumber,                                    // Sender's phone number
			SourceConnector:         func() *string { s := "android"; return &s }(),     // Android device
			SourceUser:              func() *string { s := "device"; return &s }(),      // Device itself
			DestinationAddr:         simcardNumber,                                       // Device's SIM number
			Message:                 &data.Message,
			MessageLength:           len(data.Message),
			Direction:               "inbound",
			Priority:                "normal",
			Status:                  "received",
			DeviceGroupID:           &device.DeviceGroupID,
			DeviceGroup:             &device.DeviceGroup,
			CountrySiteID:           &device.CountrySiteID,
			CountrySite:             &device.CountrySite,
			DeliveryReportRequested: false, // Inbound SMS don't need delivery reports
			ReceivedAt:              func() *time.Time { now := time.Now(); return &now }(),
		}

		// If destination address is empty, set it to "Device"
		if smsLog.DestinationAddr == nil || *smsLog.DestinationAddr == "" {
			deviceDest := "Device"
			smsLog.DestinationAddr = &deviceDest
		}

		if err := database.GetDB().Create(&smsLog).Error; err != nil {
			log.Printf("Error creating inbound SMS log: %v", err)
		} else {
			log.Printf("Inbound SMS logged successfully: %s from %s to device %s", messageID, data.PhoneNumber, deviceID)
		}
	}

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

		log.Printf("Updated SMS log %s with delivery report status: %s", data.MessageID, data.Status)

		// Publish delivery report to SMPP server if delivery report service is available
		if deliveryReportService != nil {
			if err := deliveryReportService.PublishDeliveryReport(smsLog, data.Status); err != nil {
				log.Printf("Failed to publish delivery report to SMPP: %v", err)
			}
		}
	} else {
		log.Printf("SMS log not found for message ID: %s", data.MessageID)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sms_delivery_report",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
