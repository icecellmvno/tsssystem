package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// SessionHandler handles session-related operations
type SessionHandler struct {
	authManager    *auth.RedisAuthManager
	sessionManager *session.SessionManager
}

// NewSessionHandler creates a new session handler
func NewSessionHandler(authManager *auth.RedisAuthManager, sessionManager *session.SessionManager) *SessionHandler {
	return &SessionHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleUnbind handles unbind requests
func (h *SessionHandler) HandleUnbind(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received unbind request", session.ID)

	// Remove session from Redis
	if session.SystemID != "" {
		if err := h.authManager.RemoveSession(session.SystemID, session.ID); err != nil {
			log.Printf("Session %s: Failed to remove session: %v", session.ID, err)
		}
	}

	// Send unbind response
	if err := session.SendResponse(protocol.UNBIND_RESP, protocol.ESME_ROK, nil, pdu.SequenceNumber); err != nil {
		log.Printf("Session %s: Failed to send unbind response: %v", session.ID, err)
	}

	// Close session
	session.Close()

	log.Printf("Session %s: Unbind successful", session.ID)
	return nil
}

// HandleEnquireLink handles enquire_link requests
func (h *SessionHandler) HandleEnquireLink(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received enquire_link", session.ID)

	// Update session activity
	session.UpdateActivity()

	// Send enquire_link response
	return session.SendResponse(protocol.ENQUIRE_LINK_RESP, protocol.ESME_ROK, nil, pdu.SequenceNumber)
}

// HandleEnquireLinkResp handles enquire_link_resp responses
func (h *SessionHandler) HandleEnquireLinkResp(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Received enquire_link_resp", session.ID)

	// Update session activity
	session.UpdateActivity()

	return nil
}
