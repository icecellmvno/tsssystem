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
	log.Println("Starting database migration...")

	err := database.GetDB().AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.CountrySite{},
		&models.DeviceGroup{},
		&models.Device{},
		&models.DeviceSimCard{},
		&models.SmsLog{},
		&models.AlarmLog{},
		&models.SmppUser{},
		&models.BlacklistNumber{},
		&models.Filter{},
		&models.ScheduleTask{},
		&models.ScheduleTaskExecution{},
		&models.UssdLog{},
		&models.SimCardRecord{},
		&models.MccMnc{},
		// SMS routing models
		&models.SmsRouting{},
		&models.SmsRoutingDeviceGroup{},
		&models.DeviceGroupConfig{},
		// Anti-detection models
		&models.SmppUserAntiDetectionConfig{},
		&models.SmppUserSimPoolConfig{},
		&models.SmppUserDelayConfig{},
	)

	if err != nil {
		log.Printf("Migration failed: %v", err)
		return err
	}

	log.Println("Database migration completed successfully")
	return nil
}
