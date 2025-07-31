package handlers

import (
	"strconv"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetSimCards returns paginated SIM cards with filters
func GetSimCards(c *fiber.Ctx) error {
	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "15"))
	search := c.Query("search", "")
	slotIndex := c.Query("slot_index", "")
	carrierName := c.Query("carrier_name", "")
	isActive := c.Query("is_active", "")
	networkType := c.Query("network_type", "")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 15
	}

	// Build query - Use device_sim_cards table instead of sim_card_records
	query := database.GetDB().Model(&models.DeviceSimCard{})

	// Apply filters
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"carrier_name LIKE ? OR phone_number LIKE ? OR imei LIKE ? OR iccid LIKE ? OR imsi LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if slotIndex != "" && slotIndex != "all" {
		if slot, err := strconv.Atoi(slotIndex); err == nil {
			query = query.Where("slot_index = ?", slot)
		}
	}

	if carrierName != "" && carrierName != "all" {
		query = query.Where("carrier_name LIKE ?", "%"+carrierName+"%")
	}

	if isActive != "" && isActive != "all" {
		if activeBool, err := strconv.ParseBool(isActive); err == nil {
			query = query.Where("is_active = ?", activeBool)
		}
	}

	if networkType != "" && networkType != "all" {
		query = query.Where("network_type = ?", networkType)
	}

	// SMS status filter removed for device_sim_cards table

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
	var simCards []models.DeviceSimCard
	if err := query.Find(&simCards).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SIM cards",
		})
	}

	// Enhance SIM cards with additional data
	enhancedSimCards := enhanceDeviceSimCardsWithAdditionalData(simCards)

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))

	return c.JSON(fiber.Map{
		"data":         enhancedSimCards,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
		"from":         offset + 1,
		"to":           offset + len(simCards),
	})
}

// GetSimCard returns a single SIM card by ID
func GetSimCard(c *fiber.Ctx) error {
	// Get SIM card ID from URL
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid SIM card ID",
		})
	}

	// Find SIM card
	var simCard models.DeviceSimCard
	if err := database.GetDB().First(&simCard, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "SIM card not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SIM card",
		})
	}

	// Enhance SIM card with additional data
	enhancedSimCard := enhanceDeviceSimCardWithAdditionalData(simCard)

	return c.JSON(fiber.Map{
		"data": enhancedSimCard,
	})
}

// CreateSimCard creates a new SIM card
func CreateSimCard(c *fiber.Ctx) error {
	var simCard models.DeviceSimCard
	if err := c.BodyParser(&simCard); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if simCard.SlotIndex == 0 || simCard.DeviceIMEI == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Slot index and device IMEI are required",
		})
	}

	// Create the SIM card
	if err := database.GetDB().Create(&simCard).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create SIM card",
		})
	}

	// Enhance SIM card with additional data
	enhancedSimCard := enhanceDeviceSimCardWithAdditionalData(simCard)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "SIM card created successfully",
		"data":    enhancedSimCard,
	})
}

// UpdateSimCard updates an existing SIM card
func UpdateSimCard(c *fiber.Ctx) error {
	id := c.Params("id")
	var simCard models.DeviceSimCard
	var existingSimCard models.DeviceSimCard

	// Check if SIM card exists
	if err := database.GetDB().First(&existingSimCard, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "SIM card not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve SIM card",
		})
	}

	// Parse request body
	if err := c.BodyParser(&simCard); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update the SIM card
	if err := database.GetDB().Model(&existingSimCard).Updates(simCard).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update SIM card",
		})
	}

	// Load updated SIM card
	database.GetDB().First(&simCard, id)

	// Enhance SIM card with additional data
	enhancedSimCard := enhanceDeviceSimCardWithAdditionalData(simCard)

	return c.JSON(fiber.Map{
		"message": "SIM card updated successfully",
		"data":    enhancedSimCard,
	})
}

// DeleteSimCard deletes a SIM card
func DeleteSimCard(c *fiber.Ctx) error {
	id := c.Params("id")
	var simCard models.DeviceSimCard

	if err := database.GetDB().First(&simCard, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "SIM card not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve SIM card",
		})
	}

	if err := database.GetDB().Delete(&simCard).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete SIM card",
		})
	}

	return c.JSON(fiber.Map{
		"message": "SIM card deleted successfully",
	})
}

// GetSimCardFilterOptions returns filter options for SIM cards
func GetSimCardFilterOptions(c *fiber.Ctx) error {
	var slotIndexes []int
	var carrierNames []string
	var networkTypes []string

	// Get unique slot indexes
	database.GetDB().Model(&models.DeviceSimCard{}).
		Distinct("slot_index").
		Where("slot_index IS NOT NULL").
		Pluck("slot_index", &slotIndexes)

	// Get unique carrier names
	database.GetDB().Model(&models.DeviceSimCard{}).
		Distinct("carrier_name").
		Where("carrier_name IS NOT NULL AND carrier_name != ''").
		Pluck("carrier_name", &carrierNames)

	// Get unique network types
	database.GetDB().Model(&models.DeviceSimCard{}).
		Distinct("network_type").
		Where("network_type IS NOT NULL AND network_type != ''").
		Pluck("network_type", &networkTypes)

	return c.JSON(fiber.Map{
		"slot_indexes":  slotIndexes,
		"carrier_names": carrierNames,
		"network_types": networkTypes,
	})
}

