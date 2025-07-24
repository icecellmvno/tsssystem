package main

import (
	"log"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/rabbitmq"
	"tsimsocketserver/routes"
	"tsimsocketserver/websocket"

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

	// Initialize WebSocket server
	wsServer := websocket.NewWebSocketServer(cfg)

	// Initialize SMS consumer
	smsConsumer := rabbitmq.NewSmsConsumer(rabbitMQHandler, wsServer)

	// Start consuming SMS messages from default queue
	if err := smsConsumer.StartConsuming("sms_queue"); err != nil {
		log.Printf("Warning: Failed to start SMS consumer: %v", err)
	} else {
		log.Println("SMS consumer started successfully")
	}

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
	routes.SetupRoutes(app, cfg, wsServer)

	// Start server
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
