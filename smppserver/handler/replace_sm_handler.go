package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// ReplaceSMHandler handles replace_sm operations
type ReplaceSMHandler struct {
	authManager    auth.AuthManager
	sessionManager *session.SessionManager
}

// NewReplaceSMHandler creates a new replace SM handler
func NewReplaceSMHandler(authManager auth.AuthManager, sessionManager *session.SessionManager) *ReplaceSMHandler {
	return &ReplaceSMHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleReplaceSM handles replace_sm requests
func (h *ReplaceSMHandler) HandleReplaceSM(session *session.Session, pdu *protocol.PDU) error {
	if !session.IsBound() {
		return session.SendResponse(protocol.REPLACE_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	replace, err := protocol.ParseReplaceSMPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse replace_sm: %v", session.ID, err)
		return session.SendResponse(protocol.REPLACE_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Replace SM for message ID: %s", session.ID, replace.MessageID)

	// Send replace_sm response
	responseBody := protocol.SerializeReplaceSMRespPDU()

	return session.SendResponse(protocol.REPLACE_SM_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
}

// HandleReplaceSMResp handles replace_sm_resp responses
func (h *ReplaceSMHandler) HandleReplaceSMResp(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received replace_sm_resp", session.ID)
	// For replace_sm_resp, we just log it as it's a response to our replace_sm
	return nil
}
