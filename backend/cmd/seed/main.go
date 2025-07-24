package main

import (
	"log"

	"tsimsocketserver/auth"
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

	// Run seeds
	if err := runSeeds(); err != nil {
		log.Fatalf("Failed to run seeds: %v", err)
	}

	log.Println("Database seeding completed successfully")
}

func runSeeds() error {
	db := database.GetDB()

	// Check if users already exist
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("Users already exist, skipping user seeding")
	} else {
		// Create sample users
		userData := []struct {
			username string
			email    string
			role     string
		}{
			{"admin", "admin@example.com", "admin"},
			{"manager1", "manager1@example.com", "manager"},
			{"operator1", "operator1@example.com", "operator"},
			{"manager2", "manager2@example.com", "manager"},
			{"operator2", "operator2@example.com", "operator"},
		}

		for _, userInfo := range userData {
			hashedPassword, err := auth.HashPassword("password")
			if err != nil {
				return err
			}

			user := models.User{
				Username: userInfo.username,
				Email:    userInfo.email,
				Password: hashedPassword,
				Role:     userInfo.role,
				IsActive: true,
			}

			if err := db.Create(&user).Error; err != nil {
				return err
			}
		}
		log.Println("Sample users created successfully")
	}

	// Check if sitenames already exist
	var sitenameCount int64
	db.Model(&models.Sitename{}).Count(&sitenameCount)
	if sitenameCount > 0 {
		log.Println("Sitenames already exist, skipping sitename seeding")
	} else {
		// Get user IDs for sitenames
		var manager1, manager2, operator1, operator2 models.User
		db.Where("username = ?", "manager1").First(&manager1)
		db.Where("username = ?", "manager2").First(&manager2)
		db.Where("username = ?", "operator1").First(&operator1)
		db.Where("username = ?", "operator2").First(&operator2)

		// Create sample sitenames
		sitenames := []models.Sitename{
			{
				Name:         "Site A - Downtown",
				ManagerUser:  manager1.ID,
				OperatorUser: operator1.ID,
			},
			{
				Name:         "Site B - Industrial Zone",
				ManagerUser:  manager2.ID,
				OperatorUser: operator2.ID,
			},
			{
				Name:         "Site C - Residential Area",
				ManagerUser:  manager1.ID,
				OperatorUser: operator1.ID,
			},
			{
				Name:         "Site D - Shopping Center",
				ManagerUser:  manager2.ID,
				OperatorUser: operator2.ID,
			},
		}

		for _, sitename := range sitenames {
			if err := db.Create(&sitename).Error; err != nil {
				return err
			}
		}
		log.Println("Sample sitenames created successfully")
	}

	return nil
}
