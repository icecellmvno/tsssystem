package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/types"
	"tsimsocketserver/websocket"
	"tsimsocketserver/websocket_handlers"

	amqp "github.com/rabbitmq/amqp091-go"
)

// SmppSubmitSMMessage represents the SMPP submit_sm message structure from RabbitMQ
type SmppSubmitSMMessage struct {
	MessageID            string                 `json:"message_id"`
	SystemID             string                 `json:"system_id"`
	SourceAddr           string                 `json:"source_addr"`
	DestinationAddr      string                 `json:"destination_addr"`
	ShortMessage         string                 `json:"short_message"`
	DataCoding           uint8                  `json:"data_coding"`
	ESMClass             uint8                  `json:"esm_class"`
	RegisteredDelivery   uint8                  `json:"registered_delivery"`
	PriorityFlag         uint8                  `json:"priority_flag"`
	ServiceType          string                 `json:"service_type"`
	ProtocolID           uint8                  `json:"protocol_id"`
	ScheduleDeliveryTime string                 `json:"schedule_delivery_time"`
	ValidityPeriod       string                 `json:"validity_period"`
	ReplaceIfPresentFlag uint8                  `json:"replace_if_present_flag"`
	SMDefaultMsgID       uint8                  `json:"sm_default_msg_id"`
	OptionalParameters   map[string]interface{} `json:"optional_parameters"`
	Concatenation        *ConcatenationInfo     `json:"concatenation,omitempty"`
}

// ConcatenationInfo represents concatenation information
type ConcatenationInfo struct {
	ReferenceNumber uint16 `json:"reference_number"`
	TotalSegments   uint8  `json:"total_segments"`
	SequenceNumber  uint8  `json:"sequence_number"`
}

// SmsRouter handles routing SMS messages from SMPP to active Android devices
type SmsRouter struct {
	rabbitMQ *RabbitMQHandler
	wsServer *websocket.WebSocketServer
}

// NewSmsRouter creates a new SMS router
func NewSmsRouter(rabbitMQ *RabbitMQHandler, wsServer *websocket.WebSocketServer) *SmsRouter {
	return &SmsRouter{
		rabbitMQ: rabbitMQ,
		wsServer: wsServer,
	}
}

// StartRouting starts consuming SMPP messages and routing them to devices
func (sr *SmsRouter) StartRouting(queueName string) error {
	log.Printf("Starting SMS router for queue: %s", queueName)

	return sr.rabbitMQ.ConsumeQueue(queueName, func(message []byte) error {
		return sr.processSmppMessage(message)
	})
}

