package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"
	"smppserver/protocol"

	"smppserver/session"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQClient struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	config  *Config
}

type Config struct {
	URL                 string
	Exchange            string
	Queue               string
	DeliveryReportQueue string
}

// SubmitSMMessage represents the message structure for RabbitMQ
type SubmitSMMessage struct {
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

// DeliveryReportMessage represents the delivery report message structure for RabbitMQ
type DeliveryReportMessage struct {
	MessageID       string `json:"message_id"`
	SystemID        string `json:"system_id"`
	SourceAddr      string `json:"source_addr"`
	DestinationAddr string `json:"destination_addr"`
	MessageState    uint8  `json:"message_state"`
	ErrorCode       uint8  `json:"error_code"`
	FinalDate       string `json:"final_date"`
	SubmitDate      string `json:"submit_date"`
	DoneDate        string `json:"done_date"`
	Delivered       bool   `json:"delivered"`
	Failed          bool   `json:"failed"`
	FailureReason   string `json:"failure_reason,omitempty"`
	OriginalText    string `json:"original_text,omitempty"` // Orijinal SMS metni
	DataCoding      uint8  `json:"data_coding,omitempty"`   // Orijinal mesajın data coding'i
}

func NewRabbitMQClient(config *Config) (*RabbitMQClient, error) {
	conn, err := amqp.Dial(config.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %v", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("failed to open channel: %v", err)
	}

	// Declare exchange
	err = ch.ExchangeDeclare(
		config.Exchange, // name
		"direct",        // type
		true,            // durable
		false,           // auto-deleted
		false,           // internal
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		return nil, fmt.Errorf("failed to declare exchange: %v", err)
	}

	// Declare queue
	_, err = ch.QueueDeclare(
		config.Queue, // name
		true,         // durable
		false,        // delete when unused
		false,        // exclusive
		false,        // no-wait
		nil,          // arguments
	)
	if err != nil {
		return nil, fmt.Errorf("failed to declare queue: %v", err)
	}

	// Bind queue to exchange
	err = ch.QueueBind(
		config.Queue,    // queue name
		"submit_sm",     // routing key
		config.Exchange, // exchange
		false,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to bind queue: %v", err)
	}

	// Declare delivery report queue
	_, err = ch.QueueDeclare(
		config.DeliveryReportQueue, // name
		true,                       // durable
		false,                      // delete when unused
		false,                      // exclusive
		false,                      // no-wait
		nil,                        // arguments
	)
	if err != nil {
		return nil, fmt.Errorf("failed to declare delivery report queue: %v", err)
	}

	// Bind delivery report queue to exchange
	err = ch.QueueBind(
		config.DeliveryReportQueue, // queue name
		"delivery_report",          // routing key
		config.Exchange,            // exchange
		false,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to bind delivery report queue: %v", err)
	}

	return &RabbitMQClient{
		conn:    conn,
		channel: ch,
		config:  config,
	}, nil
}

func (r *RabbitMQClient) Close() error {
	if r.channel != nil {
		if err := r.channel.Close(); err != nil {
			return fmt.Errorf("failed to close channel: %v", err)
		}
	}
	if r.conn != nil {
		if err := r.conn.Close(); err != nil {
			return fmt.Errorf("failed to close connection: %v", err)
		}
	}
	return nil
}

// PublishSubmitSM publishes a submit_sm message to RabbitMQ
func (r *RabbitMQClient) PublishSubmitSM(message *SubmitSMMessage) error {
	// Convert message to JSON
	body, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %v", err)
	}

	// Publish message
	err = r.channel.Publish(
		r.config.Exchange, // exchange
		"submit_sm",       // routing key
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %v", err)
	}

	log.Printf("Published submit_sm message to RabbitMQ: %s", message.MessageID)
	return nil
}

// ConvertOptionalParamsToString converts optional parameters to string format for JSON
func ConvertOptionalParamsToString(optionalParams map[uint16][]byte) map[string]interface{} {
	result := make(map[string]interface{})
	for tag, value := range optionalParams {
		// Convert tag to hex string
		tagStr := fmt.Sprintf("0x%04X", tag)

		// Convert value to appropriate format
		if len(value) == 1 {
			result[tagStr] = uint8(value[0])
		} else if len(value) == 2 {
			result[tagStr] = uint16(value[0])<<8 | uint16(value[1])
		} else {
			// For longer values, convert to hex string
			result[tagStr] = fmt.Sprintf("%X", value)
		}
	}
	return result
}

