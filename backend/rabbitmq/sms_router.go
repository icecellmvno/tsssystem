package rabbitmq

import (
	"encoding/json"
	"log"
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

	// TODO: Implement your manual SMS routing logic here
	// This is where you will add your custom routing implementation

	log.Printf("SMPP message processed successfully: %s", smppMsg.MessageID)
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