// processSmppMessage processes SMPP messages from RabbitMQ
func (sr *SmsRouter) processSmppMessage(message []byte) error {
	var smppMsg SmppSubmitSMMessage
	if err := json.Unmarshal(message, &smppMsg); err != nil {
		log.Printf("Error unmarshaling SMPP message: %v", err)
		return err
	}

	log.Printf("Processing SMPP message: %s from %s to %s (SystemID: %s)", smppMsg.MessageID, smppMsg.SourceAddr, smppMsg.DestinationAddr, smppMsg.SystemID)

	// Log SMPP message processing to alarm log with routing info
	sr.logSmppMessageProcessing(smppMsg, "Processing SMPP message")

	// Find all matching SMS routing rules
	var routings []models.SmsRouting
	if err := database.GetDB().Where("is_active = ? AND source_type = ? AND direction = ?", true, "smpp", "outbound").
		Preload("DeviceGroupConfigs.DeviceGroup").
		Order("priority DESC").
		Find(&routings).Error; err != nil {
		log.Printf("Error fetching SMS routing rules: %v", err)
		sr.createSmsRoutingFailureAlarm(smppMsg, "Error fetching routing rules")
		return sr.sendUndeliveredReport(smppMsg, "Error fetching routing rules")
	}

	if len(routings) == 0 {
		log.Printf("No active SMS routing found for SMPP outbound messages")
		sr.createSmsRoutingFailureAlarm(smppMsg, "No active routing rule found")
		return sr.sendUndeliveredReport(smppMsg, "No active routing rule found")
	}

	// Find the best matching routing rule
	var routing *models.SmsRouting
	for _, r := range routings {
		// Check if system_id matches (if specified in routing)
		if r.SystemID != nil && *r.SystemID != "" && *r.SystemID != "*" && *r.SystemID != smppMsg.SystemID {
			log.Printf("System ID mismatch for routing %s: expects %s, got %s", r.Name, *r.SystemID, smppMsg.SystemID)
			continue // Try next routing rule
		}

		// Check destination address pattern (if specified in routing)
		if r.DestinationAddress != nil && *r.DestinationAddress != "" && *r.DestinationAddress != "*" {
			// Enhanced pattern matching with wildcard support
			if !sr.matchesDestinationPattern(*r.DestinationAddress, smppMsg.DestinationAddr) {
				log.Printf("Destination address mismatch for routing %s: expects %s, got %s", r.Name, *r.DestinationAddress, smppMsg.DestinationAddr)
				continue // Try next routing rule
			}
		}

		// Found matching routing rule
		routing = &r
		log.Printf("Found matching routing rule: %s (ID: %d, SystemID: %s)", routing.Name, routing.ID, func() string {
			if routing.SystemID != nil {
				return *routing.SystemID
			}
			return "not set"
		}())
		break
	}

	if routing == nil {
		log.Printf("No matching routing rule found for SMPP message (SystemID: %s, Destination: %s)", smppMsg.SystemID, smppMsg.DestinationAddr)

		// Log to alarm log
		sr.logSmppMessageProcessing(smppMsg, fmt.Sprintf("No matching routing rule found for SystemID: %s, Destination: %s", smppMsg.SystemID, smppMsg.DestinationAddr))

		sr.createSmsRoutingFailureAlarm(smppMsg, fmt.Sprintf("No matching routing rule found for SystemID: %s, Destination: %s", smppMsg.SystemID, smppMsg.DestinationAddr))
		return sr.sendUndeliveredReport(smppMsg, "No matching routing rule found")
	}

	// Get connected devices
	connectedDevices := sr.wsServer.GetConnectedDevices()
	if len(connectedDevices) == 0 {
		log.Printf("No connected devices available")

		// Log to alarm log
		sr.logSmppMessageProcessing(smppMsg, "No connected devices available")

		sr.createSmsRoutingFailureAlarm(smppMsg, "No connected devices available")
		return sr.sendUndeliveredReport(smppMsg, "No connected devices available")
	}

	log.Printf("Found %d connected devices total", len(connectedDevices))

	// Get all available devices for this routing
	availableDevices := sr.getAllAvailableDevicesForRouting(*routing, connectedDevices, smppMsg)
	if len(availableDevices) == 0 {
		deviceGroups := sr.getDeviceGroupNames(*routing)
		log.Printf("No suitable devices found for routing rule '%s' (Device Groups: %s)", routing.Name, deviceGroups)

		// Log detailed failure to alarm log
		sr.logSmppMessageProcessing(smppMsg, fmt.Sprintf("No suitable devices found for routing rule '%s' (Device Groups: %s)", routing.Name, deviceGroups))

		sr.createSmsRoutingFailureAlarm(smppMsg, fmt.Sprintf("No suitable devices found for routing rule '%s' (Device Groups: %s)", routing.Name, deviceGroups))
		return sr.sendUndeliveredReport(smppMsg, "No suitable devices found")
	}

	log.Printf("Found %d available devices for routing", len(availableDevices))

	// Try to send SMS to devices until one succeeds
	var lastError error
	for i, device := range availableDevices {
		simSlot := sr.selectSimSlot(device, *routing)

		// Create SMS data
		smsData := models.SendSmsData{
			PhoneNumber: smppMsg.DestinationAddr,
			Message:     smppMsg.ShortMessage,
			SimSlot:     simSlot,
			Priority:    sr.convertPriority(smppMsg.PriorityFlag),
			MessageID:   smppMsg.MessageID, // SMPP message ID for delivery report tracking
		}

		log.Printf("Attempting to send SMS to device %s (SIM slot %d) - Attempt %d/%d",
			device.DeviceID, simSlot, i+1, len(availableDevices))

		// Send SMS via WebSocket
		if err := sr.wsServer.SendSms(device.DeviceID, smsData); err != nil {
			lastError = err
			log.Printf("Failed to send SMS to device %s: %v", device.DeviceID, err)

			// Create SMS log entry for failed attempt
			if err := sr.createSmsLogForSmpp(smppMsg, "failed", fmt.Sprintf("Device %s failed: %v", device.DeviceID, err), device.DeviceID); err != nil {
				log.Printf("Failed to create SMS log for failed attempt: %v", err)
			}

			// Send delivery report for failed attempt if delivery report was requested
			if smppMsg.RegisteredDelivery == 1 {
				if err := sr.sendDeliveryReportForFailedAttempt(smppMsg, fmt.Sprintf("Device %s failed: %v", device.DeviceID, err)); err != nil {
					log.Printf("Failed to send delivery report for failed attempt: %v", err)
				}
			}

			// Create SMS failure alarm
			sr.createSmsFailureAlarm(smppMsg, device.DeviceID, fmt.Sprintf("Device %s failed: %v", device.DeviceID, err))

			// Continue to next device
			continue
		}

		// Success! Create SMS log entry for successful delivery
		// Note: Status is "sent" initially, will be updated to "delivered" when delivery report comes
		if err := sr.createSmsLogForSmpp(smppMsg, "sent", "", device.DeviceID); err != nil {
			log.Printf("Failed to create SMS log for successful delivery: %v", err)
		}

		// Log successful SMS delivery to alarm log
		sr.logSmppMessageProcessing(smppMsg, fmt.Sprintf("SMS delivered successfully to device %s (SIM slot %d, attempt %d)", device.DeviceID, simSlot, i+1))

		log.Printf("SMPP message processed successfully: %s (sent to device %s, SIM slot %d, attempt %d)",
			smppMsg.MessageID, device.DeviceID, simSlot, i+1)
		return nil
	}

	// All devices failed
	log.Printf("Failed to send SMS to any device after trying %d devices", len(availableDevices))
	sr.createSmsRoutingFailureAlarm(smppMsg, fmt.Sprintf("All devices failed after trying %d devices. Last error: %v", len(availableDevices), lastError))
	return sr.sendUndeliveredReport(smppMsg, fmt.Sprintf("All devices failed. Last error: %v", lastError))
}