// ExtractConcatenationInfo extracts concatenation information from optional parameters
func ExtractConcatenationInfo(optionalParams map[uint16][]byte) *ConcatenationInfo {
	var concatInfo *ConcatenationInfo

	// Check for 16-bit concatenation parameters
	if refNum, exists := optionalParams[protocol.OPT_PARAM_SAR_MSG_REF_NUM]; exists && len(refNum) >= 2 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.ReferenceNumber = uint16(refNum[0])<<8 | uint16(refNum[1])
	}

	if totalSeg, exists := optionalParams[protocol.OPT_PARAM_SAR_TOTAL_SEGMENTS]; exists && len(totalSeg) >= 1 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.TotalSegments = totalSeg[0]
	}

	if seqNum, exists := optionalParams[protocol.OPT_PARAM_SAR_SEGMENT_SEQNUM]; exists && len(seqNum) >= 1 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.SequenceNumber = seqNum[0]
	}

	// Check for 8-bit concatenation parameters (alternative format)
	if refNum, exists := optionalParams[protocol.OPT_PARAM_SAR_MSG_REF_NUM_8]; exists && len(refNum) >= 1 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.ReferenceNumber = uint16(refNum[0])
	}

	if totalSeg, exists := optionalParams[protocol.OPT_PARAM_SAR_TOTAL_SEGMENTS_8]; exists && len(totalSeg) >= 1 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.TotalSegments = totalSeg[0]
	}

	if seqNum, exists := optionalParams[protocol.OPT_PARAM_SAR_SEGMENT_SEQNUM_8]; exists && len(seqNum) >= 1 {
		if concatInfo == nil {
			concatInfo = &ConcatenationInfo{}
		}
		concatInfo.SequenceNumber = seqNum[0]
	}

	return concatInfo
}

// StartDeliveryReportConsumer starts consuming delivery report messages
func (r *RabbitMQClient) StartDeliveryReportConsumer(sessionManager *session.SessionManager) error {
	msgs, err := r.channel.Consume(
		r.config.DeliveryReportQueue, // queue
		"",                           // consumer
		false,                        // auto-ack
		false,                        // exclusive
		false,                        // no-local
		false,                        // no-wait
		nil,                          // args
	)
	if err != nil {
		return fmt.Errorf("failed to start consumer: %v", err)
	}

	go func() {
		for msg := range msgs {
			r.handleDeliveryReport(msg, sessionManager)
		}
	}()

	log.Printf("Started delivery report consumer for queue: %s", r.config.DeliveryReportQueue)
	return nil
}

// handleDeliveryReport processes delivery report messages
func (r *RabbitMQClient) handleDeliveryReport(msg amqp.Delivery, sessionManager *session.SessionManager) {
	defer msg.Ack(false)

	var deliveryReport DeliveryReportMessage
	if err := json.Unmarshal(msg.Body, &deliveryReport); err != nil {
		log.Printf("Failed to unmarshal delivery report: %v", err)
		return
	}

	// Debug: Log the raw delivery report data
	log.Printf("DEBUG: Raw Delivery Report - MessageID: %s, SystemID: %s, Delivered: %v, Failed: %v, MessageState: %d",
		deliveryReport.MessageID, deliveryReport.SystemID, deliveryReport.Delivered, deliveryReport.Failed, deliveryReport.MessageState)

	// Debug: Log additional fields
	log.Printf("DEBUG: Additional Fields - OriginalText: '%s', DataCoding: %d, ErrorCode: %d",
		deliveryReport.OriginalText, deliveryReport.DataCoding, deliveryReport.ErrorCode)
	log.Printf("DEBUG: Timestamps - SubmitDate: '%s', DoneDate: '%s', FinalDate: '%s'",
		deliveryReport.SubmitDate, deliveryReport.DoneDate, deliveryReport.FinalDate)

	log.Printf("Received delivery report for message: %s, system: %s", deliveryReport.MessageID, deliveryReport.SystemID)

	// Find sessions for the system ID
	sessions := sessionManager.GetSessionsBySystemID(deliveryReport.SystemID)
	if len(sessions) == 0 {
		log.Printf("No sessions found for system ID: %s", deliveryReport.SystemID)
		return
	}

	// Send delivery report to all sessions for this system ID
	for _, session := range sessions {
		if err := r.sendDeliveryReportToSession(session, &deliveryReport); err != nil {
			log.Printf("Failed to send delivery report to session %s: %v", session.ID, err)
		}
	}
}

