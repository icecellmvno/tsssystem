package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleUssdResponse processes USSD response messages
func HandleUssdResponse(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.UssdResponseData) {
	log.Printf("USSD response from %s: %s", deviceID, data.Status)

	// Save USSD log to database
	ussdLog := models.UssdLog{
		SessionID:       data.SessionID,
		DeviceID:        deviceID,
		UssdCode:        "",  // USSD code not available in response data
		RequestMessage:  nil, // Request message not available in response data
		ResponseMessage: &data.Response,
		Status:          data.Status,
		SentAt:          nil, // Sent time not available in response data
		ReceivedAt:      nil, // Received time not available in response data
		ErrorMessage:    nil,
		Metadata:        nil, // Metadata not available in response data
	}

	if err := database.GetDB().Create(&ussdLog).Error; err != nil {
		log.Printf("Error saving USSD log to database: %v", err)
	} else {
		log.Printf("USSD log saved to database for device %s", deviceID)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "ussd_response",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleUssdResponseFailed processes USSD response failed messages
func HandleUssdResponseFailed(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.UssdResponseFailedData) {
	log.Printf("USSD response failed from %s: %s", deviceID, data.ErrorMessage)

	// Save USSD log to database
	ussdLog := models.UssdLog{
		SessionID:       data.SessionID,
		DeviceID:        deviceID,
		UssdCode:        data.UssdCode,
		RequestMessage:  nil,
		ResponseMessage: nil,
		Status:          data.Status,
		SentAt:          nil,
		ReceivedAt:      nil,
		ErrorMessage:    &data.ErrorMessage,
		Metadata:        nil,
	}

	if err := database.GetDB().Create(&ussdLog).Error; err != nil {
		log.Printf("Error saving USSD log to database: %v", err)
	} else {
		log.Printf("USSD log saved to database for device %s", deviceID)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "ussd_response_failed",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleUssdCode processes USSD code messages
func HandleUssdCode(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.UssdCodeData) {
	log.Printf("USSD code from %s: %s from %s", deviceID, data.UssdCode, data.Sender)

	// Save USSD log to database
	ussdLog := models.UssdLog{
		SessionID:       "",
		DeviceID:        deviceID,
		UssdCode:        data.UssdCode,
		RequestMessage:  nil,
		ResponseMessage: nil,
		Status:          "received",
		SentAt:          nil,
		ReceivedAt:      nil,
		ErrorMessage:    nil,
		Metadata:        nil,
	}

	if err := database.GetDB().Create(&ussdLog).Error; err != nil {
		log.Printf("Error saving USSD log to database: %v", err)
	} else {
		log.Printf("USSD log saved to database for device %s", deviceID)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "ussd_code",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleUssdCancelled processes USSD cancelled messages
func HandleUssdCancelled(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.UssdCancelledData) {
	log.Printf("USSD cancelled from %s: %s - %s", deviceID, data.UssdCode, data.Reason)

	// Save USSD log to database
	ussdLog := models.UssdLog{
		SessionID:       data.SessionID,
		DeviceID:        deviceID,
		UssdCode:        data.UssdCode,
		RequestMessage:  nil,
		ResponseMessage: nil,
		Status:          "cancelled",
		SentAt:          nil,
		ReceivedAt:      nil,
		ErrorMessage:    &data.Reason,
		Metadata:        nil,
	}

	if err := database.GetDB().Create(&ussdLog).Error; err != nil {
		log.Printf("Error saving USSD log to database: %v", err)
	} else {
		log.Printf("USSD log saved to database for device %s", deviceID)
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "ussd_cancelled",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
