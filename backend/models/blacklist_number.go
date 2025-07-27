package models

import (
	"time"

	"gorm.io/gorm"
)

type BlacklistNumber struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Number    string    `json:"number" gorm:"uniqueIndex;not null;size:20"`
	Type      string    `json:"type" gorm:"not null;default:'manual';size:10"` // 'sms' or 'manual'
	Reason    *string   `json:"reason" gorm:"size:500"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName specifies the table name for BlacklistNumber
func (BlacklistNumber) TableName() string {
	return "blacklist_numbers"
}

// BeforeCreate hook to validate data
func (b *BlacklistNumber) BeforeCreate(tx *gorm.DB) error {
	// Ensure number starts with +
	if b.Number != "" && b.Number[0] != '+' {
		b.Number = "+" + b.Number
	}
	return nil
}

// BeforeUpdate hook to validate data
func (b *BlacklistNumber) BeforeUpdate(tx *gorm.DB) error {
	// Ensure number starts with +
	if b.Number != "" && b.Number[0] != '+' {
		b.Number = "+" + b.Number
	}
	return nil
}

// IsValidNumber checks if the phone number format is valid
func (b *BlacklistNumber) IsValidNumber() bool {
	if len(b.Number) < 10 || len(b.Number) > 20 {
		return false
	}
	if b.Number[0] != '+' {
		return false
	}
	// Check if the rest are digits
	for i := 1; i < len(b.Number); i++ {
		if b.Number[i] < '0' || b.Number[i] > '9' {
			return false
		}
	}
	return true
}
