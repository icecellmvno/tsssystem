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
			CountrySiteID: deviceGroup.CountrySiteID,
			CountrySite:   deviceGroup.CountrySite,
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
					"country_site": device.CountrySite,
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
			"country_site_id": deviceGroup.CountrySiteID,
			"country_site":    deviceGroup.CountrySite,
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
					"country_site": deviceGroup.CountrySite,
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
				"country_site": device.CountrySite,
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
		CountrySite:    device.CountrySite,
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
		CountrySite:    deviceGroup.CountrySite,
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

// SetDeviceToReadyStatus sets a device to ready status when all alarms are resolved
func SetDeviceToReadyStatus(deviceID string) {
	db := database.GetDB()

	// Get current device status
	var device models.Device
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err != nil {
		log.Printf("Failed to get device %s for ready status: %v", deviceID, err)
		return
	}

	// Check if device has any active alarms
	var activeAlarmCount int64
	if err := db.Model(&models.AlarmLog{}).
		Where("device_id = ? AND status = ? AND (severity = ? OR severity = ? OR severity = ?)",
			deviceID, "started", "critical", "error", "warning").
		Count(&activeAlarmCount).Error; err != nil {
		log.Printf("Failed to check active alarms for device %s: %v", deviceID, err)
		return
	}

	// If no active alarms and device is online, set to ready status
	if activeAlarmCount == 0 && device.IsOnline {
		updates := map[string]interface{}{
			"is_active":              true,
			"maintenance_mode":       false,
			"maintenance_reason":     "",
			"maintenance_started_at": nil,
		}

		if err := db.Model(&device).Updates(updates).Error; err != nil {
			log.Printf("Failed to set device %s to ready status: %v", deviceID, err)
		} else {
			log.Printf("Device %s set to ready status (no active alarms, online)", deviceID)
		}
	}
}

// GetDeviceGroupSettings gets device group settings for alarm management
func GetDeviceGroupSettings(deviceGroupID uint) (*models.DeviceGroup, error) {
	var deviceGroup models.DeviceGroup
	if err := database.GetDB().Where("id = ?", deviceGroupID).First(&deviceGroup).Error; err != nil {
		return nil, err
	}
	return &deviceGroup, nil
}

// CheckAndUpdateDeviceStatus checks device status and updates accordingly
func CheckAndUpdateDeviceStatus(deviceID string) {
	db := database.GetDB()

	// Get current device status
	var device models.Device
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err != nil {
		log.Printf("Failed to get device %s for status check: %v", deviceID, err)
		return
	}

	// Get device group settings
	deviceGroup, err := GetDeviceGroupSettings(device.DeviceGroupID)
	if err != nil {
		log.Printf("Failed to get device group settings for device %s: %v", deviceID, err)
		return
	}

	// Check each alarm type separately
	var hasActiveAlarms bool = false
	var activeAlarmTypes []string

	// Check Battery Low Alarms
	if deviceGroup.EnableBatteryAlarms {
		var batteryAlarmCount int64
		if err := db.Model(&models.AlarmLog{}).
			Where("device_id = ? AND alarm_type = ? AND status = ? AND (severity = ? OR severity = ? OR severity = ?)",
				deviceID, "battery_low", "started", "critical", "error", "warning").
			Count(&batteryAlarmCount).Error; err != nil {
			log.Printf("Failed to check battery alarms for device %s: %v", deviceID, err)
		} else if batteryAlarmCount > 0 {
			hasActiveAlarms = true
			activeAlarmTypes = append(activeAlarmTypes, "battery_low")
			log.Printf("Device %s has %d active battery low alarms", deviceID, batteryAlarmCount)
		}
	}

	// Check Error Count Alarms
	if deviceGroup.EnableErrorAlarms {
		var errorAlarmCount int64
		if err := db.Model(&models.AlarmLog{}).
			Where("device_id = ? AND alarm_type = ? AND status = ? AND (severity = ? OR severity = ? OR severity = ?)",
				deviceID, "error_count", "started", "critical", "error", "warning").
			Count(&errorAlarmCount).Error; err != nil {
			log.Printf("Failed to check error alarms for device %s: %v", deviceID, err)
		} else if errorAlarmCount > 0 {
			hasActiveAlarms = true
			activeAlarmTypes = append(activeAlarmTypes, "error_count")
			log.Printf("Device %s has %d active error count alarms", deviceID, errorAlarmCount)
		}
	}

	// Check Device Offline Alarms
	if deviceGroup.EnableOfflineAlarms {
		var offlineAlarmCount int64
		if err := db.Model(&models.AlarmLog{}).
			Where("device_id = ? AND alarm_type = ? AND status = ? AND (severity = ? OR severity = ? OR severity = ?)",
				deviceID, "device_offline", "started", "critical", "error", "warning").
			Count(&offlineAlarmCount).Error; err != nil {
			log.Printf("Failed to check offline alarms for device %s: %v", deviceID, err)
		} else if offlineAlarmCount > 0 {
			hasActiveAlarms = true
			activeAlarmTypes = append(activeAlarmTypes, "device_offline")
			log.Printf("Device %s has %d active device offline alarms", deviceID, offlineAlarmCount)
		}
	}

	// Check SIM Balance Low Alarms
	if deviceGroup.EnableSimBalanceAlarms {
		var simBalanceAlarmCount int64
		if err := db.Model(&models.AlarmLog{}).
			Where("device_id = ? AND alarm_type = ? AND status = ? AND (severity = ? OR severity = ? OR severity = ?)",
				deviceID, "sim_balance_low", "started", "critical", "error", "warning").
			Count(&simBalanceAlarmCount).Error; err != nil {
			log.Printf("Failed to check SIM balance alarms for device %s: %v", deviceID, err)
		} else if simBalanceAlarmCount > 0 {
			hasActiveAlarms = true
			activeAlarmTypes = append(activeAlarmTypes, "sim_balance_low")
			log.Printf("Device %s has %d active SIM balance low alarms", deviceID, simBalanceAlarmCount)
		}
	}

	// Note: Signal low and SIM card change alarms don't affect device active status

	// Determine device status based on conditions
	if hasActiveAlarms {
		// Has active alarms - log but keep device active
		log.Printf("Device %s has active alarms: %v but remains operational (device group: %s)", deviceID, activeAlarmTypes, deviceGroup.DeviceGroup)
	} else if device.MaintenanceMode {
		// In maintenance mode - check if it should be active (for SIM card changes)
		if device.IsOnline {
			// Device is online and in maintenance mode - keep it active for SIM card operations
			updates := map[string]interface{}{
				"is_active": true,
			}
			if err := db.Model(&device).Updates(updates).Error; err != nil {
				log.Printf("Failed to set device %s to active in maintenance mode: %v", deviceID, err)
			} else {
				log.Printf("Device %s kept active in maintenance mode (online)", deviceID)
			}
		} else {
			// Device is offline and in maintenance mode - keep inactive
			log.Printf("Device %s remains inactive due to maintenance mode and being offline", deviceID)
		}
	} else if device.IsOnline {
		// No alarms, not in maintenance, online - set to ready
		updates := map[string]interface{}{
			"is_active": true,
		}
		if err := db.Model(&device).Updates(updates).Error; err != nil {
			log.Printf("Failed to set device %s to ready status: %v", deviceID, err)
		} else {
			log.Printf("Device %s set to ready status (no alarms, online, not in maintenance)", deviceID)
		}
	} else {
		// Offline - keep inactive
		log.Printf("Device %s remains inactive due to being offline", deviceID)
	}
}
