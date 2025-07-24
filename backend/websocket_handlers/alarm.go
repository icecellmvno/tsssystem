package websocket_handlers

import (
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
)

// HandleAlarm processes alarm messages from devices
func HandleAlarm(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmData) {
	log.Printf("Alarm from %s: %s - %s", deviceID, data.AlarmType, data.Message)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})

	// Log alarm to database
	LogAlarmToDatabase(deviceID, data)
}

// LogAlarmToDatabase creates an alarm log entry in the database
func LogAlarmToDatabase(deviceID string, data models.AlarmData) {
	// Get device info from database
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:    deviceID,
		AlarmType:   data.AlarmType,
		Message:     data.Message,
		Severity:    data.Severity,
		Status:      "started",
		DeviceGroup: data.DeviceGroup,
		Sitename:    data.Sitename,
	}

	// Try to get device info including battery and signal data
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err == nil {
		alarmLog.DeviceName = device.Name
		alarmLog.BatteryLevel = device.BatteryLevel
		alarmLog.BatteryStatus = device.BatteryStatus
		alarmLog.SignalStrength = device.SignalStrength
		alarmLog.SignalDBM = device.SignalDBM
		alarmLog.NetworkType = device.NetworkType
	} else {
		alarmLog.DeviceName = "Unknown Device"
	}

	// Create alarm log
	if err := db.Create(alarmLog).Error; err != nil {
		log.Printf("Failed to create alarm log: %v", err)
	}
}

// HandleAlarmStarted processes alarm started messages
func HandleAlarmStarted(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmStartedData) {
	log.Printf("Alarm started from %s: %s - %s", deviceID, data.AlarmType, data.Message)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm_started",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleAlarmFailed processes alarm failed messages
func HandleAlarmFailed(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmFailedData) {
	log.Printf("Alarm failed from %s: %s - %s", deviceID, data.AlarmType, data.Error)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm_failed",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleAlarmStopped processes alarm stopped messages
func HandleAlarmStopped(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmStoppedData) {
	log.Printf("Alarm stopped from %s", deviceID)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm_stopped",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})

	// Log alarm stopped to database
	LogAlarmStoppedToDatabase(deviceID, data)
}

// LogAlarmStoppedToDatabase creates an alarm stopped log entry
func LogAlarmStoppedToDatabase(deviceID string, data models.AlarmStoppedData) {
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:  deviceID,
		AlarmType: "alarm_stopped",
		Message:   "Alarm has been stopped",
		Severity:  "info",
		Status:    "stopped",
	}

	// Try to get device info including battery and signal data
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err == nil {
		alarmLog.DeviceName = device.Name
		alarmLog.DeviceGroup = device.DeviceGroup
		alarmLog.Sitename = device.Sitename
		alarmLog.BatteryLevel = device.BatteryLevel
		alarmLog.BatteryStatus = device.BatteryStatus
		alarmLog.SignalStrength = device.SignalStrength
		alarmLog.SignalDBM = device.SignalDBM
		alarmLog.NetworkType = device.NetworkType
	} else {
		alarmLog.DeviceName = "Unknown Device"
		alarmLog.DeviceGroup = "Unknown"
		alarmLog.Sitename = "Unknown"
	}

	// Create alarm log
	if err := db.Create(alarmLog).Error; err != nil {
		log.Printf("Failed to create alarm stopped log: %v", err)
	}
}

// HandleAlarmStopFailed processes alarm stop failed messages
func HandleAlarmStopFailed(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmStopFailedData) {
	log.Printf("Alarm stop failed from %s: %s", deviceID, data.Error)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm_stop_failed",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleSimCardChangeAlarm processes SIM card change alarm messages
func HandleSimCardChangeAlarm(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmData) {
	log.Printf("SIM card change alarm from %s: %s", deviceID, data.Message)

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sim_card_change_alarm",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})

	// Log SIM card change alarm to database
	LogSimCardChangeAlarmToDatabase(deviceID, data)
}

// LogSimCardChangeAlarmToDatabase creates a SIM card change alarm log entry
func LogSimCardChangeAlarmToDatabase(deviceID string, data models.AlarmData) {
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:    deviceID,
		AlarmType:   "sim_card_change",
		Message:     data.Message,
		Severity:    data.Severity,
		Status:      "started",
		DeviceGroup: data.DeviceGroup,
		Sitename:    data.Sitename,
	}

	// Try to get device info including battery and signal data
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err == nil {
		alarmLog.DeviceName = device.Name
		alarmLog.BatteryLevel = device.BatteryLevel
		alarmLog.BatteryStatus = device.BatteryStatus
		alarmLog.SignalStrength = device.SignalStrength
		alarmLog.SignalDBM = device.SignalDBM
		alarmLog.NetworkType = device.NetworkType
	} else {
		alarmLog.DeviceName = "Unknown Device"
	}

	// Create alarm log
	if err := db.Create(alarmLog).Error; err != nil {
		log.Printf("Failed to create SIM card change alarm log: %v", err)
	}

	// Set device to maintenance mode
	SetDeviceToMaintenanceMode(deviceID, "SIM card change detected")
}

// SetDeviceToMaintenanceMode sets a device to maintenance mode
func SetDeviceToMaintenanceMode(deviceID string, reason string) {
	db := database.GetDB()

	// Update device status to maintenance mode
	updates := map[string]interface{}{
		"is_active":              false,
		"maintenance_mode":       true,
		"maintenance_reason":     reason,
		"maintenance_started_at": time.Now(),
	}

	if err := db.Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error; err != nil {
		log.Printf("Failed to set device %s to maintenance mode: %v", deviceID, err)
	} else {
		log.Printf("Device %s set to maintenance mode: %s", deviceID, reason)
	}
}
