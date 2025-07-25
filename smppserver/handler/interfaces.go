package handler

import (
	"smppserver/protocol"
	"smppserver/session"
)

// BindHandlerInterface defines the interface for bind operations
type BindHandlerInterface interface {
	HandleBindReceiver(session *session.Session, pdu *protocol.PDU) error
	HandleBindTransmitter(session *session.Session, pdu *protocol.PDU) error
	HandleBindTransceiver(session *session.Session, pdu *protocol.PDU) error
}

// SMSHandlerInterface defines the interface for SMS operations
type SMSHandlerInterface interface {
	HandleSubmitSM(session *session.Session, pdu *protocol.PDU) error
	HandleDeliverSM(session *session.Session, pdu *protocol.PDU) error
	SendDeliverSM(session *session.Session, deliver *protocol.DeliverSMPDU) error
	GenerateMessageID() string
}

// SessionHandlerInterface defines the interface for session management operations
type SessionHandlerInterface interface {
	HandleUnbind(session *session.Session, pdu *protocol.PDU) error
	HandleEnquireLink(session *session.Session, pdu *protocol.PDU) error
	HandleEnquireLinkResp(session *session.Session, pdu *protocol.PDU) error
}

// DataSMHandlerInterface defines the interface for data_sm operations
type DataSMHandlerInterface interface {
	HandleDataSM(session *session.Session, pdu *protocol.PDU) error
	GenerateMessageID() string
}

// QuerySMHandlerInterface defines the interface for query_sm operations
type QuerySMHandlerInterface interface {
	HandleQuerySM(session *session.Session, pdu *protocol.PDU) error
}

// CancelSMHandlerInterface defines the interface for cancel_sm operations
type CancelSMHandlerInterface interface {
	HandleCancelSM(session *session.Session, pdu *protocol.PDU) error
}

// ReplaceSMHandlerInterface defines the interface for replace_sm operations
type ReplaceSMHandlerInterface interface {
	HandleReplaceSM(session *session.Session, pdu *protocol.PDU) error
}

// AlertNotificationHandlerInterface defines the interface for alert_notification operations
type AlertNotificationHandlerInterface interface {
	HandleAlertNotification(session *session.Session, pdu *protocol.PDU) error
}

// SMPPHandlerInterface defines the main SMPP handler interface
type SMPPHandlerInterface interface {
	HandlePDU(session *session.Session, pdu *protocol.PDU) error
	SendDeliverSM(session *session.Session, deliver *protocol.DeliverSMPDU) error
	GenerateMessageID() string
}
