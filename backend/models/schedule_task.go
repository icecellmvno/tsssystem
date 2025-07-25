package models

import (
	"time"
)

type ScheduleTask struct {
	ID                  uint       `json:"id" gorm:"primaryKey"`
	Name                string     `json:"name" gorm:"not null"`
	Description         *string    `json:"description"`
	DeviceGroupID       uint       `json:"device_group_id" gorm:"not null"`
	TaskType            string     `json:"task_type" gorm:"not null;type:enum('ussd','sms')"`
	Command             string     `json:"command" gorm:"not null"`
	Recipient           *string    `json:"recipient"`
	Frequency           string     `json:"frequency" gorm:"not null;type:enum('hourly','daily','weekly','monthly','custom')"`
	CronExpression      *string    `json:"cron_expression"`
	Time                string     `json:"time" gorm:"not null"`
	DayOfWeek           *int       `json:"day_of_week"`
	DayOfMonth          *int       `json:"day_of_month"`
	Month               *int       `json:"month"`
	IntervalMinutes     *int       `json:"interval_minutes"`
	IsActive            bool       `json:"is_active" gorm:"default:true"`
	DualSimSupport      bool       `json:"dual_sim_support" gorm:"default:false"`
	FallbackToSingleSim bool       `json:"fallback_to_single_sim" gorm:"default:true"`
	MaxRetries          int        `json:"max_retries" gorm:"default:3"`
	RetryDelayMinutes   int        `json:"retry_delay_minutes" gorm:"default:5"`
	Status              string     `json:"status" gorm:"default:'active';type:enum('active','paused','completed','failed')"`
	LastExecutedAt      *time.Time `json:"last_executed_at"`
	NextExecutionAt     *time.Time `json:"next_execution_at"`
	ExecutionCount      int        `json:"execution_count" gorm:"default:0"`
	SuccessCount        int        `json:"success_count" gorm:"default:0"`
	FailureCount        int        `json:"failure_count" gorm:"default:0"`
	LastError           *string    `json:"last_error"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`

	// Relations
	DeviceGroup *DeviceGroup `json:"device_group_data" gorm:"foreignKey:DeviceGroupID"`
}

type ScheduleTaskExecution struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	ScheduleTaskID uint       `json:"schedule_task_id" gorm:"not null"`
	DeviceID       string     `json:"device_id" gorm:"not null"`
	Status         string     `json:"status" gorm:"not null;type:enum('pending','running','completed','failed')"`
	StartedAt      *time.Time `json:"started_at"`
	CompletedAt    *time.Time `json:"completed_at"`
	Error          *string    `json:"error"`
	RetryCount     int        `json:"retry_count" gorm:"default:0"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Relations
	ScheduleTask *ScheduleTask `json:"schedule_task" gorm:"foreignKey:ScheduleTaskID"`
}
