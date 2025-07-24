package handlers

import (
	"tsimsocketserver/auth"
	"tsimsocketserver/config"

	"github.com/gofiber/fiber/v2"
)

type WebSocketHandler struct {
	cfg *config.Config
}

func NewWebSocketHandler(cfg *config.Config) *WebSocketHandler {
	return &WebSocketHandler{
		cfg: cfg,
	}
}

// GetWebSocketConfig returns WebSocket configuration for frontend
func (h *WebSocketHandler) GetWebSocketConfig(c *fiber.Ctx) error {
	// Get user from context (set by auth middleware)
	user := c.Locals("user").(*auth.Claims)

	// Use configured WebSocket URL or fallback to default
	wsURL := h.cfg.WebSocketURL
	if wsURL == "" {
		// Frontend will use proxy, so use relative URL
		wsURL = "/ws"
	}

	// Get authorization header for JWT token
	authHeader := c.Get("Authorization")
	token := ""
	if authHeader != "" {
		token = authHeader[7:] // Remove "Bearer " prefix
	}

	config := fiber.Map{
		"websocket_url":        wsURL,
		"device_websocket_url": h.cfg.WebSocketURL, // Device connection URL
		"token":                token,              // Use JWT token for frontend
		"queue_name":           "frontend_queue",
		"user_id":              user.UserID,
		"username":             user.Username,
		"role":                 user.Role,
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    config,
	})
}
