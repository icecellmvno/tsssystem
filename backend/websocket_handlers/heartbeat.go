package websocket_handlers

import (
	"fmt"
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleHeartbeat processes heartbeat messages from devices
func HandleHeartbeat(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.HeartbeatData) {
	log.Printf("Heartbeat from %s: Battery %d%%, Signal %d/5", deviceID, data.BatteryLevel, data.SignalStrength)

	// Get device group settings for alarm management
	var deviceInfo models.Device
	if err := database.GetDB().Where("imei = ?", deviceID).First(&deviceInfo).Error; err != nil {
		log.Printf("Failed to get device %s for signal check: %v", deviceID, err)
		return
	}

	deviceGroup, err := GetDeviceGroupSettings(deviceInfo.DeviceGroupID)
	if err != nil {
		log.Printf("Failed to get device group settings for device %s: %v", deviceID, err)
		return
	}

	// Signal kontrolü - device group ayarlarına göre
	if data.SignalStrength <= deviceGroup.SignalLowThreshold && deviceGroup.EnableSignalAlarms {
		log.Printf("Signal strength is %d (threshold: %d) for device %s, setting device to inactive", data.SignalStrength, deviceGroup.SignalLowThreshold, deviceID)

		// Cihazı deaktif yap
		if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Update("is_active", false).Error; err != nil {
			log.Printf("Error setting device to inactive: %v", err)
		}

		// Signal low alarmı gönder
		alarmData := models.AlarmData{
			AlarmType:   "signal_low",
			Message:     fmt.Sprintf("Device signal is low (signal strength: %d, threshold: %d). Device has been set to inactive.", data.SignalStrength, deviceGroup.SignalLowThreshold),
			Severity:    "critical",
			DeviceGroup: data.DeviceInfo.DeviceGroup,
			CountrySite: data.DeviceInfo.CountrySite,
		}

		// Broadcast alarm to frontend
		wsServer.BroadcastMessage(models.WebSocketMessage{
			Type: "alarm",
			Data: map[string]interface{}{
				"device_id":    deviceID,
				"alarm_type":   alarmData.AlarmType,
				"message":      alarmData.Message,
				"severity":     alarmData.Severity,
				"device_group": alarmData.DeviceGroup,
				"country_site": alarmData.CountrySite,
			},
			Timestamp: time.Now().UnixMilli(),
		})

		// Log alarm to database
		LogAlarmToDatabase(deviceID, alarmData)
	} else if data.SignalStrength > deviceGroup.SignalLowThreshold {
		// Signal geri geldi, cihazı aktif yap
		log.Printf("Signal strength is %d (above threshold: %d) for device %s, checking if device should be active", data.SignalStrength, deviceGroup.SignalLowThreshold, deviceID)

		// Check and update device status (this will handle setting to active if no other alarms)
		CheckAndUpdateDeviceStatus(deviceID)
	}

	// Battery kontrolü - device group ayarlarına göre
	if data.BatteryLevel <= deviceGroup.BatteryLowThreshold && deviceGroup.EnableBatteryAlarms {
		log.Printf("Battery level is %d%% (threshold: %d%%) for device %s, sending battery alarm", data.BatteryLevel, deviceGroup.BatteryLowThreshold, deviceID)

		// Battery low alarmı gönder
		alarmData := models.AlarmData{
			AlarmType:   "battery_low",
			Message:     fmt.Sprintf("Device battery is low (battery level: %d%%, threshold: %d%%).", data.BatteryLevel, deviceGroup.BatteryLowThreshold),
			Severity:    "warning",
			DeviceGroup: data.DeviceInfo.DeviceGroup,
			CountrySite: data.DeviceInfo.CountrySite,
		}

		// Broadcast alarm to frontend
		wsServer.BroadcastMessage(models.WebSocketMessage{
			Type: "alarm",
			Data: map[string]interface{}{
				"device_id":    deviceID,
				"alarm_type":   alarmData.AlarmType,
				"message":      alarmData.Message,
				"severity":     alarmData.Severity,
				"device_group": alarmData.DeviceGroup,
				"country_site": alarmData.CountrySite,
			},
			Timestamp: time.Now().UnixMilli(),
		})

		// Log alarm to database
		LogAlarmToDatabase(deviceID, alarmData)
	} else if data.BatteryLevel > deviceGroup.BatteryLowThreshold {
		// Battery geri geldi
		log.Printf("Battery level is %d%% (above threshold: %d%%) for device %s", data.BatteryLevel, deviceGroup.BatteryLowThreshold, deviceID)
	}

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
