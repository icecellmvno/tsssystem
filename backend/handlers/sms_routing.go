package handlers

import (
	"strconv"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SmsRoutingHandler struct {
	db *gorm.DB
}

func NewSmsRoutingHandler() *SmsRoutingHandler {
	return &SmsRoutingHandler{
		db: database.GetDB(),
	}
}

// GetAllSmsRoutings retrieves all SMS routings with pagination and filtering
func (h *SmsRoutingHandler) GetAllSmsRoutings(c *fiber.Ctx) error {
	var routings []models.SmsRouting
	var total int64

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "15"))
	search := c.Query("search")
	sourceType := c.Query("source_type")
	direction := c.Query("direction")
	targetType := c.Query("target_type")
	isActive := c.Query("is_active")
	sortBy := c.Query("sort_by", "priority")
	sortOrder := c.Query("sort_order", "desc")

	// Build query with joins
	query := h.db.Model(&models.SmsRouting{}).
		Preload("DeviceGroup").
		Preload("User")

	// Apply filters
	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ? OR destination_address LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if sourceType != "" && sourceType != "all" {
		query = query.Where("source_type = ?", sourceType)
	}

	if direction != "" && direction != "all" {
		query = query.Where("direction = ?", direction)
	}

	if targetType != "" && targetType != "all" {
		query = query.Where("target_type = ?", targetType)
	}

	if isActive != "" && isActive != "all" {
		isActiveBool := isActive == "true"
		query = query.Where("is_active = ?", isActiveBool)
	}

	// Get total count
	query.Count(&total)

	// Apply sorting
	orderClause := sortBy + " " + sortOrder
	query = query.Order(orderClause)

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	if err := query.Find(&routings).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage == 0 {
		lastPage = 1
	}

	// Prepare response data with computed fields
	var responseData []map[string]interface{}
	for _, routing := range routings {
		item := map[string]interface{}{
			"id":                        routing.ID,
			"name":                      routing.Name,
			"description":               routing.Description,
			"source_type":               routing.SourceType,
			"direction":                 routing.Direction,
			"system_id":                 routing.SystemID,
			"destination_address":       routing.DestinationAddress,
			"target_type":               routing.TargetType,
			"target_url":                routing.TargetURL,
			"device_group_id":           routing.DeviceGroupID,
			"target_system_id":          routing.TargetSystemID,
			"user_id":                   routing.UserID,
			"is_active":                 routing.IsActive,
			"priority":                  routing.Priority,
			"conditions":                routing.Conditions,
			"created_at":                routing.CreatedAt,
			"updated_at":                routing.UpdatedAt,
			"status_badge_variant":      routing.GetStatusBadgeVariant(),
			"source_type_badge_variant": routing.GetSourceTypeBadgeVariant(),
			"direction_badge_variant":   routing.GetDirectionBadgeVariant(),
			"target_type_badge_variant": routing.GetTargetTypeBadgeVariant(),
			"source_display_name":       routing.GetSourceDisplayName(),
			"target_display_name":       routing.GetDisplayName(),
			"routing_summary":           routing.GetRoutingSummary(),
		}

		if routing.DeviceGroup != nil {
			item["device_group"] = map[string]interface{}{
				"id":   routing.DeviceGroup.ID,
				"name": routing.DeviceGroup.DeviceGroup,
			}
		}

		responseData = append(responseData, item)
	}

	return c.JSON(fiber.Map{
		"data": responseData,
		"meta": fiber.Map{
			"current_page": page,
			"last_page":    lastPage,
			"per_page":     perPage,
			"total":        total,
		},
	})
}

