package models

import (
	"time"
)

type DeviceGroup struct {
	ID                      uint      `json:"id" gorm:"primaryKey"`
	DeviceGroup             string    `json:"device_group" gorm:"not null;unique"`
	CountrySiteID           uint      `json:"country_site_id" gorm:"not null"`
	CountrySite             string    `json:"country_site" gorm:"not null"`
	DeviceType              string    `json:"device_type" gorm:"default:'android'"`
	Status                  string    `json:"status" gorm:"default:'inactive'"`
	WebsocketURL            string    `json:"websocket_url" gorm:"not null"`
	APIKey                  string    `json:"api_key" gorm:"not null"`
	QueueName               string    `json:"queue_name" gorm:"not null"`
	BatteryLowThreshold     int       `json:"battery_low_threshold" gorm:"default:20"`
	ErrorCountThreshold     int       `json:"error_count_threshold" gorm:"default:5"`
	OfflineThresholdMinutes int       `json:"offline_threshold_minutes" gorm:"default:5"`
	SignalLowThreshold      int       `json:"signal_low_threshold" gorm:"default:2"`
	LowBalanceThreshold     string    `json:"low_balance_threshold" gorm:"default:'10.00'"`
	EnableBatteryAlarms     bool      `json:"enable_battery_alarms" gorm:"default:true"`
	EnableErrorAlarms       bool      `json:"enable_error_alarms" gorm:"default:true"`
	EnableOfflineAlarms     bool      `json:"enable_offline_alarms" gorm:"default:true"`
	EnableSignalAlarms      bool      `json:"enable_signal_alarms" gorm:"default:true"`
	EnableSimBalanceAlarms  bool      `json:"enable_sim_balance_alarms" gorm:"default:true"`
	AutoDisableSimOnAlarm   bool      `json:"auto_disable_sim_on_alarm" gorm:"default:false"`
	Sim1DailySmsLimit       int       `json:"sim1_daily_sms_limit" gorm:"default:100"`
	Sim1MonthlySmsLimit     int       `json:"sim1_monthly_sms_limit" gorm:"default:1000"`
	Sim2DailySmsLimit       int       `json:"sim2_daily_sms_limit" gorm:"default:100"`
	Sim2MonthlySmsLimit     int       `json:"sim2_monthly_sms_limit" gorm:"default:1000"`
	EnableSmsLimits         bool      `json:"enable_sms_limits" gorm:"default:false"`
	SmsLimitResetHour       int       `json:"sms_limit_reset_hour" gorm:"default:0"`
	Sim1GuardInterval       int       `json:"sim1_guard_interval" gorm:"default:1"`
	Sim2GuardInterval       int       `json:"sim2_guard_interval" gorm:"default:1"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

type DeviceGroupCreateRequest struct {
	DeviceGroup             string `json:"device_group" validate:"required"`
	CountrySiteID           uint   `json:"country_site_id" validate:"required"`
	CountrySite             string `json:"country_site" validate:"required"`
	DeviceType              string `json:"device_type"`
	Status                  string `json:"status"`
	WebsocketURL            string `json:"websocket_url" validate:"required"`
	APIKey                  string `json:"api_key"`    // Auto-generated, no validation needed
	QueueName               string `json:"queue_name"` // Auto-generated, no validation needed
	BatteryLowThreshold     int    `json:"battery_low_threshold"`
	ErrorCountThreshold     int    `json:"error_count_threshold"`
	OfflineThresholdMinutes int    `json:"offline_threshold_minutes"`
	SignalLowThreshold      int    `json:"signal_low_threshold"`
	LowBalanceThreshold     string `json:"low_balance_threshold"`
	EnableBatteryAlarms     bool   `json:"enable_battery_alarms"`
	EnableErrorAlarms       bool   `json:"enable_error_alarms"`
	EnableOfflineAlarms     bool   `json:"enable_offline_alarms"`
	EnableSignalAlarms      bool   `json:"enable_signal_alarms"`
	EnableSimBalanceAlarms  bool   `json:"enable_sim_balance_alarms"`
	AutoDisableSimOnAlarm   bool   `json:"auto_disable_sim_on_alarm"`
	Sim1DailySmsLimit       int    `json:"sim1_daily_sms_limit"`
	Sim1MonthlySmsLimit     int    `json:"sim1_monthly_sms_limit"`
	Sim2DailySmsLimit       int    `json:"sim2_daily_sms_limit"`
	Sim2MonthlySmsLimit     int    `json:"sim2_monthly_sms_limit"`
	EnableSmsLimits         bool   `json:"enable_sms_limits"`
	SmsLimitResetHour       int    `json:"sms_limit_reset_hour"`
	Sim1GuardInterval       int    `json:"sim1_guard_interval"`
	Sim2GuardInterval       int    `json:"sim2_guard_interval"`
}

type DeviceGroupUpdateRequest struct {
	DeviceGroup             *string `json:"device_group"`
	CountrySiteID           *uint   `json:"country_site_id"`
	CountrySite             *string `json:"country_site"`
	DeviceType              *string `json:"device_type"`
	Status                  *string `json:"status"`
	WebsocketURL            *string `json:"websocket_url"`
	APIKey                  *string `json:"api_key"`
	QueueName               *string `json:"queue_name"`
	BatteryLowThreshold     *int    `json:"battery_low_threshold"`
	ErrorCountThreshold     *int    `json:"error_count_threshold"`
	OfflineThresholdMinutes *int    `json:"offline_threshold_minutes"`
	SignalLowThreshold      *int    `json:"signal_low_threshold"`
	LowBalanceThreshold     *string `json:"low_balance_threshold"`
	EnableBatteryAlarms     *bool   `json:"enable_battery_alarms"`
	EnableErrorAlarms       *bool   `json:"enable_error_alarms"`
	EnableOfflineAlarms     *bool   `json:"enable_offline_alarms"`
	EnableSignalAlarms      *bool   `json:"enable_signal_alarms"`
	EnableSimBalanceAlarms  *bool   `json:"enable_sim_balance_alarms"`
	AutoDisableSimOnAlarm   *bool   `json:"auto_disable_sim_on_alarm"`
	Sim1DailySmsLimit       *int    `json:"sim1_daily_sms_limit"`
	Sim1MonthlySmsLimit     *int    `json:"sim1_monthly_sms_limit"`
	Sim2DailySmsLimit       *int    `json:"sim2_daily_sms_limit"`
	Sim2MonthlySmsLimit     *int    `json:"sim2_monthly_sms_limit"`
	EnableSmsLimits         *bool   `json:"enable_sms_limits"`
	SmsLimitResetHour       *int    `json:"sms_limit_reset_hour"`
	Sim1GuardInterval       *int    `json:"sim1_guard_interval"`
	Sim2GuardInterval       *int    `json:"sim2_guard_interval"`
}
