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

	log.Printf("Processing SMPP message: %s from %s to %s", smppMsg.MessageID, smppMsg.SourceAddr, smppMsg.DestinationAddr)

	// Find matching SMS routing rule
	var routing models.SmsRouting
	if err := database.GetDB().Where("is_active = ? AND source_type = ? AND direction = ?", true, "smpp", "outbound").
		Preload("DeviceGroupConfigs.DeviceGroup").
		Order("priority DESC").
		First(&routing).Error; err != nil {
		log.Printf("No active SMS routing found for SMPP outbound messages")
		return sr.sendUndeliveredReport(smppMsg, "No active routing rule found")
	}

	// Check if system_id matches (if specified in routing)
	if routing.SystemID != nil && *routing.SystemID != "" && *routing.SystemID != smppMsg.SystemID {
		log.Printf("System ID mismatch: routing expects %s, got %s", *routing.SystemID, smppMsg.SystemID)
		return sr.sendUndeliveredReport(smppMsg, "System ID mismatch")
	}

	// Check destination address pattern (if specified in routing)
	if routing.DestinationAddress != nil && *routing.DestinationAddress != "" && *routing.DestinationAddress != "*" {
		// Enhanced pattern matching with wildcard support
		if !sr.matchesDestinationPattern(*routing.DestinationAddress, smppMsg.DestinationAddr) {
			log.Printf("Destination address mismatch: routing expects %s, got %s", *routing.DestinationAddress, smppMsg.DestinationAddr)
			return sr.sendUndeliveredReport(smppMsg, "Destination address mismatch")
		}
	}

	log.Printf("Found matching routing rule: %s (ID: %d)", routing.Name, routing.ID)

	// Get connected devices
	connectedDevices := sr.wsServer.GetConnectedDevices()
	if len(connectedDevices) == 0 {
		log.Printf("No connected devices available")
		return sr.sendUndeliveredReport(smppMsg, "No connected devices available")
	}

	// Get all available devices for this routing
	availableDevices := sr.getAllAvailableDevicesForRouting(routing, connectedDevices, smppMsg)
	if len(availableDevices) == 0 {
		log.Printf("No suitable devices found for routing")
		return sr.sendUndeliveredReport(smppMsg, "No suitable devices found")
	}

	log.Printf("Found %d available devices for routing", len(availableDevices))

	// Try to send SMS to devices until one succeeds
	var lastError error
	for i, device := range availableDevices {
		simSlot := sr.selectSimSlot(device, routing)

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
			if err := sr.createSmsLogForSmpp(smppMsg, "failed", fmt.Sprintf("Device %s failed: %v", device.DeviceID, err)); err != nil {
				log.Printf("Failed to create SMS log for failed attempt: %v", err)
			}

			// Send delivery report for failed attempt if delivery report was requested
			if smppMsg.RegisteredDelivery == 1 {
				if err := sr.sendDeliveryReportForFailedAttempt(smppMsg, fmt.Sprintf("Device %s failed: %v", device.DeviceID, err)); err != nil {
					log.Printf("Failed to send delivery report for failed attempt: %v", err)
				}
			}

			// Continue to next device
			continue
		}

		// Success! Create SMS log entry for successful delivery
		// Note: Status is "sent" initially, will be updated to "delivered" when delivery report comes
		if err := sr.createSmsLogForSmpp(smppMsg, "sent", ""); err != nil {
			log.Printf("Failed to create SMS log for successful delivery: %v", err)
		}

		log.Printf("SMPP message processed successfully: %s (sent to device %s, SIM slot %d, attempt %d)",
			smppMsg.MessageID, device.DeviceID, simSlot, i+1)
		return nil
	}

	// All devices failed
	log.Printf("Failed to send SMS to any device after trying %d devices", len(availableDevices))
	return sr.sendUndeliveredReport(smppMsg, fmt.Sprintf("All devices failed. Last error: %v", lastError))
}

// getAllAvailableDevicesForRouting gets all available devices for routing, ordered by priority and strategy
func (sr *SmsRouter) getAllAvailableDevicesForRouting(routing models.SmsRouting, connectedDevices []*models.DeviceConnection, smppMsg SmppSubmitSMMessage) []*models.DeviceConnection {
	var allDevices []*models.DeviceConnection

	// Process device group configurations in priority order
	for _, config := range routing.DeviceGroupConfigs {
		if config.DeviceGroup == nil {
			continue
		}

		// Filter devices by device group
		var groupDevices []*models.DeviceConnection
		for _, device := range connectedDevices {
			if device.DeviceGroup == config.DeviceGroup.DeviceGroup {
				groupDevices = append(groupDevices, device)
			}
		}

		if len(groupDevices) == 0 {
			log.Printf("No connected devices found in device group: %s", config.DeviceGroup.DeviceGroup)
			continue
		}

		// Order devices based on strategy
		orderedDevices := sr.orderDevicesByStrategy(groupDevices, config, config.DeviceGroup.DeviceGroup)
		allDevices = append(allDevices, orderedDevices...)

		log.Printf("Added %d devices from group %s (priority: %d)",
			len(orderedDevices), config.DeviceGroup.DeviceGroup, config.Priority)
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

		// Filter devices by device groups
		for _, device := range connectedDevices {
			for _, groupName := range deviceGroupNames {
				if device.DeviceGroup == groupName {
					allDevices = append(allDevices, device)
					break
				}
			}
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
	if err := sr.createSmsLogForSmpp(smppMsg, "failed", reason); err != nil {
		log.Printf("Error creating SMS log for undelivered message: %v", err)
	}

	// Only send delivery report if it was requested
	if smppMsg.RegisteredDelivery == 1 {
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
func (sr *SmsRouter) createSmsLogForSmpp(smppMsg SmppSubmitSMMessage, status, errorMsg string) error {
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
