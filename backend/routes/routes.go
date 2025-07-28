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
	websocketHandler := handlers.NewWebSocketHandler(cfg)
	alarmLogHandler := handlers.NewAlarmLogHandler(cfg)
	smppUserHandler := handlers.NewSmppUserHandler(redisService)
	blacklistNumberHandler := handlers.NewBlacklistNumberHandler()
	bulkSmsHandler := handlers.NewBulkSmsHandler(wsServer)
	scheduleTaskHandler := handlers.NewScheduleTaskHandler(wsServer)
	mccMncHandler := handlers.NewMccMncHandler()
	smsRoutingHandler := handlers.NewSmsRoutingHandler()

	// API routes
	api := app.Group("/api")

	// Public routes
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/forgot-password", authHandler.ForgotPassword)

	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(cfg), middleware.PermissionMiddleware())

	// Add WebSocket server to context for SMS routing
	protected.Use(func(c *fiber.Ctx) error {
		c.Locals("ws_server", wsServer)
		return c.Next()
	})

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
	deviceGroups.Get("/:id/qr-code", deviceGroupHandler.GenerateQRCode)

	// Device routes
	devices := protected.Group("/devices")
	devices.Get("/", deviceHandler.GetAllDevices)
	devices.Get("/stats", deviceHandler.GetDeviceStats)
	devices.Get("/connected", deviceHandler.GetConnectedDevices)
	devices.Get("/active", deviceHandler.GetActiveDevices)
	devices.Get("/:imei", deviceHandler.GetDeviceByID)
	devices.Post("/:imei/sms", deviceHandler.SendSms)
	devices.Post("/:imei/ussd", deviceHandler.SendUssd)
	devices.Post("/:imei/find", deviceHandler.FindDevice)
	devices.Post("/:imei/alarm/start", deviceHandler.StartAlarm)
	devices.Post("/:imei/alarm/stop", deviceHandler.StopAlarm)
	devices.Post("/:imei/alarm", deviceHandler.StartAlarm)
	devices.Post("/:imei/toggle", deviceHandler.ToggleDevice)
	devices.Post("/:imei/maintenance/enter", deviceHandler.EnterMaintenanceMode)
	devices.Post("/:imei/maintenance/exit", deviceHandler.ExitMaintenanceMode)
	devices.Delete("/:imei", deviceHandler.DeleteDevice)
	devices.Put("/:imei/rename", deviceHandler.UpdateDeviceName)
	devices.Delete("/", deviceHandler.DeleteDevices)
	devices.Put("/toggle-active", deviceHandler.ToggleDeviceActive)
	devices.Post("/maintenance/enter", deviceHandler.EnterMaintenanceModeBulk)
	devices.Post("/maintenance/exit", deviceHandler.ExitMaintenanceModeBulk)



	// SMS Routing routes
	smsRouting := protected.Group("/sms-routing")
	smsRouting.Post("/send", smsRoutingHandler.RouteSms)
	smsRouting.Get("/stats", smsRoutingHandler.GetSmsRoutingStats)
	smsRouting.Get("/active-devices", deviceHandler.GetActiveDevices)

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

	// SMPP User Anti-Detection routes
	smppUsers.Get("/:id/anti-detection-config", handlers.GetSmppUserAntiDetectionConfig)
	smppUsers.Put("/:id/anti-detection-config", handlers.UpdateSmppUserAntiDetectionConfig)

	// SMPP User SIM Pool Config routes
	smppUsers.Get("/:id/sim-pool-configs", handlers.GetSmppUserSimPoolConfigs)
	smppUsers.Post("/:id/sim-pool-configs", handlers.CreateSmppUserSimPoolConfig)
	smppUsers.Put("/:id/sim-pool-configs/:config_id", handlers.UpdateSmppUserSimPoolConfig)
	smppUsers.Delete("/:id/sim-pool-configs/:config_id", handlers.DeleteSmppUserSimPoolConfig)

	// SMPP User Delay Config routes
	smppUsers.Get("/:id/delay-configs", handlers.GetSmppUserDelayConfigs)
	smppUsers.Post("/:id/delay-configs", handlers.CreateSmppUserDelayConfig)
	smppUsers.Put("/:id/delay-configs/:config_id", handlers.UpdateSmppUserDelayConfig)
	smppUsers.Delete("/:id/delay-configs/:config_id", handlers.DeleteSmppUserDelayConfig)

	// Blacklist Number routes
	blacklistNumbers := protected.Group("/blacklist-numbers")
	blacklistNumbers.Post("/", blacklistNumberHandler.CreateBlacklistNumber)
	blacklistNumbers.Get("/", blacklistNumberHandler.GetAllBlacklistNumbers)
	blacklistNumbers.Post("/bulk-import", blacklistNumberHandler.BulkImportBlacklistNumbers)
	blacklistNumbers.Post("/bulk-paste", blacklistNumberHandler.BulkPasteBlacklistNumbers)
	blacklistNumbers.Post("/bulk-delete", blacklistNumberHandler.BulkDeleteBlacklistNumbers)
	blacklistNumbers.Get("/:id", blacklistNumberHandler.GetBlacklistNumberByID)
	blacklistNumbers.Put("/:id", blacklistNumberHandler.UpdateBlacklistNumber)
	blacklistNumbers.Delete("/:id", blacklistNumberHandler.DeleteBlacklistNumber)

	// SMS Log routes
	smsLogs := protected.Group("/sms-logs")
	smsLogs.Get("/", handlers.GetSmsLogs)
	smsLogs.Get("/filter-options", handlers.GetSmsLogFilterOptions)
	smsLogs.Get("/:id", handlers.GetSmsLog)

	// USSD Log routes
	ussdLogs := protected.Group("/ussd-logs")
	ussdLogs.Get("/", handlers.GetUssdLogs)
	ussdLogs.Get("/filter-options", handlers.GetUssdLogFilterOptions)
	ussdLogs.Get("/:id", handlers.GetUssdLog)

	// SIM Card routes
	simCards := protected.Group("/sim-cards")
	simCards.Post("/", handlers.CreateSimCard)
	simCards.Get("/", handlers.GetSimCards)
	simCards.Get("/filter-options", handlers.GetSimCardFilterOptions)
	simCards.Get("/:id", handlers.GetSimCard)
	simCards.Put("/:id", handlers.UpdateSimCard)
	simCards.Delete("/:id", handlers.DeleteSimCard)

	// Filter routes
	filters := protected.Group("/filters")
	filters.Post("/", handlers.CreateFilter)
	filters.Get("/", handlers.GetFilters)
	filters.Delete("/bulk-delete", handlers.BulkDeleteFilters)
	filters.Get("/:id", handlers.GetFilter)
	filters.Put("/:id", handlers.UpdateFilter)
	filters.Delete("/:id", handlers.DeleteFilter)
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

	// MCC-MNC routes
	mccMnc := protected.Group("/mcc-mnc")
	mccMnc.Post("/", mccMncHandler.CreateMccMnc)
	mccMnc.Get("/", mccMncHandler.GetAllMccMnc)
	mccMnc.Get("/filter-options", mccMncHandler.GetMccMncFilterOptions)
	mccMnc.Get("/:id", mccMncHandler.GetMccMncByID)
	mccMnc.Put("/:id", mccMncHandler.UpdateMccMnc)
	mccMnc.Delete("/:id", mccMncHandler.DeleteMccMnc)
	mccMnc.Delete("/bulk-delete", mccMncHandler.BulkDeleteMccMnc)

	// SMPP Routing routes
	smppRoutings := protected.Group("/smpp-routings")
	smppRoutings.Post("/", smsRoutingHandler.CreateSmsRouting)
	smppRoutings.Get("/", smsRoutingHandler.GetAllSmsRoutings)
	smppRoutings.Get("/filter-options", smsRoutingHandler.GetSmsRoutingFilterOptions)
	smppRoutings.Get("/:id", smsRoutingHandler.GetSmsRoutingByID)
	smppRoutings.Put("/:id", smsRoutingHandler.UpdateSmsRouting)
	smppRoutings.Delete("/:id", smsRoutingHandler.DeleteSmsRouting)

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

	// Serve static files for assets (CSS, JS, images, etc.)
	app.Static("/assets", "./static/assets")
	app.Static("/vite.svg", "./static/vite.svg")

	// Catch-all route for React Router - must be last
	app.Get("*", func(c *fiber.Ctx) error {
		return c.SendFile("./static/index.html")
	})
}
