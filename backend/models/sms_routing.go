package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// SmsRouting represents the SMS routing configuration
type SmsRouting struct {
	ID                 uint           `json:"id" gorm:"primaryKey"`
	Name               string         `json:"name" gorm:"size:255;not null"`
	Description        string         `json:"description" gorm:"size:500"`
	SourceType         string         `json:"source_type" gorm:"size:50;not null"` // smpp, http
	Direction          string         `json:"direction" gorm:"size:50;not null"`   // inbound, outbound
	SystemID           *string        `json:"system_id" gorm:"size:255"`           // SMPP system ID
	DestinationAddress *string        `json:"destination_address" gorm:"size:255"` // Destination address pattern
	TargetType         string         `json:"target_type" gorm:"size:50;not null"` // http, device_group, smpp
	TargetURL          *string        `json:"target_url" gorm:"size:500"`          // HTTP target URL
	DeviceGroupID      *uint          `json:"device_group_id"`                     // Device group ID for target
	TargetSystemID     *string        `json:"target_system_id" gorm:"size:255"`    // SMPP target system ID
	UserID             *uint          `json:"user_id"`                             // User ID for HTTP source
	IsActive           bool           `json:"is_active" gorm:"default:true"`
	Priority           int            `json:"priority" gorm:"default:0"`
	Conditions         *string        `json:"conditions" gorm:"type:text"` // JSON conditions
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	// Relations
	DeviceGroup *DeviceGroup `json:"device_group,omitempty" gorm:"foreignKey:DeviceGroupID"`
	User        *User        `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for SmsRouting
func (SmsRouting) TableName() string {
	return "sms_routings"
}

// BeforeCreate hook to set default values
func (r *SmsRouting) BeforeCreate(tx *gorm.DB) error {
	if r.Priority == 0 {
		r.Priority = 50 // Default priority
	}
	return nil
}

// GetDisplayName returns a human-readable display name for the routing
func (r *SmsRouting) GetDisplayName() string {
	switch r.TargetType {
	case "http":
		if r.TargetURL != nil {
			return *r.TargetURL
		}
		return "HTTP Endpoint"
	case "device_group":
		if r.DeviceGroup != nil {
			return r.DeviceGroup.DeviceGroup
		}
		return "Device Group"
	case "smpp":
		if r.TargetSystemID != nil {
			return *r.TargetSystemID
		}
		return "SMPP Client"
	default:
		return "Unknown Target"
	}
}

// GetSourceDisplayName returns a human-readable source name
func (r *SmsRouting) GetSourceDisplayName() string {
	switch r.SourceType {
	case "smpp":
		if r.SystemID != nil {
			return *r.SystemID
		}
		return "SMPP Client"
	case "http":
		if r.User != nil {
			return r.User.Username
		}
		return "HTTP API"
	default:
		return "Unknown Source"
	}
}

// GetRoutingSummary returns a summary of the routing configuration
func (r *SmsRouting) GetRoutingSummary() string {
	source := r.GetSourceDisplayName()
	target := r.GetDisplayName()

	return fmt.Sprintf("%s → %s", source, target)
}

// GetStatusBadgeVariant returns the badge variant for status
func (r *SmsRouting) GetStatusBadgeVariant() string {
	if r.IsActive {
		return "default"
	}
	return "secondary"
}

// GetSourceTypeBadgeVariant returns the badge variant for source type
func (r *SmsRouting) GetSourceTypeBadgeVariant() string {
	switch r.SourceType {
	case "smpp":
		return "default"
	case "http":
		return "secondary"
	default:
		return "outline"
	}
}

// GetDirectionBadgeVariant returns the badge variant for direction
func (r *SmsRouting) GetDirectionBadgeVariant() string {
	switch r.Direction {
	case "inbound":
		return "default"
	case "outbound":
		return "secondary"
	default:
		return "outline"
	}
}

// GetTargetTypeBadgeVariant returns the badge variant for target type
func (r *SmsRouting) GetTargetTypeBadgeVariant() string {
	switch r.TargetType {
	case "http":
		return "default"
	case "device_group":
		return "secondary"
	case "smpp":
		return "outline"
	default:
		return "outline"
	}
}