// GetSmsRoutingByID retrieves a specific SMS routing by ID
func (h *SmsRoutingHandler) GetSmsRoutingByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var routing models.SmsRouting
	if err := h.db.Preload("DeviceGroup").Preload("User").First(&routing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMS routing not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Prepare response with computed fields
	response := map[string]interface{}{
		"id":                        routing.ID,
		"name":                      routing.Name,
		"description":               routing.Description,
		"source_type":               routing.SourceType,
		"direction":                 routing.Direction,
		"system_id":                 routing.SystemID,
		"destination_address":       routing.DestinationAddress,
		"target_type":               routing.TargetType,
		"target_url":                routing.TargetURL,
		"device_group_id":           routing.DeviceGroupID,
		"target_system_id":          routing.TargetSystemID,
		"user_id":                   routing.UserID,
		"is_active":                 routing.IsActive,
		"priority":                  routing.Priority,
		"conditions":                routing.Conditions,
		"created_at":                routing.CreatedAt,
		"updated_at":                routing.UpdatedAt,
		"status_badge_variant":      routing.GetStatusBadgeVariant(),
		"source_type_badge_variant": routing.GetSourceTypeBadgeVariant(),
		"direction_badge_variant":   routing.GetDirectionBadgeVariant(),
		"target_type_badge_variant": routing.GetTargetTypeBadgeVariant(),
		"source_display_name":       routing.GetSourceDisplayName(),
		"target_display_name":       routing.GetDisplayName(),
		"routing_summary":           routing.GetRoutingSummary(),
	}

	if routing.DeviceGroup != nil {
		response["device_group"] = map[string]interface{}{
			"id":   routing.DeviceGroup.ID,
			"name": routing.DeviceGroup.DeviceGroup,
		}
	}

	if routing.User != nil {
		response["user"] = map[string]interface{}{
			"id":       routing.User.ID,
			"username": routing.User.Username,
		}
	}

	return c.JSON(fiber.Map{
		"data": response,
	})
}

// CreateSmsRouting creates a new SMS routing
func (h *SmsRoutingHandler) CreateSmsRouting(c *fiber.Ctx) error {
	var routing models.SmsRouting

	if err := c.BodyParser(&routing); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Validate required fields
	if routing.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Name is required",
		})
	}

	if routing.SourceType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Source type is required",
		})
	}

	if routing.Direction == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Direction is required",
		})
	}

	if routing.TargetType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Target type is required",
		})
	}

	// Validate target-specific fields
	if routing.TargetType == "http" && (routing.TargetURL == nil || *routing.TargetURL == "") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Target URL is required for HTTP target type",
		})
	}

	if routing.TargetType == "device_group" && routing.DeviceGroupID == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Device group ID is required for device group target type",
		})
	}

	if routing.TargetType == "smpp" && (routing.TargetSystemID == nil || *routing.TargetSystemID == "") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Target system ID is required for SMPP target type",
		})
	}

	// Create the SMS routing
	if err := h.db.Create(&routing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "SMS routing created successfully",
		"data":    routing,
	})
}

// UpdateSmsRouting updates an existing SMS routing
func (h *SmsRoutingHandler) UpdateSmsRouting(c *fiber.Ctx) error {
	id := c.Params("id")

	var routing models.SmsRouting
	if err := h.db.First(&routing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMS routing not found",
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

	// Update the SMS routing
	if err := h.db.Model(&routing).Updates(updateData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Get updated routing
	h.db.Preload("DeviceGroup").Preload("User").First(&routing, id)

	return c.JSON(fiber.Map{
		"message": "SMS routing updated successfully",
		"data":    routing,
	})
}

// DeleteSmsRouting deletes an SMS routing
func (h *SmsRoutingHandler) DeleteSmsRouting(c *fiber.Ctx) error {
	id := c.Params("id")

	var routing models.SmsRouting
	if err := h.db.First(&routing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMS routing not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Delete the SMS routing
	if err := h.db.Delete(&routing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "SMS routing deleted successfully",
	})
}

// GetSmsRoutingFilterOptions returns filter options for SMS routings
func (h *SmsRoutingHandler) GetSmsRoutingFilterOptions(c *fiber.Ctx) error {
	// Get device groups
	var deviceGroups []models.DeviceGroup
	h.db.Select("id, device_group as name, queue_name").Find(&deviceGroups)

	// Get SMPP users (system IDs)
	var smppUsers []models.SmppUser
	h.db.Select("DISTINCT system_id").Where("system_id IS NOT NULL AND system_id != ''").Find(&smppUsers)

	var smppUserIDs []string
	for _, user := range smppUsers {
		smppUserIDs = append(smppUserIDs, user.SystemID)
	}

	// Get users
	var users []models.User
	h.db.Select("id, username, firstname, lastname").Find(&users)

	return c.JSON(fiber.Map{
		"device_groups": deviceGroups,
		"smpp_users":    smppUserIDs,
		"users":         users,
	})
}
