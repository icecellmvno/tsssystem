package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/rabbitmq"
	"smppserver/session"
	"time"
)

// SMSHandler handles SMS-related operations
type SMSHandler struct {
	authManager    *auth.RedisAuthManager
	sessionManager *session.SessionManager
	rabbitMQClient *rabbitmq.RabbitMQClient
}

// NewSMSHandler creates a new SMS handler
func NewSMSHandler(authManager *auth.RedisAuthManager, sessionManager *session.SessionManager, rabbitMQClient *rabbitmq.RabbitMQClient) *SMSHandler {
	return &SMSHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
		rabbitMQClient: rabbitMQClient,
	}
}

// HandleSubmitSM handles submit_sm requests
func (h *SMSHandler) HandleSubmitSM(session *session.Session, pdu *protocol.PDU) error {
	if !session.CanTransmit() {
		return session.SendResponse(protocol.SUBMIT_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	submit, err := protocol.ParseSubmitSMPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse submit_sm: %v", session.ID, err)
		return session.SendResponse(protocol.SUBMIT_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	// Validate source address
	if submit.SourceAddr == "" {
		log.Printf("Session %s: Empty source address", session.ID)
		return session.SendResponse(protocol.SUBMIT_SM_RESP, protocol.ESME_RINVSRCADR, nil, pdu.SequenceNumber)
	}

	// Validate destination address
	if submit.DestinationAddr == "" {
		log.Printf("Session %s: Empty destination address", session.ID)
		return session.SendResponse(protocol.SUBMIT_SM_RESP, protocol.ESME_RINVDSTADR, nil, pdu.SequenceNumber)
	}

	// Generate message ID
	messageID := h.GenerateMessageID()

	// Increment message counter
	if err := h.authManager.IncrementMessageCount(session.SystemID, true); err != nil {
		log.Printf("Session %s: Failed to increment message counter: %v", session.ID, err)
	}

	log.Printf("Session %s: Submit SM from %s to %s, message: %s", session.ID, submit.SourceAddr, submit.DestinationAddr, submit.ShortMessage)

	// Extract concatenation information
	concatenationInfo := rabbitmq.ExtractConcatenationInfo(submit.OptionalParameters)

	// Convert optional parameters to string map for JSON serialization
	optionalParamsStr := rabbitmq.ConvertOptionalParamsToString(submit.OptionalParameters)

	// Create RabbitMQ message
	rabbitMessage := &rabbitmq.SubmitSMMessage{
		MessageID:            messageID,
		SystemID:             session.SystemID,
		SourceAddr:           submit.SourceAddr,
		DestinationAddr:      submit.DestinationAddr,
		ShortMessage:         submit.ShortMessage,
		DataCoding:           submit.DataCoding,
		ESMClass:             submit.ESMClass,
		RegisteredDelivery:   submit.RegisteredDelivery,
		PriorityFlag:         submit.PriorityFlag,
		ServiceType:          submit.ServiceType,
		ProtocolID:           submit.ProtocolID,
		ScheduleDeliveryTime: submit.ScheduleDeliveryTime,
		ValidityPeriod:       submit.ValidityPeriod,
		ReplaceIfPresentFlag: submit.ReplaceIfPresentFlag,
		SMDefaultMsgID:       submit.SMDefaultMsgID,
		OptionalParameters:   optionalParamsStr,
		Concatenation:        concatenationInfo,
	}

	// Publish to RabbitMQ
	if h.rabbitMQClient != nil {
		if err := h.rabbitMQClient.PublishSubmitSM(rabbitMessage); err != nil {
			log.Printf("Session %s: Failed to publish to RabbitMQ: %v", session.ID, err)
			// Continue processing even if RabbitMQ publish fails
		}
	}

	// Send submit response
	responseBody := protocol.SerializeSubmitSMRespPDU(&protocol.SubmitSMRespPDU{
		MessageID: messageID,
	})

	return session.SendResponse(protocol.SUBMIT_SM_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
}

// HandleDeliverSM handles deliver_sm requests
func (h *SMSHandler) HandleDeliverSM(session *session.Session, pdu *protocol.PDU) error {
	if !session.CanReceive() {
		return session.SendResponse(protocol.DELIVER_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	deliver, err := protocol.ParseSubmitSMPDU(pdu.Body) // Same structure as submit_sm
	if err != nil {
		log.Printf("Session %s: Failed to parse deliver_sm: %v", session.ID, err)
		return session.SendResponse(protocol.DELIVER_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	// Increment message counter
	if err := h.authManager.IncrementMessageCount(session.SystemID, false); err != nil {
		log.Printf("Session %s: Failed to increment message counter: %v", session.ID, err)
	}

	log.Printf("Session %s: Deliver SM from %s to %s, message: %s", session.ID, deliver.SourceAddr, deliver.DestinationAddr, deliver.ShortMessage)

	// Send deliver response
	return session.SendResponse(protocol.DELIVER_SM_RESP, protocol.ESME_ROK, nil, pdu.SequenceNumber)
}

// SendDeliverSM sends a deliver_sm to a session
func (h *SMSHandler) SendDeliverSM(session *session.Session, deliver *protocol.DeliverSMPDU) error {
	// Convert to PDU
	pdu := &protocol.PDU{
		CommandLength:  uint32(16 + len(protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliver)))),
		CommandID:      protocol.DELIVER_SM,
		CommandStatus:  0,
		SequenceNumber: session.GetNextSequenceNumber(),
		Body:           protocol.SerializeSubmitSMPDU((*protocol.SubmitSMPDU)(deliver)),
	}
	return session.SendPDU(pdu)
}

// GenerateMessageID generates a unique message ID
func (h *SMSHandler) GenerateMessageID() string {
	return "MSG" + time.Now().Format("20060102150405")
}
