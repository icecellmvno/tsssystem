package models

import (
	"time"

	"gorm.io/gorm"
)

type SmppUser struct {
	ID                    uint           `json:"id" gorm:"primaryKey"`
	SystemID              string         `json:"system_id" gorm:"uniqueIndex;not null;size:50"`
	Password              string         `json:"password" gorm:"not null;size:100"`
	MaxConnectionSpeed    int            `json:"max_connection_speed" gorm:"not null;default:100"`
	IsActive              bool           `json:"is_active" gorm:"not null;default:true"`
	IsOnline              bool           `json:"is_online" gorm:"not null;default:false"`
	LastConnectedAt       *time.Time     `json:"last_connected_at"`
	LastDisconnectedAt    *time.Time     `json:"last_disconnected_at"`
	LastIPAddress         *string        `json:"last_ip_address" gorm:"size:45"`
	ConnectionCount       int            `json:"connection_count" gorm:"not null;default:0"`
	TotalMessagesSent     int            `json:"total_messages_sent" gorm:"not null;default:0"`
	TotalMessagesReceived int            `json:"total_messages_received" gorm:"not null;default:0"`
	CreatedAt             time.Time      `json:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at"`
	DeletedAt             gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName specifies the table name for SmppUser
func (SmppUser) TableName() string {
	return "smpp_users"
}

// BeforeCreate hook to set default values
func (u *SmppUser) BeforeCreate(tx *gorm.DB) error {
	if u.MaxConnectionSpeed <= 0 {
		u.MaxConnectionSpeed = 100
	}
	return nil
}

// BeforeUpdate hook to validate data
func (u *SmppUser) BeforeUpdate(tx *gorm.DB) error {
	if u.MaxConnectionSpeed <= 0 {
		u.MaxConnectionSpeed = 100
	}
	return nil
}

// UpdateConnectionStatus updates the online status and connection timestamps
func (u *SmppUser) UpdateConnectionStatus(isOnline bool, ipAddress string) {
	now := time.Now()
	u.IsOnline = isOnline
	u.LastIPAddress = &ipAddress

	if isOnline {
		u.LastConnectedAt = &now
		u.ConnectionCount++
	} else {
		u.LastDisconnectedAt = &now
	}
}

// IncrementMessageCount increments the message counters
func (u *SmppUser) IncrementMessageCount(isSent bool) {
	if isSent {
		u.TotalMessagesSent++
	} else {
		u.TotalMessagesReceived++
	}
}
