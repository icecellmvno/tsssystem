package main

import (
	"log"
	"time"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/rabbitmq"
	"tsimsocketserver/redis"
	"tsimsocketserver/routes"
	"tsimsocketserver/services"
	"tsimsocketserver/websocket"
	"tsimsocketserver/websocket_handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	if err := database.InitializeDatabase(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize Casbin
	if err := auth.InitializeCasbin(); err != nil {
		log.Fatalf("Failed to initialize Casbin: %v", err)
	}

	// Log RabbitMQ configuration
	log.Printf("RabbitMQ URL: %s", cfg.RabbitMQ.URL)

	// Initialize RabbitMQ
	rabbitMQHandler := rabbitmq.NewRabbitMQHandler()
	if err := rabbitMQHandler.Connect(cfg.RabbitMQ.URL); err != nil {
		log.Printf("Warning: Failed to connect to RabbitMQ: %v", err)
	} else {
		log.Println("Successfully connected to RabbitMQ")
	}

	// Initialize Redis service
	redisService, err := redis.NewRedisService(cfg.Redis.URL)
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v", err)
	} else {
		log.Println("Successfully connected to Redis")
		// Set Redis service for RabbitMQ handler
		rabbitMQHandler.SetRedisService(redisService)
	}

	// Initialize WebSocket server
	wsServer := websocket.NewWebSocketServer(cfg)

	// Initialize delivery report service
	deliveryReportPublisher := rabbitmq.NewDeliveryReportPublisher(rabbitMQHandler)
	deliveryReportService := services.NewDeliveryReportService(deliveryReportPublisher.PublishDeliveryReport)
	websocket_handlers.SetDeliveryReportService(deliveryReportService)

	// Initialize SMS monitoring service
	smsMonitoringService := services.NewSmsMonitoringService()
	// Configure with values from config (use defaults if not set)
	monitoringWindow := cfg.SmsMonitoring.MonitoringWindow
	if monitoringWindow == 0 {
		monitoringWindow = 10
	}
	minSmsForCheck := cfg.SmsMonitoring.MinSmsForCheck
	if minSmsForCheck == 0 {
		minSmsForCheck = 5
	}
	maintenanceThreshold := cfg.SmsMonitoring.MaintenanceThreshold
	if maintenanceThreshold == 0 {
		maintenanceThreshold = 5
	}
	smsMonitoringService.SetConfiguration(monitoringWindow, minSmsForCheck, maintenanceThreshold)
	websocket_handlers.SetSmsMonitoringService(smsMonitoringService)

	// Initialize SMS consumer for regular SMS messages
	smsConsumer := rabbitmq.NewSmsConsumer(rabbitMQHandler, wsServer)

	// Start consuming SMS messages from default queue
	if err := smsConsumer.StartConsuming("sms_queue"); err != nil {
		log.Printf("Warning: Failed to start SMS consumer: %v", err)
	} else {
		log.Println("SMS consumer started successfully")
	}

	// Initialize SMS router for SMPP messages
	smsRouter := rabbitmq.NewSmsRouter(rabbitMQHandler, wsServer)

	// Start routing SMPP messages from tsimcloudrouter queue
	if err := smsRouter.StartRouting("tsimcloudrouter"); err != nil {
		log.Printf("Warning: Failed to start SMS router: %v", err)
	} else {
		log.Println("SMS router started successfully")
	}

	// Start SMS limit reset cron job
	go startSmsLimitResetCron()

	// Start SMS monitoring cron job
	checkInterval := cfg.SmsMonitoring.CheckIntervalMinutes
	if checkInterval == 0 {
		checkInterval = 15 // Default to 15 minutes
	}
	go startSmsMonitoringCron(smsMonitoringService, checkInterval)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE",
	}))

	// Setup routes
	routes.SetupRoutes(app, cfg, wsServer, redisService)

	// Start server
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// startSmsLimitResetCron starts the cron job for SMS limit reset
func startSmsLimitResetCron() {
	smsLimitService := services.NewSmsLimitService()
	ticker := time.NewTicker(1 * time.Hour) // Check every hour
	defer ticker.Stop()

	log.Println("SMS limit reset cron job started")

	for {
		select {
		case <-ticker.C:
			if err := smsLimitService.CheckAndResetDailyLimits(); err != nil {
				log.Printf("Error in SMS limit reset cron job: %v", err)
			} else {
				log.Println("SMS limit reset cron job executed successfully")
			}
		}
	}
}

// startSmsMonitoringCron starts the cron job for SMS delivery monitoring
func startSmsMonitoringCron(smsMonitoringService *services.SmsMonitoringService, intervalMinutes int) {
	ticker := time.NewTicker(time.Duration(intervalMinutes) * time.Minute)
	defer ticker.Stop()

	log.Printf("SMS monitoring cron job started (checking every %d minutes)", intervalMinutes)

	for {
		select {
		case <-ticker.C:
			if err := smsMonitoringService.MonitorAllDevices(); err != nil {
				log.Printf("Error in SMS monitoring cron job: %v", err)
			} else {
				log.Println("SMS monitoring cron job executed successfully")
			}
		}
	}
}
