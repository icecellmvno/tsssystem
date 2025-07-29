package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/types"
	"tsimsocketserver/utils"
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

	// Get routing configuration for this system_id
	routing, err := sr.getRoutingConfiguration(smppMsg.SystemID)
	if err != nil {
		log.Printf("Error getting routing configuration for system_id %s: %v", smppMsg.SystemID, err)
		return sr.sendUndeliveredReport(smppMsg, "No routing configuration found")
	}

	// Check if destination address matches routing pattern
	if !sr.matchesDestinationPattern(smppMsg.DestinationAddr, routing) {
		log.Printf("Destination address %s does not match routing pattern for system_id %s", smppMsg.DestinationAddr, smppMsg.SystemID)
		return sr.sendUndeliveredReport(smppMsg, "Destination address does not match routing pattern")
	}

	// Find target device groups based on SMPP system_id
	targetDeviceGroups, err := sr.findTargetDeviceGroups(smppMsg.SystemID)
	if err != nil {
		log.Printf("Error finding target device groups for system_id %s: %v", smppMsg.SystemID, err)
		return err
	}

	if len(targetDeviceGroups) == 0 {
		log.Printf("No target device groups found for system_id: %s", smppMsg.SystemID)
		return sr.sendUndeliveredReport(smppMsg, "No target device groups found")
	}

	// Find active Android devices in target device groups
	activeDevices, err := sr.findActiveAndroidDevicesInGroups(targetDeviceGroups)
	if err != nil {
		log.Printf("Error finding active devices in target groups: %v", err)
		return err
	}

	if len(activeDevices) == 0 {
		log.Printf("No active Android devices found in target device groups")
		return sr.sendUndeliveredReport(smppMsg, "No active devices in target groups")
	}

	// Get routing configuration for this system_id (already retrieved above)
	if routing.ID == 0 {
		log.Printf("No routing configuration found for system_id %s", smppMsg.SystemID)
		return sr.sendUndeliveredReport(smppMsg, "No routing configuration found")
	}

	// Select devices based on strategy
	selectedDevices, err := sr.selectDevicesByStrategy(activeDevices, routing)
	if err != nil {
		log.Printf("Error selecting devices: %v", err)
		return sr.sendUndeliveredReport(smppMsg, "Failed to select devices")
	}

	if len(selectedDevices) == 0 {
		log.Printf("No devices selected for system_id: %s", smppMsg.SystemID)
		return sr.sendUndeliveredReport(smppMsg, "No devices selected")
	}

	// Route message to selected devices
	successCount := 0
	for _, device := range selectedDevices {
		if err := sr.routeMessageToDevice(device, smppMsg, routing); err != nil {
			log.Printf("Error routing message to device %s: %v", device.IMEI, err)
		} else {
			successCount++
		}
	}

	log.Printf("Successfully routed SMPP message to %d/%d selected devices using strategy: %s",
		successCount, len(selectedDevices), routing.DeviceSelectionStrategy)
	return nil
}

// selectDevicesByStrategy selects devices based on the routing strategy
func (sr *SmsRouter) selectDevicesByStrategy(activeDevices []models.Device, routing models.SmsRouting) ([]models.Device, error) {
	if len(activeDevices) == 0 {
		return nil, fmt.Errorf("no active devices available")
	}

	// Get device group configurations for this routing rule
	deviceGroupConfigs, err := sr.getDeviceGroupConfigs(routing.ID)
	if err != nil {
		log.Printf("Error getting device group configs: %v", err)
		// Fallback to default strategy
		return sr.selectDevicesByDefaultStrategy(activeDevices, routing)
	}

	// If no device group configs, use default strategy
	if len(deviceGroupConfigs) == 0 {
		return sr.selectDevicesByDefaultStrategy(activeDevices, routing)
	}

	// Use the highest priority device group config
	config := deviceGroupConfigs[0]

	maxDevices := config.MaxDevicesPerMessage
	if maxDevices == 0 {
		maxDevices = 1
	}

	switch config.DeviceSelectionStrategy {
	case "round_robin":
		return sr.selectRoundRobinDevices(activeDevices, maxDevices)
	case "least_used":
		return sr.selectLeastUsedDevices(activeDevices, maxDevices)
	case "random":
		return sr.selectRandomDevices(activeDevices, maxDevices)
	case "specific":
		return sr.selectSpecificDevicesWithConfig(activeDevices, config)
	default:
		return sr.selectRoundRobinDevices(activeDevices, maxDevices)
	}
}

