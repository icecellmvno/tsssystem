package models

// DeviceInfo represents device information from heartbeat
type DeviceInfo struct {
	Manufacturer   string `json:"manufacturer"`
	Model          string `json:"model"`
	AndroidVersion string `json:"android_version"`
	DeviceID       string `json:"device_id"`
	Sitename       string `json:"sitename"`
	DeviceGroup    string `json:"device_group"`
}

// SimCard represents SIM card information
type SimCard struct {
	SlotIndex      int    `json:"slot_index"`
	CarrierName    string `json:"carrier_name"`
	PhoneNumber    string `json:"phone_number"`
	NetworkMCC     string `json:"network_mcc"`
	NetworkMNC     string `json:"network_mnc"`
	IsActive       bool   `json:"is_active"`
	IMEI           string `json:"imei"`
	IMSI           string `json:"imsi"`
	ICCID          string `json:"iccid"`
	SignalStrength int    `json:"signal_strength"`
	SignalDBM      int    `json:"signal_dbm"`
	NetworkType    string `json:"network_type"`
}

// Location represents device location
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// HeartbeatData represents heartbeat message data
type HeartbeatData struct {
	DeviceInfo     DeviceInfo `json:"device_info"`
	BatteryLevel   int        `json:"battery_level"`
	BatteryStatus  string     `json:"battery_status"`
	SignalStrength int        `json:"signal_strength"`
	SignalDBM      int        `json:"signal_dbm"`
	NetworkType    string     `json:"network_type"`
	SimCards       []SimCard  `json:"sim_cards"`
	Location       Location   `json:"location"`
}

// DeviceStatusData represents device status message data
type DeviceStatusData struct {
	Status      string      `json:"status"`
	DeviceGroup string      `json:"device_group"`
	Sitename    string      `json:"sitename"`
	Details     interface{} `json:"details"`
}

