package handlers

import (
	"bufio"
	"strconv"
	"strings"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type BlacklistNumberHandler struct {
	db *gorm.DB
}

func NewBlacklistNumberHandler() *BlacklistNumberHandler {
	return &BlacklistNumberHandler{
		db: database.GetDB(),
	}
}

// CreateBlacklistNumber creates a new blacklist number
func (h *BlacklistNumberHandler) CreateBlacklistNumber(c *fiber.Ctx) error {
	var blacklistNumber models.BlacklistNumber

	if err := c.BodyParser(&blacklistNumber); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Validate required fields
	if blacklistNumber.Number == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Phone number is required",
		})
	}

	// Validate phone number format
	if !blacklistNumber.IsValidNumber() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Invalid phone number format. Must start with + and contain only digits",
		})
	}

	// Validate type
	if blacklistNumber.Type != "sms" && blacklistNumber.Type != "manual" {
		blacklistNumber.Type = "manual"
	}

	// Check if number already exists
	var existingNumber models.BlacklistNumber
	if err := h.db.Where("number = ?", blacklistNumber.Number).First(&existingNumber).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Phone number already exists in blacklist",
		})
	}

	// Create the blacklist number
	if err := h.db.Create(&blacklistNumber).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Blacklist number created successfully",
		"data":    blacklistNumber,
	})
}

// GetAllBlacklistNumbers retrieves all blacklist numbers with pagination and filtering
func (h *BlacklistNumberHandler) GetAllBlacklistNumbers(c *fiber.Ctx) error {
	var blacklistNumbers []models.BlacklistNumber
	var total int64

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search")
	typeFilter := c.Query("type")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Build query
	query := h.db.Model(&models.BlacklistNumber{})

	// Apply filters
	if search != "" {
		query = query.Where("number LIKE ? OR reason LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if typeFilter != "" && typeFilter != "all" {
		query = query.Where("type = ?", typeFilter)
	}

	// Get total count
	query.Count(&total)

	// Apply sorting
	orderClause := sortBy + " " + sortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		orderClause = "created_at desc"
	}

	// Apply pagination
	offset := (page - 1) * limit
	query = query.Offset(offset).Limit(limit).Order(orderClause)

	// Execute query
	if err := query.Find(&blacklistNumbers).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(limit) - 1) / int64(limit))
	if lastPage == 0 {
		lastPage = 1
	}

	return c.JSON(fiber.Map{
		"data": blacklistNumbers,
		"meta": fiber.Map{
			"current_page": page,
			"last_page":    lastPage,
			"per_page":     limit,
			"total":        total,
		},
	})
}

// GetBlacklistNumberByID retrieves a specific blacklist number by ID
func (h *BlacklistNumberHandler) GetBlacklistNumberByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var blacklistNumber models.BlacklistNumber
	if err := h.db.First(&blacklistNumber, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "Blacklist number not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": blacklistNumber,
	})
}

// UpdateBlacklistNumber updates an existing blacklist number
func (h *BlacklistNumberHandler) UpdateBlacklistNumber(c *fiber.Ctx) error {
	id := c.Params("id")

	var blacklistNumber models.BlacklistNumber
	if err := h.db.First(&blacklistNumber, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "Blacklist number not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Parse request body
	var updateData map[string]interface{}
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Validate phone number if being updated
	if number, exists := updateData["number"]; exists {
		numberStr := number.(string)
		if numberStr != "" {
			// Ensure it starts with +
			if numberStr[0] != '+' {
				numberStr = "+" + numberStr
				updateData["number"] = numberStr
			}

			// Check if new number already exists
			var existingNumber models.BlacklistNumber
			if err := h.db.Where("number = ? AND id != ?", numberStr, id).First(&existingNumber).Error; err == nil {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{
					"error":   "Validation failed",
					"message": "Phone number already exists in blacklist",
				})
			}
		}
	}

	// Update the blacklist number
	if err := h.db.Model(&blacklistNumber).Updates(updateData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Get updated blacklist number
	h.db.First(&blacklistNumber, id)

	return c.JSON(fiber.Map{
		"message": "Blacklist number updated successfully",
		"data":    blacklistNumber,
	})
}

// DeleteBlacklistNumber deletes a blacklist number
func (h *BlacklistNumberHandler) DeleteBlacklistNumber(c *fiber.Ctx) error {
	id := c.Params("id")

	var blacklistNumber models.BlacklistNumber
	if err := h.db.First(&blacklistNumber, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "Blacklist number not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Delete the blacklist number
	if err := h.db.Delete(&blacklistNumber).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Blacklist number deleted successfully",
	})
}

