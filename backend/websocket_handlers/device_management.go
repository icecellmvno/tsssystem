package websocket_handlers

import (
	"fmt"
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// SaveDeviceToDatabase creates or updates a device in the database
func SaveDeviceToDatabase(deviceID string, deviceGroup models.DeviceGroup, wsServer interfaces.WebSocketServerInterface) {
	// Check if device already exists
	var existingDevice models.Device
	if err := database.GetDB().Where("imei = ?", deviceID).First(&existingDevice).Error; err != nil {
		// Device doesn't exist, create new one with auto-generated name
		now := time.Now()
		device := models.Device{
			IMEI:          deviceID,
			Name:          fmt.Sprintf("Device-%s", deviceID), // Auto-generated name: Device-{IMEI}
			DeviceGroupID: deviceGroup.ID,
			DeviceGroup:   deviceGroup.DeviceGroup,
			SitenameID:    deviceGroup.SitenameID,
			Sitename:      deviceGroup.Sitename,
			DeviceType:    "android",
			IsOnline:      true,
			LastSeen:      &now,
		}

		if err := database.GetDB().Create(&device).Error; err != nil {
			log.Printf("Error creating device in database: %v", err)
		} else {
			log.Printf("Device created in database: %s with name: %s", deviceID, device.Name)

			// Broadcast device online status to frontend
			wsServer.BroadcastMessage(models.WebSocketMessage{
				Type: "device_online",
				Data: map[string]interface{}{
					"device_id":    deviceID,
					"device_name":  device.Name,
					"device_group": device.DeviceGroup,
					"sitename":     device.Sitename,
					"is_online":    true,
					"last_seen":    time.Now(),
				},
				Timestamp: time.Now().UnixMilli(),
			})

			// Log device online to database
			LogDeviceOnlineToDatabase(deviceID, device, deviceGroup)
		}
	} else {
		// Device exists, update online status and last seen (don't touch name if user set it)
		updates := map[string]interface{}{
			"is_online":       true,
			"last_seen":       time.Now(),
			"device_group_id": deviceGroup.ID,
			"device_group":    deviceGroup.DeviceGroup,
			"sitename_id":     deviceGroup.SitenameID,
			"sitename":        deviceGroup.Sitename,
		}

		if err := database.GetDB().Model(&existingDevice).Updates(updates).Error; err != nil {
			log.Printf("Error updating device in database: %v", err)
		} else {
			log.Printf("Device updated in database: %s", deviceID)

			// Broadcast device online status to frontend (for existing devices coming back online)
			wsServer.BroadcastMessage(models.WebSocketMessage{
				Type: "device_online",
				Data: map[string]interface{}{
					"device_id":    deviceID,
					"device_name":  existingDevice.Name,
					"device_group": deviceGroup.DeviceGroup,
					"sitename":     deviceGroup.Sitename,
					"is_online":    true,
					"last_seen":    time.Now(),
				},
				Timestamp: time.Now().UnixMilli(),
			})

			// Log device online to database
			LogDeviceOnlineToDatabase(deviceID, existingDevice, deviceGroup)
		}
	}
}

// UpdateDeviceOffline marks a device as offline in the database
func UpdateDeviceOffline(deviceID string) {
	// Update device offline status
	now := time.Now()
	updates := map[string]interface{}{
		"is_online": false,
		"last_seen": &now,
	}

	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error; err != nil {
		log.Printf("Error updating device offline status: %v", err)
	} else {
		log.Printf("Device marked as offline: %s", deviceID)
	}
}

// UpdateDeviceOfflineWithBroadcast marks a device as offline and broadcasts to frontend
func UpdateDeviceOfflineWithBroadcast(wsServer interfaces.WebSocketServerInterface, deviceID string) {
	// Update device offline status
	UpdateDeviceOffline(deviceID)

	// Get device info from database for broadcast
	var device models.Device
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err == nil {
		// Broadcast device offline status to frontend
		wsServer.BroadcastMessage(models.WebSocketMessage{
			Type: "device_offline",
			Data: map[string]interface{}{
				"device_id":    deviceID,
				"device_name":  device.Name,
				"device_group": device.DeviceGroup,
				"sitename":     device.Sitename,
				"is_online":    false,
				"last_seen":    time.Now(),
			},
			Timestamp: time.Now().UnixMilli(),
		})

		// Log device offline to database
		LogDeviceOfflineToDatabase(deviceID, device)
	}
}

// LogDeviceOfflineToDatabase creates a device offline log entry
func LogDeviceOfflineToDatabase(deviceID string, device models.Device) {
	alarmLog := &models.AlarmLog{
		DeviceID:       deviceID,
		DeviceName:     device.Name,
		DeviceGroup:    device.DeviceGroup,
		Sitename:       device.Sitename,
		AlarmType:      "device_offline",
		Message:        "Device went offline",
		Severity:       "warning",
		Status:         "started",
		BatteryLevel:   device.BatteryLevel,
		BatteryStatus:  device.BatteryStatus,
		SignalStrength: device.SignalStrength,
		SignalDBM:      device.SignalDBM,
		NetworkType:    device.NetworkType,
	}

	if err := database.GetDB().Create(alarmLog).Error; err != nil {
		log.Printf("Failed to create device offline log: %v", err)
	}
}

// LogDeviceOnlineToDatabase creates a device online log entry
func LogDeviceOnlineToDatabase(deviceID string, device models.Device, deviceGroup models.DeviceGroup) {
	alarmLog := &models.AlarmLog{
		DeviceID:       deviceID,
		DeviceName:     device.Name,
		DeviceGroup:    deviceGroup.DeviceGroup,
		Sitename:       deviceGroup.Sitename,
		AlarmType:      "device_online",
		Message:        "Device came online",
		Severity:       "info",
		Status:         "started",
		BatteryLevel:   device.BatteryLevel,
		BatteryStatus:  device.BatteryStatus,
		SignalStrength: device.SignalStrength,
		SignalDBM:      device.SignalDBM,
		NetworkType:    device.NetworkType,
	}

	if err := database.GetDB().Create(alarmLog).Error; err != nil {
		log.Printf("Failed to create device online log: %v", err)
	}
}

// UpdateDeviceInDatabase updates device information in the database
func UpdateDeviceInDatabase(deviceID string, data interface{}) {
	// Update device offline status
	now := time.Now()
	updates := map[string]interface{}{
		"is_online": false,
		"last_seen": &now,
	}

	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error; err != nil {
		log.Printf("Error updating device offline status: %v", err)
	} else {
		log.Printf("Device marked as offline: %s", deviceID)
	}
}
