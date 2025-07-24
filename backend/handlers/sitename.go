package handlers

import (
	"strconv"
	"strings"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type SitenameHandler struct{}

func NewSitenameHandler() *SitenameHandler {
	return &SitenameHandler{}
}

func (h *SitenameHandler) CreateSitename(c *fiber.Ctx) error {
	var req models.SitenameCreateRequest
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

	sitename := models.Sitename{
		Name:         req.Name,
		ManagerUser:  req.ManagerUser,
		OperatorUser: req.OperatorUser,
	}

	if err := database.GetDB().Create(&sitename).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create sitename",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(models.SitenameResponse{
		ID:           sitename.ID,
		Name:         sitename.Name,
		ManagerUser:  sitename.ManagerUser,
		OperatorUser: sitename.OperatorUser,
		CreatedAt:    sitename.CreatedAt,
		UpdatedAt:    sitename.UpdatedAt,
	})
}

func (h *SitenameHandler) GetAllSitenames(c *fiber.Ctx) error {
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

	// Build query
	query := database.GetDB().Model(&models.Sitename{})

	// Apply search filter
	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ?", searchTerm)
	}

	// Apply sorting
	orderClause := sortBy + " " + sortOrder
	if sortOrder != "asc" && sortOrder != "desc" {
		orderClause = "id desc"
	}
	query = query.Order(orderClause)

	// Get total count
	var total int64
	query.Model(&models.Sitename{}).Count(&total)

	// Apply pagination
	offset := (page - 1) * perPage
	var sitenames []models.Sitename
	if err := query.Offset(offset).Limit(perPage).Find(&sitenames).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch sitenames",
		})
	}

	// Calculate pagination info
	lastPage := int((total + int64(perPage) - 1) / int64(perPage))

	// Build response
	var responses []models.SitenameResponse
	for _, sitename := range sitenames {
		responses = append(responses, models.SitenameResponse{
			ID:           sitename.ID,
			Name:         sitename.Name,
			ManagerUser:  sitename.ManagerUser,
			OperatorUser: sitename.OperatorUser,
			CreatedAt:    sitename.CreatedAt,
			UpdatedAt:    sitename.UpdatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"data":         responses,
		"current_page": page,
		"last_page":    lastPage,
		"per_page":     perPage,
		"total":        total,
	})
}

func (h *SitenameHandler) GetSitenameByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid sitename ID",
		})
	}

	var sitename models.Sitename
	if err := database.GetDB().First(&sitename, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Sitename not found",
		})
	}

	return c.JSON(models.SitenameResponse{
		ID:           sitename.ID,
		Name:         sitename.Name,
		ManagerUser:  sitename.ManagerUser,
		OperatorUser: sitename.OperatorUser,
		CreatedAt:    sitename.CreatedAt,
		UpdatedAt:    sitename.UpdatedAt,
	})
}

func (h *SitenameHandler) UpdateSitename(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid sitename ID",
		})
	}

	var req models.SitenameUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var sitename models.Sitename
	if err := database.GetDB().First(&sitename, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Sitename not found",
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

	sitename.Name = req.Name
	sitename.ManagerUser = req.ManagerUser
	sitename.OperatorUser = req.OperatorUser

	if err := database.GetDB().Save(&sitename).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update sitename",
		})
	}

	return c.JSON(models.SitenameResponse{
		ID:           sitename.ID,
		Name:         sitename.Name,
		ManagerUser:  sitename.ManagerUser,
		OperatorUser: sitename.OperatorUser,
		CreatedAt:    sitename.CreatedAt,
		UpdatedAt:    sitename.UpdatedAt,
	})
}

func (h *SitenameHandler) DeleteSitename(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid sitename ID",
		})
	}

	if err := database.GetDB().Delete(&models.Sitename{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete sitename",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Sitename deleted successfully",
	})
}
