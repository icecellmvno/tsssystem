package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleMmsReceived processes MMS received messages from devices
func HandleMmsReceived(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.MmsReceivedData) {
	log.Printf("MMS received from %s: %s - %s (%d parts)", deviceID, data.Sender, data.Subject, data.PartsCount)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "mms_received",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleRcsReceived processes RCS received messages from devices
func HandleRcsReceived(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.RcsReceivedData) {
	log.Printf("RCS received from %s: %s - %s", deviceID, data.Sender, data.MessageType)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "rcs_received",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