// selectDevicesByDefaultStrategy selects devices using default routing strategy
func (sr *SmsRouter) selectDevicesByDefaultStrategy(activeDevices []models.Device, routing models.SmsRouting) ([]models.Device, error) {
	maxDevices := 1
	if routing.MaxDevicesPerMessage != nil {
		maxDevices = *routing.MaxDevicesPerMessage
	}

	switch routing.DeviceSelectionStrategy {
	case "round_robin":
		return sr.selectRoundRobinDevices(activeDevices, maxDevices)
	case "least_used":
		return sr.selectLeastUsedDevices(activeDevices, maxDevices)
	case "random":
		return sr.selectRandomDevices(activeDevices, maxDevices)
	case "specific":
		return sr.selectSpecificDevices(activeDevices, routing)
	default:
		return sr.selectRoundRobinDevices(activeDevices, maxDevices)
	}
}

// selectRoundRobinDevices selects devices in round-robin fashion
func (sr *SmsRouter) selectRoundRobinDevices(devices []models.Device, maxDevices int) ([]models.Device, error) {
	// Get last used device index from Redis or database
	lastIndex := sr.getLastDeviceIndex()
	nextIndex := (lastIndex + 1) % len(devices)
	sr.setLastDeviceIndex(nextIndex)

	selectedDevices := []models.Device{}
	for i := 0; i < maxDevices && i < len(devices); i++ {
		index := (nextIndex + i) % len(devices)
		selectedDevices = append(selectedDevices, devices[index])
	}

	return selectedDevices, nil
}

// selectLeastUsedDevices selects devices with least SMS usage
func (sr *SmsRouter) selectLeastUsedDevices(devices []models.Device, maxDevices int) ([]models.Device, error) {
	// Get SMS usage count for each device from the last 24 hours
	deviceUsage := make(map[string]int)

	for _, device := range devices {
		var count int64
		database.GetDB().Model(&models.SmsLog{}).
			Where("device_imei = ? AND created_at >= ?", device.IMEI, time.Now().Add(-24*time.Hour)).
			Count(&count)
		deviceUsage[device.IMEI] = int(count)
	}

	// Sort devices by usage count (ascending)
	type deviceWithUsage struct {
		device models.Device
		usage  int
	}

	var devicesWithUsage []deviceWithUsage
	for _, device := range devices {
		devicesWithUsage = append(devicesWithUsage, deviceWithUsage{
			device: device,
			usage:  deviceUsage[device.IMEI],
		})
	}

	// Sort by usage (least used first)
	for i := 0; i < len(devicesWithUsage)-1; i++ {
		for j := i + 1; j < len(devicesWithUsage); j++ {
			if devicesWithUsage[i].usage > devicesWithUsage[j].usage {
				devicesWithUsage[i], devicesWithUsage[j] = devicesWithUsage[j], devicesWithUsage[i]
			}
		}
	}

	// Return top devices
	selectedDevices := []models.Device{}
	for i := 0; i < maxDevices && i < len(devicesWithUsage); i++ {
		selectedDevices = append(selectedDevices, devicesWithUsage[i].device)
	}

	return selectedDevices, nil
}

// selectRandomDevices selects devices randomly
func (sr *SmsRouter) selectRandomDevices(devices []models.Device, maxDevices int) ([]models.Device, error) {
	rand.Seed(time.Now().UnixNano())

	// Shuffle devices
	shuffled := make([]models.Device, len(devices))
	copy(shuffled, devices)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	// Return first maxDevices
	selectedDevices := []models.Device{}
	for i := 0; i < maxDevices && i < len(shuffled); i++ {
		selectedDevices = append(selectedDevices, shuffled[i])
	}

	return selectedDevices, nil
}

