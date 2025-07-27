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

// SmsMessage represents the SMS message structure for RabbitMQ
type SmsMessage struct {
	SystemID    string `json:"system_id"`
	DeviceID    string `json:"device_id"`
	PhoneNumber string `json:"phone_number"`
	Message     string `json:"message"`
	SimSlot     int    `json:"sim_slot"`
	Priority    string `json:"priority"`
	MessageID   string `json:"message_id"`
}

// SmppSmsMessage represents the SMPP SMS message structure
type SmppSmsMessage struct {
	SystemID    string `json:"system_id"`
	SourceAddr  string `json:"source_addr"`
	DestAddr    string `json:"dest_addr"`
	Message     string `json:"message"`
	DataCoding  uint8  `json:"data_coding"`
	ESMClass    uint8  `json:"esm_class"`
	Priority    uint8  `json:"priority"`
	ReplaceFlag uint8  `json:"replace_flag"`
	SequenceNum uint32 `json:"sequence_num"`
	MessageID   string `json:"message_id"`
	// Device information fields
	DeviceID    string `json:"device_id,omitempty"`
	DeviceGroup string `json:"device_group,omitempty"`
	SimCard     string `json:"sim_card,omitempty"`
	SimName     string `json:"sim_name,omitempty"`
	SimSlot     int    `json:"sim_slot,omitempty"`
	IMSI        string `json:"imsi,omitempty"`
	CountrySite string `json:"country_site,omitempty"`
}

// SmsResponse represents the SMS response structure
type SmsResponse struct {
	SystemID  string `json:"system_id"`
	MessageID string `json:"message_id"`
	Status    string `json:"status"`
	Error     string `json:"error,omitempty"`
}

// SmsConsumer handles SMS messages from RabbitMQ
type SmsConsumer struct {
	rabbitMQ *RabbitMQHandler
	wsServer *websocket.WebSocketServer
}

// NewSmsConsumer creates a new SMS consumer
func NewSmsConsumer(rabbitMQ *RabbitMQHandler, wsServer *websocket.WebSocketServer) *SmsConsumer {
	return &SmsConsumer{
		rabbitMQ: rabbitMQ,
		wsServer: wsServer,
	}
}

// StartConsuming starts consuming SMS messages from RabbitMQ
func (sc *SmsConsumer) StartConsuming(queueName string) error {
	log.Printf("Starting SMS consumer for queue: %s", queueName)

	return sc.rabbitMQ.ConsumeQueue(queueName, func(message []byte) error {
		return sc.processSmsMessage(message)
	})
}

// processSmsMessage processes a single SMS message
func (sc *SmsConsumer) processSmsMessage(message []byte) error {
	// Try to parse as regular SMS message first
	var smsMsg SmsMessage
	if err := json.Unmarshal(message, &smsMsg); err == nil && smsMsg.DeviceID != "" {
		return sc.processRegularSmsMessage(smsMsg)
	}

	// Try to parse as SMPP SMS message
	var smppMsg SmppSmsMessage
	if err := json.Unmarshal(message, &smppMsg); err == nil {
		return sc.processSmppSmsMessage(smppMsg)
	}

	log.Printf("Error: Could not parse SMS message as either regular or SMPP format")
	return nil
}

// processRegularSmsMessage processes regular SMS messages (from frontend)
func (sc *SmsConsumer) processRegularSmsMessage(smsMsg SmsMessage) error {
	log.Printf("Processing regular SMS message: %s to %s", smsMsg.MessageID, smsMsg.PhoneNumber)

	// Get device information
	var device models.Device
	if err := database.GetDB().Where("imei = ?", smsMsg.DeviceID).First(&device).Error; err != nil {
		log.Printf("Device not found: %s", smsMsg.DeviceID)
		return sc.sendSmsResponse(smsMsg, "failed", "Device not found")
	}

	// Generate message ID if not provided
	if smsMsg.MessageID == "" {
		smsMsg.MessageID = utils.GenerateMessageID()
	}

	// Get SIM card information for the specified slot
	var deviceSimCard models.DeviceSimCard
	var simcardName, simcardNumber, simcardICCID, deviceIMSI *string

	if err := database.GetDB().Where("device_imei = ? AND slot_index = ?", smsMsg.DeviceID, smsMsg.SimSlot).First(&deviceSimCard).Error; err == nil {
		simcardName = &deviceSimCard.CarrierName
		simcardNumber = &deviceSimCard.PhoneNumber
		simcardICCID = &deviceSimCard.ICCID
		deviceIMSI = &deviceSimCard.IMSI
	}

	// Create SMS log entry
	smsLog := models.SmsLog{
		MessageID:               smsMsg.MessageID,
		DeviceID:                &smsMsg.DeviceID,
		DeviceName:              &device.Name,
		DeviceIMEI:              &device.IMEI,
		DeviceIMSI:              deviceIMSI,
		SimcardName:             simcardName,
		SimSlot:                 &smsMsg.SimSlot,
		SimcardNumber:           simcardNumber,
		SimcardICCID:            simcardICCID,
		SourceAddr:              simcardNumber,                                   // Use SIM card phone number as source
		SourceConnector:         func() *string { s := "http_api"; return &s }(), // HTTP API via RabbitMQ
		SourceUser:              func() *string { s := "system"; return &s }(),   // System user for RabbitMQ messages
		DestinationAddr:         &smsMsg.PhoneNumber,
		Message:                 &smsMsg.Message,
		MessageLength:           len(smsMsg.Message),
		Direction:               "outbound",
		Priority:                smsMsg.Priority,
		Status:                  "pending",
		DeviceGroupID:           &device.DeviceGroupID,
		DeviceGroup:             &device.DeviceGroup,
		CountrySiteID:           &device.CountrySiteID,
		CountrySite:             &device.CountrySite,
		DeliveryReportRequested: true,
		QueuedAt:                &time.Time{},
	}

	// If source address is empty, set it to "Panel"
	if smsLog.SourceAddr == nil || *smsLog.SourceAddr == "" {
		panelSource := "Panel"
		smsLog.SourceAddr = &panelSource
	}

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		log.Printf("Error creating SMS log: %v", err)
		return sc.sendSmsResponse(smsMsg, "failed", "Failed to create SMS log")
	}

	// Send SMS via WebSocket
	wsData := models.SendSmsData{
		PhoneNumber: smsMsg.PhoneNumber,
		Message:     smsMsg.Message,
		SimSlot:     smsMsg.SimSlot,
		Priority:    smsMsg.Priority,
	}

	if err := sc.wsServer.SendSms(smsMsg.DeviceID, wsData); err != nil {
		log.Printf("Error sending SMS via WebSocket: %v", err)
		return sc.sendSmsResponse(smsMsg, "failed", "Failed to send via WebSocket")
	}

	log.Printf("SMS sent successfully: %s to %s", smsMsg.MessageID, smsMsg.PhoneNumber)
	return sc.sendSmsResponse(smsMsg, "sent", "")
}

