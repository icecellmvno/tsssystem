package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleDeviceStatus processes device status messages
func HandleDeviceStatus(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.DeviceStatusData) {
	log.Printf("Device status from %s: %s", deviceID, data.Status)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "device_status",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleFindDeviceSuccess processes find device success messages
func HandleFindDeviceSuccess(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.FindDeviceSuccessData) {
	log.Printf("Find device success from %s: %s", deviceID, data.Message)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "find_device_success",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleFindDeviceFailed processes find device failed messages
func HandleFindDeviceFailed(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.FindDeviceFailedData) {
	log.Printf("Find device failed from %s: %s", deviceID, data.Error)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "find_device_failed",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}
