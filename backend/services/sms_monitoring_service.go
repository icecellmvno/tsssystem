package services

import (
	"fmt"
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
)

// SmsMonitoringService handles SMS delivery monitoring and automatic maintenance mode switching
type SmsMonitoringService struct {
	// Configuration
	MonitoringWindow     int // Number of recent SMS to check (default: 10)
	MinSmsForCheck       int // Minimum SMS count before checking (default: 5)
	MaintenanceThreshold int // Number of non-delivered SMS to trigger maintenance (default: 5)
}

// NewSmsMonitoringService creates a new SMS monitoring service instance
func NewSmsMonitoringService() *SmsMonitoringService {
	return &SmsMonitoringService{
		MonitoringWindow:     10, // Check last 10 SMS
		MinSmsForCheck:       5,  // Need at least 5 SMS to start checking
		MaintenanceThreshold: 5,  // If 5 or more are not delivered, enter maintenance
	}
}

// CheckDeviceSmsDeliveryStatus checks the SMS delivery pattern for a device
// and automatically switches to maintenance mode if needed
func (s *SmsMonitoringService) CheckDeviceSmsDeliveryStatus(deviceID string) error {
	db := database.GetDB()

	// Get device info
	var device models.Device
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err != nil {
		log.Printf("Device not found for SMS monitoring: %s", deviceID)
		return err
	}

	// Skip if device is already in maintenance mode
	if device.MaintenanceMode {
		return nil
	}

	// Get the last N SMS logs for this device, ordered by creation time (most recent first)
	var smsLogs []models.SmsLog
	if err := db.Where("device_id = ? AND direction = ? AND status IN (?)",
		deviceID, "outbound", []string{"sent", "delivered", "failed"}).
		Order("created_at DESC").
		Limit(s.MonitoringWindow).
		Find(&smsLogs).Error; err != nil {
		log.Printf("Failed to get SMS logs for device %s: %v", deviceID, err)
		return err
	}

	// Need at least minimum SMS count to make a decision
	if len(smsLogs) < s.MinSmsForCheck {
		log.Printf("Device %s has only %d SMS logs, need at least %d for monitoring",
			deviceID, len(smsLogs), s.MinSmsForCheck)
		return nil
	}

	// Count non-delivered SMS (sent or failed, but not delivered)
	nonDeliveredCount := 0
	deliveredCount := 0

	for _, smsLog := range smsLogs {
		switch smsLog.Status {
		case "delivered":
			deliveredCount++
		case "sent", "failed":
			nonDeliveredCount++
		}
	}

	log.Printf("Device %s SMS status check: %d delivered, %d non-delivered out of %d total",
		deviceID, deliveredCount, nonDeliveredCount, len(smsLogs))

	// Check if we should enter maintenance mode
	// Condition: If the last 5-10 SMS are only "sent" or "failed" (no "delivered")
	if deliveredCount == 0 && nonDeliveredCount >= s.MaintenanceThreshold {
		reason := "Automatic maintenance: No SMS delivered in last " +
			fmt.Sprintf("%d", len(smsLogs)) + " attempts"

		if err := s.enterMaintenanceMode(deviceID, reason); err != nil {
			log.Printf("Failed to enter maintenance mode for device %s: %v", deviceID, err)
			return err
		}

		log.Printf("Device %s automatically entered maintenance mode: %s", deviceID, reason)

		// Create an alarm log for this event
		s.createMaintenanceAlarm(deviceID, reason, nonDeliveredCount, len(smsLogs))
	}

	return nil
}

// enterMaintenanceMode puts a device into maintenance mode
func (s *SmsMonitoringService) enterMaintenanceMode(deviceID string, reason string) error {
	db := database.GetDB()

	now := time.Now()
	updates := map[string]interface{}{
		"maintenance_mode":       true,
		"maintenance_reason":     reason,
		"maintenance_started_at": &now,
		"is_active":              false, // Disable device when entering maintenance
	}

	return db.Model(&models.Device{}).Where("imei = ?", deviceID).Updates(updates).Error
}

// createMaintenanceAlarm creates an alarm log entry for automatic maintenance mode entry
func (s *SmsMonitoringService) createMaintenanceAlarm(deviceID string, reason string, nonDeliveredCount int, totalChecked int) {
	db := database.GetDB()

	// Get device info for alarm details
	var device models.Device
	if err := db.Where("imei = ?", deviceID).First(&device).Error; err != nil {
		log.Printf("Failed to get device info for alarm creation: %v", err)
		return
	}

	alarmLog := models.AlarmLog{
		DeviceID:    deviceID,
		DeviceName:  device.Name,
		CountrySite: device.CountrySite,
		DeviceGroup: device.DeviceGroup,
		AlarmType:   "sms_delivery_failure",
		Severity:    "warning",
		Status:      "started",
		Message:     fmt.Sprintf("Automatic maintenance: No SMS delivered in last %d attempts. Failed/Sent: %d/%d SMS", totalChecked, nonDeliveredCount, totalChecked),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := db.Create(&alarmLog).Error; err != nil {
		log.Printf("Failed to create maintenance alarm for device %s: %v", deviceID, err)
	} else {
		log.Printf("Created maintenance alarm for device %s", deviceID)
	}
}

// MonitorAllDevices runs SMS delivery monitoring for all active devices
func (s *SmsMonitoringService) MonitorAllDevices() error {
	db := database.GetDB()

	// Get all active devices that are not in maintenance mode
	var devices []models.Device
	if err := db.Where("is_active = ? AND maintenance_mode = ?", true, false).Find(&devices).Error; err != nil {
		log.Printf("Failed to get devices for SMS monitoring: %v", err)
		return err
	}

	log.Printf("Starting SMS delivery monitoring for %d devices", len(devices))

	for _, device := range devices {
		if err := s.CheckDeviceSmsDeliveryStatus(device.IMEI); err != nil {
			log.Printf("SMS monitoring failed for device %s: %v", device.IMEI, err)
		}
	}

	return nil
}

// SetConfiguration allows updating the monitoring configuration
func (s *SmsMonitoringService) SetConfiguration(monitoringWindow, minSmsForCheck, maintenanceThreshold int) {
	if monitoringWindow > 0 {
		s.MonitoringWindow = monitoringWindow
	}
	if minSmsForCheck > 0 {
		s.MinSmsForCheck = minSmsForCheck
	}
	if maintenanceThreshold > 0 {
		s.MaintenanceThreshold = maintenanceThreshold
	}

	log.Printf("SMS monitoring configuration updated: window=%d, minCheck=%d, threshold=%d",
		s.MonitoringWindow, s.MinSmsForCheck, s.MaintenanceThreshold)
}
