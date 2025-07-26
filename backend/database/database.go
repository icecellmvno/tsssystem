package database

import (
	"log"

	"tsimsocketserver/config"

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

	log.Println("Database connected successfully")

	return nil
}

func GetDB() *gorm.DB {
	return DB
}
