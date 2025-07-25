package models

import (
	"time"
)

// UssdLog represents USSD logs in the database
type UssdLog struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	SessionID       string     `json:"session_id" gorm:"type:varchar(255);not null;index"`
	DeviceID        string     `json:"device_id" gorm:"type:varchar(255);not null;index"`
	DeviceName      *string    `json:"device_name" gorm:"type:varchar(255)"`
	DeviceIMEI      *string    `json:"device_imei" gorm:"type:varchar(255)"`
	DeviceIMSI      *string    `json:"device_imsi" gorm:"type:varchar(255)"`
	SimSlot         *int       `json:"sim_slot" gorm:"index"`
	UssdCode        string     `json:"ussd_code" gorm:"type:varchar(255);not null"`
	RequestMessage  *string    `json:"request_message" gorm:"type:text"`
	ResponseMessage *string    `json:"response_message" gorm:"type:text"`
	Status          string     `json:"status" gorm:"type:varchar(50);not null;default:'pending'"`
	SentAt          *time.Time `json:"sent_at"`
	ReceivedAt      *time.Time `json:"received_at"`
	ErrorMessage    *string    `json:"error_message" gorm:"type:text"`
	Metadata        *string    `json:"metadata" gorm:"type:json"`
	DeviceGroupID   *uint      `json:"device_group_id" gorm:"index"`
	DeviceGroup     *string    `json:"device_group" gorm:"type:varchar(255)"`
	CountrySiteID   *uint      `json:"country_site_id" gorm:"index"`
	CountrySite     *string    `json:"country_site" gorm:"type:varchar(255)"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
