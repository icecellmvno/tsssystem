package models

import (
	"time"

	"gorm.io/gorm"
)

type Sitename struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Name         string         `json:"name" gorm:"uniqueIndex;size:100;not null"`
	ManagerUser  uint           `json:"manager_user" gorm:"not null"`
	OperatorUser uint           `json:"operator_user" gorm:"not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type SitenameCreateRequest struct {
	Name         string `json:"name" validate:"required,min=2,max=100"`
	ManagerUser  uint   `json:"manager_user" validate:"required"`
	OperatorUser uint   `json:"operator_user" validate:"required"`
}

type SitenameUpdateRequest struct {
	Name         string `json:"name" validate:"required,min=2,max=100"`
	ManagerUser  uint   `json:"manager_user" validate:"required"`
	OperatorUser uint   `json:"operator_user" validate:"required"`
}

type SitenameResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	ManagerUser  uint      `json:"manager_user"`
	OperatorUser uint      `json:"operator_user"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
