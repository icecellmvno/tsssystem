package handlers

import (
	"strconv"
	"strings"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type CountrySiteHandler struct{}

func NewCountrySiteHandler() *CountrySiteHandler {
	return &CountrySiteHandler{}
}

func (h *CountrySiteHandler) CreateCountrySite(c *fiber.Ctx) error {
	var req models.CountrySiteCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if manager user exists
	var managerUser models.User
	if err := database.GetDB().First(&managerUser, req.ManagerUser).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Manager user not found",
		})
	}

	// Check if operator user exists
	var operatorUser models.User
	if err := database.GetDB().First(&operatorUser, req.OperatorUser).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Operator user not found",
		})
	}

	countrySite := models.CountrySite{
		Name:             req.Name,
		CountryPhoneCode: req.CountryPhoneCode,
		ManagerUser:      req.ManagerUser,
		OperatorUser:     req.OperatorUser,
	}

	if err := database.GetDB().Create(&countrySite).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create country site",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(models.CountrySiteResponse{
		ID:               countrySite.ID,
		Name:             countrySite.Name,
		CountryPhoneCode: countrySite.CountryPhoneCode,
		ManagerUser:      countrySite.ManagerUser,
		OperatorUser:     countrySite.OperatorUser,
		CreatedAt:        countrySite.CreatedAt,
		UpdatedAt:        countrySite.UpdatedAt,
	})
}

func (h *CountrySiteHandler) GetAllCountrySites(c *fiber.Ctx) error {
	// Get query parameters
	search := c.Query("search")
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

	// Build query with joins to get user names
	query := database.GetDB().Table("country_sites").
		Select("country_sites.*, manager.username as manager_user_name, operator.username as operator_user_name").
		Joins("LEFT JOIN users manager ON country_sites.manager_user = manager.id").
		Joins("LEFT JOIN users operator ON country_sites.operator_user = operator.id")

	// Apply search filter
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(country_sites.name) LIKE ? OR LOWER(country_sites.country_phone_code) LIKE ?", searchTerm, searchTerm)
	}

	// Apply sorting
	orderClause := "country_sites." + sortBy + " " + sortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		orderClause = "country_sites.id desc"
	}
	query = query.Order(orderClause)

	// Get total count
	var total int64
	database.GetDB().Model(&models.CountrySite{}).Count(&total)

	// Apply pagination
	offset := (page - 1) * perPage
	var results []map[string]interface{}
	if err := query.Offset(offset).Limit(perPage).Find(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch country sites",
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))

	// Build response
	var responses []map[string]interface{}
	for _, result := range results {
		responses = append(responses, map[string]interface{}{
			"id":                 result["id"],
			"name":               result["name"],
			"country_phone_code": result["country_phone_code"],
			"manager_user":       result["manager_user"],
			"operator_user":      result["operator_user"],
			"manager_user_name":  result["manager_user_name"],
			"operator_user_name": result["operator_user_name"],
			"created_at":         result["created_at"],
			"updated_at":         result["updated_at"],
		})
	}

	// Ensure data is always an array, never null
	if responses == nil {
		responses = []map[string]interface{}{}
	}

	return c.JSON(fiber.Map{
		"data":         responses,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
	})
}

func (h *CountrySiteHandler) GetCountrySiteByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid country site ID",
		})
	}

	var countrySite models.CountrySite
	if err := database.GetDB().First(&countrySite, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Country site not found",
		})
	}

	return c.JSON(models.CountrySiteResponse{
		ID:               countrySite.ID,
		Name:             countrySite.Name,
		CountryPhoneCode: countrySite.CountryPhoneCode,
		ManagerUser:      countrySite.ManagerUser,
		OperatorUser:     countrySite.OperatorUser,
		CreatedAt:        countrySite.CreatedAt,
		UpdatedAt:        countrySite.UpdatedAt,
	})
}

func (h *CountrySiteHandler) UpdateCountrySite(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid country site ID",
		})
	}

	var req models.CountrySiteUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var countrySite models.CountrySite
	if err := database.GetDB().First(&countrySite, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Country site not found",
		})
	}

	// Check if manager user exists
	var managerUser models.User
	if err := database.GetDB().First(&managerUser, req.ManagerUser).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Manager user not found",
		})
	}

	// Check if operator user exists
	var operatorUser models.User
	if err := database.GetDB().First(&operatorUser, req.OperatorUser).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Operator user not found",
		})
	}

	countrySite.Name = req.Name
	countrySite.CountryPhoneCode = req.CountryPhoneCode
	countrySite.ManagerUser = req.ManagerUser
	countrySite.OperatorUser = req.OperatorUser

	if err := database.GetDB().Save(&countrySite).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update country site",
		})
	}

	return c.JSON(models.CountrySiteResponse{
		ID:               countrySite.ID,
		Name:             countrySite.Name,
		CountryPhoneCode: countrySite.CountryPhoneCode,
		ManagerUser:      countrySite.ManagerUser,
		OperatorUser:     countrySite.OperatorUser,
		CreatedAt:        countrySite.CreatedAt,
		UpdatedAt:        countrySite.UpdatedAt,
	})
}

func (h *CountrySiteHandler) DeleteCountrySite(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid country site ID",
		})
	}

	if err := database.GetDB().Delete(&models.CountrySite{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete country site",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Country site deleted successfully",
	})
}
