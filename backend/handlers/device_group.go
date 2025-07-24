package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/rabbitmq"

	"github.com/gofiber/fiber/v2"
)

type DeviceGroupHandler struct {
	cfg      *config.Config
	rabbitMQ *rabbitmq.RabbitMQHandler
}

func NewDeviceGroupHandler(cfg *config.Config) *DeviceGroupHandler {
	rabbitMQ := rabbitmq.NewRabbitMQHandler()

	// Connect to RabbitMQ
	if err := rabbitMQ.Connect(cfg.RabbitMQ.URL); err != nil {
		fmt.Printf("Warning: Failed to connect to RabbitMQ: %v\n", err)
	}

	return &DeviceGroupHandler{
		cfg:      cfg,
		rabbitMQ: rabbitMQ,
	}
}

// validateDeviceGroupName validates device group name using regex
func (h *DeviceGroupHandler) validateDeviceGroupName(name string) error {
	// Regex pattern: only alphanumeric characters allowed
	pattern := regexp.MustCompile(`^[a-zA-Z0-9]+$`)

	if !pattern.MatchString(name) {
		return fmt.Errorf("device group name must contain only alphanumeric characters (a-z, A-Z, 0-9). No spaces, hyphens, underscores, or special characters allowed")
	}

	if len(name) < 3 {
		return fmt.Errorf("device group name must be at least 3 characters long")
	}

	if len(name) > 50 {
		return fmt.Errorf("device group name must be maximum 50 characters long")
	}

	return nil
}

// generateAPIKey generates a random API key
func (h *DeviceGroupHandler) generateAPIKey() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// generateQueueName generates queue name from device group name
func (h *DeviceGroupHandler) generateQueueName(deviceGroupName string) string {
	// Convert to lowercase and add queue suffix
	return fmt.Sprintf("%s_queue", strings.ToLower(deviceGroupName))
}

func (h *DeviceGroupHandler) CreateDeviceGroup(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups", "POST") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to create device group",
		})
	}

	var req models.DeviceGroupCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate device group name
	if err := h.validateDeviceGroupName(req.DeviceGroup); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Check if device group already exists
	var existingDeviceGroup models.DeviceGroup
	if err := database.GetDB().Where("device_group = ?", req.DeviceGroup).First(&existingDeviceGroup).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Device group already exists",
		})
	}

	// Auto-generate API key and queue name
	apiKey := h.generateAPIKey()
	queueName := h.generateQueueName(req.DeviceGroup)

	// Create RabbitMQ queue
	if h.rabbitMQ != nil {
		if err := h.rabbitMQ.CreateQueue(queueName); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create RabbitMQ queue: " + err.Error(),
			})
		}
	}

	deviceGroup := models.DeviceGroup{
		DeviceGroup:             req.DeviceGroup,
		SitenameID:              req.SitenameID,
		Sitename:                req.Sitename,
		DeviceType:              req.DeviceType,
		Status:                  req.Status,
		WebsocketURL:            req.WebsocketURL,
		APIKey:                  apiKey,    // Auto-generated
		QueueName:               queueName, // Auto-generated
		BatteryLowThreshold:     req.BatteryLowThreshold,
		ErrorCountThreshold:     req.ErrorCountThreshold,
		OfflineThresholdMinutes: req.OfflineThresholdMinutes,
		SignalLowThreshold:      req.SignalLowThreshold,
		LowBalanceThreshold:     req.LowBalanceThreshold,
		EnableBatteryAlarms:     req.EnableBatteryAlarms,
		EnableErrorAlarms:       req.EnableErrorAlarms,
		EnableOfflineAlarms:     req.EnableOfflineAlarms,
		EnableSignalAlarms:      req.EnableSignalAlarms,
		EnableSimBalanceAlarms:  req.EnableSimBalanceAlarms,
		AutoDisableSimOnAlarm:   req.AutoDisableSimOnAlarm,
		Sim1DailySmsLimit:       req.Sim1DailySmsLimit,
		Sim1MonthlySmsLimit:     req.Sim1MonthlySmsLimit,
		Sim2DailySmsLimit:       req.Sim2DailySmsLimit,
		Sim2MonthlySmsLimit:     req.Sim2MonthlySmsLimit,
		EnableSmsLimits:         req.EnableSmsLimits,
		SmsLimitResetHour:       req.SmsLimitResetHour,
		Sim1GuardInterval:       req.Sim1GuardInterval,
		Sim2GuardInterval:       req.Sim2GuardInterval,
	}

	// Calculate and set status only if not manually provided
	if req.Status == "" {
		deviceGroup.Status = "configured" // Default to "configured" if not manually provided
	}

	if err := database.GetDB().Create(&deviceGroup).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create device group",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Device group created successfully",
		"data":    deviceGroup,
	})
}