// getAllAvailableDevicesForRouting gets all available devices for routing, ordered by priority and strategy
func (sr *SmsRouter) getAllAvailableDevicesForRouting(routing models.SmsRouting, _ []*models.DeviceConnection, _ SmppSubmitSMMessage) []*models.DeviceConnection {
	var allDevices []*models.DeviceConnection

	// Process device group configurations in priority order
	for _, config := range routing.DeviceGroupConfigs {
		if config.DeviceGroup == nil {
			continue
		}

		// Get devices from database for this device group
		var dbDevices []models.Device
		if err := database.GetDB().Where("device_group = ? AND is_active = ? AND is_online = ?", config.DeviceGroup.DeviceGroup, true, true).Find(&dbDevices).Error; err != nil {
			log.Printf("Error fetching devices for group %s: %v", config.DeviceGroup.DeviceGroup, err)
			continue
		}

		if len(dbDevices) == 0 {
			log.Printf("No devices found in database for device group: %s (active and online)", config.DeviceGroup.DeviceGroup)
			continue
		}

		// Convert database devices to DeviceConnection format
		var groupDevices []*models.DeviceConnection
		for _, dbDevice := range dbDevices {
			deviceConn := &models.DeviceConnection{
				DeviceID:       dbDevice.IMEI,
				DeviceGroup:    dbDevice.DeviceGroup,
				CountrySite:    dbDevice.CountrySite,
				ConnectionType: "android",
				IsHandicap:     false,
			}
			groupDevices = append(groupDevices, deviceConn)
		}

		// Order devices based on strategy
		orderedDevices := sr.orderDevicesByStrategy(groupDevices, config, config.DeviceGroup.DeviceGroup)
		allDevices = append(allDevices, orderedDevices...)

		onlineCount := sr.countOnlineDevices(orderedDevices)
		log.Printf("Added %d devices from database for group %s (priority: %d, online: %d)",
			len(orderedDevices), config.DeviceGroup.DeviceGroup, config.Priority, onlineCount)
	}

	// If no device group configs, use legacy device_group_ids
	if len(routing.DeviceGroupConfigs) == 0 && routing.DeviceGroupIDs != nil && *routing.DeviceGroupIDs != "" {
		var deviceGroupIDs []uint
		if err := json.Unmarshal([]byte(*routing.DeviceGroupIDs), &deviceGroupIDs); err != nil {
			log.Printf("Error parsing device group IDs: %v", err)
			return allDevices
		}

		// Get device group names from IDs
		var deviceGroupNames []string
		for _, groupID := range deviceGroupIDs {
			var deviceGroup models.DeviceGroup
			if err := database.GetDB().First(&deviceGroup, groupID).Error; err == nil {
				deviceGroupNames = append(deviceGroupNames, deviceGroup.DeviceGroup)
			}
		}

		// Get devices from database for these device groups
		var dbDevices []models.Device
		if err := database.GetDB().Where("device_group IN ? AND is_active = ? AND is_online = ?", deviceGroupNames, true, true).Find(&dbDevices).Error; err != nil {
			log.Printf("Error fetching devices for legacy device groups: %v", err)
			return allDevices
		}

		log.Printf("Found %d devices in legacy device groups: %s", len(dbDevices), strings.Join(deviceGroupNames, ", "))

		// Convert database devices to DeviceConnection format
		for _, dbDevice := range dbDevices {
			deviceConn := &models.DeviceConnection{
				DeviceID:       dbDevice.IMEI,
				DeviceGroup:    dbDevice.DeviceGroup,
				CountrySite:    dbDevice.CountrySite,
				ConnectionType: "android",
				IsHandicap:     false,
			}
			allDevices = append(allDevices, deviceConn)
		}
	}

	return allDevices
}

