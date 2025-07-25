package main

import (
	"log"

	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
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

	// Run migrations
	if err := runMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database migration completed successfully")
}

func runMigrations() error {
	return database.GetDB().AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.Sitename{},
		&models.DeviceGroup{},
		&models.Device{},
		&models.DeviceSimCard{},
		&models.AlarmLog{},
		&models.SmppUser{},
		&models.SmsLog{},
		&models.Filter{},
	)
}
