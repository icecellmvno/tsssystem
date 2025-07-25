package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// CancelSMHandler handles cancel_sm operations
type CancelSMHandler struct {
	authManager    *auth.RedisAuthManager
	sessionManager *session.SessionManager
}

// NewCancelSMHandler creates a new cancel SM handler
func NewCancelSMHandler(authManager *auth.RedisAuthManager, sessionManager *session.SessionManager) *CancelSMHandler {
	return &CancelSMHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleCancelSM handles cancel_sm requests
func (h *CancelSMHandler) HandleCancelSM(session *session.Session, pdu *protocol.PDU) error {
	if !session.IsBound() {
		return session.SendResponse(protocol.CANCEL_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	cancel, err := protocol.ParseCancelSMPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse cancel_sm: %v", session.ID, err)
		return session.SendResponse(protocol.CANCEL_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Cancel SM for message ID: %s", session.ID, cancel.MessageID)

	// Send cancel_sm response
	responseBody := protocol.SerializeCancelSMRespPDU()

	return session.SendResponse(protocol.CANCEL_SM_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
}
