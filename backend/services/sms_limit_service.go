package services

import (
	"database/sql"
	"fmt"
	"time"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
)

type SmsLimitService struct{}

func NewSmsLimitService() *SmsLimitService {
	return &SmsLimitService{}
}

// CheckSmsLimit checks if device can send SMS based on limits
func (s *SmsLimitService) CheckSmsLimit(deviceIMEI string, simSlot int) (bool, string, error) {
	db := database.GetDB()

	// Get device and device group info
	var device models.Device
	var deviceGroup models.DeviceGroup

	if err := db.Where("imei = ?", deviceIMEI).First(&device).Error; err != nil {
		return false, "Device not found", err
	}

	if err := db.Where("id = ?", device.DeviceGroupID).First(&deviceGroup).Error; err != nil {
		return false, "Device group not found", err
	}

	// Check if SMS limits are enabled
	if !deviceGroup.EnableSmsLimits {
		return true, "", nil
	}

	// Get current limits based on sim slot
	var dailyLimit, monthlyLimit int
	if simSlot == 1 {
		dailyLimit = deviceGroup.Sim1DailySmsLimit
		monthlyLimit = deviceGroup.Sim1MonthlySmsLimit
	} else if simSlot == 2 {
		dailyLimit = deviceGroup.Sim2DailySmsLimit
		monthlyLimit = deviceGroup.Sim2MonthlySmsLimit
	} else {
		return false, "Invalid SIM slot", nil
	}

	// Check if limits are set (0 means no limit)
	if dailyLimit == 0 && monthlyLimit == 0 {
		return true, "", nil
	}

	// Get current usage
	var dailyUsed, monthlyUsed int
	if simSlot == 1 {
		dailyUsed = device.Sim1DailySmsUsed
		monthlyUsed = device.Sim1MonthlySmsUsed
	} else {
		dailyUsed = device.Sim2DailySmsUsed
		monthlyUsed = device.Sim2MonthlySmsUsed
	}

	// Check daily limit
	if dailyLimit > 0 && dailyUsed >= dailyLimit {
		return false, "Daily SMS limit exceeded", nil
	}

	// Check monthly limit
	if monthlyLimit > 0 && monthlyUsed >= monthlyLimit {
		return false, "Monthly SMS limit exceeded", nil
	}

	return true, "", nil
}

// IncrementSmsUsage increments SMS usage for a device and checks for alarms
func (s *SmsLimitService) IncrementSmsUsage(deviceIMEI string, simSlot int) error {
	db := database.GetDB()

	// Update usage based on sim slot
	if simSlot == 1 {
		if err := db.Model(&models.Device{}).
			Where("imei = ?", deviceIMEI).
			UpdateColumn("sim1_daily_sms_used", sql.Expr("sim1_daily_sms_used + 1")).
			UpdateColumn("sim1_monthly_sms_used", sql.Expr("sim1_monthly_sms_used + 1")).
			Error; err != nil {
			return err
		}
	} else if simSlot == 2 {
		if err := db.Model(&models.Device{}).
			Where("imei = ?", deviceIMEI).
			UpdateColumn("sim2_daily_sms_used", sql.Expr("sim2_daily_sms_used + 1")).
			UpdateColumn("sim2_monthly_sms_used", sql.Expr("sim2_monthly_sms_used + 1")).
			Error; err != nil {
			return err
		}
	}

	// Check for alarms after incrementing usage
	return s.CheckSmsLimitAlarms(deviceIMEI, simSlot)
}