// Helper functions

func enhanceDeviceSimCardsWithAdditionalData(simCards []models.DeviceSimCard) []map[string]interface{} {
	enhancedSimCards := make([]map[string]interface{}, len(simCards))

	for i, simCard := range simCards {
		enhancedSimCards[i] = enhanceDeviceSimCardWithAdditionalData(simCard)
	}

	return enhancedSimCards
}

func enhanceDeviceSimCardWithAdditionalData(simCard models.DeviceSimCard) map[string]interface{} {
	// Get device information to access model
	var device models.Device
	database.GetDB().Where("imei = ?", simCard.DeviceIMEI).First(&device)

	// Determine SIM Card Status based on business logic
	simCardStatus := "Unknown"
	statusBadgeVariant := "secondary"

	if !simCard.IsActive {
		simCardStatus = "Blocked"
		statusBadgeVariant = "destructive"
	} else if simCard.SmsBalance <= 0 || simCard.SmsLimit <= 0 {
		simCardStatus = "No Balance"
		statusBadgeVariant = "destructive"
	} else if device.IsOnline && simCard.IsActive {
		simCardStatus = "Active"
		statusBadgeVariant = "default"
	} else if simCard.IsActive {
		simCardStatus = "Good"
		statusBadgeVariant = "outline"
	}

	signalStrengthBadgeVariant := "secondary"
	if simCard.SignalStrength >= 80 {
		signalStrengthBadgeVariant = "default"
	} else if simCard.SignalStrength >= 60 {
		signalStrengthBadgeVariant = "outline"
	} else if simCard.SignalStrength >= 40 {
		signalStrengthBadgeVariant = "secondary"
	} else {
		signalStrengthBadgeVariant = "destructive"
	}

	networkTypeBadgeVariant := "secondary"
	switch simCard.NetworkType {
	case "5G":
		networkTypeBadgeVariant = "default"
	case "4G":
		networkTypeBadgeVariant = "outline"
	case "3G":
		networkTypeBadgeVariant = "secondary"
	case "2G":
		networkTypeBadgeVariant = "destructive"
	}

	// Generate signal strength text
	signalStrengthText := "Unknown"
	if simCard.SignalStrength >= 80 {
		signalStrengthText = "Excellent"
	} else if simCard.SignalStrength >= 60 {
		signalStrengthText = "Good"
	} else if simCard.SignalStrength >= 40 {
		signalStrengthText = "Fair"
	} else if simCard.SignalStrength >= 20 {
		signalStrengthText = "Poor"
	} else if simCard.SignalStrength > 0 {
		signalStrengthText = "Very Poor"
	}

	return map[string]interface{}{
		"id":                            simCard.ID,
		"slot_index":                    simCard.SlotIndex,
		"device_imei":                   simCard.DeviceIMEI,
		"carrier_name":                  simCard.CarrierName,
		"phone_number":                  simCard.PhoneNumber,
		"imei":                          simCard.IMEI,
		"iccid":                         simCard.ICCID,
		"imsi":                          simCard.IMSI,
		"network_mcc":                   simCard.NetworkMCC,
		"network_mnc":                   simCard.NetworkMNC,
		"signal_strength":               simCard.SignalStrength,
		"signal_dbm":                    simCard.SignalDBM,
		"network_type":                  simCard.NetworkType,
		"is_active":                     simCard.IsActive,
		"created_at":                    simCard.CreatedAt,
		"updated_at":                    simCard.UpdatedAt,
		"status_badge_variant":          statusBadgeVariant,
		"signal_strength_badge_variant": signalStrengthBadgeVariant,
		"network_type_badge_variant":    networkTypeBadgeVariant,
		"signal_strength_text":          signalStrengthText,
		// Add missing fields with default values for compatibility
		"subscription_id":        0,
		"display_name":           simCard.CarrierName,
		"country_iso":            "",
		"number":                 simCard.PhoneNumber,
		"sim_mcc":                "",
		"sim_mnc":                "",
		"network_operator_name":  simCard.CarrierName,
		"sim_operator_name":      simCard.CarrierName,
		"roaming":                false,
		"signal_type":            "",
		"rsrp":                   0,
		"rsrq":                   0,
		"rssnr":                  0,
		"cqi":                    0,
		"total_delivered":        0,
		"total_sent":             0,
		"total_waiting":          0,
		"main_balance":           0.0,
		"sms_balance":            0,
		"sms_limit":              0,
		"device_id":              nil,
		"device_name":            simCard.DeviceName,
		"country_site":           simCard.CountrySite,
		"device_group_name":      simCard.DeviceGroupName,
		"device_model":           device.Model,
		"sim_card_status":        simCardStatus,
		"roaming_badge_variant":  "secondary",
		"success_rate":           0.0,
		"formatted_main_balance": "$0.00",
		"formatted_sms_balance":  "0",
		"formatted_sms_limit":    "0",
	}
}

func formatCurrency(amount float64) string {
	return "$" + strconv.FormatFloat(amount, 'f', 2, 64)
}

func formatNumber(num int) string {
	return strconv.Itoa(num)
}
