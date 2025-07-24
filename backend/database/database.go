package database

import (
	"log"

	"tsimsocketserver/config"
	"tsimsocketserver/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitializeDatabase(cfg *config.Config) error {
	var err error

	DB, err = gorm.Open(mysql.Open(cfg.GetDatabaseDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return err
	}

	// Auto-migrate database tables
	if err := autoMigrate(DB); err != nil {
		return err
	}

	log.Println("Database connected successfully")

	return nil
}

func GetDB() *gorm.DB {
	return DB
}

// autoMigrate automatically migrates all models to create/update database tables
func autoMigrate(db *gorm.DB) error {
	log.Println("Starting database migration...")

	// Add all models here for auto-migration
	err := db.AutoMigrate(
		&models.User{},
		&models.Sitename{},
		&models.DeviceGroup{},
		&models.Device{},
		&models.AlarmLog{},
		&models.SmppUser{},
		&models.BlacklistNumber{},
		&models.SmsLog{},
	)

	if err != nil {
		log.Printf("Migration failed: %v", err)
		return err
	}

	log.Println("Database migration completed successfully")
	return nil
}
