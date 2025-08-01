package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"tsimsocketserver/auth"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
)

// GetSmsLogs returns paginated SMS logs with filters
func GetSmsLogs(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)
	_ = user.UserID // userID is available but not used yet

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "15"))
	search := c.Query("search", "")
	status := c.Query("status", "")
	smsStatus := c.Query("sms_status", "")
	smppSent := c.Query("smpp_sent", "")
	sourceAddr := c.Query("source_addr", "")
	destinationAddr := c.Query("destination_addr", "")
	deviceID := c.Query("device_id", "")
	deviceName := c.Query("device_name", "")
	simcardName := c.Query("simcard_name", "")
	simSlot := c.Query("sim_slot", "")
	sitename := c.Query("sitename", "")
	deviceGroup := c.Query("device_group", "")
	sourceUsername := c.Query("source_username", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")
	startTime := c.Query("start_time", "")
	endTime := c.Query("end_time", "")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Debug: Log the received parameters
	log.Printf("SMS Logs Filter - startDate: %s, endDate: %s, startTime: %s, endTime: %s",
		startDate, endDate, startTime, endTime)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 15
	}

	// Build query
	query := database.GetDB().Model(&models.SmsLog{})

	// Apply filters
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"message_id LIKE ? OR destination_addr LIKE ? OR source_addr LIKE ? OR message LIKE ? OR device_name LIKE ? OR device_imei LIKE ? OR device_imsi LIKE ? OR sitename LIKE ? OR device_group LIKE ? OR source_username LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	// Use sms_status if provided, otherwise fall back to status
	if smsStatus != "" {
		query = query.Where("status = ?", smsStatus)
	} else if status != "" {
		query = query.Where("status = ?", status)
	}

	if smppSent != "" {
		if smppSent == "true" {
			query = query.Where("smpp_sent = ?", true)
		} else if smppSent == "false" {
			query = query.Where("smpp_sent = ?", false)
		}
	}

	if sourceAddr != "" {
		query = query.Where("source_addr LIKE ?", "%"+sourceAddr+"%")
	}

	if destinationAddr != "" {
		query = query.Where("destination_addr LIKE ?", "%"+destinationAddr+"%")
	}

	if deviceID != "" {
		query = query.Where("device_id LIKE ?", "%"+deviceID+"%")
	}

	if deviceName != "" {
		query = query.Where("device_name LIKE ?", "%"+deviceName+"%")
	}

	if simcardName != "" {
		query = query.Where("simcard_name LIKE ?", "%"+simcardName+"%")
	}

	if simSlot != "" {
		if slot, err := strconv.Atoi(simSlot); err == nil {
			query = query.Where("sim_slot = ?", slot)
		}
	}

	if sitename != "" {
		query = query.Where("sitename = ?", sitename)
	}

	if deviceGroup != "" {
		query = query.Where("device_group = ?", deviceGroup)
	}

	if sourceUsername != "" {
		query = query.Where("source_username = ?", sourceUsername)
	}

	if startDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", startDate); err == nil {
			// If start time is also provided, combine them
			if startTime != "" {
				// Parse the time
				if parsedTime, err := time.Parse("15:04", startTime); err == nil {
					// Combine date and time
					startDateTime := time.Date(
						parsedDate.Year(), parsedDate.Month(), parsedDate.Day(),
						parsedTime.Hour(), parsedTime.Minute(), 0, 0,
						time.UTC,
					)
					query = query.Where("created_at >= ?", startDateTime)
				} else {
					// Fallback to date only
					query = query.Where("DATE(created_at) >= ?", parsedDate.Format("2006-01-02"))
				}
			} else {
				// Date only
				query = query.Where("DATE(created_at) >= ?", parsedDate.Format("2006-01-02"))
			}
		}
	} else if startTime != "" {
		// Only time filter (no date)
		query = query.Where("TIME(created_at) >= ?", startTime)
	}

	if endDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", endDate); err == nil {
			// If end time is also provided, combine them
			if endTime != "" {
				// Parse the time
				if parsedTime, err := time.Parse("15:04", endTime); err == nil {
					// Combine date and time
					endDateTime := time.Date(
						parsedDate.Year(), parsedDate.Month(), parsedDate.Day(),
						parsedTime.Hour(), parsedTime.Minute(), 59, 999999999,
						time.UTC,
					)
					query = query.Where("created_at <= ?", endDateTime)
				} else {
					// Fallback to date only (add one day to include the end date)
					endDatePlusOne := parsedDate.AddDate(0, 0, 1)
					query = query.Where("DATE(created_at) < ?", endDatePlusOne.Format("2006-01-02"))
				}
			} else {
				// Date only (add one day to include the end date)
				endDatePlusOne := parsedDate.AddDate(0, 0, 1)
				query = query.Where("DATE(created_at) < ?", endDatePlusOne.Format("2006-01-02"))
			}
		}
	} else if endTime != "" {
		// Only time filter (no date)
		query = query.Where("TIME(created_at) <= ?", endTime)
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

	// Debug: Log the final query
	sql := query.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Find(&[]models.SmsLog{})
	})
	log.Printf("SMS Logs Query: %s", sql)

	// Execute query
	var smsLogs []models.SmsLog
	if err := query.Find(&smsLogs).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SMS logs",
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))

	return c.JSON(fiber.Map{
		"data":         smsLogs,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
	})
}

// GetSmsLog returns a single SMS log by ID
func GetSmsLog(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)
	_ = user.UserID // userID is available but not used yet

	// Get SMS log ID from URL
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMS log ID",
		})
	}

	// Find SMS log
	var smsLog models.SmsLog
	if err := database.GetDB().First(&smsLog, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "SMS log not found",
			})
		}
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SMS log",
		})
	}

	return c.JSON(smsLog)
}

// GetSmsLogFilterOptions returns filter options for SMS logs
func GetSmsLogFilterOptions(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)
	_ = user.UserID // userID is available but not used yet

	// Get unique statuses
	var statuses []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("status").
		Where("status IS NOT NULL AND status != ''").
		Pluck("status", &statuses)

	// Get unique device names
	var deviceNames []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("device_name").
		Where("device_name IS NOT NULL AND device_name != ''").
		Pluck("device_name", &deviceNames)

	// Get unique SIM card names
	var simcardNames []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("simcard_name").
		Where("simcard_name IS NOT NULL AND simcard_name != ''").
		Pluck("simcard_name", &simcardNames)

	// Get unique SIM slots
	var simSlots []int
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("sim_slot").
		Where("sim_slot IS NOT NULL").
		Pluck("sim_slot", &simSlots)

	// Get unique sitenames
	var sitenames []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("sitename").
		Where("sitename IS NOT NULL AND sitename != ''").
		Pluck("sitename", &sitenames)

	// Get unique device groups
	var deviceGroups []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("device_group").
		Where("device_group IS NOT NULL AND device_group != ''").
		Pluck("device_group", &deviceGroups)

	// Get unique source usernames
	var sourceUsernames []string
	database.GetDB().Model(&models.SmsLog{}).
		Distinct("source_username").
		Where("source_username IS NOT NULL AND source_username != ''").
		Pluck("source_username", &sourceUsernames)

	return c.JSON(fiber.Map{
		"statuses":        statuses,
		"deviceNames":     deviceNames,
		"simcardNames":    simcardNames,
		"simSlots":        simSlots,
		"sitenames":       sitenames,
		"deviceGroups":    deviceGroups,
		"sourceUsernames": sourceUsernames,
	})
}
