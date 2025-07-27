package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

// GetSmsRoutingRules returns all SMS routing rules
func GetSmsRoutingRules(c *fiber.Ctx) error {
	var rules []models.SmsRoutingRule

	if err := database.GetDB().Find(&rules).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SMS routing rules",
		})
	}

	return c.JSON(rules)
}

// GetSmsRoutingRule returns a specific SMS routing rule
func GetSmsRoutingRule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID",
		})
	}

	var rule models.SmsRoutingRule
	if err := database.GetDB().First(&rule, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SMS routing rule not found",
		})
	}

	return c.JSON(rule)
}

// CreateSmsRoutingRule creates a new SMS routing rule
func CreateSmsRoutingRule(c *fiber.Ctx) error {
	var rule models.SmsRoutingRule

	if err := c.BodyParser(&rule); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if rule.Name == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Name is required",
		})
	}

	if rule.DestinationPattern == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Destination pattern is required",
		})
	}

	if err := database.GetDB().Create(&rule).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create SMS routing rule",
		})
	}

	return c.Status(http.StatusCreated).JSON(rule)
}

// UpdateSmsRoutingRule updates an existing SMS routing rule
func UpdateSmsRoutingRule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID",
		})
	}

	var rule models.SmsRoutingRule
	if err := database.GetDB().First(&rule, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SMS routing rule not found",
		})
	}

	var updateData models.SmsRoutingRule
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update fields
	if updateData.Name != "" {
		rule.Name = updateData.Name
	}
	if updateData.DestinationPattern != "" {
		rule.DestinationPattern = updateData.DestinationPattern
	}
	if updateData.DeviceGroupIDs != "" {
		rule.DeviceGroupIDs = updateData.DeviceGroupIDs
	}
	rule.Priority = updateData.Priority
	rule.IsActive = updateData.IsActive

	if err := database.GetDB().Save(&rule).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update SMS routing rule",
		})
	}

	return c.JSON(rule)
}

// DeleteSmsRoutingRule deletes an SMS routing rule
func DeleteSmsRoutingRule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID",
		})
	}

	var rule models.SmsRoutingRule
	if err := database.GetDB().First(&rule, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "SMS routing rule not found",
		})
	}

	if err := database.GetDB().Delete(&rule).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete SMS routing rule",
		})
	}

	return c.SendStatus(http.StatusNoContent)
}

// GetDeviceGroupIDsFromJSON parses device group IDs from JSON string
func GetDeviceGroupIDsFromJSON(jsonStr string) ([]uint, error) {
	var ids []uint
	if jsonStr == "" {
		return ids, nil
	}

	err := json.Unmarshal([]byte(jsonStr), &ids)
	return ids, err
}
