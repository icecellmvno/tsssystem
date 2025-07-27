package main

import (
	"encoding/json"
	"log"
	"os"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
)

type MccMncData struct {
	Mcc         string `json:"mcc"`
	Mnc         string `json:"mnc"`
	Iso         string `json:"iso"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	Network     string `json:"network"`
}

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
		// Create system permissions
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
		log.Println("System permissions created successfully")
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

		log.Println("System roles created successfully")
	}

	// Create admin user
	var adminUserCount int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&adminUserCount)
	if adminUserCount > 0 {
		log.Println("Admin user already exists, skipping admin user creation")
	} else {
		// Create admin user
		hashedPassword, err := auth.HashPassword("admin123")
		if err != nil {
			return err
		}

		adminUser := models.User{
			Username:  "admin",
			Firstname: "Administrator",
			Lastname:  "User",
			Email:     "admin@tsimsocket.com",
			Password:  hashedPassword,
			Role:      "admin",
			IsActive:  true,
		}

		if err := db.Create(&adminUser).Error; err != nil {
			return err
		}
		log.Println("Admin user created successfully (username: admin, password: admin123)")
	}

	// Seed MCC-MNC data
	if err := seedMccMnc(); err != nil {
		return err
	}

	return nil
}

func seedMccMnc() error {
	db := database.GetDB()

	// Check if MCC-MNC data already exists
	var mccMncCount int64
	db.Model(&models.MccMnc{}).Count(&mccMncCount)
	if mccMncCount > 0 {
		log.Printf("MCC-MNC data already exists (%d records), skipping MCC-MNC seeding", mccMncCount)
		return nil
	}

	// Read JSON file
	jsonFile, err := os.ReadFile("tools/mcc-mnc-table.json")
	if err != nil {
		log.Printf("Warning: MCC-MNC JSON file not found at tools/mcc-mnc-table.json: %v", err)
		log.Println("Skipping MCC-MNC seeding - file not available")
		return nil
	}

	// Parse JSON data
	var mccMncData []MccMncData
	if err := json.Unmarshal(jsonFile, &mccMncData); err != nil {
		return err
	}

	log.Printf("Found %d MCC-MNC records to seed", len(mccMncData))

	// Convert and insert data in batches
	batchSize := 1000
	totalRecords := len(mccMncData)

	for i := 0; i < totalRecords; i += batchSize {
		end := i + batchSize
		if end > totalRecords {
			end = totalRecords
		}

		batch := mccMncData[i:end]
		var mccMncBatch []models.MccMnc

		for _, data := range batch {
			// Normalize data
			mccMnc := models.MccMnc{
				Mcc:         normalizeString(data.Mcc, 10),
				Mnc:         normalizeString(data.Mnc, 10),
				Iso:         normalizeString(data.Iso, 10),
				Country:     normalizeString(data.Country, 100),
				CountryCode: normalizeString(data.CountryCode, 10),
				Network:     normalizeString(data.Network, 200),
			}
			mccMncBatch = append(mccMncBatch, mccMnc)
		}

		// Insert batch
		if err := db.CreateInBatches(mccMncBatch, len(mccMncBatch)).Error; err != nil {
			log.Printf("Error inserting batch %d-%d: %v", i+1, end, err)
			return err
		}

		log.Printf("Inserted batch %d-%d of %d records", i+1, end, totalRecords)
	}

	log.Printf("Successfully seeded %d MCC-MNC records", totalRecords)
	return nil
}

// normalizeString ensures the string fits within the specified max length
func normalizeString(s string, maxLen int) string {
	if len(s) > maxLen {
		return s[:maxLen]
	}
	return s
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}
