package models

import "time"

type Device struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	IMEI           string     `json:"imei" gorm:"type:varchar(255);uniqueIndex;not null"`
	Name           string     `json:"name" gorm:"type:varchar(255)"` // User editable device name
	DeviceGroupID  uint       `json:"device_group_id" gorm:"not null"`
	DeviceGroup    string     `json:"device_group" gorm:"type:varchar(255);not null"`
	CountrySiteID  uint       `json:"country_site_id" gorm:"not null"`
	CountrySite    string     `json:"country_site" gorm:"type:varchar(255);not null"`
	DeviceType     string     `json:"device_type" gorm:"type:varchar(50);default:'android'"`
	Manufacturer   string     `json:"manufacturer" gorm:"type:varchar(255)"`
	Model          string     `json:"model" gorm:"type:varchar(255)"`
	AndroidVersion string     `json:"android_version" gorm:"type:varchar(50)"`
	BatteryLevel   int        `json:"battery_level"`
	BatteryStatus  string     `json:"battery_status" gorm:"type:varchar(50)"`
	SignalStrength int        `json:"signal_strength"`
	SignalDBM      int        `json:"signal_dbm"`
	NetworkType    string     `json:"network_type" gorm:"type:varchar(50)"`
	Latitude       float64    `json:"latitude"`
	Longitude      float64    `json:"longitude"`
	IsActive       bool       `json:"is_active" gorm:"default:true"`
	IsOnline       bool       `json:"is_online" gorm:"default:false"`
	LastSeen       *time.Time `json:"last_seen"`

	// Maintenance mode fields
	MaintenanceMode      bool       `json:"maintenance_mode" gorm:"default:false"`
	MaintenanceReason    string     `json:"maintenance_reason" gorm:"type:varchar(500)"`
	MaintenanceStartedAt *time.Time `json:"maintenance_started_at"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at" gorm:"index"`
	IsDeleted bool       `json:"is_deleted" gorm:"default:false"`
}

type DeviceSimCard struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	DeviceIMEI     string    `json:"device_imei" gorm:"type:varchar(255);not null;index"`
	SlotIndex      int       `json:"slot_index" gorm:"not null"`
	CarrierName    string    `json:"carrier_name" gorm:"type:varchar(255)"`
	PhoneNumber    string    `json:"phone_number" gorm:"type:varchar(50)"`
	NetworkMCC     string    `json:"network_mcc" gorm:"type:varchar(10)"`
	NetworkMNC     string    `json:"network_mnc" gorm:"type:varchar(10)"`
	IsActive       bool      `json:"is_active" gorm:"default:true"`
	IMEI           string    `json:"imei" gorm:"type:varchar(255)"`
	IMSI           string    `json:"imsi" gorm:"type:varchar(255)"`
	ICCID          string    `json:"iccid" gorm:"type:varchar(255)"`
	SignalStrength int       `json:"signal_strength"`
	SignalDBM      int       `json:"signal_dbm"`
	NetworkType    string    `json:"network_type" gorm:"type:varchar(50)"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
