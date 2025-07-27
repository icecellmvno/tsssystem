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

// HandleAlarm processes alarm messages from devices
func HandleAlarm(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmData) {
	log.Printf("Alarm from %s: %s - %s", deviceID, data.AlarmType, data.Message)

	// Add device_id to alarm data for frontend
	alarmDataWithDeviceID := map[string]interface{}{
		"device_id":    deviceID,
		"alarm_type":   data.AlarmType,
		"message":      data.Message,
		"severity":     data.Severity,
		"device_group": data.DeviceGroup,
		"country_site": data.CountrySite,
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "alarm",
		Data:      alarmDataWithDeviceID,
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
		CountrySite: data.CountrySite,
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
		alarmLog.CountrySite = device.CountrySite
		alarmLog.BatteryLevel = device.BatteryLevel
		alarmLog.BatteryStatus = device.BatteryStatus
		alarmLog.SignalStrength = device.SignalStrength
		alarmLog.SignalDBM = device.SignalDBM
		alarmLog.NetworkType = device.NetworkType
	} else {
		alarmLog.DeviceName = "Unknown Device"
		alarmLog.DeviceGroup = "Unknown"
		alarmLog.CountrySite = "Unknown"
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
	log.Printf("=== SIM CARD CHANGE ALARM PROCESSING ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message: %s", data.Message)
	log.Printf("Severity: %s", data.Severity)
	log.Printf("Device Group: %s", data.DeviceGroup)
	log.Printf("Country Site: %s", data.CountrySite)

	// Determine alarm scenario based on message content
	var scenario string
	if strings.Contains(data.Message, "SIM tray opened") {
		scenario = "SIM_TRAY_OPENED"
	} else if strings.Contains(data.Message, "SIM tray closed") {
		scenario = "SIM_TRAY_CLOSED"
	} else if strings.Contains(data.Message, "IMSI changed") {
		scenario = "IMSI_CHANGED"
	} else if strings.Contains(data.Message, "SIM card count changed") {
		scenario = "CARD_COUNT_CHANGED"
	} else {
		scenario = "CONFIGURATION_CHANGED"
	}

	log.Printf("Alarm Scenario: %s", scenario)

	// Add device_id to alarm data for frontend
	alarmDataWithDeviceID := map[string]interface{}{
		"device_id":    deviceID,
		"alarm_type":   data.AlarmType,
		"message":      data.Message,
		"severity":     data.Severity,
		"device_group": data.DeviceGroup,
		"country_site": data.CountrySite,
		"scenario":     scenario,
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sim_card_change_alarm",
		Data:      alarmDataWithDeviceID,
		Timestamp: time.Now().UnixMilli(),
	})

	// Log SIM card change alarm to database
	LogSimCardChangeAlarmToDatabase(deviceID, data, scenario)

	// Set device to maintenance mode only for critical scenarios
	if scenario == "SIM_TRAY_OPENED" || scenario == "IMSI_CHANGED" {
		SetDeviceToMaintenanceMode(deviceID, fmt.Sprintf("SIM card change detected: %s", scenario))
		log.Printf("Device %s set to maintenance mode due to critical SIM change: %s", deviceID, scenario)
	} else {
		log.Printf("Device %s status unchanged for non-critical SIM change: %s", deviceID, scenario)
	}
}

// LogSimCardChangeAlarmToDatabase creates a SIM card change alarm log entry
func LogSimCardChangeAlarmToDatabase(deviceID string, data models.AlarmData, scenario string) {
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:    deviceID,
		AlarmType:   "sim_card_change",
		Message:     data.Message,
		Severity:    data.Severity,
		Status:      "started",
		DeviceGroup: data.DeviceGroup,
		CountrySite: data.CountrySite,
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
	} else {
		log.Printf("SIM card change alarm logged to database for device %s, scenario: %s", deviceID, scenario)
	}
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

// StopSimCardChangeAlarm stops the SIM card change alarm for a device
func StopSimCardChangeAlarm(deviceID string) {
	db := database.GetDB()

	// Update the latest SIM card change alarm to stopped status
	if err := db.Model(&models.AlarmLog{}).
		Where("device_id = ? AND alarm_type = ? AND status = ?", deviceID, "sim_card_change", "started").
		Order("created_at DESC").
		Limit(1).
		Update("status", "stopped").Error; err != nil {
		log.Printf("Failed to stop SIM card change alarm for device %s: %v", deviceID, err)
	} else {
		log.Printf("SIM card change alarm stopped for device %s", deviceID)
	}
}