func (h *DeviceGroupHandler) GetAllDeviceGroups(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups", "GET") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to view device groups",
		})
	}

	// Get query parameters
	search := c.Query("search")
	sitenameID := c.Query("sitename_id")
	sortBy := c.Query("sort_by", "device_group")
	sortOrder := c.Query("sort_order", "asc")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	// Validate page and per_page
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := database.GetDB().Model(&models.DeviceGroup{})

	// Apply search filter
	if search != "" {
		query = query.Where("device_group LIKE ? OR sitename LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Apply sitename filter
	if sitenameID != "" {
		query = query.Where("sitename_id = ?", sitenameID)
	}

	// Apply sorting
	if sortOrder == "desc" {
		query = query.Order(sortBy + " DESC")
	} else {
		query = query.Order(sortBy + " ASC")
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	var deviceGroups []models.DeviceGroup
	if err := query.Find(&deviceGroups).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch device groups",
		})
	}

	// Calculate pagination info
	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage < 1 {
		lastPage = 1
	}

	// Build pagination links
	var links []map[string]interface{}

	// Previous page
	if page > 1 {
		links = append(links, map[string]interface{}{
			"url":    fmt.Sprintf("?page=%d", page-1),
			"label":  "&laquo; Previous",
			"active": false,
		})
	}

	// Page numbers
	for i := 1; i <= lastPage; i++ {
		if i == page {
			links = append(links, map[string]interface{}{
				"url":    fmt.Sprintf("?page=%d", i),
				"label":  fmt.Sprintf("%d", i),
				"active": true,
			})
		} else if i == 1 || i == lastPage || (i >= page-2 && i <= page+2) {
			links = append(links, map[string]interface{}{
				"url":    fmt.Sprintf("?page=%d", i),
				"label":  fmt.Sprintf("%d", i),
				"active": false,
			})
		} else if i == page-3 || i == page+3 {
			links = append(links, map[string]interface{}{
				"url":    "",
				"label":  "...",
				"active": false,
			})
		}
	}

	// Next page
	if page < lastPage {
		links = append(links, map[string]interface{}{
			"url":    fmt.Sprintf("?page=%d", page+1),
			"label":  "Next &raquo;",
			"active": false,
		})
	}

	return c.JSON(fiber.Map{
		"data":         deviceGroups,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
		"links":        links,
	})
}

func (h *DeviceGroupHandler) GetDeviceGroupByID(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups/:id", "GET") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to view device group",
		})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid device group ID",
		})
	}

	var deviceGroup models.DeviceGroup
	if err := database.GetDB().First(&deviceGroup, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Device group not found",
		})
	}

	return c.JSON(fiber.Map{
		"data": deviceGroup,
	})
}

