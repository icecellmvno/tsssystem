package handlers

import (
	"log"
	"time"
	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/utils"
	"tsimsocketserver/websocket"

	"tsimsocketserver/auth"

	"github.com/gofiber/fiber/v2"
)

type DeviceHandler struct {
	wsServer *websocket.WebSocketServer
}

func NewDeviceHandler(wsServer *websocket.WebSocketServer) *DeviceHandler {
	return &DeviceHandler{
		wsServer: wsServer,
	}
}

// GetConnectedDevices returns all connected devices
func (h *DeviceHandler) GetConnectedDevices(c *fiber.Ctx) error {
	devices := h.wsServer.GetConnectedDevices()
	return c.JSON(fiber.Map{
		"success": true,
		"data":    devices,
	})
}

// GetAllDevices returns all devices from database
func (h *DeviceHandler) GetAllDevices(c *fiber.Ctx) error {
	var devices []models.Device

	// Get query parameters
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 15)
	search := c.Query("search")
	countrySite := c.Query("country_site")
	deviceGroup := c.Query("device_group")
	status := c.Query("status")
	online := c.Query("online")
	maintenance := c.Query("maintenance")
	imeis := c.Query("imeis") // Get imeis parameter

	// Build query
	query := database.GetDB()

	// Apply filters
	if search != "" {
		query = query.Where("name LIKE ? OR imei LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if countrySite != "" && countrySite != "all" {
		query = query.Where("country_site = ?", countrySite)
	}
	if deviceGroup != "" && deviceGroup != "all" {
		query = query.Where("device_group = ?", deviceGroup)
	}
	if status != "" && status != "all" {
		switch status {
		case "ready":
			query = query.Where("is_active = ? AND is_online = ? AND maintenance_mode = ?", true, true, false)
		case "alarm":
			query = query.Where("is_active = ? AND maintenance_mode = ?", false, false)
		case "maintenance":
			query = query.Where("maintenance_mode = ?", true)
		case "inactive":
			query = query.Where("is_active = ?", false)
		case "offline":
			query = query.Where("is_online = ?", false)
		}
	}
	if online != "" && online != "all" {
		if online == "online" {
			query = query.Where("is_online = ?", true)
		} else {
			query = query.Where("is_online = ?", false)
		}
	}
	if maintenance != "" && maintenance != "all" {
		if maintenance == "maintenance" {
			query = query.Where("maintenance_mode = ?", true)
		} else if maintenance == "not_maintenance" {
			query = query.Where("maintenance_mode = ?", false)
		}
	}

	// Apply IMEI filter if provided
	if imeis != "" {
		// Split comma-separated IMEIs or handle single IMEI
		imeiList := []string{}
		if imeis != "" {
			// Handle both comma-separated and multiple imeis parameters
			// Get all imeis parameters from query string
			args := c.Context().QueryArgs()
			if args.Has("imeis") {
				// Multiple imeis parameters (like ?imeis=123&imeis=456)
				args.VisitAll(func(key, value []byte) {
					if string(key) == "imeis" {
						imeiList = append(imeiList, string(value))
					}
				})
			} else {
				// Single imeis parameter with comma separation
				imeiList = []string{imeis}
			}
		}

		if len(imeiList) > 0 {
			query = query.Where("imei IN ?", imeiList)
		}
	}

	// Get total count
	var total int64
	query.Model(&models.Device{}).Count(&total)

	// Apply pagination
	offset := (page - 1) * limit
	query = query.Offset(offset).Limit(limit)

	// Execute query
	if err := query.Find(&devices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    devices,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

// SendSms sends SMS to a device
func (h *DeviceHandler) SendSms(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		SimSlot     int    `json:"sim_slot"`
		PhoneNumber string `json:"phone_number"`
		Message     string `json:"message"`
		Priority    string `json:"priority"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Get device information by IMEI (device_id parameter is actually IMEI)
	var device models.Device
	if err := database.GetDB().Where("imei = ?", imei).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Get SIM card information for the specified slot
	var deviceSimCard models.DeviceSimCard
	var simcardName, simcardNumber, simcardICCID, deviceIMSI *string

	if err := database.GetDB().Where("device_imei = ? AND slot_index = ?", imei, request.SimSlot).First(&deviceSimCard).Error; err == nil {
		simcardName = &deviceSimCard.CarrierName
		simcardNumber = &deviceSimCard.PhoneNumber
		simcardICCID = &deviceSimCard.ICCID
		deviceIMSI = &deviceSimCard.IMSI
	}

	// Generate unique message ID
	messageID := utils.GenerateMessageID()

	// Get authenticated user from context
	user := c.Locals("user").(*auth.Claims)
	username := user.Username

	// Create SMS log entry
	smsLog := models.SmsLog{
		MessageID:               messageID,
		DeviceID:                &imei,
		DeviceName:              &device.Name,
		DeviceIMEI:              &device.IMEI,
		DeviceIMSI:              deviceIMSI,
		SimcardName:             simcardName,
		SimSlot:                 &request.SimSlot,
		SimcardNumber:           simcardNumber,
		SimcardICCID:            simcardICCID,
		SourceAddr:              simcardNumber,                                 // Use SIM card phone number as source
		SourceConnector:         func() *string { s := "manual"; return &s }(), // Manual from device show
		SourceUser:              &username,                                     // Username who sent the SMS
		DestinationAddr:         &request.PhoneNumber,
		Message:                 &request.Message,
		MessageLength:           len(request.Message),
		Direction:               "outbound",
		Priority:                request.Priority,
		Status:                  "pending",
		DeviceGroupID:           &device.DeviceGroupID,
		DeviceGroup:             &device.DeviceGroup,
		CountrySiteID:           &device.CountrySiteID,
		CountrySite:             &device.CountrySite,
		DeliveryReportRequested: true,
	}

	// If source address is empty, set it to "Panel"
	if smsLog.SourceAddr == nil || *smsLog.SourceAddr == "" {
		panelSource := "Panel"
		smsLog.SourceAddr = &panelSource
	}

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create SMS log",
		})
	}

	data := models.SendSmsData{
		SimSlot:     request.SimSlot,
		PhoneNumber: request.PhoneNumber,
		Message:     request.Message,
		Priority:    request.Priority,
		MessageID:   messageID,
	}

	if err := h.wsServer.SendSms(imei, data); err != nil {
		// Update SMS log status to failed
		database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": "Failed to send SMS via WebSocket",
		})

		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send SMS",
		})
	}

	return c.JSON(fiber.Map{
		"success":    true,
		"message":    "SMS sent successfully",
		"message_id": messageID,
	})
}

// SendUssd sends USSD command to a device
func (h *DeviceHandler) SendUssd(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		SimSlot   int    `json:"sim_slot"`
		UssdCode  string `json:"ussd_code"`
		SessionID string `json:"session_id,omitempty"`
		Delay     int    `json:"delay"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.SendUssdData{
		SimSlot:   request.SimSlot,
		UssdCode:  request.UssdCode,
		SessionID: request.SessionID,
		Delay:     request.Delay,
	}

	if err := h.wsServer.SendUssd(imei, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send USSD command",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "USSD command sent successfully",
	})
}

// FindDevice sends find device command
func (h *DeviceHandler) FindDevice(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		Message string `json:"message"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.FindDeviceData{
		Message: request.Message,
	}

	if err := h.wsServer.FindDevice(imei, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send find device command",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Find device command sent successfully",
	})
}

// StartAlarm sends alarm start command
func (h *DeviceHandler) StartAlarm(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		AlarmType string `json:"alarm_type"`
		Message   string `json:"message"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	data := models.AlarmStartData{
		AlarmType: request.AlarmType,
		Message:   request.Message,
	}

	if err := h.wsServer.StartAlarm(imei, data); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to start alarm",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Alarm started successfully",
	})
}

