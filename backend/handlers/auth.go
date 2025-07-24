package handlers

import (
	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/models"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.UserLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user models.User
	if err := database.GetDB().Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	if !auth.CheckPassword(req.Password, user.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	if !user.IsActive {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Account is deactivated",
		})
	}

	token, err := auth.GenerateToken(&user, h.cfg)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"token":   token,
		"user": models.UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.Role,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	})
}

func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req models.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user models.User
	if err := database.GetDB().Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not for security
		return c.JSON(fiber.Map{
			"message": "If the email exists, a password reset link has been sent",
		})
	}

	if !user.IsActive {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Account is deactivated",
		})
	}

	// Generate reset token
	resetToken, err := auth.GenerateResetToken(&user, h.cfg)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate reset token",
		})
	}

	// TODO: Send email with reset link
	// For now, just return success message
	// In production, you would send an email with the reset link

	return c.JSON(fiber.Map{
		"message":     "If the email exists, a password reset link has been sent",
		"reset_token": resetToken, // Remove this in production
	})
}
