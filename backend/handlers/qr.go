package handlers

import (
	"encoding/json"
	"time"
	"tsimsocketserver/config"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type QRHandler struct {
	cfg *config.Config
}

func NewQRHandler(cfg *config.Config) *QRHandler {
	return &QRHandler{
		cfg: cfg,
	}
}

// GenerateQRConfig generates QR code configuration for a device
func (h *QRHandler) GenerateQRConfig(c *fiber.Ctx) error {
	var request struct {
		DeviceGroup             string `json:"device_group"`
		Sitename                string `json:"sitename"`
		APIKey                  string `json:"api_key"`
		QueueName               string `json:"queue_name"`
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

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Validate required fields
	if request.DeviceGroup == "" || request.Sitename == "" || request.APIKey == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device group, sitename, and API key are required",
		})
	}

	// Set default values if not provided
	if request.BatteryLowThreshold == 0 {
		request.BatteryLowThreshold = 20
	}
	if request.ErrorCountThreshold == 0 {
		request.ErrorCountThreshold = 5
	}
	if request.OfflineThresholdMinutes == 0 {
		request.OfflineThresholdMinutes = 5
	}
	if request.SignalLowThreshold == 0 {
		request.SignalLowThreshold = 2
	}
	if request.LowBalanceThreshold == "" {
		request.LowBalanceThreshold = "10.00"
	}
	if request.Sim1DailySmsLimit == 0 {
		request.Sim1DailySmsLimit = 100
	}
	if request.Sim1MonthlySmsLimit == 0 {
		request.Sim1MonthlySmsLimit = 1000
	}
	if request.Sim2DailySmsLimit == 0 {
		request.Sim2DailySmsLimit = 100
	}
	if request.Sim2MonthlySmsLimit == 0 {
		request.Sim2MonthlySmsLimit = 1000
	}
	if request.Sim1GuardInterval == 0 {
		request.Sim1GuardInterval = 1
	}
	if request.Sim2GuardInterval == 0 {
		request.Sim2GuardInterval = 1
	}

	// Build WebSocket URL
	wsURL := h.cfg.WebSocketURL

	// Create QR config data
	qrConfig := models.QRConfigData{
		DeviceGroup:             request.DeviceGroup,
		Sitename:                request.Sitename,
		WebsocketURL:            wsURL,
		APIKey:                  request.APIKey,
		QueueName:               request.QueueName,
		BatteryLowThreshold:     request.BatteryLowThreshold,
		ErrorCountThreshold:     request.ErrorCountThreshold,
		OfflineThresholdMinutes: request.OfflineThresholdMinutes,
		SignalLowThreshold:      request.SignalLowThreshold,
		LowBalanceThreshold:     request.LowBalanceThreshold,
		EnableBatteryAlarms:     request.EnableBatteryAlarms,
		EnableErrorAlarms:       request.EnableErrorAlarms,
		EnableOfflineAlarms:     request.EnableOfflineAlarms,
		EnableSignalAlarms:      request.EnableSignalAlarms,
		EnableSimBalanceAlarms:  request.EnableSimBalanceAlarms,
		AutoDisableSimOnAlarm:   request.AutoDisableSimOnAlarm,
		Sim1DailySmsLimit:       request.Sim1DailySmsLimit,
		Sim1MonthlySmsLimit:     request.Sim1MonthlySmsLimit,
		Sim2DailySmsLimit:       request.Sim2DailySmsLimit,
		Sim2MonthlySmsLimit:     request.Sim2MonthlySmsLimit,
		EnableSmsLimits:         request.EnableSmsLimits,
		SmsLimitResetHour:       request.SmsLimitResetHour,
		Sim1GuardInterval:       request.Sim1GuardInterval,
		Sim2GuardInterval:       request.Sim2GuardInterval,
		Timestamp:               time.Now().Format("2006-01-02 15:04:05"),
	}

	// Convert to JSON for QR code
	qrJSON, err := json.Marshal(qrConfig)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate QR config",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"qr_config": qrConfig,
			"qr_json":   string(qrJSON),
		},
	})
}