// orderDevicesByStrategy orders devices based on the specified strategy
func (sr *SmsRouter) orderDevicesByStrategy(devices []*models.DeviceConnection, config models.DeviceGroupConfig, deviceGroup string) []*models.DeviceConnection {
	switch config.DeviceSelectionStrategy {
	case "round_robin":
		return sr.orderDevicesRoundRobin(devices, deviceGroup)
	case "least_used":
		return sr.orderDevicesLeastUsed(devices)
	case "random":
		return sr.orderDevicesRandom(devices)
	case "specific":
		return sr.orderDevicesSpecific(devices, config)
	default:
		return sr.orderDevicesRoundRobin(devices, deviceGroup)
	}
}

// orderDevicesRoundRobin orders devices using round-robin strategy
func (sr *SmsRouter) orderDevicesRoundRobin(devices []*models.DeviceConnection, deviceGroup string) []*models.DeviceConnection {
	if len(devices) == 0 {
		return devices
	}

	// Get last used device index from Redis
	lastIndex := 0
	if sr.rabbitMQ.redisService != nil {
		if index, err := sr.rabbitMQ.redisService.GetLastDeviceIndex(deviceGroup); err == nil {
			lastIndex = index
		}
	}

	// Reorder devices starting from next index
	orderedDevices := make([]*models.DeviceConnection, len(devices))
	for i := range devices {
		index := (lastIndex + 1 + i) % len(devices)
		orderedDevices[i] = devices[index]
	}

	// Update last used index in Redis
	if sr.rabbitMQ.redisService != nil {
		sr.rabbitMQ.redisService.SetLastDeviceIndex(deviceGroup, (lastIndex+1)%len(devices))
	}

	return orderedDevices
}

// orderDevicesLeastUsed orders devices with least SMS usage first
func (sr *SmsRouter) orderDevicesLeastUsed(devices []*models.DeviceConnection) []*models.DeviceConnection {
	// For now, return devices as-is (can be enhanced with actual SMS usage tracking)
	// TODO: Implement SMS usage tracking and ordering
	return devices
}

// orderDevicesRandom orders devices randomly
func (sr *SmsRouter) orderDevicesRandom(devices []*models.DeviceConnection) []*models.DeviceConnection {
	if len(devices) == 0 {
		return devices
	}

	// Create a copy and shuffle
	orderedDevices := make([]*models.DeviceConnection, len(devices))
	copy(orderedDevices, devices)

	// Simple random shuffle
	rand.Seed(time.Now().UnixNano())
	for i := len(orderedDevices) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		orderedDevices[i], orderedDevices[j] = orderedDevices[j], orderedDevices[i]
	}

	return orderedDevices
}

