package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleHeartbeat processes heartbeat messages from devices
func HandleHeartbeat(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.HeartbeatData) {
	log.Printf("Heartbeat from %s: Battery %d%%, Signal %d/5", deviceID, data.BatteryLevel, data.SignalStrength)

	// Update device info in database
	UpdateDeviceInfo(wsServer, deviceID, data)

	// Get device name from database for frontend
	var device models.Device
	deviceName := ""
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err == nil {
		deviceName = device.Name
	}

	// Create heartbeat data with device name
	heartbeatData := map[string]interface{}{
		"device_info":     data.DeviceInfo,
		"battery_level":   data.BatteryLevel,
		"battery_status":  data.BatteryStatus,
		"signal_strength": data.SignalStrength,
		"signal_dbm":      data.SignalDBM,
		"network_type":    data.NetworkType,
		"sim_cards":       data.SimCards,
		"location":        data.Location,
		"device_name":     deviceName, // Add device name from database
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "heartbeat",
		Data:      heartbeatData,
		Timestamp: time.Now().UnixMilli(),
	})
}

// UpdateDeviceInfo updates device information from heartbeat data
func UpdateDeviceInfo(wsServer interfaces.WebSocketServerInterface, deviceID string, heartbeatData models.HeartbeatData) {
	// Update device info from heartbeat (don't touch user-editable name)
	now := time.Now()
	updates := map[string]interface{}{
		"manufacturer":    heartbeatData.DeviceInfo.Manufacturer,
		"model":           heartbeatData.DeviceInfo.Model,
		"android_version": heartbeatData.DeviceInfo.AndroidVersion,
		"battery_level":   heartbeatData.BatteryLevel,
		"battery_status":  heartbeatData.BatteryStatus,
		"signal_strength": heartbeatData.SignalStrength,
		"signal_dbm":      heartbeatData.SignalDBM,
		"network_type":    heartbeatData.NetworkType,
		"latitude":        heartbeatData.Location.Latitude,
		"longitude":       heartbeatData.Location.Longitude,
		"last_seen":       &now,
	}

	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error; err != nil {
		log.Printf("Error updating device info: %v", err)
	}

	// Update SIM card info
	UpdateDeviceSimCards(deviceID, heartbeatData.SimCards)
}

// UpdateDeviceSimCards updates SIM card information for a device
func UpdateDeviceSimCards(deviceID string, simCards []models.SimCard) {
	// Delete existing SIM cards for this device
	if err := database.GetDB().Where("device_imei = ?", deviceID).Delete(&models.DeviceSimCard{}).Error; err != nil {
		log.Printf("Error deleting existing SIM cards: %v", err)
		return
	}

	// Insert new SIM card info
	for _, simCard := range simCards {
		deviceSimCard := models.DeviceSimCard{
			DeviceIMEI:     deviceID,
			SlotIndex:      simCard.SlotIndex,
			CarrierName:    simCard.CarrierName,
			PhoneNumber:    simCard.PhoneNumber,
			NetworkMCC:     simCard.NetworkMCC,
			NetworkMNC:     simCard.NetworkMNC,
			IsActive:       simCard.IsActive,
			IMEI:           simCard.IMEI,
			IMSI:           simCard.IMSI,
			ICCID:          simCard.ICCID,
			SignalStrength: simCard.SignalStrength,
			SignalDBM:      simCard.SignalDBM,
			NetworkType:    simCard.NetworkType,
		}

		if err := database.GetDB().Create(&deviceSimCard).Error; err != nil {
			log.Printf("Error creating SIM card record: %v", err)
		}
	}
}
