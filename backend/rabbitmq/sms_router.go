package rabbitmq

import (
	"encoding/json"
	"log"
	"time"

	"tsimsocketserver/database"
	"tsimsocketserver/models"
	"tsimsocketserver/utils"
	"tsimsocketserver/websocket"
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

	// Find target device groups based on SMPP system_id
	targetDeviceGroups, err := sr.findTargetDeviceGroups(smppMsg.SystemID)
	if err != nil {
		log.Printf("Error finding target device groups for system_id %s: %v", smppMsg.SystemID, err)
		return err
	}

	if len(targetDeviceGroups) == 0 {
		log.Printf("No target device groups found for system_id: %s", smppMsg.SystemID)
		return sr.createSmsLogForSmpp(smppMsg, "failed", "No target device groups found")
	}

	// Find active Android devices in target device groups
	activeDevices, err := sr.findActiveAndroidDevicesInGroups(targetDeviceGroups)
	if err != nil {
		log.Printf("Error finding active devices in target groups: %v", err)
		return err
	}

	if len(activeDevices) == 0 {
		log.Printf("No active Android devices found in target device groups")
		return sr.createSmsLogForSmpp(smppMsg, "failed", "No active devices in target groups")
	}

	// Route message to devices in target groups
	successCount := 0
	for _, device := range activeDevices {
		if err := sr.routeMessageToDevice(device, smppMsg); err != nil {
			log.Printf("Error routing message to device %s: %v", device.IMEI, err)
		} else {
			successCount++
		}
	}

	log.Printf("Successfully routed SMPP message to %d/%d active devices in target groups", successCount, len(activeDevices))
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
func (sr *SmsRouter) routeMessageToDevice(device models.Device, smppMsg SmppSubmitSMMessage) error {
	// Generate unique message ID for this device if not provided
	deviceMessageID := smppMsg.MessageID
	if deviceMessageID == "" {
		deviceMessageID = utils.GenerateMessageID()
	}

	// Get device SIM card information (use first SIM card as per user preference)
	var deviceSimCard models.DeviceSimCard
	var simcardName, simcardNumber, simcardICCID, deviceIMSI *string

	if err := database.GetDB().Where("device_imei = ? AND slot_index = ?", device.IMEI, 1).First(&deviceSimCard).Error; err == nil {
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
		SimSlot:                 func() *int { slot := 1; return &slot }(),
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
		SimSlot:     1, // Use first SIM slot
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
