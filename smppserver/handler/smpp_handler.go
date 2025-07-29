package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/rabbitmq"
	"smppserver/session"
	"time"
)

// SMPPHandler handles SMPP protocol operations
type SMPPHandler struct {
	authManager    auth.AuthManager
	sessionManager *session.SessionManager

	// Separate handlers
	bindHandler              *BindHandler
	smsHandler               *SMSHandler
	sessionHandler           *SessionHandler
	dataSMHandler            *DataSMHandler
	querySMHandler           *QuerySMHandler
	cancelSMHandler          *CancelSMHandler
	replaceSMHandler         *ReplaceSMHandler
	alertNotificationHandler *AlertNotificationHandler
}

// NewSMPPHandler creates a new SMPP handler
func NewSMPPHandler(authManager auth.AuthManager, sessionManager *session.SessionManager, rabbitMQClient *rabbitmq.RabbitMQClient) *SMPPHandler {
	return &SMPPHandler{
		authManager:              authManager,
		sessionManager:           sessionManager,
		bindHandler:              NewBindHandler(authManager, sessionManager),
		smsHandler:               NewSMSHandler(authManager, sessionManager, rabbitMQClient),
		sessionHandler:           NewSessionHandler(authManager, sessionManager),
		dataSMHandler:            NewDataSMHandler(authManager, sessionManager),
		querySMHandler:           NewQuerySMHandler(authManager, sessionManager),
		cancelSMHandler:          NewCancelSMHandler(authManager, sessionManager),
		replaceSMHandler:         NewReplaceSMHandler(authManager, sessionManager),
		alertNotificationHandler: NewAlertNotificationHandler(authManager, sessionManager),
	}
}

// HandlePDU handles incoming SMPP PDUs
func (h *SMPPHandler) HandlePDU(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received PDU: %s", session.ID, pdu.String())

	switch pdu.CommandID {
	// Bind operations
	case protocol.BIND_RECEIVER:
		return h.bindHandler.HandleBindReceiver(session, pdu)
	case protocol.BIND_TRANSMITTER:
		return h.bindHandler.HandleBindTransmitter(session, pdu)
	case protocol.BIND_TRANSCEIVER:
		return h.bindHandler.HandleBindTransceiver(session, pdu)
	case protocol.OUTBIND:
		return h.handleOutbind(session, pdu)

	// Session management
	case protocol.UNBIND:
		return h.sessionHandler.HandleUnbind(session, pdu)
	case protocol.ENQUIRE_LINK:
		return h.sessionHandler.HandleEnquireLink(session, pdu)
	case protocol.ENQUIRE_LINK_RESP:
		return h.sessionHandler.HandleEnquireLinkResp(session, pdu)

	// SMS operations
	case protocol.SUBMIT_SM:
		return h.smsHandler.HandleSubmitSM(session, pdu)
	case protocol.DELIVER_SM:
		return h.smsHandler.HandleDeliverSM(session, pdu)
	case protocol.DATA_SM:
		return h.dataSMHandler.HandleDataSM(session, pdu)

	// Query operations
	case protocol.QUERY_SM:
		return h.querySMHandler.HandleQuerySM(session, pdu)

	// Cancel operations
	case protocol.CANCEL_SM:
		return h.cancelSMHandler.HandleCancelSM(session, pdu)

	// Replace operations
	case protocol.REPLACE_SM:
		return h.replaceSMHandler.HandleReplaceSM(session, pdu)

	// Alert notification
	case protocol.ALERT_NOTIFICATION:
		return h.alertNotificationHandler.HandleAlertNotification(session, pdu)

	default:
		log.Printf("Session %s: Unknown command ID: 0x%08X", session.ID, pdu.CommandID)
		return session.SendGenericNACK(pdu.SequenceNumber)
	}
}

// handleOutbind handles outbind requests (ESME initiated)
func (h *SMPPHandler) handleOutbind(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received outbind request", session.ID)
	return session.SendGenericNACK(pdu.SequenceNumber)
}

// SendDeliverSM sends a deliver_sm PDU to the session
func (h *SMPPHandler) SendDeliverSM(session *session.Session, deliver *protocol.DeliverSMPDU) error {
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
func (h *SMPPHandler) GenerateMessageID() string {
	return "MSG" + time.Now().Format("20060102150405")
}
