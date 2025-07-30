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
	// Create deliver_sm PDU for delivery report
	deliverPDU := &protocol.DeliverSMPDU{
		ServiceType:          "",
		SourceAddrTON:        0,
		SourceAddrNPI:        0,
		SourceAddr:           report.SourceAddr,
		DestAddrTON:          0,
		DestAddrNPI:          0,
		DestinationAddr:      report.DestinationAddr,
		ESMClass:             protocol.ESM_CLASS_DEFAULT, // Delivery receipt için default ESM class
		ProtocolID:           0,
		PriorityFlag:         0,
		ScheduleDeliveryTime: "",
		ValidityPeriod:       "",
		RegisteredDelivery:   protocol.REG_DELIVERY_SMSC,
		ReplaceIfPresentFlag: 0,
		DataCoding:           0,
		SMDefaultMsgID:       0,
		SMLength:             0,
		ShortMessage:         "", // Delivery report'larda mesaj boş olmalı
		OptionalParameters:   make(map[uint16][]byte),
	}

	// Add delivery report specific optional parameters
	deliverPDU.OptionalParameters[protocol.OPT_PARAM_MESSAGE_STATE] = []byte{report.MessageState}
	deliverPDU.OptionalParameters[protocol.OPT_PARAM_RECEIPTED_MESSAGE_ID] = []byte(report.MessageID)

	// Convert to PDU and send
	pdu := &protocol.PDU{
		CommandLength:  uint32(16 + len(protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliverPDU)))),
		CommandID:      protocol.DELIVER_SM,
		CommandStatus:  0,
		SequenceNumber: session.GetNextSequenceNumber(),
		Body:           protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliverPDU)),
	}

	return session.SendPDU(pdu)
}
