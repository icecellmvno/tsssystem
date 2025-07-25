package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// DataSMHandler handles data_sm operations
type DataSMHandler struct {
	authManager    *auth.RedisAuthManager
	sessionManager *session.SessionManager
}

// NewDataSMHandler creates a new data SM handler
func NewDataSMHandler(authManager *auth.RedisAuthManager, sessionManager *session.SessionManager) *DataSMHandler {
	return &DataSMHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleDataSM handles data_sm requests
func (h *DataSMHandler) HandleDataSM(session *session.Session, pdu *protocol.PDU) error {
	if !session.IsBound() {
		return session.SendResponse(protocol.DATA_SM_RESP, protocol.ESME_RINVBNDSTS, nil, pdu.SequenceNumber)
	}

	data, err := protocol.ParseDataSMPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse data_sm: %v", session.ID, err)
		return session.SendResponse(protocol.DATA_SM_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Data SM from %s to %s", session.ID, data.SourceAddr, data.DestinationAddr)

	// Send data_sm response
	responseBody := protocol.SerializeDataSMRespPDU(&protocol.DataSMRespPDU{
		MessageID:          "",
		OptionalParameters: make(map[uint16][]byte),
	})

	return session.SendResponse(protocol.DATA_SM_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
}
