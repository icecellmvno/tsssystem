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

	// Create permissions first
	var permissionCount int64
	db.Model(&models.Permission{}).Count(&permissionCount)
	if permissionCount > 0 {
		log.Println("Permissions already exist, skipping permission seeding")
	} else {
		// Create sample permissions
		permissions := []models.Permission{
			{Name: "users.read", Description: stringPtr("View users")},
			{Name: "users.create", Description: stringPtr("Create users")},
			{Name: "users.update", Description: stringPtr("Update users")},
			{Name: "users.delete", Description: stringPtr("Delete users")},
			{Name: "roles.read", Description: stringPtr("View roles")},
			{Name: "roles.create", Description: stringPtr("Create roles")},
			{Name: "roles.update", Description: stringPtr("Update roles")},
			{Name: "roles.delete", Description: stringPtr("Delete roles")},
			{Name: "permissions.read", Description: stringPtr("View permissions")},
			{Name: "permissions.create", Description: stringPtr("Create permissions")},
			{Name: "permissions.update", Description: stringPtr("Update permissions")},
			{Name: "permissions.delete", Description: stringPtr("Delete permissions")},
			{Name: "devices.read", Description: stringPtr("View devices")},
			{Name: "devices.control", Description: stringPtr("Control devices")},
			{Name: "sms.send", Description: stringPtr("Send SMS")},
			{Name: "alarms.view", Description: stringPtr("View alarms")},
			{Name: "reports.view", Description: stringPtr("View reports")},
		}

		for _, permission := range permissions {
			if err := db.Create(&permission).Error; err != nil {
				return err
			}
		}
		log.Println("Sample permissions created successfully")
	}

	// Create roles
	var roleCount int64
	db.Model(&models.Role{}).Count(&roleCount)
	if roleCount > 0 {
		log.Println("Roles already exist, skipping role seeding")
	} else {
		// Get all permissions
		var permissions []models.Permission
		if err := db.Find(&permissions).Error; err != nil {
			return err
		}

		// Create admin role with all permissions
		adminRole := models.Role{
			Name:        "admin",
			Description: stringPtr("Administrator with full access"),
		}
		if err := db.Create(&adminRole).Error; err != nil {
			return err
		}
		if err := db.Model(&adminRole).Association("Permissions").Append(permissions); err != nil {
			return err
		}

		// Create manager role with limited permissions
		managerPermissions := []models.Permission{}
		for _, perm := range permissions {
			if perm.Name == "users.read" || perm.Name == "devices.read" ||
				perm.Name == "devices.control" || perm.Name == "sms.send" ||
				perm.Name == "alarms.view" || perm.Name == "reports.view" {
				managerPermissions = append(managerPermissions, perm)
			}
		}

		managerRole := models.Role{
			Name:        "manager",
			Description: stringPtr("Manager with device and reporting access"),
		}
		if err := db.Create(&managerRole).Error; err != nil {
			return err
		}
		if err := db.Model(&managerRole).Association("Permissions").Append(managerPermissions); err != nil {
			return err
		}

		// Create operator role with basic permissions
		operatorPermissions := []models.Permission{}
		for _, perm := range permissions {
			if perm.Name == "devices.read" || perm.Name == "devices.control" ||
				perm.Name == "sms.send" || perm.Name == "alarms.view" {
				operatorPermissions = append(operatorPermissions, perm)
			}
		}

		operatorRole := models.Role{
			Name:        "operator",
			Description: stringPtr("Operator with device control access"),
		}
		if err := db.Create(&operatorRole).Error; err != nil {
			return err
		}
		if err := db.Model(&operatorRole).Association("Permissions").Append(operatorPermissions); err != nil {
			return err
		}

		// Create user role with minimal permissions
		userPermissions := []models.Permission{}
		for _, perm := range permissions {
			if perm.Name == "devices.read" || perm.Name == "alarms.view" {
				userPermissions = append(userPermissions, perm)
			}
		}

		userRole := models.Role{
			Name:        "user",
			Description: stringPtr("Basic user with read access"),
		}
		if err := db.Create(&userRole).Error; err != nil {
			return err
		}
		if err := db.Model(&userRole).Association("Permissions").Append(userPermissions); err != nil {
			return err
		}

		log.Println("Sample roles created successfully")
	}

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

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}