// BulkImportBlacklistNumbers imports multiple blacklist numbers from file
func (h *BlacklistNumberHandler) BulkImportBlacklistNumbers(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "File upload error",
			"message": "No file uploaded",
		})
	}

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "File error",
			"message": "Failed to open uploaded file",
		})
	}
	defer src.Close()

	var successCount int
	var errorCount int
	var errors []string

	scanner := bufio.NewScanner(src)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		// Parse line (format: number,type,reason)
		parts := strings.Split(line, ",")
		number := strings.TrimSpace(parts[0])
		numberType := "manual"
		reason := ""

		if len(parts) > 1 {
			numberType = strings.TrimSpace(parts[1])
		}
		if len(parts) > 2 {
			reason = strings.TrimSpace(parts[2])
		}

		// Validate type
		if numberType != "sms" && numberType != "manual" {
			numberType = "manual"
		}

		// Ensure number starts with +
		if number != "" && number[0] != '+' {
			number = "+" + number
		}

		// Create blacklist number
		blacklistNumber := models.BlacklistNumber{
			Number: number,
			Type:   numberType,
		}

		if reason != "" {
			blacklistNumber.Reason = &reason
		}

		// Check if number already exists
		var existing models.BlacklistNumber
		if err := h.db.Where("number = ?", number).First(&existing).Error; err == nil {
			errorCount++
			errors = append(errors, "Number "+number+" already exists")
			continue
		}

		// Create the blacklist number
		if err := h.db.Create(&blacklistNumber).Error; err != nil {
			errorCount++
			errors = append(errors, "Failed to create "+number+": "+err.Error())
		} else {
			successCount++
		}
	}

	return c.JSON(fiber.Map{
		"success":      true,
		"message":      "Import completed",
		"successCount": successCount,
		"errorCount":   errorCount,
		"errors":       errors,
	})
}

// BulkPasteBlacklistNumbers imports multiple blacklist numbers from pasted text
func (h *BlacklistNumberHandler) BulkPasteBlacklistNumbers(c *fiber.Ctx) error {
	var request struct {
		Lines string `json:"lines"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	if request.Lines == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "No data provided",
		})
	}

	var successCount int
	var errorCount int
	var errors []string

	lines := strings.Split(request.Lines, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse line (format: number,type,reason)
		parts := strings.Split(line, ",")
		number := strings.TrimSpace(parts[0])
		numberType := "manual"
		reason := ""

		if len(parts) > 1 {
			numberType = strings.TrimSpace(parts[1])
		}
		if len(parts) > 2 {
			reason = strings.TrimSpace(parts[2])
		}

		// Validate type
		if numberType != "sms" && numberType != "manual" {
			numberType = "manual"
		}

		// Ensure number starts with +
		if number != "" && number[0] != '+' {
			number = "+" + number
		}

		// Create blacklist number
		blacklistNumber := models.BlacklistNumber{
			Number: number,
			Type:   numberType,
		}

		if reason != "" {
			blacklistNumber.Reason = &reason
		}

		// Check if number already exists
		var existing models.BlacklistNumber
		if err := h.db.Where("number = ?", number).First(&existing).Error; err == nil {
			errorCount++
			errors = append(errors, "Number "+number+" already exists")
			continue
		}

		// Create the blacklist number
		if err := h.db.Create(&blacklistNumber).Error; err != nil {
			errorCount++
			errors = append(errors, "Failed to create "+number+": "+err.Error())
		} else {
			successCount++
		}
	}

	return c.JSON(fiber.Map{
		"success":      true,
		"message":      "Import completed",
		"successCount": successCount,
		"errorCount":   errorCount,
		"errors":       errors,
	})
}

// BulkDeleteBlacklistNumbers deletes multiple blacklist numbers
func (h *BlacklistNumberHandler) BulkDeleteBlacklistNumbers(c *fiber.Ctx) error {
	var request struct {
		IDs []uint `json:"ids"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	if len(request.IDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "No IDs provided",
		})
	}

	// Delete the blacklist numbers
	if err := h.db.Delete(&models.BlacklistNumber{}, request.IDs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Blacklist numbers deleted successfully",
		"count":   len(request.IDs),
	})
}
