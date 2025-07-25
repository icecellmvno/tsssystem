package handlers

import (
	"strconv"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type PermissionHandler struct{}

func NewPermissionHandler() *PermissionHandler {
	return &PermissionHandler{}
}

func (h *PermissionHandler) GetAllPermissions(c *fiber.Ctx) error {
	var permissions []models.Permission
	if err := database.GetDB().Find(&permissions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch permissions",
		})
	}

	var responses []models.PermissionResponse
	for _, permission := range permissions {
		// Count roles that have this permission
		var roleCount int64
		database.GetDB().Model(&models.Role{}).Joins("JOIN role_permissions ON roles.id = role_permissions.role_id").Where("role_permissions.permission_id = ?", permission.ID).Count(&roleCount)

		responses = append(responses, models.PermissionResponse{
			ID:          permission.ID,
			Name:        permission.Name,
			Description: permission.Description,
			RoleCount:   int(roleCount),
			CreatedAt:   permission.CreatedAt,
			UpdatedAt:   permission.UpdatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"permissions": responses,
	})
}

func (h *PermissionHandler) GetPermissionByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid permission ID",
		})
	}

	var permission models.Permission
	if err := database.GetDB().First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Permission not found",
		})
	}

	// Count roles that have this permission
	var roleCount int64
	database.GetDB().Model(&models.Role{}).Joins("JOIN role_permissions ON roles.id = role_permissions.role_id").Where("role_permissions.permission_id = ?", permission.ID).Count(&roleCount)

	return c.JSON(fiber.Map{
		"permission": models.PermissionResponse{
			ID:          permission.ID,
			Name:        permission.Name,
			Description: permission.Description,
			RoleCount:   int(roleCount),
			CreatedAt:   permission.CreatedAt,
			UpdatedAt:   permission.UpdatedAt,
		},
	})
}

func (h *PermissionHandler) CreatePermission(c *fiber.Ctx) error {
	var req models.PermissionCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if permission already exists
	var existingPermission models.Permission
	if err := database.GetDB().Where("name = ?", req.Name).First(&existingPermission).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Permission already exists",
		})
	}

	permission := models.Permission{
		Name:        req.Name,
		Description: stringPtr(req.Description),
	}

	if err := database.GetDB().Create(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create permission",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Permission created successfully",
		"permission": models.PermissionResponse{
			ID:          permission.ID,
			Name:        permission.Name,
			Description: permission.Description,
			CreatedAt:   permission.CreatedAt,
			UpdatedAt:   permission.UpdatedAt,
		},
	})
}

func (h *PermissionHandler) UpdatePermission(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid permission ID",
		})
	}

	var req models.PermissionUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var permission models.Permission
	if err := database.GetDB().First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Permission not found",
		})
	}

	// Check if name is being changed and if it conflicts
	if req.Name != "" && req.Name != permission.Name {
		var existingPermission models.Permission
		if err := database.GetDB().Where("name = ? AND id != ?", req.Name, id).First(&existingPermission).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Permission name already exists",
			})
		}
	}

	// Update permission fields
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if err := database.GetDB().Model(&permission).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update permission",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Permission updated successfully",
		"permission": models.PermissionResponse{
			ID:          permission.ID,
			Name:        permission.Name,
			Description: permission.Description,
			CreatedAt:   permission.CreatedAt,
			UpdatedAt:   permission.UpdatedAt,
		},
	})
}

func (h *PermissionHandler) DeletePermission(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid permission ID",
		})
	}

	var permission models.Permission
	if err := database.GetDB().First(&permission, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Permission not found",
		})
	}

	// Check if any roles are using this permission
	var roleCount int64
	database.GetDB().Model(&models.Role{}).Joins("JOIN role_permissions ON roles.id = role_permissions.role_id").Where("role_permissions.permission_id = ?", permission.ID).Count(&roleCount)
	if roleCount > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Cannot delete permission that is assigned to roles",
		})
	}

	if err := database.GetDB().Delete(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete permission",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Permission deleted successfully",
	})
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}