func (h *DeviceGroupHandler) UpdateDeviceGroup(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups/:id", "PUT") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to update device group",
		})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid device group ID",
		})
	}

	var req models.DeviceGroupUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var deviceGroup models.DeviceGroup
	if err := database.GetDB().First(&deviceGroup, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Device group not found",
		})
	}

	// Update fields if provided
	if req.DeviceGroup != nil {
		// Validate new device group name
		if err := h.validateDeviceGroupName(*req.DeviceGroup); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		// // Check if new device group name already exists
		// var existingDeviceGroup models.DeviceGroup
		// if err := database.GetDB().Where("device_group = ? AND id != ?", *req.DeviceGroup, id).First(&existingDeviceGroup).Error; err == nil {
		// 	return c.Status(fiber.StatusConflict).JSON(fiber.Map{
		// 		"error": "Device group name already exists",
		// 	})
		// }

		deviceGroup.DeviceGroup = *req.DeviceGroup

		// Auto-update queue name when device group name changes
		oldQueueName := deviceGroup.QueueName
		deviceGroup.QueueName = h.generateQueueName(*req.DeviceGroup)

		// Update RabbitMQ queue if name changed
		if h.rabbitMQ != nil && oldQueueName != deviceGroup.QueueName {
			// Create new queue
			if err := h.rabbitMQ.CreateQueue(deviceGroup.QueueName); err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to create new RabbitMQ queue: " + err.Error(),
				})
			}

			// Delete old queue (optional - you might want to keep it for existing messages)
			// if err := h.rabbitMQ.DeleteQueue(oldQueueName); err != nil {
			//     log.Printf("Warning: Failed to delete old RabbitMQ queue %s: %v", oldQueueName, err)
			// }
		}
	}
	if req.SitenameID != nil {
		deviceGroup.SitenameID = *req.SitenameID
	}
	if req.Sitename != nil {
		deviceGroup.Sitename = *req.Sitename
	}
	if req.DeviceType != nil {
		deviceGroup.DeviceType = *req.DeviceType
	}
	if req.Status != nil {
		deviceGroup.Status = *req.Status
	}
	if req.WebsocketURL != nil {
		deviceGroup.WebsocketURL = *req.WebsocketURL
	}

	if req.BatteryLowThreshold != nil {
		deviceGroup.BatteryLowThreshold = *req.BatteryLowThreshold
	}
	if req.ErrorCountThreshold != nil {
		deviceGroup.ErrorCountThreshold = *req.ErrorCountThreshold
	}
	if req.OfflineThresholdMinutes != nil {
		deviceGroup.OfflineThresholdMinutes = *req.OfflineThresholdMinutes
	}
	if req.SignalLowThreshold != nil {
		deviceGroup.SignalLowThreshold = *req.SignalLowThreshold
	}
	if req.LowBalanceThreshold != nil {
		deviceGroup.LowBalanceThreshold = *req.LowBalanceThreshold
	}
	if req.EnableBatteryAlarms != nil {
		deviceGroup.EnableBatteryAlarms = *req.EnableBatteryAlarms
	}
	if req.EnableErrorAlarms != nil {
		deviceGroup.EnableErrorAlarms = *req.EnableErrorAlarms
	}
	if req.EnableOfflineAlarms != nil {
		deviceGroup.EnableOfflineAlarms = *req.EnableOfflineAlarms
	}
	if req.EnableSignalAlarms != nil {
		deviceGroup.EnableSignalAlarms = *req.EnableSignalAlarms
	}
	if req.EnableSimBalanceAlarms != nil {
		deviceGroup.EnableSimBalanceAlarms = *req.EnableSimBalanceAlarms
	}
	if req.AutoDisableSimOnAlarm != nil {
		deviceGroup.AutoDisableSimOnAlarm = *req.AutoDisableSimOnAlarm
	}
	if req.Sim1DailySmsLimit != nil {
		deviceGroup.Sim1DailySmsLimit = *req.Sim1DailySmsLimit
	}
	if req.Sim1MonthlySmsLimit != nil {
		deviceGroup.Sim1MonthlySmsLimit = *req.Sim1MonthlySmsLimit
	}
	if req.Sim2DailySmsLimit != nil {
		deviceGroup.Sim2DailySmsLimit = *req.Sim2DailySmsLimit
	}
	if req.Sim2MonthlySmsLimit != nil {
		deviceGroup.Sim2MonthlySmsLimit = *req.Sim2MonthlySmsLimit
	}
	if req.EnableSmsLimits != nil {
		deviceGroup.EnableSmsLimits = *req.EnableSmsLimits
	}
	if req.SmsLimitResetHour != nil {
		deviceGroup.SmsLimitResetHour = *req.SmsLimitResetHour
	}
	if req.Sim1GuardInterval != nil {
		deviceGroup.Sim1GuardInterval = *req.Sim1GuardInterval
	}
	if req.Sim2GuardInterval != nil {
		deviceGroup.Sim2GuardInterval = *req.Sim2GuardInterval
	}

	if err := database.GetDB().Save(&deviceGroup).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update device group",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Device group updated successfully",
		"data":    deviceGroup,
	})
}

// DeleteDeviceGroup deletes a device group
func (h *DeviceGroupHandler) DeleteDeviceGroup(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups/:id", "DELETE") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to delete device group",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Device group ID is required",
		})
	}

	deviceGroupID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid device group ID",
		})
	}

	// Check if device group exists
	var deviceGroup models.DeviceGroup
	if err := database.GetDB().First(&deviceGroup, deviceGroupID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Device group not found",
		})
	}

	// Delete device group
	if err := database.GetDB().Delete(&deviceGroup).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete device group",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Device group deleted successfully",
	})
}

// GenerateQRCode generates QR code data for a device group
func (h *DeviceGroupHandler) GenerateQRCode(c *fiber.Ctx) error {
	// Get user from context
	user := c.Locals("user").(*auth.Claims)

	// Check permission
	if !auth.CheckPermission(user.Role, "/api/device-groups/:id", "GET") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions to generate QR code",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Device group ID is required",
		})
	}

	deviceGroupID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid device group ID",
		})
	}

	// Get device group
	var deviceGroup models.DeviceGroup
	if err := database.GetDB().First(&deviceGroup, deviceGroupID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Device group not found",
		})
	}

	// Generate QR code data
	qrData := fmt.Sprintf(`{
		"device_group": "%s",
		"sitename": "%s",
		"api_key": "%s",
		"websocket_url": "%s",
		"queue_name": "%s"
	}`, deviceGroup.DeviceGroup, deviceGroup.Sitename, deviceGroup.APIKey, h.cfg.WebSocketURL, deviceGroup.QueueName)

	return c.JSON(fiber.Map{
		"success": true,
		"qr_data": qrData,
	})
}
