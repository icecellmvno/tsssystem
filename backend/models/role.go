package models

import (
	"time"

	"gorm.io/gorm"
)

type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;size:50;not null"`
	Description *string        `json:"description" gorm:"size:255"`
	Permissions []Permission   `json:"permissions" gorm:"many2many:role_permissions;"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type RoleCreateRequest struct {
	Name          string `json:"name" validate:"required,min=2,max=50"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

type RoleUpdateRequest struct {
	Name          string  `json:"name" validate:"omitempty,min=2,max=50"`
	Description   *string `json:"description"`
	PermissionIDs *[]uint `json:"permission_ids"`
}

type RoleResponse struct {
	ID          uint         `json:"id"`
	Name        string       `json:"name"`
	Description *string      `json:"description"`
	Permissions []Permission `json:"permissions"`
	UserCount   int          `json:"user_count"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
