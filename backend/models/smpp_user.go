package models

import (
	"time"

	"gorm.io/gorm"
)

type SmppUser struct {
	ID                    uint       `json:"id" gorm:"primaryKey"`
	SystemID              string     `json:"system_id" gorm:"uniqueIndex;not null;size:50"`
	Password              string     `json:"password" gorm:"not null;size:100"`
	MaxConnectionSpeed    int        `json:"max_connection_speed" gorm:"not null;default:100"`
	IsActive              bool       `json:"is_active" gorm:"not null;default:true"`
	IsOnline              bool       `json:"is_online" gorm:"not null;default:false"`
	LastConnectedAt       *time.Time `json:"last_connected_at"`
	LastDisconnectedAt    *time.Time `json:"last_disconnected_at"`
	LastIPAddress         *string    `json:"last_ip_address" gorm:"size:45"`
	ConnectionCount       int        `json:"connection_count" gorm:"not null;default:0"`
	TotalMessagesSent     int        `json:"total_messages_sent" gorm:"not null;default:0"`
	TotalMessagesReceived int        `json:"total_messages_received" gorm:"not null;default:0"`

	// MT Messaging Credentials
	MtSrcAddr              *string `json:"mt_src_addr" gorm:"size:50"`
	MtHttpThroughput       *string `json:"mt_http_throughput" gorm:"size:20"`
	MtBalance              *string `json:"mt_balance" gorm:"size:20"`
	MtSmppsThroughput      *string `json:"mt_smpps_throughput" gorm:"size:20"`
	MtSmsCount             *string `json:"mt_sms_count" gorm:"size:20"`
	MtEarlyPercent         *string `json:"mt_early_percent" gorm:"size:20"`
	MtPriorityFilter       *string `json:"mt_priority_filter" gorm:"size:10"`
	MtContentFilter        *string `json:"mt_content_filter" gorm:"size:255"`
	MtSrcAddrFilter        *string `json:"mt_src_addr_filter" gorm:"size:255"`
	MtDstAddrFilter        *string `json:"mt_dst_addr_filter" gorm:"size:255"`
	MtValidityPeriodFilter *string `json:"mt_validity_period_filter" gorm:"size:20"`
	MtHttpSend             bool    `json:"mt_http_send" gorm:"default:true"`
	MtHttpDlrMethod        bool    `json:"mt_http_dlr_method" gorm:"default:true"`
	MtHttpBalance          bool    `json:"mt_http_balance" gorm:"default:true"`
	MtSmppsSend            bool    `json:"mt_smpps_send" gorm:"default:true"`
	MtPriority             bool    `json:"mt_priority" gorm:"default:true"`
	MtHttpLongContent      bool    `json:"mt_http_long_content" gorm:"default:true"`
	MtSrcAddrAuth          bool    `json:"mt_src_addr_auth" gorm:"default:true"`
	MtDlrLevel             bool    `json:"mt_dlr_level" gorm:"default:true"`
	MtHttpRate             bool    `json:"mt_http_rate" gorm:"default:true"`
	MtValidityPeriod       bool    `json:"mt_validity_period" gorm:"default:true"`
	MtHttpBulk             bool    `json:"mt_http_bulk" gorm:"default:false"`
	MtHexContent           bool    `json:"mt_hex_content" gorm:"default:true"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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