// CheckSmsLimitAlarms checks if SMS limit alarms should be triggered
func (s *SmsLimitService) CheckSmsLimitAlarms(deviceIMEI string, simSlot int) error {
	db := database.GetDB()

	// Get device and device group info
	var device models.Device
	var deviceGroup models.DeviceGroup

	if err := db.Where("imei = ?", deviceIMEI).First(&device).Error; err != nil {
		return err
	}

	if err := db.Where("id = ?", device.DeviceGroupID).First(&deviceGroup).Error; err != nil {
		return err
	}

	// Check if SMS limits are enabled
	if !deviceGroup.EnableSmsLimits {
		return nil
	}

	// Get current limits based on sim slot
	var dailyLimit, monthlyLimit int
	if simSlot == 1 {
		dailyLimit = deviceGroup.Sim1DailySmsLimit
		monthlyLimit = deviceGroup.Sim1MonthlySmsLimit
	} else if simSlot == 2 {
		dailyLimit = deviceGroup.Sim2DailySmsLimit
		monthlyLimit = deviceGroup.Sim2MonthlySmsLimit
	} else {
		return fmt.Errorf("invalid SIM slot")
	}

	// Get current usage
	var dailyUsed, monthlyUsed int
	if simSlot == 1 {
		dailyUsed = device.Sim1DailySmsUsed
		monthlyUsed = device.Sim1MonthlySmsUsed
	} else {
		dailyUsed = device.Sim2DailySmsUsed
		monthlyUsed = device.Sim2MonthlySmsUsed
	}

	// Check daily limit alarm (80% threshold)
	if dailyLimit > 0 {
		dailyPercentage := float64(dailyUsed) / float64(dailyLimit) * 100
		if dailyPercentage >= 80 {
			// Check if alarm already exists for today
			var existingAlarm models.AlarmLog
			today := time.Now().Format("2006-01-02")

			if err := db.Where("device_id = ? AND alarm_type = ? AND DATE(created_at) = ?",
				deviceIMEI, "sms_limit_daily", today).First(&existingAlarm).Error; err != nil {
				// Create new alarm
				alarm := models.AlarmLog{
					DeviceID:    deviceIMEI,
					DeviceName:  device.Name,
					DeviceGroup: device.DeviceGroup,
					CountrySite: device.CountrySite,
					AlarmType:   "sms_limit_daily",
					Message: fmt.Sprintf("Device %s SIM Slot %d daily SMS limit reached %.1f%% (%d/%d)",
						device.Name, simSlot, dailyPercentage, dailyUsed, dailyLimit),
					Severity:       "warning",
					Status:         "started",
					BatteryLevel:   device.BatteryLevel,
					BatteryStatus:  device.BatteryStatus,
					SignalStrength: device.SignalStrength,
					SignalDBM:      device.SignalDBM,
					NetworkType:    device.NetworkType,
				}

				if err := db.Create(&alarm).Error; err != nil {
					return err
				}
			}
		}
	}

	// Check monthly limit alarm (80% threshold)
	if monthlyLimit > 0 {
		monthlyPercentage := float64(monthlyUsed) / float64(monthlyLimit) * 100
		if monthlyPercentage >= 80 {
			// Check if alarm already exists for this month
			var existingAlarm models.AlarmLog
			currentMonth := time.Now().Format("2006-01")

			if err := db.Where("device_id = ? AND alarm_type = ? AND DATE_FORMAT(created_at, '%%Y-%%m') = ?",
				deviceIMEI, "sms_limit_monthly", currentMonth).First(&existingAlarm).Error; err != nil {
				// Create new alarm
				alarm := models.AlarmLog{
					DeviceID:    deviceIMEI,
					DeviceName:  device.Name,
					DeviceGroup: device.DeviceGroup,
					CountrySite: device.CountrySite,
					AlarmType:   "sms_limit_monthly",
					Message: fmt.Sprintf("Device %s SIM Slot %d monthly SMS limit reached %.1f%% (%d/%d)",
						device.Name, simSlot, monthlyPercentage, monthlyUsed, monthlyLimit),
					Severity:       "warning",
					Status:         "started",
					BatteryLevel:   device.BatteryLevel,
					BatteryStatus:  device.BatteryStatus,
					SignalStrength: device.SignalStrength,
					SignalDBM:      device.SignalDBM,
					NetworkType:    device.NetworkType,
				}

				if err := db.Create(&alarm).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// ResetSmsLimits resets SMS limits for a device (manual reset)
func (s *SmsLimitService) ResetSmsLimits(deviceIMEI string, simSlot int, resetType string) error {
	db := database.GetDB()
	now := time.Now()

	updates := make(map[string]interface{})

	if simSlot == 1 {
		if resetType == "daily" || resetType == "both" {
			updates["sim1_daily_sms_used"] = 0
			updates["sim1_daily_limit_reset_at"] = now
		}
		if resetType == "monthly" || resetType == "both" {
			updates["sim1_monthly_sms_used"] = 0
			updates["sim1_monthly_limit_reset_at"] = now
		}
	} else if simSlot == 2 {
		if resetType == "daily" || resetType == "both" {
			updates["sim2_daily_sms_used"] = 0
			updates["sim2_daily_limit_reset_at"] = now
		}
		if resetType == "monthly" || resetType == "both" {
			updates["sim2_monthly_sms_used"] = 0
			updates["sim2_monthly_limit_reset_at"] = now
		}
	}

	if len(updates) > 0 {
		return db.Model(&models.Device{}).Where("imei = ?", deviceIMEI).Updates(updates).Error
	}

	return nil
}

// CheckAndResetDailyLimits checks and resets daily limits based on device group settings
func (s *SmsLimitService) CheckAndResetDailyLimits() error {
	db := database.GetDB()
	now := time.Now()

	// Get all devices with their device groups
	var devices []models.Device
	if err := db.Preload("DeviceGroup").Find(&devices).Error; err != nil {
		return err
	}

	for _, device := range devices {
		var deviceGroup models.DeviceGroup
		if err := db.Where("id = ?", device.DeviceGroupID).First(&deviceGroup).Error; err != nil {
			continue
		}

		// Check if daily reset is needed for SIM1
		if device.Sim1DailyLimitResetAt == nil ||
			(now.Hour() >= deviceGroup.SmsLimitResetHour &&
				device.Sim1DailyLimitResetAt.Day() != now.Day()) {
			s.ResetSmsLimits(device.IMEI, 1, "daily")
		}

		// Check if daily reset is needed for SIM2
		if device.Sim2DailyLimitResetAt == nil ||
			(now.Hour() >= deviceGroup.SmsLimitResetHour &&
				device.Sim2DailyLimitResetAt.Day() != now.Day()) {
			s.ResetSmsLimits(device.IMEI, 2, "daily")
		}

		// Check if monthly reset is needed for SIM1
		if device.Sim1MonthlyLimitResetAt == nil ||
			device.Sim1MonthlyLimitResetAt.Month() != now.Month() {
			s.ResetSmsLimits(device.IMEI, 1, "monthly")
		}

		// Check if monthly reset is needed for SIM2
		if device.Sim2MonthlyLimitResetAt == nil ||
			device.Sim2MonthlyLimitResetAt.Month() != now.Month() {
			s.ResetSmsLimits(device.IMEI, 2, "monthly")
		}
	}

	return nil
}

// EnterMaintenanceModeIfLimitExceeded puts device in maintenance mode if limits are exceeded
func (s *SmsLimitService) EnterMaintenanceModeIfLimitExceeded(deviceIMEI string, simSlot int) error {
	db := database.GetDB()

	// Get device and device group info
	var device models.Device
	var deviceGroup models.DeviceGroup

	if err := db.Where("imei = ?", deviceIMEI).First(&device).Error; err != nil {
		return err
	}

	if err := db.Where("id = ?", device.DeviceGroupID).First(&deviceGroup).Error; err != nil {
		return err
	}

	// Check if limits are exceeded
	canSend, reason, _ := s.CheckSmsLimit(deviceIMEI, simSlot)
	if !canSend {
		// Enter maintenance mode
		now := time.Now()
		updates := map[string]interface{}{
			"maintenance_mode":       true,
			"maintenance_reason":     "SMS limit exceeded: " + reason,
			"maintenance_started_at": now,
		}

		return db.Model(&models.Device{}).Where("imei = ?", deviceIMEI).Updates(updates).Error
	}

	return nil
}

// GetSmsLimitStatus returns current SMS limit status for a device
func (s *SmsLimitService) GetSmsLimitStatus(deviceIMEI string, simSlot int) (map[string]interface{}, error) {
	db := database.GetDB()

	// Get device and device group info
	var device models.Device
	var deviceGroup models.DeviceGroup

	if err := db.Where("imei = ?", deviceIMEI).First(&device).Error; err != nil {
		return nil, err
	}

	if err := db.Where("id = ?", device.DeviceGroupID).First(&deviceGroup).Error; err != nil {
		return nil, err
	}

	// Get current limits based on sim slot
	var dailyLimit, monthlyLimit int
	if simSlot == 1 {
		dailyLimit = deviceGroup.Sim1DailySmsLimit
		monthlyLimit = deviceGroup.Sim1MonthlySmsLimit
	} else if simSlot == 2 {
		dailyLimit = deviceGroup.Sim2DailySmsLimit
		monthlyLimit = deviceGroup.Sim2MonthlySmsLimit
	} else {
		return nil, fmt.Errorf("invalid SIM slot")
	}

	// Get current usage
	var dailyUsed, monthlyUsed int
	if simSlot == 1 {
		dailyUsed = device.Sim1DailySmsUsed
		monthlyUsed = device.Sim1MonthlySmsUsed
	} else {
		dailyUsed = device.Sim2DailySmsUsed
		monthlyUsed = device.Sim2MonthlySmsUsed
	}

	// Calculate percentages
	var dailyPercentage, monthlyPercentage float64
	if dailyLimit > 0 {
		dailyPercentage = float64(dailyUsed) / float64(dailyLimit) * 100
	}
	if monthlyLimit > 0 {
		monthlyPercentage = float64(monthlyUsed) / float64(monthlyLimit) * 100
	}

	return map[string]interface{}{
		"device_name":        device.Name,
		"sim_slot":           simSlot,
		"daily_limit":        dailyLimit,
		"daily_used":         dailyUsed,
		"daily_percentage":   dailyPercentage,
		"monthly_limit":      monthlyLimit,
		"monthly_used":       monthlyUsed,
		"monthly_percentage": monthlyPercentage,
		"alarm_threshold":    80.0,
		"daily_alarm":        dailyPercentage >= 80,
		"monthly_alarm":      monthlyPercentage >= 80,
	}, nil
}