// selectSpecificDevices selects specific devices based on target_device_ids
func (sr *SmsRouter) selectSpecificDevices(activeDevices []models.Device, routing models.SmsRouting) ([]models.Device, error) {
	if routing.TargetDeviceIDs == nil || *routing.TargetDeviceIDs == "" {
		return nil, fmt.Errorf("no target device IDs specified for specific strategy")
	}

	var targetDeviceIDs []string
	if err := json.Unmarshal([]byte(*routing.TargetDeviceIDs), &targetDeviceIDs); err != nil {
		return nil, fmt.Errorf("invalid target device IDs format: %v", err)
	}

	// Create map for faster lookup
	activeDeviceMap := make(map[string]models.Device)
	for _, device := range activeDevices {
		activeDeviceMap[device.IMEI] = device
	}

	selectedDevices := []models.Device{}
	for _, targetID := range targetDeviceIDs {
		if device, exists := activeDeviceMap[targetID]; exists {
			selectedDevices = append(selectedDevices, device)
		}
	}

	return selectedDevices, nil
}

// selectSpecificDevicesWithConfig selects specific devices by IMEI using device group config
func (sr *SmsRouter) selectSpecificDevicesWithConfig(activeDevices []models.Device, config models.DeviceGroupConfig) ([]models.Device, error) {
	if config.TargetDeviceIDs == nil || *config.TargetDeviceIDs == "" {
		return nil, fmt.Errorf("no target device IDs specified in config")
	}

	targetDeviceIDs := config.GetTargetDeviceIDsArray()
	if len(targetDeviceIDs) == 0 {
		return nil, fmt.Errorf("no target device IDs specified in config")
	}

	// Create map for faster lookup
	activeDeviceMap := make(map[string]models.Device)
	for _, device := range activeDevices {
		activeDeviceMap[device.IMEI] = device
	}

	selectedDevices := []models.Device{}
	maxDevices := config.MaxDevicesPerMessage
	if maxDevices == 0 {
		maxDevices = 1
	}

	for i, targetID := range targetDeviceIDs {
		// maxDevices kontrolü ekle
		if i >= maxDevices {
			break
		}
		if device, exists := activeDeviceMap[targetID]; exists {
			selectedDevices = append(selectedDevices, device)
		}
	}

	return selectedDevices, nil
}

// getSimSlotPreference gets the preferred SIM slot for a device
func (sr *SmsRouter) getSimSlotPreference(device models.Device, routing models.SmsRouting) int {
	// Get device group configurations for this routing rule
	deviceGroupConfigs, err := sr.getDeviceGroupConfigs(routing.ID)
	if err == nil && len(deviceGroupConfigs) > 0 {
		// Use the highest priority device group config
		config := deviceGroupConfigs[0]
		return config.SimSlotPreference
	}

	// Fallback to routing configuration
	if routing.SimSlotPreference != nil {
		return *routing.SimSlotPreference
	}
	return 1 // Default to SIM 1
}

// getLastDeviceIndex gets the last used device index (simplified implementation)
func (sr *SmsRouter) getLastDeviceIndex() int {
	// TODO: Implement Redis or database storage for last device index
	// For now, return 0
	return 0
}

// setLastDeviceIndex sets the last used device index (simplified implementation)
func (sr *SmsRouter) setLastDeviceIndex(index int) {
	// TODO: Implement Redis or database storage for last device index
	// For now, do nothing
}

// getRoutingConfiguration gets the routing configuration for a system_id
func (sr *SmsRouter) getRoutingConfiguration(systemID string) (models.SmsRouting, error) {
	var routing models.SmsRouting

	err := database.GetDB().Where("is_active = ? AND source_type = ? AND system_id = ?",
		true, "smpp", systemID).First(&routing).Error

	if err != nil {
		return models.SmsRouting{}, err
	}

	return routing, nil
}

// matchesDestinationPattern checks if destination address matches routing pattern
func (sr *SmsRouter) matchesDestinationPattern(destinationAddr string, routing models.SmsRouting) bool {
	if routing.DestinationAddress == nil || *routing.DestinationAddress == "" {
		return true // No pattern specified, accept all
	}

	pattern := *routing.DestinationAddress

	// Simple pattern matching - can be enhanced with regex
	if pattern == "*" {
		return true // Accept all addresses
	}

	if pattern == destinationAddr {
		return true // Exact match
	}

	// Check if pattern is a prefix (e.g., "+90" matches "+905551234567")
	if len(pattern) > 0 && pattern[len(pattern)-1] != '*' {
		if len(destinationAddr) >= len(pattern) && destinationAddr[:len(pattern)] == pattern {
			return true
		}
	}

	// Check if pattern is a suffix (e.g., "*123" matches "905551234567")
	if len(pattern) > 0 && pattern[0] == '*' {
		suffix := pattern[1:]
		if len(destinationAddr) >= len(suffix) && destinationAddr[len(destinationAddr)-len(suffix):] == suffix {
			return true
		}
	}

	return false
}

