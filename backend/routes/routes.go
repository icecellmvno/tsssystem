package routes

import (
	"tsimsocketserver/config"
	"tsimsocketserver/handlers"
	"tsimsocketserver/middleware"
	"tsimsocketserver/websocket"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, cfg *config.Config, wsServer *websocket.WebSocketServer) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	sitenameHandler := handlers.NewSitenameHandler()
	deviceGroupHandler := handlers.NewDeviceGroupHandler(cfg)
	deviceHandler := handlers.NewDeviceHandler(wsServer)
	qrHandler := handlers.NewQRHandler(cfg)
	websocketHandler := handlers.NewWebSocketHandler(cfg)
	alarmLogHandler := handlers.NewAlarmLogHandler(cfg)
	smppUserHandler := handlers.NewSmppUserHandler()
	blacklistNumberHandler := handlers.NewBlacklistNumberHandler()
	bulkSmsHandler := handlers.NewBulkSmsHandler(wsServer)

	// API routes
	api := app.Group("/api")

	// Public routes
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/forgot-password", authHandler.ForgotPassword)

	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(cfg), middleware.PermissionMiddleware())

	// User routes
	users := protected.Group("/users")
	users.Get("/profile", userHandler.GetProfile)
	users.Get("/", userHandler.GetAllUsers)
	users.Get("/:id", userHandler.GetUserByID)
	users.Put("/:id", userHandler.UpdateUser)
	users.Delete("/:id", userHandler.DeleteUser)

	// Sitename routes
	sitenames := protected.Group("/sitenames")
	sitenames.Post("/", sitenameHandler.CreateSitename)
	sitenames.Get("/", sitenameHandler.GetAllSitenames)
	sitenames.Get("/:id", sitenameHandler.GetSitenameByID)
	sitenames.Put("/:id", sitenameHandler.UpdateSitename)
	sitenames.Delete("/:id", sitenameHandler.DeleteSitename)

	// Device Group routes
	deviceGroups := protected.Group("/device-groups")
	deviceGroups.Post("/", deviceGroupHandler.CreateDeviceGroup)
	deviceGroups.Get("/", deviceGroupHandler.GetAllDeviceGroups)
	deviceGroups.Get("/:id", deviceGroupHandler.GetDeviceGroupByID)
	deviceGroups.Put("/:id", deviceGroupHandler.UpdateDeviceGroup)
	deviceGroups.Delete("/:id", deviceGroupHandler.DeleteDeviceGroup)
	deviceGroups.Get("/:id/qr", deviceGroupHandler.GenerateQRCode)

	// Device routes
	devices := protected.Group("/devices")
	devices.Get("/", deviceHandler.GetAllDevices)
	devices.Get("/connected", deviceHandler.GetConnectedDevices)
	devices.Get("/:device_id", deviceHandler.GetDeviceByID)
	devices.Post("/:device_id/sms", deviceHandler.SendSms)
	devices.Post("/:device_id/ussd", deviceHandler.SendUssd)
	devices.Post("/:device_id/find", deviceHandler.FindDevice)
	devices.Post("/:device_id/alarm/start", deviceHandler.StartAlarm)
	devices.Post("/:device_id/alarm/stop", deviceHandler.StopAlarm)
	devices.Post("/:device_id/alarm", deviceHandler.StartAlarm)
	devices.Post("/:device_id/toggle", deviceHandler.ToggleDevice)
	devices.Post("/:device_id/maintenance/enter", deviceHandler.EnterMaintenanceMode)
	devices.Post("/:device_id/maintenance/exit", deviceHandler.ExitMaintenanceMode)
	devices.Delete("/:device_id", deviceHandler.DeleteDevice)
	devices.Put("/:device_id/name", deviceHandler.UpdateDeviceName)

	// Alarm Log routes
	alarmLogs := protected.Group("/alarm-logs")
	alarmLogs.Get("/", alarmLogHandler.GetAlarmLogs)
	alarmLogs.Get("/:id", alarmLogHandler.GetAlarmLog)
	alarmLogs.Delete("/:id", alarmLogHandler.DeleteAlarmLog)
	alarmLogs.Delete("/", alarmLogHandler.ClearAlarmLogs)

	// SMPP User routes
	smppUsers := protected.Group("/smpp-users")
	smppUsers.Post("/", smppUserHandler.CreateSmppUser)
	smppUsers.Get("/", smppUserHandler.GetAllSmppUsers)
	smppUsers.Get("/stats", smppUserHandler.GetSmppUserStats)
	smppUsers.Get("/:id", smppUserHandler.GetSmppUserByID)
	smppUsers.Put("/:id", smppUserHandler.UpdateSmppUser)
	smppUsers.Delete("/:id", smppUserHandler.DeleteSmppUser)
	smppUsers.Put("/:id/connection-status", smppUserHandler.UpdateConnectionStatus)

	// Blacklist Number routes
	blacklistNumbers := protected.Group("/blacklist-numbers")
	blacklistNumbers.Post("/", blacklistNumberHandler.CreateBlacklistNumber)
	blacklistNumbers.Get("/", blacklistNumberHandler.GetAllBlacklistNumbers)
	blacklistNumbers.Get("/:id", blacklistNumberHandler.GetBlacklistNumberByID)
	blacklistNumbers.Put("/:id", blacklistNumberHandler.UpdateBlacklistNumber)
	blacklistNumbers.Delete("/:id", blacklistNumberHandler.DeleteBlacklistNumber)
	blacklistNumbers.Post("/bulk-import", blacklistNumberHandler.BulkImportBlacklistNumbers)
	blacklistNumbers.Post("/bulk-paste", blacklistNumberHandler.BulkPasteBlacklistNumbers)
	blacklistNumbers.Post("/bulk-delete", blacklistNumberHandler.BulkDeleteBlacklistNumbers)

	// SMS Log routes
	smsLogs := protected.Group("/sms-logs")
	smsLogs.Get("/", handlers.GetSmsLogs)
	smsLogs.Get("/:id", handlers.GetSmsLog)
	smsLogs.Get("/filter-options", handlers.GetSmsLogFilterOptions)

	// Bulk SMS routes
	bulkSms := protected.Group("/bulk-sms")
	bulkSms.Post("/send", bulkSmsHandler.SendBulkSms)
	bulkSms.Get("/status", bulkSmsHandler.GetBulkSmsStatus)

	// QR Code routes
	qr := protected.Group("/qr")
	qr.Post("/generate", qrHandler.GenerateQRConfig)

	// WebSocket config route
	protected.Get("/websocket-config", websocketHandler.GetWebSocketConfig)

	// WebSocket routes
	app.Get("/ws", wsServer.HandleWebSocket) // Unified WebSocket endpoint (type=android|frontend)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is running",
		})
	})
}
