package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// DeviceGroupConfig represents configuration for a device group within an SMS routing
type DeviceGroupConfig struct {
	ID            uint `json:"id" gorm:"primaryKey"`
	SmsRoutingID  uint `json:"sms_routing_id" gorm:"not null"`
	DeviceGroupID uint `json:"device_group_id" gorm:"not null"`
	Priority      int  `json:"priority" gorm:"default:50"`
	TotalSmsCount int  `json:"total_sms_count" gorm:"default:1000"`

	// Device Selection Strategy
	DeviceSelectionStrategy string  `json:"device_selection_strategy" gorm:"size:50;default:'round_robin'"`
	TargetDeviceIDs         *string `json:"target_device_ids" gorm:"type:text"` // JSON array of device IMEIs

	// SIM Card Configuration
	SimSlotPreference        int    `json:"sim_slot_preference" gorm:"default:1"`
	SimCardSelectionStrategy string `json:"sim_card_selection_strategy" gorm:"size:50;default:'preferred'"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	// Relations
	SmsRouting  *SmsRouting  `json:"sms_routing,omitempty" gorm:"foreignKey:SmsRoutingID"`
	DeviceGroup *DeviceGroup `json:"device_group,omitempty" gorm:"foreignKey:DeviceGroupID"`
}

// TableName specifies the table name for DeviceGroupConfig
func (DeviceGroupConfig) TableName() string {
	return "device_group_configs"
}

// BeforeCreate hook to set default values
func (dgc *DeviceGroupConfig) BeforeCreate(tx *gorm.DB) error {
	if dgc.Priority == 0 {
		dgc.Priority = 50
	}
	if dgc.TotalSmsCount == 0 {
		dgc.TotalSmsCount = 1000
	}
	if dgc.DeviceSelectionStrategy == "" {
		dgc.DeviceSelectionStrategy = "round_robin"
	}
	if dgc.SimSlotPreference == 0 {
		dgc.SimSlotPreference = 1
	}
	if dgc.SimCardSelectionStrategy == "" {
		dgc.SimCardSelectionStrategy = "preferred"
	}
	return nil
}

// GetTargetDeviceIDsArray returns the target device IDs as a string array
func (dgc *DeviceGroupConfig) GetTargetDeviceIDsArray() []string {
	if dgc.TargetDeviceIDs == nil {
		return []string{}
	}

	var deviceIDs []string
	if err := json.Unmarshal([]byte(*dgc.TargetDeviceIDs), &deviceIDs); err != nil {
		return []string{}
	}
	return deviceIDs
}

// SetTargetDeviceIDsArray sets the target device IDs from a string array
func (dgc *DeviceGroupConfig) SetTargetDeviceIDsArray(deviceIDs []string) error {
	if len(deviceIDs) == 0 {
		dgc.TargetDeviceIDs = nil
		return nil
	}

	data, err := json.Marshal(deviceIDs)
	if err != nil {
		return err
	}

	jsonStr := string(data)
	dgc.TargetDeviceIDs = &jsonStr
	return nil
}