// StopAlarm sends alarm stop command
func (h *DeviceHandler) StopAlarm(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	if err := h.wsServer.StopAlarm(imei); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to stop alarm",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Alarm stopped successfully",
	})
}

// UpdateDeviceName updates device name
func (h *DeviceHandler) UpdateDeviceName(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		Name string `json:"name"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if request.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device name is required",
		})
	}

	// Update device name in database
	if err := database.GetDB().Model(&models.Device{}).Where("imei = ?", imei).Update("name", request.Name).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update device name",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device name updated successfully",
	})
}

// GetDeviceByID returns a specific device by IMEI with SIM card information
func (h *DeviceHandler) GetDeviceByID(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var device models.Device
	if err := database.GetDB().Where("imei = ?", imei).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Get SIM card information for this device
	var deviceSimCards []models.DeviceSimCard
	if err := database.GetDB().Where("device_imei = ?", imei).Order("slot_index ASC").Find(&deviceSimCards).Error; err != nil {
		// Log error but don't fail the request
		log.Printf("Error fetching SIM cards for device %s: %v", imei, err)
	}

	// Create response with device and SIM card information
	response := fiber.Map{
		"id":                     device.ID,
		"imei":                   device.IMEI,
		"name":                   device.Name,
		"device_group_id":        device.DeviceGroupID,
		"device_group":           device.DeviceGroup,
		"country_site_id":        device.CountrySiteID,
		"country_site":           device.CountrySite,
		"device_type":            device.DeviceType,
		"manufacturer":           device.Manufacturer,
		"model":                  device.Model,
		"android_version":        device.AndroidVersion,
		"battery_level":          device.BatteryLevel,
		"battery_status":         device.BatteryStatus,
		"signal_strength":        device.SignalStrength,
		"signal_dbm":             device.SignalDBM,
		"network_type":           device.NetworkType,
		"latitude":               device.Latitude,
		"longitude":              device.Longitude,
		"is_active":              device.IsActive,
		"is_online":              device.IsOnline,
		"maintenance_mode":       device.MaintenanceMode,
		"maintenance_reason":     device.MaintenanceReason,
		"maintenance_started_at": device.MaintenanceStartedAt,
		"last_seen":              device.LastSeen,
		"created_at":             device.CreatedAt,
		"updated_at":             device.UpdatedAt,
		"sim_cards":              deviceSimCards,
	}

	return c.JSON(response)
}

// ToggleDevice toggles device active status
func (h *DeviceHandler) ToggleDevice(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		Action string `json:"action"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	// Get device information by IMEI (device_id parameter is actually IMEI)
	var device models.Device
	if err := database.GetDB().Where("imei = ?", imei).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device status
	var isActive bool
	switch request.Action {
	case "ENABLE":
		isActive = true
	case "DISABLE":
		isActive = false
	default:
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid action. Must be 'ENABLE' or 'DISABLE'",
		})
	}

	if err := database.GetDB().Model(&device).Update("is_active", isActive).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update device status",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device status updated successfully",
		"data": fiber.Map{
			"device_id": imei,
			"is_active": isActive,
		},
	})
}