// sendUndeliveredReport sends an undelivered delivery report to SMPP server
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
			SourceAddr:      smppMsg.DestinationAddr, // Hedef numara (mesajın gideceği yer)
			DestinationAddr: smppMsg.SourceAddr,      // SMPP client adresi (mesajın geldiği yer)
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

// findTargetDeviceGroups finds device groups based on SMPP system_id
func (sr *SmsRouter) findTargetDeviceGroups(systemID string) ([]string, error) {
	var routings []models.SmsRouting
	var deviceGroupNames []string

	// Find active SMPP routings for this system_id
	err := database.GetDB().Where("is_active = ? AND source_type = ? AND system_id = ?",
		true, "smpp", systemID).Find(&routings).Error
	if err != nil {
		return nil, err
	}

	// Extract device group names from routings
	for _, routing := range routings {
		if routing.DeviceGroupIDs != nil && *routing.DeviceGroupIDs != "" {
			var deviceGroupIDs []uint
			if err := json.Unmarshal([]byte(*routing.DeviceGroupIDs), &deviceGroupIDs); err == nil {
				for _, groupID := range deviceGroupIDs {
					var deviceGroup models.DeviceGroup
					if err := database.GetDB().First(&deviceGroup, groupID).Error; err == nil {
						deviceGroupNames = append(deviceGroupNames, deviceGroup.DeviceGroup)
					}
				}
			}
		}
	}

	return deviceGroupNames, nil
}

// getDeviceGroupConfigs returns device group configurations for a routing rule
func (sr *SmsRouter) getDeviceGroupConfigs(routingID uint) ([]models.DeviceGroupConfig, error) {
	var configs []models.DeviceGroupConfig

	err := database.GetDB().Where("sms_routing_id = ?", routingID).
		Preload("DeviceGroup").
		Order("priority DESC").
		Find(&configs).Error

	return configs, err
}

// findActiveAndroidDevicesInGroups finds all active Android devices in specific device groups
func (sr *SmsRouter) findActiveAndroidDevicesInGroups(deviceGroups []string) ([]models.Device, error) {
	var devices []models.Device

	if len(deviceGroups) == 0 {
		// If no specific groups, return all active Android devices (fallback)
		err := database.GetDB().Where("is_online = ? AND device_type = ?",
			true, "android").Find(&devices).Error
		return devices, err
	}

	// Find devices that are active, online, android type, and in specified device groups
	err := database.GetDB().Where("is_online = ? AND device_type = ? AND device_group IN ?",
		true, "android", deviceGroups).Find(&devices).Error

	return devices, err
}

// findActiveAndroidDevices finds all active Android devices (kept for backward compatibility)
func (sr *SmsRouter) findActiveAndroidDevices() ([]models.Device, error) {
	var devices []models.Device

	// Find devices that are active, online, and of type android
	err := database.GetDB().Where("is_online = ? AND device_type = ?",
		true, "android").Find(&devices).Error

	return devices, err
}

