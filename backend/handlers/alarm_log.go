package handlers

import (
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type AlarmLogHandler struct {
	cfg *config.Config
}

func NewAlarmLogHandler(cfg *config.Config) *AlarmLogHandler {
	return &AlarmLogHandler{
		cfg: cfg,
	}
}

// GetAlarmLogs returns all alarm logs with pagination and filtering
func (h *AlarmLogHandler) GetAlarmLogs(c *fiber.Ctx) error {
	var alarmLogs []models.AlarmLog
	var total int64

	// Get query parameters
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 50) // Default to 50 records
	deviceID := c.Query("device_id")
	deviceGroup := c.Query("device_group")
	countrySite := c.Query("country_site")
	alarmType := c.Query("alarm_type")
	severity := c.Query("severity")
	status := c.Query("status")

	// Build query
	query := database.GetDB().Model(&models.AlarmLog{})

	// Apply filters
	if deviceID != "" {
		query = query.Where("device_id = ?", deviceID)
	}
	if deviceGroup != "" {
		query = query.Where("device_group = ?", deviceGroup)
	}
	if countrySite != "" {
		query = query.Where("country_site = ?", countrySite)
	}
	if alarmType != "" {
		query = query.Where("alarm_type = ?", alarmType)
	}
	if severity != "" {
		query = query.Where("severity = ?", severity)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	query.Count(&total)

	// Apply pagination and ordering
	offset := (page - 1) * limit
	query = query.Order("created_at DESC").Offset(offset).Limit(limit)

	// Execute query
	if err := query.Find(&alarmLogs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch alarm logs",
		})
	}

	return c.JSON(fiber.Map{
		"data":  alarmLogs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAlarmLog returns a specific alarm log by ID
func (h *AlarmLogHandler) GetAlarmLog(c *fiber.Ctx) error {
	id := c.Params("id")

	var alarmLog models.AlarmLog
	if err := database.GetDB().First(&alarmLog, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Alarm log not found",
		})
	}

	return c.JSON(alarmLog)
}

// DeleteAlarmLog deletes an alarm log
func (h *AlarmLogHandler) DeleteAlarmLog(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := database.GetDB().Delete(&models.AlarmLog{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete alarm log",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Alarm log deleted successfully",
	})
}

// ClearAlarmLogs clears all alarm logs
func (h *AlarmLogHandler) ClearAlarmLogs(c *fiber.Ctx) error {
	if err := database.GetDB().Where("1 = 1").Delete(&models.AlarmLog{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to clear alarm logs",
		})
	}

	return c.JSON(fiber.Map{
		"message": "All alarm logs cleared successfully",
	})
}
