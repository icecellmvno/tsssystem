package routes

import (
	"tsimsocketserver/config"
	"tsimsocketserver/handlers"
	"tsimsocketserver/middleware"
	"tsimsocketserver/redis"
	"tsimsocketserver/websocket"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, cfg *config.Config, wsServer *websocket.WebSocketServer, redisService *redis.RedisService) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	roleHandler := handlers.NewRoleHandler()
	permissionHandler := handlers.NewPermissionHandler()
	countrySiteHandler := handlers.NewCountrySiteHandler()
	deviceGroupHandler := handlers.NewDeviceGroupHandler(cfg)
	deviceHandler := handlers.NewDeviceHandler(wsServer)
	qrHandler := handlers.NewQRHandler(cfg)
	websocketHandler := handlers.NewWebSocketHandler(cfg)
	alarmLogHandler := handlers.NewAlarmLogHandler(cfg)
	smppUserHandler := handlers.NewSmppUserHandler(redisService)
	blacklistNumberHandler := handlers.NewBlacklistNumberHandler()
	bulkSmsHandler := handlers.NewBulkSmsHandler(wsServer)
	scheduleTaskHandler := handlers.NewScheduleTaskHandler(wsServer)

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
	users.Post("/", userHandler.CreateUser)
	users.Put("/:id", userHandler.UpdateUser)
	users.Delete("/:id", userHandler.DeleteUser)

	// Role routes
	roles := protected.Group("/roles")
	roles.Get("/", roleHandler.GetAllRoles)
	roles.Get("/:id", roleHandler.GetRoleByID)
	roles.Post("/", roleHandler.CreateRole)
	roles.Put("/:id", roleHandler.UpdateRole)
	roles.Delete("/:id", roleHandler.DeleteRole)

	// Permission routes
	permissions := protected.Group("/permissions")
	permissions.Get("/", permissionHandler.GetAllPermissions)
	permissions.Get("/:id", permissionHandler.GetPermissionByID)
	permissions.Post("/", permissionHandler.CreatePermission)
	permissions.Put("/:id", permissionHandler.UpdatePermission)
	permissions.Delete("/:id", permissionHandler.DeletePermission)

	// Country Site routes
	countrySites := protected.Group("/country-sites")
	countrySites.Post("/", countrySiteHandler.CreateCountrySite)
	countrySites.Get("/", countrySiteHandler.GetAllCountrySites)
	countrySites.Get("/:id", countrySiteHandler.GetCountrySiteByID)
	countrySites.Put("/:id", countrySiteHandler.UpdateCountrySite)
	countrySites.Delete("/:id", countrySiteHandler.DeleteCountrySite)

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

	// USSD Log routes
	ussdLogs := protected.Group("/ussd-logs")
	ussdLogs.Get("/", handlers.GetUssdLogs)
	ussdLogs.Get("/:id", handlers.GetUssdLog)
	ussdLogs.Get("/filter-options", handlers.GetUssdLogFilterOptions)

	// SIM Card routes
	simCards := protected.Group("/sim-cards")
	simCards.Post("/", handlers.CreateSimCard)
	simCards.Get("/", handlers.GetSimCards)
	simCards.Get("/:id", handlers.GetSimCard)
	simCards.Put("/:id", handlers.UpdateSimCard)
	simCards.Delete("/:id", handlers.DeleteSimCard)
	simCards.Get("/filter-options", handlers.GetSimCardFilterOptions)

	// Filter routes
	filters := protected.Group("/filters")
	filters.Post("/", handlers.CreateFilter)
	filters.Get("/", handlers.GetFilters)
	filters.Get("/:id", handlers.GetFilter)
	filters.Put("/:id", handlers.UpdateFilter)
	filters.Delete("/:id", handlers.DeleteFilter)
	filters.Delete("/bulk-delete", handlers.BulkDeleteFilters)
	filters.Patch("/:id/toggle", handlers.ToggleFilterStatus)

	// Bulk SMS routes
	bulkSms := protected.Group("/bulk-sms")
	bulkSms.Post("/send", bulkSmsHandler.SendBulkSms)
	bulkSms.Get("/status", bulkSmsHandler.GetBulkSmsStatus)

	// Schedule Task routes
	scheduleTasks := protected.Group("/schedule-tasks")
	scheduleTasks.Post("/", scheduleTaskHandler.CreateScheduleTask)
	scheduleTasks.Get("/", scheduleTaskHandler.GetAllScheduleTasks)
	scheduleTasks.Get("/:id", scheduleTaskHandler.GetScheduleTaskByID)
	scheduleTasks.Put("/:id", scheduleTaskHandler.UpdateScheduleTask)
	scheduleTasks.Delete("/:id", scheduleTaskHandler.DeleteScheduleTask)
	scheduleTasks.Post("/:id/execute", scheduleTaskHandler.ExecuteScheduleTask)
	scheduleTasks.Post("/:id/pause", scheduleTaskHandler.PauseScheduleTask)
	scheduleTasks.Post("/:id/resume", scheduleTaskHandler.ResumeScheduleTask)

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