// orderDevicesSpecific orders specific devices first, then others
func (sr *SmsRouter) orderDevicesSpecific(devices []*models.DeviceConnection, config models.DeviceGroupConfig) []*models.DeviceConnection {
	if config.TargetDeviceIDs == nil {
		return devices
	}

	var targetDeviceIDs []string
	if err := json.Unmarshal([]byte(*config.TargetDeviceIDs), &targetDeviceIDs); err != nil {
		log.Printf("Error parsing target device IDs: %v", err)
		return devices
	}

	var specificDevices []*models.DeviceConnection
	var otherDevices []*models.DeviceConnection

	for _, device := range devices {
		isSpecific := false
		for _, targetID := range targetDeviceIDs {
			if device.DeviceID == targetID {
				specificDevices = append(specificDevices, device)
				isSpecific = true
				break
			}
		}
		if !isSpecific {
			otherDevices = append(otherDevices, device)
		}
	}

	// Return specific devices first, then others
	return append(specificDevices, otherDevices...)
}

// selectSimSlot selects the appropriate SIM slot for the device
func (sr *SmsRouter) selectSimSlot(device *models.DeviceConnection, routing models.SmsRouting) int {
	// Use device group config if available
	for _, config := range routing.DeviceGroupConfigs {
		if config.DeviceGroup != nil && device.DeviceGroup == config.DeviceGroup.DeviceGroup {
			return config.SimSlotPreference
		}
	}

	// Fallback to routing-level preference
	if routing.SimSlotPreference != nil {
		return *routing.SimSlotPreference
	}

	// Default to SIM slot 1
	return 1
}

// sendDeliveryReportForFailedAttempt sends delivery report for failed SMS attempts
func (sr *SmsRouter) sendDeliveryReportForFailedAttempt(smppMsg SmppSubmitSMMessage, reason string) error {
	deliveryReport := &types.DeliveryReportMessage{
		MessageID:       smppMsg.MessageID,
		SystemID:        smppMsg.SystemID,
		SourceAddr:      smppMsg.DestinationAddr,
		DestinationAddr: smppMsg.SourceAddr,
		MessageState:    4, // UNDELIVERABLE
		ErrorCode:       0,
		FinalDate:       time.Now().Format("20060102150405"),
		SubmitDate:      time.Now().Format("20060102150405"),
		DoneDate:        time.Now().Format("20060102150405"),
		Delivered:       false,
		Failed:          true,
		FailureReason:   reason,
	}

	// Publish delivery report to RabbitMQ
	if err := sr.publishDeliveryReport(deliveryReport); err != nil {
		log.Printf("Error publishing failed attempt delivery report: %v", err)
		return err
	}

	log.Printf("Sent failed attempt delivery report for message %s: %s", smppMsg.MessageID, reason)
	return nil
}

// Helper function to send undelivered report
func (sr *SmsRouter) sendUndeliveredReport(smppMsg SmppSubmitSMMessage, reason string) error {
	// Create SMS log entry for failed delivery
	if err := sr.createSmsLogForSmpp(smppMsg, "failed", reason, ""); err != nil {
		log.Printf("Error creating SMS log for undelivered message: %v", err)
	}

	// Only send delivery report if it was requested
	if smppMsg.RegisteredDelivery == 1 {
		deliveryReport := &types.DeliveryReportMessage{
			MessageID:       smppMsg.MessageID,
			SystemID:        smppMsg.SystemID,
			SourceAddr:      smppMsg.SourceAddr,      // SMPP client adresi (mesajın geldiği yer)
			DestinationAddr: smppMsg.DestinationAddr, // Hedef numara (mesajın gideceği yer)
			MessageState:    4,                       // UNDELIVERABLE
			ErrorCode:       0,
			FinalDate:       time.Now().Format("20060102150405"),
			SubmitDate:      time.Now().Format("20060102150405"),
			DoneDate:        time.Now().Format("20060102150405"),
			Delivered:       false,
			Failed:          true,
			FailureReason:   reason,
		}

		// Publish delivery report to RabbitMQ
		if err := sr.publishDeliveryReport(deliveryReport); err != nil {
			log.Printf("Error publishing undelivered delivery report: %v", err)
			return err
		}

		log.Printf("Sent undelivered delivery report for message %s: %s", smppMsg.MessageID, reason)
	}

	return nil
}

