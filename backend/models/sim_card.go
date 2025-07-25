package models

import (
	"time"
)

// SimCardRecord represents SIM cards in the database
type SimCardRecord struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	SlotIndex           int       `json:"slot_index" gorm:"not null"`
	SubscriptionID      int       `json:"subscription_id" gorm:"not null"`
	DisplayName         string    `json:"display_name" gorm:"type:varchar(255)"`
	CarrierName         string    `json:"carrier_name" gorm:"type:varchar(255)"`
	CountryISO          string    `json:"country_iso" gorm:"type:varchar(10)"`
	Number              string    `json:"number" gorm:"type:varchar(50)"`
	IMEI                string    `json:"imei" gorm:"type:varchar(255)"`
	ICCID               string    `json:"iccid" gorm:"column:iccid;type:varchar(255)"`
	IMSI                string    `json:"imsi" gorm:"type:varchar(255)"`
	NetworkMCC          string    `json:"network_mcc" gorm:"type:varchar(10)"`
	NetworkMNC          string    `json:"network_mnc" gorm:"type:varchar(10)"`
	SimMCC              string    `json:"sim_mcc" gorm:"type:varchar(10)"`
	SimMNC              string    `json:"sim_mnc" gorm:"type:varchar(10)"`
	NetworkOperatorName string    `json:"network_operator_name" gorm:"type:varchar(255)"`
	SimOperatorName     string    `json:"sim_operator_name" gorm:"type:varchar(255)"`
	Roaming             bool      `json:"roaming" gorm:"default:false"`
	SignalStrength      int       `json:"signal_strength"`
	SignalDBM           int       `json:"signal_dbm"`
	SignalType          string    `json:"signal_type" gorm:"type:varchar(50)"`
	RSRP                int       `json:"rsrp"`
	RSRQ                int       `json:"rsrq"`
	RSSNR               int       `json:"rssnr"`
	CQI                 int       `json:"cqi"`
	NetworkType         string    `json:"network_type" gorm:"type:varchar(50)"`
	IsActive            bool      `json:"is_active" gorm:"default:true"`
	TotalDelivered      int       `json:"total_delivered" gorm:"default:0"`
	TotalSent           int       `json:"total_sent" gorm:"default:0"`
	TotalWaiting        int       `json:"total_waiting" gorm:"default:0"`
	MainBalance         float64   `json:"main_balance" gorm:"default:0"`
	SmsBalance          int       `json:"sms_balance" gorm:"default:0"`
	SmsLimit            int       `json:"sms_limit" gorm:"default:0"`
	DeviceID            *uint     `json:"device_id" gorm:"index"`
	DeviceName          *string   `json:"device_name" gorm:"type:varchar(255)"`
	CountrySite         *string   `json:"country_site" gorm:"type:varchar(255)"`
	DeviceGroupName     *string   `json:"device_group_name" gorm:"type:varchar(255)"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
