package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleUssdResponse processes USSD response messages
func HandleUssdResponse(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.UssdResponseData) {
	log.Printf("USSD response from %s: %s", deviceID, data.Status)

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

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "ussd_cancelled",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