// publishDeliveryReport publishes delivery report to RabbitMQ
func (sr *SmsRouter) publishDeliveryReport(report *types.DeliveryReportMessage) error {
	// Convert message to JSON
	body, err := json.Marshal(report)
	if err != nil {
		return err
	}

	// Publish to delivery report queue
	err = sr.rabbitMQ.channel.Publish(
		"tsimcloudrouter", // exchange
		"delivery_report", // routing key
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)
	if err != nil {
		log.Printf("Failed to publish delivery report: %v", err)
		return err
	}

	return nil
}

// createSmsLogForSmpp creates an SMS log entry for SMPP messages
func (sr *SmsRouter) createSmsLogForSmpp(smppMsg SmppSubmitSMMessage, status, errorMsg string, deviceID string) error {
	// Get device information from the successful device (if available)
	var deviceInfo *models.Device
	var simCardInfo *models.SimCardRecord

	// Try to find the specific device that was used for sending this SMS
	if deviceID != "" {
		if err := database.GetDB().Where("imei = ? AND is_active = ? AND is_online = ?", deviceID, true, true).First(&deviceInfo).Error; err == nil {
			// Get SIM card information for this device
			var simCards []models.SimCardRecord
			if err := database.GetDB().Where("device_id = ?", deviceInfo.ID).Find(&simCards).Error; err == nil && len(simCards) > 0 {
				simCardInfo = &simCards[0]
			}
		}
	}

	// If no specific device found, try to find any available device
	if deviceInfo == nil {
		var devices []models.Device
		if err := database.GetDB().Where("is_active = ? AND is_online = ?", true, true).Find(&devices).Error; err == nil {
			if len(devices) > 0 {
				deviceInfo = &devices[0]

				// Get SIM card information for this device
				var simCards []models.SimCardRecord
				if err := database.GetDB().Where("device_id = ?", deviceInfo.ID).Find(&simCards).Error; err == nil && len(simCards) > 0 {
					simCardInfo = &simCards[0]
				}
			}
		}
	}

	smsLog := models.SmsLog{
		MessageID:               smppMsg.MessageID,
		SourceAddr:              &smppMsg.SourceAddr,
		SourceConnector:         func() *string { s := "smpp"; return &s }(),
		SourceUser:              &smppMsg.SystemID,
		DestinationAddr:         &smppMsg.DestinationAddr,
		Message:                 &smppMsg.ShortMessage,
		MessageLength:           len(smppMsg.ShortMessage),
		Direction:               "outbound",
		Priority:                sr.convertPriority(smppMsg.PriorityFlag),
		Status:                  status,
		DeliveryReportRequested: smppMsg.RegisteredDelivery == 1,
		QueuedAt:                func() *time.Time { now := time.Now(); return &now }(),
		Metadata:                sr.createMetadata(smppMsg),
	}

	// Add device information if available
	if deviceInfo != nil {
		smsLog.DeviceID = &deviceInfo.IMEI
		smsLog.DeviceName = &deviceInfo.Name
		smsLog.DeviceIMEI = &deviceInfo.IMEI
		smsLog.DeviceGroup = &deviceInfo.DeviceGroup
		smsLog.CountrySite = &deviceInfo.CountrySite

		// Get device group ID
		var deviceGroup models.DeviceGroup
		if err := database.GetDB().Where("device_group = ?", deviceInfo.DeviceGroup).First(&deviceGroup).Error; err == nil {
			smsLog.DeviceGroupID = &deviceGroup.ID
		}

		// Get country site ID
		var countrySite models.CountrySite
		if err := database.GetDB().Where("country_site = ?", deviceInfo.CountrySite).First(&countrySite).Error; err == nil {
			smsLog.CountrySiteID = &countrySite.ID
		}
	}

	// Add SIM card information if available
	if simCardInfo != nil {
		smsLog.SimSlot = &simCardInfo.SlotIndex
		smsLog.SimcardName = &simCardInfo.DisplayName
		smsLog.SimcardNumber = &simCardInfo.Number
		smsLog.SimcardICCID = &simCardInfo.ICCID
		smsLog.DeviceIMSI = &simCardInfo.IMSI
	}

	if errorMsg != "" {
		smsLog.ErrorMessage = &errorMsg
	}

	return database.GetDB().Create(&smsLog).Error
}