// sendDeliveryReportToSession sends a delivery report to a specific session
func (r *RabbitMQClient) sendDeliveryReportToSession(session *session.Session, report *DeliveryReportMessage) error {
	// Debug: Log the delivery report details
	log.Printf("DEBUG: Delivery Report - MessageID: %s, Delivered: %v, Failed: %v, MessageState: %d",
		report.MessageID, report.Delivered, report.Failed, report.MessageState)

	// Determine the actual message state based on delivery status
	// SMPP Message State Values: 0=ENROUTE, 1=DELIVERED, 2=EXPIRED, 3=DELETED, 4=UNDELIVERABLE, 5=ACCEPTED, 6=UNKNOWN, 7=REJECTED
	var messageState uint8

	// Debug: Log the decision process
	log.Printf("DEBUG: Message State Decision Process:")
	log.Printf("DEBUG: - report.Delivered: %v", report.Delivered)
	log.Printf("DEBUG: - report.Failed: %v", report.Failed)
	log.Printf("DEBUG: - report.MessageState: %d", report.MessageState)

	if report.Delivered {
		messageState = protocol.MESSAGE_STATE_DELIVERED // DELIVERED (SMPP 3.4/5.0 standard)
		log.Printf("DEBUG: - Setting messageState to DELIVERED (%d) because report.Delivered = true", messageState)
	} else if report.Failed {
		messageState = protocol.MESSAGE_STATE_UNDELIVERABLE // UNDELIVERABLE (SMPP 3.4/5.0 standard)
		log.Printf("DEBUG: - Setting messageState to UNDELIVERABLE (%d) because report.Failed = true", messageState)
	} else if report.MessageState > 0 {
		messageState = report.MessageState // Use original if available and valid
		log.Printf("DEBUG: - Setting messageState to original value (%d) from report.MessageState", messageState)
	} else {
		messageState = protocol.MESSAGE_STATE_ENROUTE // Default to ENROUTE if no state provided
		log.Printf("DEBUG: - Setting messageState to ENROUTE (%d) as default", messageState)
	}

	// Debug: Log the message state determination
	log.Printf("DEBUG: Message State Determination - Delivered: %v, Failed: %v, Original MessageState: %d, Final MessageState: %d",
		report.Delivered, report.Failed, report.MessageState, messageState)

	// Create delivery report text in SMPP format
	deliveryReportText := r.createDeliveryReportText(report, messageState)

	// Determine data coding - use original message's data coding if available, otherwise default to GSM 7-bit
	dataCoding := uint8(protocol.DCS_GSM7) // Default to GSM 7-bit
	if report.DataCoding != 0 {
		dataCoding = report.DataCoding
	}

	// Create deliver_sm PDU for delivery report
	// In delivery report: SourceAddr = original destination (recipient), DestinationAddr = original source (sender)
	deliverPDU := &protocol.DeliverSMPDU{
		ServiceType:          "",
		SourceAddrTON:        protocol.TON_UNKNOWN,             // International number
		SourceAddrNPI:        protocol.NPI_UNKNOWN,             // ISDN numbering plan
		SourceAddr:           report.DestinationAddr,           // Original recipient becomes source in delivery report
		DestAddrTON:          protocol.TON_UNKNOWN,             // International number
		DestAddrNPI:          protocol.NPI_UNKNOWN,             // ISDN numbering plan
		DestinationAddr:      report.SourceAddr,                // Original sender becomes destination in delivery report
		ESMClass:             protocol.ESM_CLASS_DATAGRAM_MODE, // SMSC delivery receipt (DLR) = 0x04
		ProtocolID:           0,                                // Normal SMS
		PriorityFlag:         0,                                // Normal priority
		ScheduleDeliveryTime: "",
		ValidityPeriod:       "",
		RegisteredDelivery:   protocol.REG_DELIVERY_SMSC, // SMSC delivery receipt = 0x01
		ReplaceIfPresentFlag: 0,
		DataCoding:           dataCoding, // Use original message's data coding
		SMDefaultMsgID:       0,
		SMLength:             uint8(len(deliveryReportText)),
		ShortMessage:         deliveryReportText, // Delivery report text
		OptionalParameters:   make(map[uint16][]byte),
	}

	// Debug: Log the final message state being sent
	log.Printf("DEBUG: Final Message State for Optional Parameters: %d", messageState)

	// Add delivery report specific optional parameters
	deliverPDU.OptionalParameters[protocol.OPT_PARAM_MESSAGE_STATE] = []byte{messageState}
	deliverPDU.OptionalParameters[protocol.OPT_PARAM_RECEIPTED_MESSAGE_ID] = []byte(report.MessageID)

	// Debug: Log the DLR PDU configuration
	log.Printf("DEBUG: DLR PDU Configuration - ESMClass: 0x%02X, RegisteredDelivery: 0x%02X, MessageState: %d",
		deliverPDU.ESMClass, deliverPDU.RegisteredDelivery, messageState)

	// Debug: Log the cleaned DLR text
	log.Printf("DEBUG: DLR Text: %s", deliveryReportText)

	// Convert to PDU and send
	pdu := &protocol.PDU{
		CommandLength:  uint32(16 + len(protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliverPDU)))),
		CommandID:      protocol.DELIVER_SM,
		CommandStatus:  0,
		SequenceNumber: session.GetNextSequenceNumber(),
		Body:           protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliverPDU)),
	}

	// Debug: Log the final PDU details
	log.Printf("DEBUG: Sending DLR PDU - CommandID: 0x%08X, SequenceNumber: %d, BodyLength: %d",
		pdu.CommandID, pdu.SequenceNumber, len(pdu.Body))

	err := session.SendPDU(pdu)
	if err != nil {
		log.Printf("ERROR: Failed to send DLR PDU: %v", err)
		return err
	}

	log.Printf("INFO: Successfully sent DLR for message: %s to session: %s", report.MessageID, session.ID)
	return nil
}

