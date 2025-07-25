package handlers

import (
	"strconv"

	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type RoleHandler struct{}

func NewRoleHandler() *RoleHandler {
	return &RoleHandler{}
}

func (h *RoleHandler) GetAllRoles(c *fiber.Ctx) error {
	var roles []models.Role
	if err := database.GetDB().Preload("Permissions").Find(&roles).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch roles",
		})
	}

	var responses []models.RoleResponse
	for _, role := range roles {
		// Count users with this role
		var userCount int64
		database.GetDB().Model(&models.User{}).Where("role = ?", role.Name).Count(&userCount)

		responses = append(responses, models.RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			Description: role.Description,
			Permissions: role.Permissions,
			UserCount:   int(userCount),
			CreatedAt:   role.CreatedAt,
			UpdatedAt:   role.UpdatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"roles": responses,
	})
}

func (h *RoleHandler) GetRoleByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role ID",
		})
	}

	var role models.Role
	if err := database.GetDB().Preload("Permissions").First(&role, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	// Count users with this role
	var userCount int64
	database.GetDB().Model(&models.User{}).Where("role = ?", role.Name).Count(&userCount)

	return c.JSON(fiber.Map{
		"role": models.RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			Description: role.Description,
			Permissions: role.Permissions,
			UserCount:   int(userCount),
			CreatedAt:   role.CreatedAt,
			UpdatedAt:   role.UpdatedAt,
		},
	})
}

func (h *RoleHandler) CreateRole(c *fiber.Ctx) error {
	var req models.RoleCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check if role already exists
	var existingRole models.Role
	if err := database.GetDB().Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Role already exists",
		})
	}

	role := models.Role{
		Name:        req.Name,
		Description: stringPtr(req.Description),
	}

	// Begin transaction
	tx := database.GetDB().Begin()

	if err := tx.Create(&role).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create role",
		})
	}

	// Add permissions if provided
	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		if err := tx.Where("id IN ?", req.PermissionIDs).Find(&permissions).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch permissions",
			})
		}

		if err := tx.Model(&role).Association("Permissions").Append(permissions); err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to assign permissions",
			})
		}
	}

	tx.Commit()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Role created successfully",
		"role": models.RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			Description: role.Description,
			CreatedAt:   role.CreatedAt,
			UpdatedAt:   role.UpdatedAt,
		},
	})
}

func (h *RoleHandler) UpdateRole(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role ID",
		})
	}

	var req models.RoleUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var role models.Role
	if err := database.GetDB().First(&role, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	// Check if name is being changed and if it conflicts
	if req.Name != "" && req.Name != role.Name {
		var existingRole models.Role
		if err := database.GetDB().Where("name = ? AND id != ?", req.Name, id).First(&existingRole).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Role name already exists",
			})
		}
	}

	// Begin transaction
	tx := database.GetDB().Begin()

	// Update role fields
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	if err := tx.Model(&role).Updates(updates).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update role",
		})
	}

	// Update permissions if provided
	if req.PermissionIDs != nil {
		// Clear existing permissions
		if err := tx.Model(&role).Association("Permissions").Clear(); err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to clear permissions",
			})
		}

		// Add new permissions
		if len(*req.PermissionIDs) > 0 {
			var permissions []models.Permission
			if err := tx.Where("id IN ?", *req.PermissionIDs).Find(&permissions).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to fetch permissions",
				})
			}

			if err := tx.Model(&role).Association("Permissions").Append(permissions); err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to assign permissions",
				})
			}
		}
	}

	tx.Commit()

	// Reload role with permissions
	database.GetDB().Preload("Permissions").First(&role, id)

	return c.JSON(fiber.Map{
		"message": "Role updated successfully",
		"role": models.RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			Description: role.Description,
			Permissions: role.Permissions,
			CreatedAt:   role.CreatedAt,
			UpdatedAt:   role.UpdatedAt,
		},
	})
}

func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role ID",
		})
	}

	var role models.Role
	if err := database.GetDB().First(&role, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	// Check if any users are using this role
	var userCount int64
	database.GetDB().Model(&models.User{}).Where("role = ?", role.Name).Count(&userCount)
	if userCount > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Cannot delete role that is assigned to users",
		})
	}

	// Begin transaction
	tx := database.GetDB().Begin()

	// Clear permissions association
	if err := tx.Model(&role).Association("Permissions").Clear(); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to clear role permissions",
		})
	}

	// Delete role
	if err := tx.Delete(&role).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete role",
		})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message": "Role deleted successfully",
	})
}