// matchesDestinationPattern checks if destination address matches the pattern
func (sr *SmsRouter) matchesDestinationPattern(pattern, address string) bool {
	// If pattern is "*", it matches everything
	if pattern == "*" {
		return true
	}

	// If pattern ends with "*", check if address starts with the pattern (excluding "*")
	if len(pattern) > 1 && pattern[len(pattern)-1] == '*' {
		prefix := pattern[:len(pattern)-1]
		return len(address) >= len(prefix) && address[:len(prefix)] == prefix
	}

	// If pattern starts with "*", check if address ends with the pattern (excluding "*")
	if len(pattern) > 1 && pattern[0] == '*' {
		suffix := pattern[1:]
		return len(address) >= len(suffix) && address[len(address)-len(suffix):] == suffix
	}

	// If pattern contains "*" in the middle, split and check both parts
	if strings.Contains(pattern, "*") {
		parts := strings.Split(pattern, "*")
		if len(parts) == 2 {
			prefix := parts[0]
			suffix := parts[1]
			return len(address) >= len(prefix)+len(suffix) &&
				address[:len(prefix)] == prefix &&
				address[len(address)-len(suffix):] == suffix
		}
	}

	// Exact match
	return pattern == address
}

// convertPriority converts SMPP priority flag to string priority
func (sr *SmsRouter) convertPriority(priorityFlag uint8) string {
	switch priorityFlag {
	case 0:
		return "normal"
	case 1:
		return "high"
	case 2:
		return "urgent"
	default:
		return "normal"
	}
}

// createMetadata creates metadata JSON for SMPP message
func (sr *SmsRouter) createMetadata(smppMsg SmppSubmitSMMessage) *string {
	metadata := map[string]interface{}{
		"system_id":           smppMsg.SystemID,
		"data_coding":         smppMsg.DataCoding,
		"esm_class":           smppMsg.ESMClass,
		"registered_delivery": smppMsg.RegisteredDelivery,
		"priority_flag":       smppMsg.PriorityFlag,
		"service_type":        smppMsg.ServiceType,
		"protocol_id":         smppMsg.ProtocolID,
		"replace_if_present":  smppMsg.ReplaceIfPresentFlag,
		"sm_default_msg_id":   smppMsg.SMDefaultMsgID,
		"optional_parameters": smppMsg.OptionalParameters,
	}

	if smppMsg.Concatenation != nil {
		metadata["concatenation"] = smppMsg.Concatenation
	}

	metadataJSON, _ := json.Marshal(metadata)
	metadataStr := string(metadataJSON)
	return &metadataStr
}

// createSmsFailureAlarm creates an alarm when SMS sending fails
func (sr *SmsRouter) createSmsFailureAlarm(smppMsg SmppSubmitSMMessage, deviceID string, errorMsg string) {
	alarmData := models.AlarmData{
		AlarmType:   "sms_send_failed",
		Message:     fmt.Sprintf("SMS sending failed for device %s: %s", deviceID, errorMsg),
		Severity:    "error",
		DeviceGroup: "SMS_Router",
		CountrySite: "System",
	}

	// Log alarm to database
	websocket_handlers.LogAlarmToDatabase(deviceID, alarmData)

	// Broadcast alarm to frontend
	sr.wsServer.BroadcastMessage(models.WebSocketMessage{
		Type: "alarm",
		Data: map[string]interface{}{
			"device_id":    deviceID,
			"alarm_type":   alarmData.AlarmType,
			"message":      alarmData.Message,
			"severity":     alarmData.Severity,
			"device_group": alarmData.DeviceGroup,
			"country_site": alarmData.CountrySite,
		},
		Timestamp: time.Now().UnixMilli(),
	})

	log.Printf("SMS failure alarm created for device %s: %s", deviceID, errorMsg)
}

// createSmsRoutingFailureAlarm creates an alarm when SMS routing fails completely
func (sr *SmsRouter) createSmsRoutingFailureAlarm(smppMsg SmppSubmitSMMessage, reason string) {
	alarmData := models.AlarmData{
		AlarmType:   "sms_routing_failed",
		Message:     fmt.Sprintf("SMS routing failed: %s. Message: %s to %s", reason, smppMsg.MessageID, smppMsg.DestinationAddr),
		Severity:    "critical",
		DeviceGroup: "SMS_Router",
		CountrySite: "System",
	}

	// Log alarm to database (using a system device ID)
	websocket_handlers.LogAlarmToDatabase("SMS_Router_System", alarmData)

	// Broadcast alarm to frontend
	sr.wsServer.BroadcastMessage(models.WebSocketMessage{
		Type: "alarm",
		Data: map[string]interface{}{
			"device_id":    "SMS_Router_System",
			"alarm_type":   alarmData.AlarmType,
			"message":      alarmData.Message,
			"severity":     alarmData.Severity,
			"device_group": alarmData.DeviceGroup,
			"country_site": alarmData.CountrySite,
		},
		Timestamp: time.Now().UnixMilli(),
	})

	log.Printf("SMS routing failure alarm created: %s", reason)
}

