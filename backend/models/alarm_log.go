package models

import (
	"time"
)

// AlarmLog represents alarm events in the database
type AlarmLog struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	DeviceID    string `json:"device_id" gorm:"index;not null;size:255"`
	DeviceName  string `json:"device_name" gorm:"not null;size:255"`
	DeviceGroup string `json:"device_group" gorm:"not null;size:255"`
	CountrySite string `json:"country_site" gorm:"not null;size:255"`
	AlarmType   string `json:"alarm_type" gorm:"not null;size:100;index"`
	Message     string `json:"message" gorm:"type:text"`
	Severity    string `json:"severity" gorm:"not null;size:20;index"` // warning, error, critical, info
	Status      string `json:"status" gorm:"not null;size:20;index"`   // started, stopped, failed

	// Device status at alarm time
	BatteryLevel   int    `json:"battery_level" gorm:"default:0"`
	BatteryStatus  string `json:"battery_status" gorm:"size:50"`
	SignalStrength int    `json:"signal_strength" gorm:"default:0"`
	SignalDBM      int    `json:"signal_dbm" gorm:"default:0"`
	NetworkType    string `json:"network_type" gorm:"size:50"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for AlarmLog
func (AlarmLog) TableName() string {
	return "alarm_logs"
}
