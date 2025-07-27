package handlers

import (
	"strconv"
	"strings"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type MccMncHandler struct{}

func NewMccMncHandler() *MccMncHandler {
	return &MccMncHandler{}
}

func (h *MccMncHandler) CreateMccMnc(c *fiber.Ctx) error {
	var req models.MccMncCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if MCC-MNC combination already exists
	var existingMccMnc models.MccMnc
	if err := database.GetDB().Where("mcc = ? AND mnc = ?", req.Mcc, req.Mnc).First(&existingMccMnc).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "MCC-MNC combination already exists",
		})
	}

	mccMnc := models.MccMnc{
		Mcc:         req.Mcc,
		Mnc:         req.Mnc,
		Iso:         req.Iso,
		Country:     req.Country,
		CountryCode: req.CountryCode,
		Network:     req.Network,
	}

	if err := database.GetDB().Create(&mccMnc).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create MCC-MNC record",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(models.MccMncResponse{
		ID:          mccMnc.ID,
		Mcc:         mccMnc.Mcc,
		Mnc:         mccMnc.Mnc,
		Iso:         mccMnc.Iso,
		Country:     mccMnc.Country,
		CountryCode: mccMnc.CountryCode,
		Network:     mccMnc.Network,
		CreatedAt:   mccMnc.CreatedAt,
		UpdatedAt:   mccMnc.UpdatedAt,
	})
}

func (h *MccMncHandler) GetAllMccMnc(c *fiber.Ctx) error {
	// Get query parameters
	search := c.Query("search")
	country := c.Query("country")
	network := c.Query("network")
	iso := c.Query("iso")
	sortBy := c.Query("sort_by", "id")
	sortOrder := c.Query("sort_order", "desc")
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
	query := database.GetDB().Model(&models.MccMnc{})

	// Apply search filter
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(mcc) LIKE ? OR LOWER(mnc) LIKE ? OR LOWER(country) LIKE ? OR LOWER(network) LIKE ? OR LOWER(iso) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Apply specific filters
	if country != "" {
		query = query.Where("LOWER(country) LIKE ?", "%"+strings.ToLower(country)+"%")
	}
	if network != "" {
		query = query.Where("LOWER(network) LIKE ?", "%"+strings.ToLower(network)+"%")
	}
	if iso != "" {
		query = query.Where("LOWER(iso) LIKE ?", "%"+strings.ToLower(iso)+"%")
	}

	// Apply sorting
	orderClause := sortBy + " " + sortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		orderClause = "id desc"
	}
	query = query.Order(orderClause)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get total count",
		})
	}

	// Calculate pagination
	offset := (page - 1) * perPage

	// Get paginated results
	var mccMncList []models.MccMnc
	if err := query.Offset(offset).Limit(perPage).Find(&mccMncList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get MCC-MNC records",
		})
	}

	// Convert to response format
	var response []models.MccMncResponse
	for _, mccMnc := range mccMncList {
		response = append(response, models.MccMncResponse{
			ID:          mccMnc.ID,
			Mcc:         mccMnc.Mcc,
			Mnc:         mccMnc.Mnc,
			Iso:         mccMnc.Iso,
			Country:     mccMnc.Country,
			CountryCode: mccMnc.CountryCode,
			Network:     mccMnc.Network,
			CreatedAt:   mccMnc.CreatedAt,
			UpdatedAt:   mccMnc.UpdatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"data": response,
		"pagination": fiber.Map{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (int(total) + perPage - 1) / perPage,
		},
	})
}

func (h *MccMncHandler) GetMccMncByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID format",
		})
	}

	var mccMnc models.MccMnc
	if err := database.GetDB().First(&mccMnc, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "MCC-MNC record not found",
		})
	}

	return c.JSON(models.MccMncResponse{
		ID:          mccMnc.ID,
		Mcc:         mccMnc.Mcc,
		Mnc:         mccMnc.Mnc,
		Iso:         mccMnc.Iso,
		Country:     mccMnc.Country,
		CountryCode: mccMnc.CountryCode,
		Network:     mccMnc.Network,
		CreatedAt:   mccMnc.CreatedAt,
		UpdatedAt:   mccMnc.UpdatedAt,
	})
}

func (h *MccMncHandler) UpdateMccMnc(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID format",
		})
	}

	var req models.MccMncUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if record exists
	var existingMccMnc models.MccMnc
	if err := database.GetDB().First(&existingMccMnc, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "MCC-MNC record not found",
		})
	}

	// Check if new MCC-MNC combination already exists (excluding current record)
	var duplicateMccMnc models.MccMnc
	if err := database.GetDB().Where("mcc = ? AND mnc = ? AND id != ?", req.Mcc, req.Mnc, id).First(&duplicateMccMnc).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "MCC-MNC combination already exists",
		})
	}

	// Update the record
	updates := models.MccMnc{
		Mcc:         req.Mcc,
		Mnc:         req.Mnc,
		Iso:         req.Iso,
		Country:     req.Country,
		CountryCode: req.CountryCode,
		Network:     req.Network,
	}

	if err := database.GetDB().Model(&existingMccMnc).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update MCC-MNC record",
		})
	}

	// Get updated record
	if err := database.GetDB().First(&existingMccMnc, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get updated record",
		})
	}

	return c.JSON(models.MccMncResponse{
		ID:          existingMccMnc.ID,
		Mcc:         existingMccMnc.Mcc,
		Mnc:         existingMccMnc.Mnc,
		Iso:         existingMccMnc.Iso,
		Country:     existingMccMnc.Country,
		CountryCode: existingMccMnc.CountryCode,
		Network:     existingMccMnc.Network,
		CreatedAt:   existingMccMnc.CreatedAt,
		UpdatedAt:   existingMccMnc.UpdatedAt,
	})
}

func (h *MccMncHandler) DeleteMccMnc(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID format",
		})
	}

	// Check if record exists
	var mccMnc models.MccMnc
	if err := database.GetDB().First(&mccMnc, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "MCC-MNC record not found",
		})
	}

	// Delete the record
	if err := database.GetDB().Delete(&mccMnc).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete MCC-MNC record",
		})
	}

	return c.JSON(fiber.Map{
		"message": "MCC-MNC record deleted successfully",
	})
}

func (h *MccMncHandler) GetMccMncFilterOptions(c *fiber.Ctx) error {
	var countries []string
	var networks []string
	var isos []string

	// Get unique countries
	if err := database.GetDB().Model(&models.MccMnc{}).Distinct("country").Pluck("country", &countries).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get countries",
		})
	}

	// Get unique networks
	if err := database.GetDB().Model(&models.MccMnc{}).Distinct("network").Pluck("network", &networks).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get networks",
		})
	}

	// Get unique ISOs
	if err := database.GetDB().Model(&models.MccMnc{}).Distinct("iso").Pluck("iso", &isos).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get ISOs",
		})
	}

	return c.JSON(models.MccMncFilterOptions{
		Countries: countries,
		Networks:  networks,
		Isos:      isos,
	})
}

func (h *MccMncHandler) BulkDeleteMccMnc(c *fiber.Ctx) error {
	var req struct {
		IDs []uint `json:"ids" validate:"required,min=1"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if len(req.IDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No IDs provided",
		})
	}

	// Delete records
	if err := database.GetDB().Where("id IN ?", req.IDs).Delete(&models.MccMnc{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete MCC-MNC records",
		})
	}

	return c.JSON(fiber.Map{
		"message": "MCC-MNC records deleted successfully",
		"count":   len(req.IDs),
	})
}