// routeMessageToDevice routes an SMPP message to a specific device
func (sr *SmsRouter) routeMessageToDevice(device models.Device, smppMsg SmppSubmitSMMessage, routing models.SmsRouting) error {
	// Generate unique message ID for this device if not provided
	deviceMessageID := smppMsg.MessageID
	if deviceMessageID == "" {
		deviceMessageID = utils.GenerateMessageID()
	}

	// Get preferred SIM slot from routing configuration
	simSlot := sr.getSimSlotPreference(device, routing)

	// Get device SIM card information for the preferred slot
	var deviceSimCard models.DeviceSimCard
	var simcardName, simcardNumber, simcardICCID, deviceIMSI *string

	if err := database.GetDB().Where("device_imei = ? AND slot_index = ?", device.IMEI, simSlot).First(&deviceSimCard).Error; err == nil {
		simcardName = &deviceSimCard.CarrierName
		simcardNumber = &deviceSimCard.PhoneNumber
		simcardICCID = &deviceSimCard.ICCID
		deviceIMSI = &deviceSimCard.IMSI
	}

	// Create SMS log entry
	smsLog := models.SmsLog{
		MessageID:               deviceMessageID,
		DeviceID:                &device.IMEI,
		DeviceName:              &device.Name,
		DeviceIMEI:              &device.IMEI,
		DeviceIMSI:              deviceIMSI,
		SimcardName:             simcardName,
		SimSlot:                 &simSlot,
		SimcardNumber:           simcardNumber,
		SimcardICCID:            simcardICCID,
		SourceAddr:              &smppMsg.SourceAddr,
		SourceConnector:         func() *string { s := "smpp"; return &s }(), // SMPP
		SourceUser:              &smppMsg.SystemID,                           // SMPP system ID as user
		DestinationAddr:         &smppMsg.DestinationAddr,
		Message:                 &smppMsg.ShortMessage,
		MessageLength:           len(smppMsg.ShortMessage),
		Direction:               "outbound",
		Priority:                sr.convertPriority(smppMsg.PriorityFlag),
		Status:                  "pending",
		DeviceGroupID:           &device.DeviceGroupID,
		DeviceGroup:             &device.DeviceGroup,
		CountrySiteID:           &device.CountrySiteID,
		CountrySite:             &device.CountrySite,
		DeliveryReportRequested: smppMsg.RegisteredDelivery == 1,
		QueuedAt:                func() *time.Time { now := time.Now(); return &now }(),
		Metadata:                sr.createMetadata(smppMsg),
	}

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		log.Printf("Error creating SMS log: %v", err)
		return err
	}

	// Send SMS via WebSocket to the device
	wsData := models.SendSmsData{
		PhoneNumber: smppMsg.DestinationAddr,
		Message:     smppMsg.ShortMessage,
		SimSlot:     simSlot, // Use preferred SIM slot
		Priority:    sr.convertPriority(smppMsg.PriorityFlag),
		MessageID:   deviceMessageID,
	}

	if err := sr.wsServer.SendSms(device.IMEI, wsData); err != nil {
		log.Printf("Error sending SMS via WebSocket to device %s: %v", device.IMEI, err)

		// Update SMS log with error
		database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": "Failed to send via WebSocket",
		})

		// Send undelivered report if delivery report was requested
		if smppMsg.RegisteredDelivery == 1 {
			deliveryReport := &types.DeliveryReportMessage{
				MessageID:       deviceMessageID,
				SystemID:        smppMsg.SystemID,
				SourceAddr:      smppMsg.DestinationAddr, // Hedef numara (mesajın gideceği yer)
				DestinationAddr: smppMsg.SourceAddr,      // SMPP client adresi (mesajın geldiği yer)
				MessageState:    4,                       // UNDELIVERABLE
				ErrorCode:       0,
				FinalDate:       time.Now().Format("20060102150405"),
				SubmitDate:      time.Now().Format("20060102150405"),
				DoneDate:        time.Now().Format("20060102150405"),
				Delivered:       false,
				Failed:          true,
				FailureReason:   "Failed to send via WebSocket",
			}

			if err := sr.publishDeliveryReport(deliveryReport); err != nil {
				log.Printf("Error publishing delivery report for WebSocket failure: %v", err)
			}
		}

		return err
	}

	// Update SMS log status to sent
	database.GetDB().Model(&smsLog).Updates(map[string]interface{}{
		"status":  "sent",
		"sent_at": time.Now(),
	})

	log.Printf("Successfully routed SMS to device %s: %s", device.IMEI, deviceMessageID)
	return nil
}

// createSmsLogForSmpp creates an SMS log entry for SMPP messages when no devices are available
func (sr *SmsRouter) createSmsLogForSmpp(smppMsg SmppSubmitSMMessage, status, errorMsg string) error {
	smsLog := models.SmsLog{
		MessageID:               smppMsg.MessageID,
		SourceAddr:              &smppMsg.SourceAddr,
		SourceConnector:         func() *string { s := "smpp"; return &s }(), // SMPP
		SourceUser:              &smppMsg.SystemID,                           // SMPP system ID as user
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