// ExitMaintenanceMode exits maintenance mode for a device
func (h *DeviceHandler) ExitMaintenanceMode(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	// Get device information by IMEI (device_id parameter is actually IMEI)
	var device models.Device
	if err := database.GetDB().Where("imei = ?", imei).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device to exit maintenance mode
	updates := map[string]interface{}{
		"maintenance_mode":       false,
		"maintenance_reason":     "",
		"maintenance_started_at": nil,
		"is_active":              true, // Re-enable device when exiting maintenance
	}

	if err := database.GetDB().Model(&device).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to exit maintenance mode",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device exited maintenance mode successfully",
		"data": fiber.Map{
			"device_id":        imei,
			"maintenance_mode": false,
			"is_active":        true,
		},
	})
}

// EnterMaintenanceMode enters maintenance mode for a device
func (h *DeviceHandler) EnterMaintenanceMode(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	var request struct {
		Reason string `json:"reason"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if request.Reason == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Maintenance reason is required",
		})
	}

	// Get device information by IMEI (device_id parameter is actually IMEI)
	var device models.Device
	if err := database.GetDB().Where("imei = ?", imei).First(&device).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"message": "Device not found",
		})
	}

	// Update device to enter maintenance mode
	now := time.Now()
	updates := map[string]interface{}{
		"maintenance_mode":       true,
		"maintenance_reason":     request.Reason,
		"maintenance_started_at": &now,
		"is_active":              false, // Disable device when entering maintenance
	}

	if err := database.GetDB().Model(&device).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to enter maintenance mode",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device entered maintenance mode successfully",
		"data": fiber.Map{
			"device_id":          imei,
			"maintenance_mode":   true,
			"maintenance_reason": request.Reason,
			"is_active":          false,
		},
	})
}

// DeleteDevice deletes a device
func (h *DeviceHandler) DeleteDevice(c *fiber.Ctx) error {
	imei := c.Params("imei")
	if imei == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Device IMEI is required",
		})
	}

	// Delete device from database
	if err := database.GetDB().Where("imei = ?", imei).Delete(&models.Device{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to delete device",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Device deleted successfully",
	})
}

// GetDeviceStats returns device statistics
func (h *DeviceHandler) GetDeviceStats(c *fiber.Ctx) error {
	var total, active, inactive, online, offline, maintenance, ready, alarm int64

	// Get total devices
	database.GetDB().Model(&models.Device{}).Count(&total)

	// Get active devices
	database.GetDB().Model(&models.Device{}).Where("is_active = ?", true).Count(&active)

	// Get inactive devices
	database.GetDB().Model(&models.Device{}).Where("is_active = ?", false).Count(&inactive)

	// Get online devices
	database.GetDB().Model(&models.Device{}).Where("is_online = ?", true).Count(&online)

	// Get offline devices
	database.GetDB().Model(&models.Device{}).Where("is_online = ?", false).Count(&offline)

	// Get devices in maintenance
	database.GetDB().Model(&models.Device{}).Where("maintenance_mode = ?", true).Count(&maintenance)

	// Get ready devices (active, online, not in maintenance, no alarms)
	database.GetDB().Model(&models.Device{}).
		Where("is_active = ? AND is_online = ? AND maintenance_mode = ?", true, true, false).
		Count(&ready)

	// Get devices with alarms (simplified - you might want to join with alarm_logs table)
	database.GetDB().Model(&models.Device{}).
		Where("is_active = ?", false).
		Where("maintenance_mode = ?", false).
		Count(&alarm)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"total":       total,
			"active":      active,
			"inactive":    inactive,
			"online":      online,
			"offline":     offline,
			"maintenance": maintenance,
			"ready":       ready,
			"alarm":       alarm,
		},
	})
}

// DeleteDevices deletes multiple devices by IMEI
func (h *DeviceHandler) DeleteDevices(c *fiber.Ctx) error {
	// Get IMEIs from query parameters
	args := c.Context().QueryArgs()
	var imeiList []string

	// Check if imeis parameter exists
	if args.Has("imeis") {
		// Multiple imeis parameters (like ?imeis=123&imeis=456)
		args.VisitAll(func(key, value []byte) {
			if string(key) == "imeis" {
				imeiList = append(imeiList, string(value))
			}
		})
	}

	// If no IMEIs found in query parameters, try to parse from JSON body
	if len(imeiList) == 0 {
		var request struct {
			Imeis []string `json:"imeis"`
		}

		if err := c.BodyParser(&request); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body or missing imeis parameter",
			})
		}

		imeiList = request.Imeis
	}

	if len(imeiList) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "No devices to delete",
		})
	}

	// Delete devices
	if err := database.GetDB().Where("imei IN ?", imeiList).Delete(&models.Device{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to delete devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Devices deleted successfully",
	})
}

// ToggleDeviceActive toggles active status for multiple devices
func (h *DeviceHandler) ToggleDeviceActive(c *fiber.Ctx) error {
	var request struct {
		Imeis  []string `json:"imeis"`
		Active bool     `json:"active"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if len(request.Imeis) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "No devices to update",
		})
	}

	// Update devices
	if err := database.GetDB().Model(&models.Device{}).
		Where("imei IN ?", request.Imeis).
		Update("is_active", request.Active).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Devices updated successfully",
	})
}