// createDeliveryReportText creates the delivery report text in SMPP format
func (r *RabbitMQClient) createDeliveryReportText(report *DeliveryReportMessage, messageState uint8) string {
	// SMPP Standard DLR Format: "id:message_id sub:001 dlvrd:001 submit date:submit_date done date:done_date stat:status err:error_code text:original_text"

	// Debug: Log input parameters
	log.Printf("DEBUG: createDeliveryReportText - MessageState: %d, OriginalText: '%s', Delivered: %v, Failed: %v",
		messageState, report.OriginalText, report.Delivered, report.Failed)

	// Convert message state to SMPP status string (SMPP 3.4/5.0 standard)
	// SMPP Message State Values: 0=ENROUTE, 1=DELIVERED, 2=EXPIRED, 3=DELETED, 4=UNDELIVERABLE, 5=ACCEPTED, 6=UNKNOWN, 7=REJECTED
	var status string
	switch messageState {
	case protocol.MESSAGE_STATE_ENROUTE: // ENROUTE
		status = "ENROUTE"
	case protocol.MESSAGE_STATE_DELIVERED: // DELIVERED
		status = "DELIVRD"
	case protocol.MESSAGE_STATE_EXPIRED: // EXPIRED
		status = "EXPIRED"
	case protocol.MESSAGE_STATE_DELETED: // DELETED
		status = "DELETED"
	case protocol.MESSAGE_STATE_UNDELIVERABLE: // UNDELIVERABLE
		status = "UNDELIV"
	case protocol.MESSAGE_STATE_ACCEPTED: // ACCEPTED
		status = "ACCEPTD"
	case protocol.MESSAGE_STATE_UNKNOWN: // UNKNOWN
		status = "UNKNOWN"
	case protocol.MESSAGE_STATE_REJECTED: // REJECTED
		status = "REJECTD"
	default:
		status = "UNKNOWN"
	}

	// Debug: Log status conversion
	log.Printf("DEBUG: Status conversion - MessageState: %d -> Status: '%s'", messageState, status)

	// Determine submit and delivered counts based on actual message state
	var subCount, dlvrdCount string
	if messageState == protocol.MESSAGE_STATE_DELIVERED { // DELIVERED (SMPP 3.4/5.0 standard)
		subCount = "001"
		dlvrdCount = "001"
	} else {
		subCount = "001"
		dlvrdCount = "000"
	}

	// Clean and validate timestamps
	submitDate := r.cleanTimestamp(report.SubmitDate)
	doneDate := r.cleanTimestamp(report.DoneDate)

	// Create delivery report text with proper SMPP format
	originalText := "Delivery Report"
	if report.OriginalText != "" && len(report.OriginalText) > 0 {
		originalText = report.OriginalText
	}

	// Use original message ID directly (SMPP standard)
	messageID := report.MessageID
	if messageID == "" {
		messageID = "UNKNOWN"
	}

	deliveryText := fmt.Sprintf("id:%s sub:%s dlvrd:%s submit date:%s done date:%s stat:%s err:%03d text:%s",
		messageID, subCount, dlvrdCount, submitDate, doneDate, status, report.ErrorCode, originalText)

	// Debug: Log final delivery text
	log.Printf("DEBUG: Final delivery text: '%s'", deliveryText)

	return deliveryText
}

// cleanTimestamp cleans and validates timestamp format
func (r *RabbitMQClient) cleanTimestamp(timestamp string) string {
	if timestamp == "" {
		return "00000000000000" // Default empty timestamp
	}

	// Remove any non-numeric characters and ensure proper format
	cleaned := ""
	for _, char := range timestamp {
		if char >= '0' && char <= '9' {
			cleaned += string(char)
		}
	}

	// Ensure minimum length (14 digits for YYYYMMDDHHMMSS)
	if len(cleaned) < 14 {
		cleaned = cleaned + "00000000000000"[:14-len(cleaned)]
	}

	// Truncate if too long
	if len(cleaned) > 14 {
		cleaned = cleaned[:14]
	}

	return cleaned
}
