package handlers

import (
	"strconv"
	"time"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetUssdLogs returns paginated USSD logs with filters
func GetUssdLogs(c *fiber.Ctx) error {
	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "15"))
	search := c.Query("search", "")
	status := c.Query("status", "")
	deviceID := c.Query("device_id", "")
	ussdCode := c.Query("ussd_code", "")
	deviceGroupID := c.Query("device_group_id", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 15
	}

	// Build query
	query := database.GetDB().Model(&models.UssdLog{})

	// Apply filters
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"session_id LIKE ? OR device_id LIKE ? OR device_name LIKE ? OR ussd_code LIKE ? OR request_message LIKE ? OR response_message LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if deviceID != "" && deviceID != "all" {
		query = query.Where("device_id LIKE ?", "%"+deviceID+"%")
	}

	if ussdCode != "" && ussdCode != "all" {
		query = query.Where("ussd_code LIKE ?", "%"+ussdCode+"%")
	}

	if deviceGroupID != "" && deviceGroupID != "all" {
		if groupID, err := strconv.Atoi(deviceGroupID); err == nil {
			query = query.Where("device_group_id = ?", groupID)
		}
	}

	if startDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("DATE(created_at) >= ?", parsedDate.Format("2006-01-02"))
		}
	}

	if endDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", endDate); err == nil {
			// Add one day to include the end date
			endDatePlusOne := parsedDate.AddDate(0, 0, 1)
			query = query.Where("DATE(created_at) < ?", endDatePlusOne.Format("2006-01-02"))
		}
	}

	// Apply sorting
	if sortOrder == "asc" {
		query = query.Order(sortBy + " ASC")
	} else {
		query = query.Order(sortBy + " DESC")
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	var ussdLogs []models.UssdLog
	if err := query.Find(&ussdLogs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch USSD logs",
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))

	return c.JSON(fiber.Map{
		"data":         ussdLogs,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
		"from":         offset + 1,
		"to":           offset + len(ussdLogs),
	})
}

// GetUssdLog returns a single USSD log by ID
func GetUssdLog(c *fiber.Ctx) error {
	// Get USSD log ID from URL
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid USSD log ID",
		})
	}

	// Find USSD log
	var ussdLog models.UssdLog
	if err := database.GetDB().First(&ussdLog, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "USSD log not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch USSD log",
		})
	}

	return c.JSON(fiber.Map{
		"data": ussdLog,
	})
}

// GetUssdLogFilterOptions returns filter options for USSD logs
func GetUssdLogFilterOptions(c *fiber.Ctx) error {
	var statuses []string
	var deviceIDs []string
	var ussdCodes []string
	var deviceGroupIDs []uint

	// Get unique statuses
	database.GetDB().Model(&models.UssdLog{}).
		Distinct("status").
		Where("status IS NOT NULL AND status != ''").
		Pluck("status", &statuses)

	// Get unique device IDs
	database.GetDB().Model(&models.UssdLog{}).
		Distinct("device_id").
		Where("device_id IS NOT NULL AND device_id != ''").
		Pluck("device_id", &deviceIDs)

	// Get unique USSD codes
	database.GetDB().Model(&models.UssdLog{}).
		Distinct("ussd_code").
		Where("ussd_code IS NOT NULL AND ussd_code != ''").
		Pluck("ussd_code", &ussdCodes)

	// Get unique device group IDs
	database.GetDB().Model(&models.UssdLog{}).
		Distinct("device_group_id").
		Where("device_group_id IS NOT NULL").
		Pluck("device_group_id", &deviceGroupIDs)

	return c.JSON(fiber.Map{
		"statuses":         statuses,
		"device_ids":       deviceIDs,
		"ussd_codes":       ussdCodes,
		"device_group_ids": deviceGroupIDs,
	})
}
