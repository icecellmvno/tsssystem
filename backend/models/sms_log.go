package models

import (
	"time"
)

// SmsLog represents SMS logs in the database
type SmsLog struct {
	ID                       uint       `json:"id" gorm:"primaryKey"`
	MessageID                string     `json:"message_id" gorm:"uniqueIndex;not null;size:255"`
	MsgID                    *string    `json:"msg_id" gorm:"size:255"`
	OperatorMsgID            *string    `json:"operator_msg_id" gorm:"size:255"`
	UID                      *string    `json:"uid" gorm:"size:255"`
	CorrelationID            *string    `json:"correlation_id" gorm:"size:255"`
	DeviceID                 *string    `json:"device_id" gorm:"size:255;index"`
	DeviceName               *string    `json:"device_name" gorm:"size:255"`
	DeviceIMEI               *string    `json:"device_imei" gorm:"size:255"`
	DeviceIMSI               *string    `json:"device_imsi" gorm:"size:255"`
	SimcardName              *string    `json:"simcard_name" gorm:"size:255"`
	SimSlot                  *int       `json:"sim_slot" gorm:"index"`
	SimcardNumber            *string    `json:"simcard_number" gorm:"size:255"`
	SimcardICCID             *string    `json:"simcard_iccid" gorm:"size:255"`
	DeviceGroupID            *uint      `json:"device_group_id" gorm:"index"`
	DeviceGroup              *string    `json:"device_group" gorm:"size:255"`
	SitenameID               *uint      `json:"sitename_id" gorm:"index"`
	Sitename                 *string    `json:"sitename" gorm:"size:255"`
	SourceAddr               *string    `json:"source_addr" gorm:"size:255"`
	SourceUsername           *string    `json:"source_username" gorm:"size:255"`
	DestinationAddr          *string    `json:"destination_addr" gorm:"size:255"`
	Message                  *string    `json:"message" gorm:"type:text"`
	MessageLength            int        `json:"message_length" gorm:"not null;default:0"`
	MessageEncoding          *string    `json:"message_encoding" gorm:"size:50"`
	Direction                string     `json:"direction" gorm:"not null;size:20;index"`           // inbound, outbound
	Priority                 string     `json:"priority" gorm:"not null;size:20;default:'normal'"` // low, normal, high, urgent
	Status                   string     `json:"status" gorm:"not null;size:20;index"`              // pending, queued, sent, delivered, failed, timeout, guard, rejected, expired, cancelled, submitted, accepted, undeliverable, unknown
	StatusCode               *string    `json:"status_code" gorm:"size:50"`
	RetryCount               int        `json:"retry_count" gorm:"not null;default:0"`
	MaxRetries               int        `json:"max_retries" gorm:"not null;default:3"`
	QueuedAt                 *time.Time `json:"queued_at"`
	SentAt                   *time.Time `json:"sent_at"`
	DeliveredAt              *time.Time `json:"delivered_at"`
	ExpiresAt                *time.Time `json:"expires_at"`
	ProcessedAt              *time.Time `json:"processed_at"`
	SmppUserID               *uint      `json:"smpp_user_id" gorm:"index"`
	SmppSent                 bool       `json:"smpp_sent" gorm:"not null;default:false"`
	OperatorName             *string    `json:"operator_name" gorm:"size:255"`
	OperatorCode             *string    `json:"operator_code" gorm:"size:50"`
	MCC                      *string    `json:"mcc" gorm:"size:10"`
	MNC                      *string    `json:"mnc" gorm:"size:10"`
	Rate                     string     `json:"rate" gorm:"not null;default:'0.00'"`
	Charge                   string     `json:"charge" gorm:"not null;default:'0.00'"`
	Currency                 string     `json:"currency" gorm:"not null;default:'TRY'"`
	PduCount                 int        `json:"pdu_count" gorm:"not null;default:1"`
	TotalCost                string     `json:"total_cost" gorm:"not null;default:'0.00'"`
	ErrorMessage             *string    `json:"error_message" gorm:"type:text"`
	ErrorCode                *string    `json:"error_code" gorm:"size:50"`
	DeliveryReportRequested  bool       `json:"delivery_report_requested" gorm:"not null;default:true"`
	DeliveryReportReceivedAt *time.Time `json:"delivery_report_received_at"`
	DeliveryReportStatus     *string    `json:"delivery_report_status" gorm:"size:50"`
	ProcessingTimeMs         *int       `json:"processing_time_ms"`
	QueueTimeMs              *int       `json:"queue_time_ms"`
	IsBlacklisted            bool       `json:"is_blacklisted" gorm:"not null;default:false"`
	CampaignID               *string    `json:"campaign_id" gorm:"size:255"`
	BatchID                  *string    `json:"batch_id" gorm:"size:255"`
	Metadata                 *string    `json:"metadata" gorm:"type:json"`
	CreatedAt                time.Time  `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt                time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for SmsLog
func (SmsLog) TableName() string {
	return "sms_logs"
}

// SmsLogCreateRequest represents the request structure for creating SMS logs
type SmsLogCreateRequest struct {
	DeviceID                string  `json:"device_id" validate:"required"`
	DeviceName              string  `json:"device_name"`
	SimSlot                 int     `json:"sim_slot" validate:"required,min=1,max=2"`
	DestinationAddr         string  `json:"destination_addr" validate:"required"`
	Message                 string  `json:"message" validate:"required"`
	Priority                string  `json:"priority"`
	DeviceGroupID           *uint   `json:"device_group_id"`
	CampaignID              *string `json:"campaign_id"`
	BatchID                 *string `json:"batch_id"`
	DeliveryReportRequested bool    `json:"delivery_report_requested"`
}

// SmsLogUpdateRequest represents the request structure for updating SMS logs
type SmsLogUpdateRequest struct {
	Status                   *string    `json:"status"`
	StatusCode               *string    `json:"status_code"`
	SentAt                   *time.Time `json:"sent_at"`
	DeliveredAt              *time.Time `json:"delivered_at"`
	ErrorMessage             *string    `json:"error_message"`
	ErrorCode                *string    `json:"error_code"`
	DeliveryReportStatus     *string    `json:"delivery_report_status"`
	DeliveryReportReceivedAt *time.Time `json:"delivery_report_received_at"`
	ProcessingTimeMs         *int       `json:"processing_time_ms"`
	QueueTimeMs              *int       `json:"queue_time_ms"`
}