// EnterMaintenanceModeBulk puts multiple devices into maintenance mode
func (h *DeviceHandler) EnterMaintenanceModeBulk(c *fiber.Ctx) error {
	var request struct {
		Imeis  []string `json:"imeis"`
		Reason string   `json:"reason"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if len(request.Imeis) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "No devices to update",
		})
	}

	// Update devices
	now := time.Now()
	updates := map[string]interface{}{
		"maintenance_mode":       true,
		"maintenance_reason":     request.Reason,
		"maintenance_started_at": &now,
		"is_active":              false,
	}

	if err := database.GetDB().Model(&models.Device{}).
		Where("imei IN ?", request.Imeis).
		Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Devices put into maintenance mode",
	})
}

// ExitMaintenanceModeBulk takes multiple devices out of maintenance mode
func (h *DeviceHandler) ExitMaintenanceModeBulk(c *fiber.Ctx) error {
	var request struct {
		Imeis []string `json:"imeis"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if len(request.Imeis) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"message": "No devices to update",
		})
	}

	// Update devices
	updates := map[string]interface{}{
		"maintenance_mode":       false,
		"maintenance_reason":     "",
		"maintenance_started_at": nil,
		"is_active":              true,
	}

	if err := database.GetDB().Model(&models.Device{}).
		Where("imei IN ?", request.Imeis).
		Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Devices exited maintenance mode",
	})
}

// GetActiveDevices returns all active devices
func (h *DeviceHandler) GetActiveDevices(c *fiber.Ctx) error {
	var devices []models.Device

	// Get active devices (not in maintenance mode and is_active = true)
	if err := database.GetDB().Where("is_active = ? AND maintenance_mode = ?", true, false).Find(&devices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch active devices",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    devices,
	})
}
