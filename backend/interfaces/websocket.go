package interfaces

import "tsimsocketserver/models"

// WebSocketServerInterface defines the interface for WebSocket server operations
type WebSocketServerInterface interface {
	BroadcastMessage(message models.WebSocketMessage)
}
