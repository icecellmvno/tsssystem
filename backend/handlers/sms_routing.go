package handlers

import (
	"encoding/json"
	"log"
	"strconv"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"tsimsocketserver/websocket"

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
			"device_group_ids":          routing.DeviceGroupIDs,
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
	if err := h.db.Preload("User").First(&routing, id).Error; err != nil {
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
		"device_group_ids":          routing.DeviceGroupIDs,
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
	if routing.TargetType == "device_group" && (routing.DeviceGroupIDs == nil || *routing.DeviceGroupIDs == "[]") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Device group IDs are required for device group target type",
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

// RouteSms handles SMS routing logic
func (h *SmsRoutingHandler) RouteSms(c *fiber.Ctx) error {
	var request struct {
		SourceAddress string `json:"source_address"`
		DestAddress   string `json:"dest_address"`
		Message       string `json:"message"`
		Direction     string `json:"direction"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Get WebSocket server from context
	wsServer := c.Locals("ws_server").(*websocket.WebSocketServer)
	if wsServer == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "WebSocket server not available",
			"message": "Cannot route SMS without WebSocket server",
		})
	}

	// Find matching routing rule
	var routing models.SmsRouting
	if err := h.db.Where("is_active = ? AND direction = ?", true, request.Direction).
		Preload("User").
		Order("priority DESC").
		First(&routing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "No routing rule found",
				"message": "No active routing rule found for the given direction",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Log routing information
	log.Printf("Routing SMS - Source: %s, Dest: %s, Direction: %s, Routing ID: %d",
		request.SourceAddress, request.DestAddress, request.Direction, routing.ID)

	// Send to all connected devices in the device groups
	if routing.DeviceGroupIDs != nil && *routing.DeviceGroupIDs != "" {
		var deviceGroupIDs []uint
		if err := json.Unmarshal([]byte(*routing.DeviceGroupIDs), &deviceGroupIDs); err != nil {
			log.Printf("Error parsing device group IDs: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Invalid device group configuration",
				"message": "Failed to parse device group IDs",
			})
		}

		// Get device group names from IDs
		var deviceGroupNames []string
		for _, groupID := range deviceGroupIDs {
			var deviceGroup models.DeviceGroup
			if err := h.db.First(&deviceGroup, groupID).Error; err == nil {
				deviceGroupNames = append(deviceGroupNames, deviceGroup.DeviceGroup)
			}
		}

		devices := wsServer.GetConnectedDevices()
		for _, device := range devices {
			// Check if device belongs to any of the target device groups
			for _, groupName := range deviceGroupNames {
				if device.DeviceGroup == groupName {
					// Create SMS message data
					smsData := models.SendSmsData{
						PhoneNumber: request.DestAddress,
						Message:     request.Message,
						SimSlot:     1, // Default to SIM slot 1
						Priority:    "normal",
					}
					wsServer.SendSms(device.DeviceID, smsData)
					break // Send only once per device
				}
			}
		}
	}

	return c.JSON(fiber.Map{
		"message": "SMS routed successfully",
		"routing": routing,
	})
}

// GetSmsRoutingStats returns statistics for SMS routing
func (h *SmsRoutingHandler) GetSmsRoutingStats(c *fiber.Ctx) error {
	var stats struct {
		TotalRoutings       int64 `json:"total_routings"`
		ActiveRoutings      int64 `json:"active_routings"`
		InactiveRoutings    int64 `json:"inactive_routings"`
		DeviceGroupRoutings int64 `json:"device_group_routings"`
		UserRoutings        int64 `json:"user_routings"`
	}

	// Get total routings
	h.db.Model(&models.SmsRouting{}).Count(&stats.TotalRoutings)

	// Get active routings
	h.db.Model(&models.SmsRouting{}).Where("is_active = ?", true).Count(&stats.ActiveRoutings)

	// Get inactive routings
	h.db.Model(&models.SmsRouting{}).Where("is_active = ?", false).Count(&stats.InactiveRoutings)

	// Get device group routings
	h.db.Model(&models.SmsRouting{}).Where("device_group_ids IS NOT NULL AND device_group_ids != '[]'").Count(&stats.DeviceGroupRoutings)

	// Get user routings
	h.db.Model(&models.SmsRouting{}).Where("user_id IS NOT NULL").Count(&stats.UserRoutings)

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}
