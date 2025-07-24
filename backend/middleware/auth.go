package middleware

import (
	"strings"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format",
			})
		}

		claims, err := auth.ValidateToken(tokenString, cfg)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		c.Locals("user", claims)
		return c.Next()
	}
}

func PermissionMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*auth.Claims)
		path := c.Path()
		method := c.Method()

		if !auth.CheckPermission(user.Role, path, method) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Insufficient permissions",
			})
		}

		return c.Next()
	}
}
