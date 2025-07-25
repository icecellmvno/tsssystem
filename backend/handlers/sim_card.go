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
	countryISO := c.Query("country_iso", "")
	networkOperatorName := c.Query("network_operator_name", "")
	simOperatorName := c.Query("sim_operator_name", "")
	roaming := c.Query("roaming", "")
	isActive := c.Query("is_active", "")
	networkType := c.Query("network_type", "")
	sitename := c.Query("sitename", "")
	deviceGroupName := c.Query("device_group_name", "")
	deviceName := c.Query("device_name", "")
	smsStatus := c.Query("sms_status", "")
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
	query := database.GetDB().Model(&models.SimCardRecord{})

	// Apply filters
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where(
			"display_name LIKE ? OR carrier_name LIKE ? OR number LIKE ? OR imei LIKE ? OR iccid LIKE ? OR imsi LIKE ? OR network_operator_name LIKE ? OR sim_operator_name LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
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

	if countryISO != "" && countryISO != "all" {
		query = query.Where("country_iso = ?", countryISO)
	}

	if networkOperatorName != "" && networkOperatorName != "all" {
		query = query.Where("network_operator_name LIKE ?", "%"+networkOperatorName+"%")
	}

	if simOperatorName != "" && simOperatorName != "all" {
		query = query.Where("sim_operator_name LIKE ?", "%"+simOperatorName+"%")
	}

	if roaming != "" && roaming != "all" {
		if roamingBool, err := strconv.ParseBool(roaming); err == nil {
			query = query.Where("roaming = ?", roamingBool)
		}
	}

	if isActive != "" && isActive != "all" {
		if activeBool, err := strconv.ParseBool(isActive); err == nil {
			query = query.Where("is_active = ?", activeBool)
		}
	}

	if networkType != "" && networkType != "all" {
		query = query.Where("network_type = ?", networkType)
	}

	if sitename != "" && sitename != "all" {
		query = query.Where("sitename LIKE ?", "%"+sitename+"%")
	}

	if deviceGroupName != "" && deviceGroupName != "all" {
		query = query.Where("device_group_name LIKE ?", "%"+deviceGroupName+"%")
	}

	if deviceName != "" && deviceName != "all" {
		query = query.Where("device_name LIKE ?", "%"+deviceName+"%")
	}

	// Apply SMS status filter
	if smsStatus != "" && smsStatus != "all" {
		switch smsStatus {
		case "active":
			query = query.Where("sms_balance > 0 AND is_active = true")
		case "inactive":
			query = query.Where("(sms_balance = 0 OR is_active = false)")
		case "limit_reached":
			query = query.Where("total_sent >= sms_limit AND sms_limit > 0")
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
	var simCards []models.SimCardRecord
	if err := query.Find(&simCards).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch SIM cards",
		})
	}

	// Enhance SIM cards with additional data
	enhancedSimCards := enhanceSimCardsWithAdditionalData(simCards)

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
	var simCard models.SimCardRecord
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
	enhancedSimCard := enhanceSimCardWithAdditionalData(simCard)

	return c.JSON(fiber.Map{
		"data": enhancedSimCard,
	})
}

// CreateSimCard creates a new SIM card
func CreateSimCard(c *fiber.Ctx) error {
	var simCard models.SimCardRecord
	if err := c.BodyParser(&simCard); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if simCard.SlotIndex == 0 || simCard.SubscriptionID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Slot index and subscription ID are required",
		})
	}

	// Create the SIM card
	if err := database.GetDB().Create(&simCard).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create SIM card",
		})
	}

	// Enhance SIM card with additional data
	enhancedSimCard := enhanceSimCardWithAdditionalData(simCard)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "SIM card created successfully",
		"data":    enhancedSimCard,
	})
}

// UpdateSimCard updates an existing SIM card
func UpdateSimCard(c *fiber.Ctx) error {
	id := c.Params("id")
	var simCard models.SimCardRecord
	var existingSimCard models.SimCardRecord

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
	enhancedSimCard := enhanceSimCardWithAdditionalData(simCard)

	return c.JSON(fiber.Map{
		"message": "SIM card updated successfully",
		"data":    enhancedSimCard,
	})
}

