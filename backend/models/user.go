package models

import (
	"time"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Firstname string    `json:"firstname" gorm:"size:100;not null"`
	Lastname  string    `json:"lastname" gorm:"size:100;not null"`
	Email     string    `json:"email" gorm:"uniqueIndex;size:100;not null"`
	Password  string    `json:"-" gorm:"size:255;not null"`
	Role      string    `json:"role" gorm:"size:20;default:'user'"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserCreateRequest struct {
	Username  string `json:"username" validate:"required,min=3,max=50"`
	Firstname string `json:"firstname" validate:"required,min=2,max=100"`
	Lastname  string `json:"lastname" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	Role      string `json:"role" validate:"required,oneof=admin manager operator user"`
}

type UserUpdateRequest struct {
	Username  *string `json:"username" validate:"omitempty,min=3,max=50"`
	Firstname *string `json:"firstname" validate:"omitempty,min=2,max=100"`
	Lastname  *string `json:"lastname" validate:"omitempty,max=100"`
	Email     *string `json:"email" validate:"omitempty,email"`
	Password  *string `json:"password" validate:"omitempty,min=6"`
	Role      *string `json:"role" validate:"omitempty,oneof=admin manager operator user"`
	IsActive  *bool   `json:"is_active"`
}

type UserLoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Firstname string    `json:"firstname"`
	Lastname  string    `json:"lastname"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
