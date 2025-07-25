package models

import (
	"encoding/json"
	"time"
)

type Filter struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	Name        string          `json:"name" gorm:"not null"`
	Type        string          `json:"type" gorm:"not null"`
	Description string          `json:"description"`
	IsActive    bool            `json:"is_active" gorm:"default:true"`
	Config      json.RawMessage `json:"config" gorm:"type:json"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// TableName specifies the table name for the Filter model
func (Filter) TableName() string {
	return "filters"
}

// FilterType represents the different types of filters
type FilterType string

const (
	TransparentFilter     FilterType = "TransparentFilter"
	ConnectorFilter       FilterType = "ConnectorFilter"
	UserFilter            FilterType = "UserFilter"
	GroupFilter           FilterType = "GroupFilter"
	SourceAddrFilter      FilterType = "SourceAddrFilter"
	DestinationAddrFilter FilterType = "DestinationAddrFilter"
	ShortMessageFilter    FilterType = "ShortMessageFilter"
	DateIntervalFilter    FilterType = "DateIntervalFilter"
	TimeIntervalFilter    FilterType = "TimeIntervalFilter"
	TagFilter             FilterType = "TagFilter"
	EvalPyFilter          FilterType = "EvalPyFilter"
)

// FilterConfig represents the configuration for different filter types
type FilterConfig struct {
	// ConnectorFilter
	ConnectorID string `json:"connector_id,omitempty"`

	// UserFilter
	UserID string `json:"user_id,omitempty"`

	// GroupFilter
	GroupID string `json:"group_id,omitempty"`

	// SourceAddrFilter, DestinationAddrFilter
	Address string `json:"address,omitempty"`

	// ShortMessageFilter
	Pattern string `json:"pattern,omitempty"`

	// DateIntervalFilter
	StartDate string `json:"start_date,omitempty"`
	EndDate   string `json:"end_date,omitempty"`

	// TimeIntervalFilter
	StartTime string `json:"start_time,omitempty"`
	EndTime   string `json:"end_time,omitempty"`

	// TagFilter
	Tag string `json:"tag,omitempty"`

	// EvalPyFilter
	ScriptPath    string `json:"script_path,omitempty"`
	ScriptContent string `json:"script_content,omitempty"`
}

// CreateFilterRequest represents the request structure for creating a filter
type CreateFilterRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Type        string                 `json:"type" binding:"required"`
	Description string                 `json:"description"`
	IsActive    bool                   `json:"is_active"`
	Config      map[string]interface{} `json:"config"`
}

// UpdateFilterRequest represents the request structure for updating a filter
type UpdateFilterRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Type        string                 `json:"type" binding:"required"`
	Description string                 `json:"description"`
	IsActive    bool                   `json:"is_active"`
	Config      map[string]interface{} `json:"config"`
}

// FilterResponse represents the response structure for filter data
type FilterResponse struct {
	ID          uint                   `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Description string                 `json:"description"`
	IsActive    bool                   `json:"is_active"`
	Config      map[string]interface{} `json:"config"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// PaginatedFiltersResponse represents the paginated response for filters
type PaginatedFiltersResponse struct {
	Data        []FilterResponse `json:"data"`
	CurrentPage int              `json:"current_page"`
	LastPage    int              `json:"last_page"`
	PerPage     int              `json:"per_page"`
	Total       int64            `json:"total"`
	Links       []interface{}    `json:"links"`
}