// AlarmData represents alarm message data
type AlarmData struct {
	AlarmType   string `json:"alarm_type"`
	Message     string `json:"message"`
	Severity    string `json:"severity"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// SmsLogData represents SMS log message data
type SmsLogData struct {
	SimSlot     int    `json:"sim_slot"`
	PhoneNumber string `json:"phone_number"`
	Message     string `json:"message"`
	Status      string `json:"status"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// SmsMessageData represents SMS message data
type SmsMessageData struct {
	PhoneNumber        string `json:"phone_number"`
	Message            string `json:"message"`
	Direction          string `json:"direction"`
	SimSlot            int    `json:"sim_slot"`
	Timestamp          int64  `json:"timestamp"`
	FormattedTimestamp string `json:"formatted_timestamp"`
	DeviceGroup        string `json:"device_group"`
	Sitename           string `json:"sitename"`
}

// SmsDeliveryReportData represents SMS delivery report data
type SmsDeliveryReportData struct {
	PhoneNumber string `json:"phone_number"`
	MessageID   string `json:"message_id"`
	Status      string `json:"status"`
	SimSlot     int    `json:"sim_slot"`
	Timestamp   int64  `json:"timestamp"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// UssdResponseData represents USSD response data
type UssdResponseData struct {
	SessionID       string `json:"session_id"`
	MessageID       string `json:"message_id"`
	Response        string `json:"response"`
	CleanedResponse string `json:"cleaned_response"`
	Status          string `json:"status"`
	IsMenu          bool   `json:"is_menu"`
	AutoCancel      bool   `json:"auto_cancel"`
	Timestamp       int64  `json:"timestamp"`
}

// UssdResponseFailedData represents USSD response failed data
type UssdResponseFailedData struct {
	SessionID    string `json:"session_id"`
	MessageID    string `json:"message_id"`
	UssdCode     string `json:"ussd_code"`
	SimSlot      int    `json:"sim_slot"`
	FailureCode  int    `json:"failure_code"`
	ErrorMessage string `json:"error_message"`
	Status       string `json:"status"`
}

// MmsReceivedData represents MMS received data
type MmsReceivedData struct {
	Sender      string `json:"sender"`
	Subject     string `json:"subject"`
	PartsCount  int    `json:"parts_count"`
	SimSlot     int    `json:"sim_slot"`
	Timestamp   int64  `json:"timestamp"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// RcsReceivedData represents RCS received data
type RcsReceivedData struct {
	Sender      string `json:"sender"`
	Message     string `json:"message"`
	MessageType string `json:"message_type"`
	SimSlot     int    `json:"sim_slot"`
	Timestamp   int64  `json:"timestamp"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// UssdCodeData represents USSD code data
type UssdCodeData struct {
	Sender      string `json:"sender"`
	UssdCode    string `json:"ussd_code"`
	SimSlot     int    `json:"sim_slot"`
	Timestamp   int64  `json:"timestamp"`
	DeviceGroup string `json:"device_group"`
	Sitename    string `json:"sitename"`
}

// FindDeviceSuccessData represents find device success data
type FindDeviceSuccessData struct {
	Message   string `json:"message"`
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
}

// FindDeviceFailedData represents find device failed data
type FindDeviceFailedData struct {
	Message   string `json:"message"`
	Status    string `json:"status"`
	Error     string `json:"error"`
	Timestamp int64  `json:"timestamp"`
}

// AlarmStartedData represents alarm started data
type AlarmStartedData struct {
	AlarmType string `json:"alarm_type"`
	Message   string `json:"message"`
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
	Source    string `json:"source,omitempty"`
}

// AlarmFailedData represents alarm failed data
type AlarmFailedData struct {
	AlarmType string `json:"alarm_type"`
	Message   string `json:"message"`
	Status    string `json:"status"`
	Error     string `json:"error"`
	Timestamp int64  `json:"timestamp"`
}

// AlarmStoppedData represents alarm stopped data
type AlarmStoppedData struct {
	Status    string `json:"status"`
	Timestamp int64  `json:"timestamp"`
}

// AlarmStopFailedData represents alarm stop failed data
type AlarmStopFailedData struct {
	Status    string `json:"status"`
	Error     string `json:"error"`
	Timestamp int64  `json:"timestamp"`
}

// UssdCancelledData represents USSD cancelled data
type UssdCancelledData struct {
	SessionID string `json:"session_id"`
	MessageID string `json:"message_id"`
	UssdCode  string `json:"ussd_code"`
	SimSlot   int    `json:"sim_slot"`
	Status    string `json:"status"`
	Reason    string `json:"reason"`
	Timestamp int64  `json:"timestamp"`
}

// DeviceSettings represents device configuration settings
type DeviceSettings struct {
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

// ConnectionEstablishedData represents connection confirmation data
type ConnectionEstablishedData struct {
	Settings DeviceSettings `json:"settings"`
}

// SendSmsData represents send SMS command data
type SendSmsData struct {
	SimSlot     int    `json:"sim_slot"`
	PhoneNumber string `json:"phone_number"`
	Message     string `json:"message"`
	Priority    string `json:"priority"`
}

// SendUssdData represents send USSD command data
type SendUssdData struct {
	SimSlot   int    `json:"sim_slot"`
	UssdCode  string `json:"ussd_code"`
	SessionID string `json:"session_id,omitempty"`
	Delay     int    `json:"delay"`
}

// SendRcsData represents send RCS command data
type SendRcsData struct {
	SimSlot     int    `json:"sim_slot"`
	PhoneNumber string `json:"phone_number"`
	Message     string `json:"message"`
	MessageType string `json:"message_type"`
}

// FindDeviceData represents find device command data
type FindDeviceData struct {
	Message string `json:"message"`
}

// AlarmStartData represents alarm start command data
type AlarmStartData struct {
	AlarmType string `json:"alarm_type"`
	Message   string `json:"message"`
}

// DeviceConnection represents a device WebSocket connection
type DeviceConnection struct {
	DeviceID       string      `json:"device_id"`
	DeviceGroup    string      `json:"device_group"`
	Sitename       string      `json:"sitename"`
	ConnectionType string      `json:"connection_type"` // android, frontend, usbmodem
	Conn           interface{} `json:"-"`
	IsHandicap     bool        `json:"is_handicap"`
}

// QRConfigData represents QR code configuration data
type QRConfigData struct {
	DeviceGroup             string `json:"device_group"`
	Sitename                string `json:"sitename"`
	WebsocketURL            string `json:"websocket_url"`
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
	Timestamp               string `json:"timestamp"`
}