// DeleteSimCard deletes a SIM card
func DeleteSimCard(c *fiber.Ctx) error {
	id := c.Params("id")
	var simCard models.SimCardRecord

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
	var countryISOs []string
	var networkOperatorNames []string
	var simOperatorNames []string
	var networkTypes []string
	var sitenames []string
	var deviceGroupNames []string
	var deviceNames []string

	// Get unique slot indexes
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("slot_index").
		Where("slot_index IS NOT NULL").
		Pluck("slot_index", &slotIndexes)

	// Get unique carrier names
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("carrier_name").
		Where("carrier_name IS NOT NULL AND carrier_name != ''").
		Pluck("carrier_name", &carrierNames)

	// Get unique country ISOs
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("country_iso").
		Where("country_iso IS NOT NULL AND country_iso != ''").
		Pluck("country_iso", &countryISOs)

	// Get unique network operator names
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("network_operator_name").
		Where("network_operator_name IS NOT NULL AND network_operator_name != ''").
		Pluck("network_operator_name", &networkOperatorNames)

	// Get unique SIM operator names
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("sim_operator_name").
		Where("sim_operator_name IS NOT NULL AND sim_operator_name != ''").
		Pluck("sim_operator_name", &simOperatorNames)

	// Get unique network types
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("network_type").
		Where("network_type IS NOT NULL AND network_type != ''").
		Pluck("network_type", &networkTypes)

	// Get unique sitenames
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("sitename").
		Where("sitename IS NOT NULL AND sitename != ''").
		Pluck("sitename", &sitenames)

	// Get unique device group names
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("device_group_name").
		Where("device_group_name IS NOT NULL AND device_group_name != ''").
		Pluck("device_group_name", &deviceGroupNames)

	// Get unique device names
	database.GetDB().Model(&models.SimCardRecord{}).
		Distinct("device_name").
		Where("device_name IS NOT NULL AND device_name != ''").
		Pluck("device_name", &deviceNames)

	return c.JSON(fiber.Map{
		"slot_indexes":           slotIndexes,
		"carrier_names":          carrierNames,
		"country_isos":           countryISOs,
		"network_operator_names": networkOperatorNames,
		"sim_operator_names":     simOperatorNames,
		"network_types":          networkTypes,
		"sitenames":              sitenames,
		"device_group_names":     deviceGroupNames,
		"device_names":           deviceNames,
	})
}

// Helper functions

func enhanceSimCardsWithAdditionalData(simCards []models.SimCardRecord) []map[string]interface{} {
	enhancedSimCards := make([]map[string]interface{}, len(simCards))

	for i, simCard := range simCards {
		enhancedSimCards[i] = enhanceSimCardWithAdditionalData(simCard)
	}

	return enhancedSimCards
}

func enhanceSimCardWithAdditionalData(simCard models.SimCardRecord) map[string]interface{} {
	// Calculate success rate
	successRate := 0.0
	if simCard.TotalSent > 0 {
		successRate = float64(simCard.TotalDelivered) / float64(simCard.TotalSent) * 100
	}

	// Determine badge variants
	statusBadgeVariant := "secondary"
	if simCard.IsActive {
		statusBadgeVariant = "default"
	} else {
		statusBadgeVariant = "destructive"
	}

	roamingBadgeVariant := "secondary"
	if simCard.Roaming {
		roamingBadgeVariant = "destructive"
	} else {
		roamingBadgeVariant = "default"
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
		"subscription_id":               simCard.SubscriptionID,
		"display_name":                  simCard.DisplayName,
		"carrier_name":                  simCard.CarrierName,
		"country_iso":                   simCard.CountryISO,
		"number":                        simCard.Number,
		"imei":                          simCard.IMEI,
		"iccid":                         simCard.ICCID,
		"imsi":                          simCard.IMSI,
		"network_mcc":                   simCard.NetworkMCC,
		"network_mnc":                   simCard.NetworkMNC,
		"sim_mcc":                       simCard.SimMCC,
		"sim_mnc":                       simCard.SimMNC,
		"network_operator_name":         simCard.NetworkOperatorName,
		"sim_operator_name":             simCard.SimOperatorName,
		"roaming":                       simCard.Roaming,
		"signal_strength":               simCard.SignalStrength,
		"signal_dbm":                    simCard.SignalDBM,
		"signal_type":                   simCard.SignalType,
		"rsrp":                          simCard.RSRP,
		"rsrq":                          simCard.RSRQ,
		"rssnr":                         simCard.RSSNR,
		"cqi":                           simCard.CQI,
		"network_type":                  simCard.NetworkType,
		"is_active":                     simCard.IsActive,
		"total_delivered":               simCard.TotalDelivered,
		"total_sent":                    simCard.TotalSent,
		"total_waiting":                 simCard.TotalWaiting,
		"main_balance":                  simCard.MainBalance,
		"sms_balance":                   simCard.SmsBalance,
		"sms_limit":                     simCard.SmsLimit,
		"device_id":                     simCard.DeviceID,
		"device_name":                   simCard.DeviceName,
		"sitename":                      simCard.Sitename,
		"device_group_name":             simCard.DeviceGroupName,
		"created_at":                    simCard.CreatedAt,
		"updated_at":                    simCard.UpdatedAt,
		"status_badge_variant":          statusBadgeVariant,
		"roaming_badge_variant":         roamingBadgeVariant,
		"signal_strength_badge_variant": signalStrengthBadgeVariant,
		"network_type_badge_variant":    networkTypeBadgeVariant,
		"success_rate":                  successRate,
		"signal_strength_text":          signalStrengthText,
		"formatted_main_balance":        formatCurrency(simCard.MainBalance),
		"formatted_sms_balance":         formatNumber(simCard.SmsBalance),
		"formatted_sms_limit":           formatNumber(simCard.SmsLimit),
	}
}

func formatCurrency(amount float64) string {
	return "$" + strconv.FormatFloat(amount, 'f', 2, 64)
}

func formatNumber(num int) string {
	return strconv.Itoa(num)
}