// processSmppSmsMessage processes SMPP SMS messages
func (sc *SmsConsumer) processSmppSmsMessage(smppMsg SmppSmsMessage) error {
	log.Printf("Processing SMPP SMS message: %s from %s to %s", smppMsg.MessageID, smppMsg.SourceAddr, smppMsg.DestAddr)

	// Try to find device by system_id (SMPP username)
	var device models.Device
	if err := database.GetDB().Where("imei = ? OR name = ?", smppMsg.SystemID, smppMsg.SystemID).First(&device).Error; err != nil {
		log.Printf("Device not found for SMPP system_id: %s", smppMsg.SystemID)
		// Continue without device info
	}

	// Get device group info if device found
	if device.ID != 0 {
		smppMsg.DeviceGroup = device.DeviceGroup
		smppMsg.CountrySite = device.CountrySite
		smppMsg.DeviceID = device.IMEI
	}

	// Get SIM card info if device found
	var simCard models.SimCardRecord
	if device.ID != 0 {
		if err := database.GetDB().Where("device_id = ? AND slot_index = ?", device.ID, smppMsg.SimSlot).First(&simCard).Error; err == nil {
			smppMsg.SimCard = simCard.ICCID
			smppMsg.SimName = simCard.DisplayName
			smppMsg.IMSI = simCard.IMSI
		}
	}

	// Create SMS log entry for SMPP message
	smsLog := models.SmsLog{
		MessageID:               smppMsg.MessageID,
		SourceAddr:              &smppMsg.SourceAddr,
		SourceConnector:         func() *string { s := "smpp"; return &s }(), // SMPP
		SourceUser:              &smppMsg.SystemID,                           // SMPP system ID as user
		DestinationAddr:         &smppMsg.DestAddr,
		Message:                 &smppMsg.Message,
		MessageLength:           len(smppMsg.Message),
		Direction:               "outbound",
		Priority:                "normal",
		Status:                  "pending",
		DeliveryReportRequested: true,
		QueuedAt:                &time.Time{},
	}

	// Set device information if available
	if device.ID != 0 {
		smsLog.DeviceGroupID = &device.DeviceGroupID
		smsLog.DeviceGroup = &device.DeviceGroup
		smsLog.CountrySiteID = &device.CountrySiteID
		smsLog.CountrySite = &device.CountrySite
	}

	// Create metadata with device info
	metadata := map[string]interface{}{
		"system_id":    smppMsg.SystemID,
		"device_id":    smppMsg.DeviceID,
		"device_group": smppMsg.DeviceGroup,
		"sim_card":     smppMsg.SimCard,
		"sim_name":     smppMsg.SimName,
		"sim_slot":     smppMsg.SimSlot,
		"imsi":         smppMsg.IMSI,
		"country_site": smppMsg.CountrySite,
		"data_coding":  smppMsg.DataCoding,
		"esm_class":    smppMsg.ESMClass,
	}

	metadataJSON, _ := json.Marshal(metadata)
	metadataStr := string(metadataJSON)
	smsLog.Metadata = &metadataStr

	if err := database.GetDB().Create(&smsLog).Error; err != nil {
		log.Printf("Error creating SMPP SMS log: %v", err)
		return err
	}

	log.Printf("SMPP SMS logged successfully: %s from %s to %s (Device: %s, Group: %s, SIM: %s)",
		smppMsg.MessageID, smppMsg.SourceAddr, smppMsg.DestAddr, smppMsg.DeviceID, smppMsg.DeviceGroup, smppMsg.SimName)
	return nil
}

// sendSmsResponse sends a response back to RabbitMQ
func (sc *SmsConsumer) sendSmsResponse(smsMsg SmsMessage, status, error string) error {
	response := SmsResponse{
		SystemID:  smsMsg.SystemID,
		MessageID: smsMsg.MessageID,
		Status:    status,
		Error:     error,
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling SMS response: %v", err)
		return err
	}

	// Send response to response queue
	responseQueueName := smsMsg.SystemID + "_response"
	if err := sc.rabbitMQ.PublishMessage(responseQueueName, responseBytes); err != nil {
		log.Printf("Error publishing SMS response: %v", err)
		return err
	}

	return nil
}
