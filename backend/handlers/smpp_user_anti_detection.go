package handlers

import (
	"net/http"
	"strconv"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

// GetSmppUserAntiDetectionConfig returns anti-detection config for a specific SMPP user
func GetSmppUserAntiDetectionConfig(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	var config models.SmppUserAntiDetectionConfig
	if err := database.GetDB().Where("smpp_user_id = ?", smppUserID).First(&config).Error; err != nil {
		// If not found, return empty config
		return c.JSON(fiber.Map{
			"smpp_user_id":           smppUserID,
			"anti_detection_enabled": false,
			"routing_rule_ids":       "[]",
		})
	}

	return c.JSON(config)
}

// UpdateSmppUserAntiDetectionConfig updates anti-detection config for a specific SMPP user
func UpdateSmppUserAntiDetectionConfig(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	// Check if SMPP user exists
	var smppUser models.SmppUser
	if err := database.GetDB().First(&smppUser, smppUserID).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SMPP user not found",
		})
	}

	var updateData models.SmppUserAntiDetectionConfig
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Find existing config or create new one
	var config models.SmppUserAntiDetectionConfig
	result := database.GetDB().Where("smpp_user_id = ?", smppUserID).First(&config)

	if result.Error != nil {
		// Create new config
		config = models.SmppUserAntiDetectionConfig{
			SmppUserID: uint(smppUserID),
		}
	}

	// Update fields
	config.AntiDetectionEnabled = updateData.AntiDetectionEnabled
	if updateData.RoutingRuleIDs != "" {
		config.RoutingRuleIDs = updateData.RoutingRuleIDs
	}

	if result.Error != nil {
		// Create new record
		if err := database.GetDB().Create(&config).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create anti-detection config",
			})
		}
	} else {
		// Update existing record
		if err := database.GetDB().Save(&config).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update anti-detection config",
			})
		}
	}

	return c.JSON(config)
}

// GetSmppUserSimPoolConfigs returns SIM pool configs for a specific SMPP user
func GetSmppUserSimPoolConfigs(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	var configs []models.SmppUserSimPoolConfig
	if err := database.GetDB().Where("smpp_user_id = ?", smppUserID).Find(&configs).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SIM pool configs",
		})
	}

	return c.JSON(configs)
}

// CreateSmppUserSimPoolConfig creates a new SIM pool config for a specific SMPP user
func CreateSmppUserSimPoolConfig(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	var config models.SmppUserSimPoolConfig
	if err := c.BodyParser(&config); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	config.SmppUserID = uint(smppUserID)

	// Validate required fields
	if config.DeviceGroupID == 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Device group ID is required",
		})
	}

	if err := database.GetDB().Create(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create SIM pool config",
		})
	}

	return c.Status(http.StatusCreated).JSON(config)
}

// UpdateSmppUserSimPoolConfig updates an existing SIM pool config
func UpdateSmppUserSimPoolConfig(c *fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("config_id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config ID",
		})
	}

	var config models.SmppUserSimPoolConfig
	if err := database.GetDB().First(&config, configID).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SIM pool config not found",
		})
	}

	var updateData models.SmppUserSimPoolConfig
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update fields
	if updateData.DeviceGroupID != 0 {
		config.DeviceGroupID = updateData.DeviceGroupID
	}
	if updateData.SimCardIDs != "" {
		config.SimCardIDs = updateData.SimCardIDs
	}
	if updateData.RotationStrategy != "" {
		config.RotationStrategy = updateData.RotationStrategy
	}
	config.CooldownMinutes = updateData.CooldownMinutes
	config.MaxDailyUsage = updateData.MaxDailyUsage
	config.IsActive = updateData.IsActive

	if err := database.GetDB().Save(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update SIM pool config",
		})
	}

	return c.JSON(config)
}

// DeleteSmppUserSimPoolConfig deletes a SIM pool config
func DeleteSmppUserSimPoolConfig(c *fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("config_id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config ID",
		})
	}

	var config models.SmppUserSimPoolConfig
	if err := database.GetDB().First(&config, configID).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SIM pool config not found",
		})
	}

	if err := database.GetDB().Delete(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete SIM pool config",
		})
	}

	return c.SendStatus(http.StatusNoContent)
}

// GetSmppUserDelayConfigs returns delay configs for a specific SMPP user
func GetSmppUserDelayConfigs(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	var configs []models.SmppUserDelayConfig
	if err := database.GetDB().Where("smpp_user_id = ?", smppUserID).Find(&configs).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch delay configs",
		})
	}

	return c.JSON(configs)
}

// CreateSmppUserDelayConfig creates a new delay config for a specific SMPP user
func CreateSmppUserDelayConfig(c *fiber.Ctx) error {
	smppUserID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SMPP user ID",
		})
	}

	var config models.SmppUserDelayConfig
	if err := c.BodyParser(&config); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	config.SmppUserID = uint(smppUserID)

	// Validate required fields
	if config.DeviceGroupID == 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Device group ID is required",
		})
	}

	if err := database.GetDB().Create(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create delay config",
		})
	}

	return c.Status(http.StatusCreated).JSON(config)
}

// UpdateSmppUserDelayConfig updates an existing delay config
func UpdateSmppUserDelayConfig(c *fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("config_id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config ID",
		})
	}

	var config models.SmppUserDelayConfig
	if err := database.GetDB().First(&config, configID).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Delay config not found",
		})
	}

	var updateData models.SmppUserDelayConfig
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update fields
	if updateData.DeviceGroupID != 0 {
		config.DeviceGroupID = updateData.DeviceGroupID
	}
	config.MinDelayMs = updateData.MinDelayMs
	config.MaxDelayMs = updateData.MaxDelayMs
	if updateData.DistributionType != "" {
		config.DistributionType = updateData.DistributionType
	}
	config.IsActive = updateData.IsActive

	if err := database.GetDB().Save(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update delay config",
		})
	}

	return c.JSON(config)
}

// DeleteSmppUserDelayConfig deletes a delay config
func DeleteSmppUserDelayConfig(c *fiber.Ctx) error {
	configID, err := strconv.ParseUint(c.Params("config_id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config ID",
		})
	}

	var config models.SmppUserDelayConfig
	if err := database.GetDB().First(&config, configID).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Delay config not found",
		})
	}

	if err := database.GetDB().Delete(&config).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete delay config",
		})
	}

	return c.SendStatus(http.StatusNoContent)
}
