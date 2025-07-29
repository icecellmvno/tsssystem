package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// QuerySMHandler handles query_sm operations
type QuerySMHandler struct {
	authManager    auth.AuthManager
	sessionManager *session.SessionManager
}

// NewQuerySMHandler creates a new query SM handler
func NewQuerySMHandler(authManager auth.AuthManager, sessionManager *session.SessionManager) *QuerySMHandler {
	return &QuerySMHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleQuerySM handles query_sm requests
func (h *QuerySMHandler) HandleQuerySM(session *session.Session, pdu *protocol.PDU) error {
	if !session.IsBound() {
		return session.SendResponse(protocol.QUERY_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	query, err := protocol.ParseQuerySMPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse query_sm: %v", session.ID, err)
		return session.SendResponse(protocol.QUERY_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Query SM for message ID: %s", session.ID, query.MessageID)

	// Send query_sm response
	responseBody := protocol.SerializeQuerySMRespPDU(&protocol.QuerySMRespPDU{
		MessageID:    query.MessageID,
		FinalDate:    "",
		MessageState: 0,
		ErrorCode:    0,
	})

	return session.SendResponse(protocol.QUERY_SM_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
}
