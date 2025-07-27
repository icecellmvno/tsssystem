package models

import (
	"time"
)

// SmppUserAntiDetectionConfig represents anti-detection configuration for SMPP users
type SmppUserAntiDetectionConfig struct {
	ID                   uint      `json:"id" gorm:"primaryKey"`
	SmppUserID           uint      `json:"smpp_user_id"`
	AntiDetectionEnabled bool      `json:"anti_detection_enabled" gorm:"default:false"`
	RoutingRuleIDs       string    `json:"routing_rule_ids" gorm:"type:json"` // [1, 2, 3] bu user için hangi routing rules
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`

	// Relations
	SmppUser SmppUser `json:"smpp_user" gorm:"foreignKey:SmppUserID"`
}

// SmppUserSimPoolConfig represents SIM pool configuration for SMPP users
type SmppUserSimPoolConfig struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	SmppUserID       uint      `json:"smpp_user_id"`
	DeviceGroupID    uint      `json:"device_group_id"`
	SimCardIDs       string    `json:"sim_card_ids" gorm:"type:json"`                 // [1, 2, 3] bu user için hangi SIM'ler
	RotationStrategy string    `json:"rotation_strategy" gorm:"default:'least_used'"` // round_robin, least_used, random
	CooldownMinutes  int       `json:"cooldown_minutes" gorm:"default:5"`
	MaxDailyUsage    int       `json:"max_daily_usage" gorm:"default:100"`
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relations
	SmppUser    SmppUser    `json:"smpp_user" gorm:"foreignKey:SmppUserID"`
	DeviceGroup DeviceGroup `json:"device_group" gorm:"foreignKey:DeviceGroupID"`
}

// SmppUserDelayConfig represents delay configuration for SMPP users
type SmppUserDelayConfig struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	SmppUserID       uint      `json:"smpp_user_id"`
	DeviceGroupID    uint      `json:"device_group_id"`
	MinDelayMs       int       `json:"min_delay_ms" gorm:"default:1000"`
	MaxDelayMs       int       `json:"max_delay_ms" gorm:"default:30000"`
	DistributionType string    `json:"distribution_type" gorm:"default:'uniform'"` // uniform, exponential, normal
	IsActive         bool      `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Relations
	SmppUser    SmppUser    `json:"smpp_user" gorm:"foreignKey:SmppUserID"`
	DeviceGroup DeviceGroup `json:"device_group" gorm:"foreignKey:DeviceGroupID"`
}