// getDeviceGroupNames returns a comma-separated list of device group names for a routing rule
func (sr *SmsRouter) getDeviceGroupNames(routing models.SmsRouting) string {
	var groupNames []string

	// Get device group names from DeviceGroupConfigs
	for _, config := range routing.DeviceGroupConfigs {
		if config.DeviceGroup != nil {
			groupNames = append(groupNames, config.DeviceGroup.DeviceGroup)
		}
	}

	// If no DeviceGroupConfigs, try legacy device_group_ids
	if len(groupNames) == 0 && routing.DeviceGroupIDs != nil && *routing.DeviceGroupIDs != "" {
		var deviceGroupIDs []uint
		if err := json.Unmarshal([]byte(*routing.DeviceGroupIDs), &deviceGroupIDs); err == nil {
			for _, groupID := range deviceGroupIDs {
				var deviceGroup models.DeviceGroup
				if err := database.GetDB().First(&deviceGroup, groupID).Error; err == nil {
					groupNames = append(groupNames, deviceGroup.DeviceGroup)
				}
			}
		}
	}

	if len(groupNames) == 0 {
		return "none"
	}

	return strings.Join(groupNames, ", ")
}

// logSmppMessageProcessing logs SMPP message processing to alarm log
func (sr *SmsRouter) logSmppMessageProcessing(smppMsg SmppSubmitSMMessage, message string) {
	// Get routing info for better context
	var routingInfo string
	var routing models.SmsRouting
	if err := database.GetDB().Where("is_active = ? AND source_type = ? AND direction = ?", true, "smpp", "outbound").
		Preload("DeviceGroupConfigs.DeviceGroup").
		Order("priority DESC").
		First(&routing).Error; err == nil {
		deviceGroups := sr.getDeviceGroupNames(routing)
		routingInfo = fmt.Sprintf(" (Routing: %s, Device Groups: %s)", routing.Name, deviceGroups)
	} else {
		routingInfo = " (No routing rule found)"
	}

	alarmData := models.AlarmData{
		AlarmType:   "smpp_message_processing",
		Message:     fmt.Sprintf("%s: %s from %s to %s (SystemID: %s)%s", message, smppMsg.MessageID, smppMsg.SourceAddr, smppMsg.DestinationAddr, smppMsg.SystemID, routingInfo),
		Severity:    "info",
		DeviceGroup: "SMS_Router",
		CountrySite: "System",
	}

	// Log alarm to database
	websocket_handlers.LogAlarmToDatabase("SMS_Router_System", alarmData)

	// Broadcast alarm to frontend
	sr.wsServer.BroadcastMessage(models.WebSocketMessage{
		Type: "alarm",
		Data: map[string]interface{}{
			"device_id":    "SMS_Router_System",
			"alarm_type":   alarmData.AlarmType,
			"message":      alarmData.Message,
			"severity":     alarmData.Severity,
			"device_group": alarmData.DeviceGroup,
			"country_site": alarmData.CountrySite,
		},
		Timestamp: time.Now().UnixMilli(),
	})
}

// isDeviceOnline checks if a device is currently online (connected via WebSocket)
func (sr *SmsRouter) isDeviceOnline(deviceID string, connectedDevices []*models.DeviceConnection) bool {
	for _, device := range connectedDevices {
		if device.DeviceID == deviceID {
			return true
		}
	}
	return false
}

// countOnlineDevices counts how many devices in the list are online
func (sr *SmsRouter) countOnlineDevices(devices []*models.DeviceConnection) int {
	count := 0
	for _, device := range devices {
		// Check if device is online by looking in connected devices
		if sr.isDeviceOnline(device.DeviceID, sr.wsServer.GetConnectedDevices()) {
			count++
		}
	}
	return count
}
