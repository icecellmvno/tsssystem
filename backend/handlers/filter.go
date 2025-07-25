package handlers

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
)

// GetFilters handles GET /api/filters
func GetFilters(c *fiber.Ctx) error {
	db := database.GetDB()

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search")
	filterType := c.Query("type")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	// Validate page and per_page
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := db.Model(&models.Filter{})

	// Apply search filter
	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Apply type filter
	if filterType != "" && filterType != "all" {
		query = query.Where("type = ?", filterType)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Apply sorting
	orderClause := sortBy
	if strings.ToUpper(sortOrder) == "DESC" {
		orderClause += " DESC"
	} else {
		orderClause += " ASC"
	}
	query = query.Order(orderClause)

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	var filters []models.Filter
	if err := query.Find(&filters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filters",
		})
	}

	// Convert to response format
	var responses []models.FilterResponse
	for _, filter := range filters {
		var config map[string]interface{}
		if filter.Config != nil {
			json.Unmarshal(filter.Config, &config)
		}

		response := models.FilterResponse{
			ID:          filter.ID,
			Name:        filter.Name,
			Type:        filter.Type,
			Description: filter.Description,
			IsActive:    filter.IsActive,
			Config:      config,
			CreatedAt:   filter.CreatedAt,
			UpdatedAt:   filter.UpdatedAt,
		}
		responses = append(responses, response)
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	// Build pagination links
	var links []interface{}
	if page > 1 {
		links = append(links, fiber.Map{"url": "?page=" + strconv.Itoa(page-1), "label": "Previous", "active": false})
	}
	if page < lastPage {
		links = append(links, fiber.Map{"url": "?page=" + strconv.Itoa(page+1), "label": "Next", "active": false})
	}

	response := models.PaginatedFiltersResponse{
		Data:        responses,
		CurrentPage: page,
		LastPage:    lastPage,
		PerPage:     perPage,
		Total:       total,
		Links:       links,
	}

	return c.JSON(response)
}

// GetFilter handles GET /api/filters/:id
func GetFilter(c *fiber.Ctx) error {
	db := database.GetDB()
	id := c.Params("id")

	var filter models.Filter
	if err := db.First(&filter, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Filter not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	var config map[string]interface{}
	if filter.Config != nil {
		json.Unmarshal(filter.Config, &config)
	}

	response := models.FilterResponse{
		ID:          filter.ID,
		Name:        filter.Name,
		Type:        filter.Type,
		Description: filter.Description,
		IsActive:    filter.IsActive,
		Config:      config,
		CreatedAt:   filter.CreatedAt,
		UpdatedAt:   filter.UpdatedAt,
	}

	return c.JSON(response)
}

// CreateFilter handles POST /api/filters
func CreateFilter(c *fiber.Ctx) error {
	db := database.GetDB()

	var req models.CreateFilterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Validate filter type
	validTypes := []string{
		"TransparentFilter", "ConnectorFilter", "UserFilter", "GroupFilter",
		"SourceAddrFilter", "DestinationAddrFilter", "ShortMessageFilter",
		"DateIntervalFilter", "TimeIntervalFilter", "TagFilter", "EvalPyFilter",
	}

	isValidType := false
	for _, validType := range validTypes {
		if req.Type == validType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid filter type",
		})
	}

	// Convert config to JSON
	configJSON, err := json.Marshal(req.Config)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config format",
		})
	}

	filter := models.Filter{
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		IsActive:    req.IsActive,
		Config:      configJSON,
	}

	if err := db.Create(&filter).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create filter",
		})
	}

	var config map[string]interface{}
	if filter.Config != nil {
		json.Unmarshal(filter.Config, &config)
	}

	response := models.FilterResponse{
		ID:          filter.ID,
		Name:        filter.Name,
		Type:        filter.Type,
		Description: filter.Description,
		IsActive:    filter.IsActive,
		Config:      config,
		CreatedAt:   filter.CreatedAt,
		UpdatedAt:   filter.UpdatedAt,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// UpdateFilter handles PUT /api/filters/:id
func UpdateFilter(c *fiber.Ctx) error {
	db := database.GetDB()
	id := c.Params("id")

	var req models.UpdateFilterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Validate filter type
	validTypes := []string{
		"TransparentFilter", "ConnectorFilter", "UserFilter", "GroupFilter",
		"SourceAddrFilter", "DestinationAddrFilter", "ShortMessageFilter",
		"DateIntervalFilter", "TimeIntervalFilter", "TagFilter", "EvalPyFilter",
	}

	isValidType := false
	for _, validType := range validTypes {
		if req.Type == validType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid filter type",
		})
	}

	var filter models.Filter
	if err := db.First(&filter, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Filter not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	// Convert config to JSON
	configJSON, err := json.Marshal(req.Config)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid config format",
		})
	}

	// Update filter
	filter.Name = req.Name
	filter.Type = req.Type
	filter.Description = req.Description
	filter.IsActive = req.IsActive
	filter.Config = configJSON

	if err := db.Save(&filter).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update filter",
		})
	}

	var config map[string]interface{}
	if filter.Config != nil {
		json.Unmarshal(filter.Config, &config)
	}

	response := models.FilterResponse{
		ID:          filter.ID,
		Name:        filter.Name,
		Type:        filter.Type,
		Description: filter.Description,
		IsActive:    filter.IsActive,
		Config:      config,
		CreatedAt:   filter.CreatedAt,
		UpdatedAt:   filter.UpdatedAt,
	}

	return c.JSON(response)
}

// DeleteFilter handles DELETE /api/filters/:id
func DeleteFilter(c *fiber.Ctx) error {
	db := database.GetDB()
	id := c.Params("id")

	var filter models.Filter
	if err := db.First(&filter, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Filter not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	if err := db.Delete(&filter).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete filter",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Filter deleted successfully",
	})
}

// BulkDeleteFilters handles DELETE /api/filters/bulk-delete
func BulkDeleteFilters(c *fiber.Ctx) error {
	db := database.GetDB()

	var req struct {
		IDs []uint `json:"ids"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if len(req.IDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No filter IDs provided",
		})
	}

	if err := db.Delete(&models.Filter{}, req.IDs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete filters",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Filters deleted successfully",
	})
}

// ToggleFilterStatus handles PATCH /api/filters/:id/toggle
func ToggleFilterStatus(c *fiber.Ctx) error {
	db := database.GetDB()
	id := c.Params("id")

	var filter models.Filter
	if err := db.First(&filter, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Filter not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch filter",
		})
	}

	// Toggle status
	filter.IsActive = !filter.IsActive

	if err := db.Save(&filter).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update filter status",
		})
	}

	var config map[string]interface{}
	if filter.Config != nil {
		json.Unmarshal(filter.Config, &config)
	}

	response := models.FilterResponse{
		ID:          filter.ID,
		Name:        filter.Name,
		Type:        filter.Type,
		Description: filter.Description,
		IsActive:    filter.IsActive,
		Config:      config,
		CreatedAt:   filter.CreatedAt,
		UpdatedAt:   filter.UpdatedAt,
	}

	return c.JSON(response)
}
