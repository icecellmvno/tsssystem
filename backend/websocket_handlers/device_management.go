package websocket_handlers

import (
	"fmt"
	"log"
	"strings"
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

	// Check active alarms based on device group settings
	var activeAlarmCount int64
	query := db.Model(&models.AlarmLog{}).Where("device_id = ? AND status = ?", deviceID, "started")

	// Only count alarms that are enabled in device group settings
	var conditions []string
	var args []interface{}

	if deviceGroup.EnableBatteryAlarms {
		conditions = append(conditions, "alarm_type = ?")
		args = append(args, "battery_low")
	}
	if deviceGroup.EnableSignalAlarms {
		conditions = append(conditions, "alarm_type = ?")
		args = append(args, "signal_low")
	}
	if deviceGroup.EnableErrorAlarms {
		conditions = append(conditions, "alarm_type = ?")
		args = append(args, "error_count")
	}
	if deviceGroup.EnableOfflineAlarms {
		conditions = append(conditions, "alarm_type = ?")
		args = append(args, "device_offline")
	}
	if deviceGroup.EnableSimBalanceAlarms {
		conditions = append(conditions, "alarm_type = ?")
		args = append(args, "sim_balance_low")
	}

	// Note: SIM card change alarms are handled separately and don't affect device active status

	// Add severity conditions
	conditions = append(conditions, "(severity = ? OR severity = ? OR severity = ?)")
	args = append(args, "critical", "error", "warning")

	// Build the query
	if len(conditions) > 0 {
		query = query.Where("("+strings.Join(conditions, " OR ")+")", args...)
	}

	if err := query.Count(&activeAlarmCount).Error; err != nil {
		log.Printf("Failed to check active alarms for device %s: %v", deviceID, err)
		return
	}

	// Determine device status based on conditions
	if activeAlarmCount > 0 {
		// Has active alarms - set to inactive
		updates := map[string]interface{}{
			"is_active": false,
		}
		if err := db.Model(&device).Updates(updates).Error; err != nil {
			log.Printf("Failed to set device %s to inactive due to alarms: %v", deviceID, err)
		} else {
			log.Printf("Device %s set to inactive due to %d active alarms (device group: %s)", deviceID, activeAlarmCount, deviceGroup.DeviceGroup)
		}
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
