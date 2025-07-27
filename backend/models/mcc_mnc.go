package models

import (
	"time"
)

type MccMnc struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Mcc         string    `json:"mcc" gorm:"size:10;not null;index"`
	Mnc         string    `json:"mnc" gorm:"size:10;not null;index"`
	Iso         string    `json:"iso" gorm:"size:10;not null;index"`
	Country     string    `json:"country" gorm:"size:100;not null;index"`
	CountryCode string    `json:"country_code" gorm:"size:10;not null"`
	Network     string    `json:"network" gorm:"size:200;not null;index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MccMncCreateRequest struct {
	Mcc         string `json:"mcc" validate:"required,min=1,max=10"`
	Mnc         string `json:"mnc" validate:"required,min=1,max=10"`
	Iso         string `json:"iso" validate:"required,min=1,max=10"`
	Country     string `json:"country" validate:"required,min=1,max=100"`
	CountryCode string `json:"country_code" validate:"required,min=1,max=10"`
	Network     string `json:"network" validate:"required,min=1,max=200"`
}

type MccMncUpdateRequest struct {
	Mcc         string `json:"mcc" validate:"required,min=1,max=10"`
	Mnc         string `json:"mnc" validate:"required,min=1,max=10"`
	Iso         string `json:"iso" validate:"required,min=1,max=10"`
	Country     string `json:"country" validate:"required,min=1,max=100"`
	CountryCode string `json:"country_code" validate:"required,min=1,max=10"`
	Network     string `json:"network" validate:"required,min=1,max=200"`
}

type MccMncResponse struct {
	ID          uint      `json:"id"`
	Mcc         string    `json:"mcc"`
	Mnc         string    `json:"mnc"`
	Iso         string    `json:"iso"`
	Country     string    `json:"country"`
	CountryCode string    `json:"country_code"`
	Network     string    `json:"network"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MccMncFilterOptions struct {
	Countries []string `json:"countries"`
	Networks  []string `json:"networks"`
	Isos      []string `json:"isos"`
}
