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

	// Update device online status
	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", deviceID).Update("is_online", true).Error; err != nil {
		log.Printf("Failed to update device online status: %v", err)
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
		// Battery geri geldi, battery low alarmını durdur
		log.Printf("Battery level is %d%% (above threshold: %d%%) for device %s, battery has recovered", data.BatteryLevel, deviceGroup.BatteryLowThreshold, deviceID)

		// Stop any active battery low alarms for this device
		if err := database.GetDB().Model(&models.AlarmLog{}).
			Where("device_id = ? AND alarm_type = ? AND status = ?", deviceID, "battery_low", "started").
			Update("status", "stopped").Error; err != nil {
			log.Printf("Failed to stop battery low alarm for device %s: %v", deviceID, err)
		} else {
			log.Printf("Battery low alarm stopped for device %s", deviceID)
		}
	}

	// Update device info in database
	UpdateDeviceInfo(wsServer, deviceID, data)

	// Get device name from database for frontend
	var device models.Device
	deviceName := ""
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err == nil {
		deviceName = device.Name
	}

	// Process SIM card statuses and create enhanced heartbeat data
	enhancedSimCards := processSimCardStatuses(data.SimCards, deviceID, deviceGroup)

	// Create heartbeat data with device name and enhanced SIM card statuses
	heartbeatData := map[string]interface{}{
		"device_info":     data.DeviceInfo,
		"battery_level":   data.BatteryLevel,
		"battery_status":  data.BatteryStatus,
		"signal_strength": data.SignalStrength,
		"signal_dbm":      data.SignalDBM,
		"network_type":    data.NetworkType,
		"sim_cards":       enhancedSimCards,
		"location":        data.Location,
		"device_name":     deviceName, // Add device name from database
		"device_id":       deviceID,
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

	// Get device info for device name and country site
	var device models.Device
	var deviceName, countrySite string
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err == nil {
		deviceName = device.Name
		countrySite = device.CountrySite
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
			DeviceName:     deviceName,
			CountrySite:    countrySite,
		}

		if err := database.GetDB().Create(&deviceSimCard).Error; err != nil {
			log.Printf("Error creating SIM card record: %v", err)
		}
	}
}

// processSimCardStatuses processes SIM card statuses based on business logic
func processSimCardStatuses(simCards []models.SimCard, deviceID string, deviceGroup *models.DeviceGroup) []map[string]interface{} {
	enhancedSimCards := make([]map[string]interface{}, len(simCards))

	for i, simCard := range simCards {
		// Determine SIM Card Status based on business logic
		simCardStatus := "Unknown"
		statusBadgeVariant := "secondary"

		if !simCard.IsActive {
			simCardStatus = "Blocked"
			statusBadgeVariant = "destructive"
		} else {
			// Check if device is online (we know it is since we're in heartbeat)
			simCardStatus = "Active"
			statusBadgeVariant = "default"
		}

		// Create enhanced SIM card data
		enhancedSimCard := map[string]interface{}{
			"slot_index":                    simCard.SlotIndex,
			"carrier_name":                  simCard.CarrierName,
			"phone_number":                  simCard.PhoneNumber,
			"network_mcc":                   simCard.NetworkMCC,
			"network_mnc":                   simCard.NetworkMNC,
			"is_active":                     simCard.IsActive,
			"imei":                          simCard.IMEI,
			"imsi":                          simCard.IMSI,
			"iccid":                         simCard.ICCID,
			"signal_strength":               simCard.SignalStrength,
			"signal_dbm":                    simCard.SignalDBM,
			"network_type":                  simCard.NetworkType,
			"sim_card_status":               simCardStatus,
			"status_badge_variant":          statusBadgeVariant,
			"signal_strength_badge_variant": getSignalStrengthBadgeVariant(simCard.SignalStrength),
			"network_type_badge_variant":    getNetworkTypeBadgeVariant(simCard.NetworkType),
			"signal_strength_text":          getSignalStrengthText(simCard.SignalStrength),
		}

		enhancedSimCards[i] = enhancedSimCard
	}

	return enhancedSimCards
}

// getSignalStrengthBadgeVariant returns badge variant based on signal strength
func getSignalStrengthBadgeVariant(signalStrength int) string {
	if signalStrength >= 80 {
		return "default"
	} else if signalStrength >= 60 {
		return "outline"
	} else if signalStrength >= 40 {
		return "secondary"
	} else {
		return "destructive"
	}
}

// getNetworkTypeBadgeVariant returns badge variant based on network type
func getNetworkTypeBadgeVariant(networkType string) string {
	switch networkType {
	case "5G":
		return "default"
	case "4G":
		return "outline"
	case "3G":
		return "secondary"
	case "2G":
		return "destructive"
	default:
		return "secondary"
	}
}

// getSignalStrengthText returns human readable signal strength text
func getSignalStrengthText(signalStrength int) string {
	if signalStrength >= 80 {
		return "Excellent"
	} else if signalStrength >= 60 {
		return "Good"
	} else if signalStrength >= 40 {
		return "Fair"
	} else if signalStrength >= 20 {
		return "Poor"
	} else if signalStrength > 0 {
		return "Very Poor"
	}
	return "Unknown"
}
