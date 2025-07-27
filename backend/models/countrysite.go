package models

import (
	"time"
)

type CountrySite struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	Name             string    `json:"name" gorm:"uniqueIndex;size:100;not null"`
	CountryPhoneCode string    `json:"country_phone_code" gorm:"size:10;not null"`
	ManagerUser      uint      `json:"manager_user" gorm:"not null"`
	OperatorUser     uint      `json:"operator_user" gorm:"not null"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type CountrySiteCreateRequest struct {
	Name             string `json:"name" validate:"required,min=2,max=100"`
	CountryPhoneCode string `json:"country_phone_code" validate:"required,min=1,max=10"`
	ManagerUser      uint   `json:"manager_user" validate:"required"`
	OperatorUser     uint   `json:"operator_user" validate:"required"`
}

type CountrySiteUpdateRequest struct {
	Name             string `json:"name" validate:"required,min=2,max=100"`
	CountryPhoneCode string `json:"country_phone_code" validate:"required,min=1,max=10"`
	ManagerUser      uint   `json:"manager_user" validate:"required"`
	OperatorUser     uint   `json:"operator_user" validate:"required"`
}

type CountrySiteResponse struct {
	ID               uint      `json:"id"`
	Name             string    `json:"name"`
	CountryPhoneCode string    `json:"country_phone_code"`
	ManagerUser      uint      `json:"manager_user"`
	OperatorUser     uint      `json:"operator_user"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
