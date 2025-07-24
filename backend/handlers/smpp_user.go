package handlers

import (
	"strconv"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SmppUserHandler struct {
	db *gorm.DB
}

func NewSmppUserHandler() *SmppUserHandler {
	return &SmppUserHandler{
		db: database.GetDB(),
	}
}

// CreateSmppUser creates a new SMPP user
func (h *SmppUserHandler) CreateSmppUser(c *fiber.Ctx) error {
	var smppUser models.SmppUser

	if err := c.BodyParser(&smppUser); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Validate required fields
	if smppUser.SystemID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "System ID is required",
		})
	}

	if smppUser.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Password is required",
		})
	}

	// Check if system_id already exists
	var existingUser models.SmppUser
	if err := h.db.Where("system_id = ?", smppUser.SystemID).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "System ID already exists",
		})
	}

	// Create the SMPP user
	if err := h.db.Create(&smppUser).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "SMPP user created successfully",
		"data":    smppUser,
	})
}

// GetAllSmppUsers retrieves all SMPP users with pagination and filtering
func (h *SmppUserHandler) GetAllSmppUsers(c *fiber.Ctx) error {
	var smppUsers []models.SmppUser
	var total int64

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search")
	isOnline := c.Query("is_online")
	isActive := c.Query("is_active")

	// Build query
	query := h.db.Model(&models.SmppUser{})

	// Apply filters
	if search != "" {
		query = query.Where("system_id LIKE ?", "%"+search+"%")
	}

	if isOnline != "" {
		if isOnline == "1" {
			query = query.Where("is_online = ?", true)
		} else if isOnline == "0" {
			query = query.Where("is_online = ?", false)
		}
	}

	if isActive != "" {
		if isActive == "1" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "0" {
			query = query.Where("is_active = ?", false)
		}
	}

	// Get total count
	query.Count(&total)

	// Apply pagination
	offset := (page - 1) * limit
	query = query.Offset(offset).Limit(limit).Order("created_at DESC")

	// Execute query
	if err := query.Find(&smppUsers).Error; err != nil {
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
		"data": smppUsers,
		"meta": fiber.Map{
			"current_page": page,
			"last_page":    lastPage,
			"per_page":     limit,
			"total":        total,
		},
	})
}

// GetSmppUserByID retrieves a specific SMPP user by ID
func (h *SmppUserHandler) GetSmppUserByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var smppUser models.SmppUser
	if err := h.db.First(&smppUser, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMPP user not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": smppUser,
	})
}

// UpdateSmppUser updates an existing SMPP user
func (h *SmppUserHandler) UpdateSmppUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var smppUser models.SmppUser
	if err := h.db.First(&smppUser, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMPP user not found",
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

	// Check if system_id is being updated and if it already exists
	if systemID, exists := updateData["system_id"]; exists {
		var existingUser models.SmppUser
		if err := h.db.Where("system_id = ? AND id != ?", systemID, id).First(&existingUser).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "Validation failed",
				"message": "System ID already exists",
			})
		}
	}

	// Update the SMPP user
	if err := h.db.Model(&smppUser).Updates(updateData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Get updated user
	h.db.First(&smppUser, id)

	return c.JSON(fiber.Map{
		"message": "SMPP user updated successfully",
		"data":    smppUser,
	})
}

// DeleteSmppUser deletes an SMPP user
func (h *SmppUserHandler) DeleteSmppUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var smppUser models.SmppUser
	if err := h.db.First(&smppUser, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMPP user not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	// Check if user is currently online
	if smppUser.IsOnline {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Cannot delete",
			"message": "Cannot delete SMPP user while they are online",
		})
	}

	// Delete the SMPP user
	if err := h.db.Delete(&smppUser).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "SMPP user deleted successfully",
	})
}

// UpdateConnectionStatus updates the connection status of an SMPP user
func (h *SmppUserHandler) UpdateConnectionStatus(c *fiber.Ctx) error {
	id := c.Params("id")

	var smppUser models.SmppUser
	if err := h.db.First(&smppUser, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "SMPP user not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	var request struct {
		IsOnline  bool   `json:"is_online"`
		IPAddress string `json:"ip_address"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// Update connection status
	smppUser.UpdateConnectionStatus(request.IsOnline, request.IPAddress)

	if err := h.db.Save(&smppUser).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Connection status updated successfully",
		"data":    smppUser,
	})
}

// GetSmppUserStats returns statistics for SMPP users
func (h *SmppUserHandler) GetSmppUserStats(c *fiber.Ctx) error {
	var stats struct {
		TotalUsers       int64 `json:"total_users"`
		ActiveUsers      int64 `json:"active_users"`
		OnlineUsers      int64 `json:"online_users"`
		InactiveUsers    int64 `json:"inactive_users"`
		OfflineUsers     int64 `json:"offline_users"`
		TotalMessages    int64 `json:"total_messages"`
		TotalConnections int64 `json:"total_connections"`
	}

	// Get counts
	h.db.Model(&models.SmppUser{}).Count(&stats.TotalUsers)
	h.db.Model(&models.SmppUser{}).Where("is_active = ?", true).Count(&stats.ActiveUsers)
	h.db.Model(&models.SmppUser{}).Where("is_online = ?", true).Count(&stats.OnlineUsers)
	h.db.Model(&models.SmppUser{}).Where("is_active = ?", false).Count(&stats.InactiveUsers)
	h.db.Model(&models.SmppUser{}).Where("is_online = ?", false).Count(&stats.OfflineUsers)

	// Get message and connection totals
	h.db.Model(&models.SmppUser{}).Select("COALESCE(SUM(total_messages_sent + total_messages_received), 0)").Scan(&stats.TotalMessages)
	h.db.Model(&models.SmppUser{}).Select("COALESCE(SUM(connection_count), 0)").Scan(&stats.TotalConnections)

	return c.JSON(fiber.Map{
		"data": stats,
	})
}

// AuthenticateSmppUser authenticates an SMPP user for connection
func (h *SmppUserHandler) AuthenticateSmppUser(systemID, password string) (*models.SmppUser, error) {
	var smppUser models.SmppUser

	err := h.db.Where("system_id = ? AND password = ? AND is_active = ?",
		systemID, password, true).First(&smppUser).Error

	if err != nil {
		return nil, err
	}

	return &smppUser, nil
}
