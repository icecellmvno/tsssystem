package models

import (
	"time"

	"gorm.io/gorm"
)

// SmsRoutingDeviceGroup represents the many-to-many relationship between SMS routings and device groups
type SmsRoutingDeviceGroup struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	SmsRoutingID  uint           `json:"sms_routing_id" gorm:"not null"`
	DeviceGroupID uint           `json:"device_group_id" gorm:"not null"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	// Relations
	SmsRouting  *SmsRouting  `json:"sms_routing,omitempty" gorm:"foreignKey:SmsRoutingID"`
	DeviceGroup *DeviceGroup `json:"device_group,omitempty" gorm:"foreignKey:DeviceGroupID"`
}

// TableName specifies the table name for SmsRoutingDeviceGroup
func (SmsRoutingDeviceGroup) TableName() string {
	return "sms_routing_device_groups"
}
