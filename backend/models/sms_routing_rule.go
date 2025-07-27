package models

import (
	"time"
)

// SmsRoutingRule represents SMS routing rules
type SmsRoutingRule struct {
	ID                 uint      `json:"id" gorm:"primaryKey"`
	Name               string    `json:"name" gorm:"not null"`
	DestinationPattern string    `json:"destination_pattern" gorm:"not null"` // +90*, +90544*, etc.
	DeviceGroupIDs     string    `json:"device_group_ids" gorm:"type:json"`   // [1, 2, 3] birden fazla device group
	Priority           int       `json:"priority" gorm:"default:0"`
	IsActive           bool      `json:"is_active" gorm:"default:true"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