// HandleSimCardChangeAlarmResolved processes SIM card change alarm resolution
func HandleSimCardChangeAlarmResolved(wsServer interfaces.WebSocketServerInterface, deviceID string, data models.AlarmData) {
	log.Printf("=== SIM CARD CHANGE ALARM RESOLUTION PROCESSING ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message: %s", data.Message)
	log.Printf("Severity: %s", data.Severity)
	log.Printf("Device Group: %s", data.DeviceGroup)
	log.Printf("Country Site: %s", data.CountrySite)

	// Determine resolution scenario based on message content
	var resolutionScenario string
	if strings.Contains(data.Message, "SIM tray closed with same IMSIs") {
		resolutionScenario = "SAME_IMSIS_RESTORED"
	} else if strings.Contains(data.Message, "SIM card reinserted") {
		resolutionScenario = "CARDS_REINSERTED"
	} else if strings.Contains(data.Message, "SIM card configuration resolved") {
		resolutionScenario = "CONFIGURATION_RESOLVED"
	} else {
		resolutionScenario = "GENERAL_RESOLUTION"
	}

	log.Printf("Resolution Scenario: %s", resolutionScenario)

	// Stop the alarm
	StopSimCardChangeAlarm(deviceID)

	// Add device_id to alarm data for frontend
	alarmDataWithDeviceID := map[string]interface{}{
		"device_id":           deviceID,
		"alarm_type":          data.AlarmType,
		"message":             data.Message,
		"severity":            data.Severity,
		"device_group":        data.DeviceGroup,
		"country_site":        data.CountrySite,
		"resolution_scenario": resolutionScenario,
	}

	// Broadcast to frontend clients
	wsServer.BroadcastMessage(models.WebSocketMessage{
		Type:      "sim_card_change_alarm_resolved",
		Data:      alarmDataWithDeviceID,
		Timestamp: time.Now().UnixMilli(),
	})

	// Log alarm resolution to database
	LogSimCardChangeAlarmResolvedToDatabase(deviceID, data, resolutionScenario)

	// Check if device should be taken out of maintenance mode
	if resolutionScenario == "SAME_IMSIS_RESTORED" || resolutionScenario == "CARDS_REINSERTED" {
		log.Printf("Device %s should be taken out of maintenance mode due to resolution: %s", deviceID, resolutionScenario)
		// Remove device from maintenance mode
		RemoveDeviceFromMaintenanceMode(deviceID, fmt.Sprintf("SIM card change resolved: %s", resolutionScenario))
	}

	// Check and update device status after alarm resolution
	CheckAndUpdateDeviceStatus(deviceID)
}

// LogSimCardChangeAlarmResolvedToDatabase logs the resolution of SIM card change alarm
func LogSimCardChangeAlarmResolvedToDatabase(deviceID string, data models.AlarmData, scenario string) {
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:    deviceID,
		AlarmType:   "sim_card_change_resolved",
		Message:     data.Message,
		Severity:    "info",
		Status:      "stopped",
		DeviceGroup: data.DeviceGroup,
		CountrySite: data.CountrySite,
	}

	// Try to get device info
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
		log.Printf("Failed to create SIM card change alarm resolved log: %v", err)
	} else {
		log.Printf("SIM card change alarm resolution logged to database for device %s, scenario: %s", deviceID, scenario)
	}
}

// RemoveDeviceFromMaintenanceMode removes a device from maintenance mode
func RemoveDeviceFromMaintenanceMode(deviceID string, reason string) {
	db := database.GetDB()

	// Update device status to remove maintenance mode
	updates := map[string]interface{}{
		"maintenance_mode":       false,
		"maintenance_reason":     "",
		"maintenance_started_at": nil,
		"maintenance_ended_at":   time.Now(),
	}

	if err := db.Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error; err != nil {
		log.Printf("Failed to remove device %s from maintenance mode: %v", deviceID, err)
	} else {
		log.Printf("Device %s removed from maintenance mode: %s", deviceID, reason)
	}
}

// LogAlarmResolvedToDatabase logs the resolution of any alarm
func LogAlarmResolvedToDatabase(deviceID string, data models.AlarmData) {
	var device models.Device
	db := database.GetDB()

	alarmLog := &models.AlarmLog{
		DeviceID:    deviceID,
		AlarmType:   data.AlarmType + "_resolved",
		Message:     data.Message,
		Severity:    "info",
		Status:      "stopped",
		DeviceGroup: data.DeviceGroup,
		CountrySite: data.CountrySite,
	}

	// Try to get device info
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
		log.Printf("Failed to create alarm resolved log: %v", err)
	}

	// Check and update device status after alarm resolution
	CheckAndUpdateDeviceStatus(deviceID)
}
