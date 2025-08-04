package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// BindHandler handles bind-related operations
type BindHandler struct {
	authManager    auth.AuthManager
	sessionManager *session.SessionManager
}

// NewBindHandler creates a new bind handler
func NewBindHandler(authManager auth.AuthManager, sessionManager *session.SessionManager) *BindHandler {
	return &BindHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleBindReceiver handles bind_receiver requests
func (h *BindHandler) HandleBindReceiver(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Processing bind_receiver request", session.ID)

	if session.IsBound() {
		log.Printf("Session %s: Already bound, sending error response", session.ID)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	bind, err := protocol.ParseBindPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse bind_receiver: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Parsed bind request - SystemID: %s, SystemType: %s", session.ID, bind.SystemID, bind.SystemType)

	// Check for empty system ID or password
	if bind.SystemID == "" {
		log.Printf("Session %s: Empty system ID", session.ID)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RINVSYSID, nil, pdu.SequenceNumber)
	}

	if bind.Password == "" {
		log.Printf("Session %s: Empty password", session.ID)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	// Authenticate user
	log.Printf("Session %s: Authenticating user %s", session.ID, bind.SystemID)
	smppUser, err := h.authManager.AuthenticateUser(bind.SystemID, bind.Password)
	if err != nil {
		log.Printf("Session %s: Authentication failed for %s: %v", session.ID, bind.SystemID, err)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Authentication successful for user %s", session.ID, bind.SystemID)

	// Check connection limits (using MaxConnectionSpeed as max connections)
	activeCount, err := h.authManager.GetActiveSessionsCount(bind.SystemID)
	if err != nil {
		log.Printf("Session %s: Failed to get active sessions count: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RSYSERR, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Active sessions count: %d, Max allowed: %d", session.ID, activeCount, smppUser.MaxConnectionSpeed)

	if activeCount >= smppUser.MaxConnectionSpeed {
		log.Printf("Session %s: Too many connections for user %s", session.ID, bind.SystemID)
		return session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	// Update session with user info
	session.SystemID = bind.SystemID
	session.Password = bind.Password
	session.SystemType = bind.SystemType
	session.InterfaceVersion = bind.InterfaceVersion
	session.AddressRange = bind.AddressRange
	session.IsAuthenticated = true

	// Set session state
	session.SetState(1) // StateBoundRX
	log.Printf("Session %s: Session state set to StateBoundRX", session.ID)

	// Send bind response immediately
	responseBody := protocol.SerializeBindRespPDU(bind.SystemID)

	log.Printf("Session %s: Generated bind response body, length: %d", session.ID, len(responseBody))

	// Add session to auth manager
	remoteAddr := session.Conn.RemoteAddr().String()
	if err := h.authManager.AddSession(bind.SystemID, session.ID, remoteAddr, "receiver"); err != nil {
		log.Printf("Session %s: Failed to add session to auth manager: %v", session.ID, err)
		// Don't fail the bind if auth manager fails, just log it
	} else {
		log.Printf("Session %s: Successfully added to auth manager", session.ID)
	}

	log.Printf("Session %s: Sending bind_receiver response for %s", session.ID, bind.SystemID)
	err = session.SendResponse(protocol.BIND_RECEIVER_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
	if err != nil {
		log.Printf("Session %s: Failed to send bind response: %v", session.ID, err)
		return err
	}

	log.Printf("Session %s: Bind receiver successful for %s", session.ID, bind.SystemID)
	return nil
}

// HandleBindTransmitter handles bind_transmitter requests
func (h *BindHandler) HandleBindTransmitter(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Processing bind_transmitter request", session.ID)

	if session.IsBound() {
		log.Printf("Session %s: Already bound, sending error response", session.ID)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	bind, err := protocol.ParseBindPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse bind_transmitter: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Parsed bind request - SystemID: %s, SystemType: %s", session.ID, bind.SystemID, bind.SystemType)

	// Check for empty system ID or password
	if bind.SystemID == "" {
		log.Printf("Session %s: Empty system ID", session.ID)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RINVSYSID, nil, pdu.SequenceNumber)
	}

	if bind.Password == "" {
		log.Printf("Session %s: Empty password", session.ID)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	// Authenticate user
	log.Printf("Session %s: Authenticating user %s", session.ID, bind.SystemID)
	smppUser, err := h.authManager.AuthenticateUser(bind.SystemID, bind.Password)
	if err != nil {
		log.Printf("Session %s: Authentication failed for %s: %v", session.ID, bind.SystemID, err)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Authentication successful for user %s", session.ID, bind.SystemID)

	// Check connection limits (using MaxConnectionSpeed as max connections)
	activeCount, err := h.authManager.GetActiveSessionsCount(bind.SystemID)
	if err != nil {
		log.Printf("Session %s: Failed to get active sessions count: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RSYSERR, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Active sessions count: %d, Max allowed: %d", session.ID, activeCount, smppUser.MaxConnectionSpeed)

	if activeCount >= smppUser.MaxConnectionSpeed {
		log.Printf("Session %s: Too many connections for user %s", session.ID, bind.SystemID)
		return session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	// Update session with user info
	session.SystemID = bind.SystemID
	session.Password = bind.Password
	session.SystemType = bind.SystemType
	session.InterfaceVersion = bind.InterfaceVersion
	session.AddressRange = bind.AddressRange
	session.IsAuthenticated = true

	// Set session state
	session.SetState(2) // StateBoundTX
	log.Printf("Session %s: Session state set to StateBoundTX", session.ID)

	// Send bind response immediately
	responseBody := protocol.SerializeBindRespPDU(bind.SystemID)

	log.Printf("Session %s: Generated bind response body, length: %d", session.ID, len(responseBody))

	// Add session to auth manager
	remoteAddr := session.Conn.RemoteAddr().String()
	if err := h.authManager.AddSession(bind.SystemID, session.ID, remoteAddr, "transmitter"); err != nil {
		log.Printf("Session %s: Failed to add session to auth manager: %v", session.ID, err)
		// Don't fail the bind if auth manager fails, just log it
	} else {
		log.Printf("Session %s: Successfully added to auth manager", session.ID)
	}

	log.Printf("Session %s: Sending bind_transmitter response for %s", session.ID, bind.SystemID)
	err = session.SendResponse(protocol.BIND_TRANSMITTER_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
	if err != nil {
		log.Printf("Session %s: Failed to send bind response: %v", session.ID, err)
		return err
	}

	log.Printf("Session %s: Bind transmitter successful for %s", session.ID, bind.SystemID)
	return nil
}

// HandleBindTransceiver handles bind_transceiver requests
func (h *BindHandler) HandleBindTransceiver(session *session.Session, pdu *protocol.PDU) error {
	log.Printf("Session %s: Processing bind_transceiver request", session.ID)
	log.Printf("Session %s: Current state: %d, IsBound: %t", session.ID, session.GetState(), session.IsBound())

	if session.IsBound() {
		log.Printf("Session %s: Already bound, sending error response", session.ID)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	bind, err := protocol.ParseBindPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse bind_transceiver: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RINVCMDLEN, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Parsed bind request - SystemID: %s, SystemType: %s", session.ID, bind.SystemID, bind.SystemType)

	// Check for empty system ID or password
	if bind.SystemID == "" {
		log.Printf("Session %s: Empty system ID", session.ID)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RINVSYSID, nil, pdu.SequenceNumber)
	}

	if bind.Password == "" {
		log.Printf("Session %s: Empty password", session.ID)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	// Authenticate user
	log.Printf("Session %s: Authenticating user %s", session.ID, bind.SystemID)
	smppUser, err := h.authManager.AuthenticateUser(bind.SystemID, bind.Password)
	if err != nil {
		log.Printf("Session %s: Authentication failed for %s: %v", session.ID, bind.SystemID, err)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RINVPASWD, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Authentication successful for user %s", session.ID, bind.SystemID)

	// Check connection limits (using MaxConnectionSpeed as max connections)
	activeCount, err := h.authManager.GetActiveSessionsCount(bind.SystemID)
	if err != nil {
		log.Printf("Session %s: Failed to get active sessions count: %v", session.ID, err)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RSYSERR, nil, pdu.SequenceNumber)
	}

	log.Printf("Session %s: Active sessions count: %d, Max allowed: %d", session.ID, activeCount, smppUser.MaxConnectionSpeed)

	if activeCount >= smppUser.MaxConnectionSpeed {
		log.Printf("Session %s: Too many connections for user %s", session.ID, bind.SystemID)
		return session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_RALYBND, nil, pdu.SequenceNumber)
	}

	// Update session with user info
	session.SystemID = bind.SystemID
	session.Password = bind.Password
	session.SystemType = bind.SystemType
	session.InterfaceVersion = bind.InterfaceVersion
	session.AddressRange = bind.AddressRange
	session.IsAuthenticated = true

	// Set session state
	session.SetState(3) // StateBoundTRX
	log.Printf("Session %s: Session state set to StateBoundTRX", session.ID)

	// Send bind response immediately
	responseBody := protocol.SerializeBindRespPDU(bind.SystemID)

	log.Printf("Session %s: Generated bind response body, length: %d", session.ID, len(responseBody))

	// Add session to auth manager
	remoteAddr := session.Conn.RemoteAddr().String()
	if err := h.authManager.AddSession(bind.SystemID, session.ID, remoteAddr, "transceiver"); err != nil {
		log.Printf("Session %s: Failed to add session to auth manager: %v", session.ID, err)
		// Don't fail the bind if auth manager fails, just log it
	} else {
		log.Printf("Session %s: Successfully added to auth manager", session.ID)
	}

	log.Printf("Session %s: Sending bind_transceiver response for %s", session.ID, bind.SystemID)
	err = session.SendResponse(protocol.BIND_TRANSCEIVER_RESP, protocol.ESME_ROK, responseBody, pdu.SequenceNumber)
	if err != nil {
		log.Printf("Session %s: Failed to send bind response: %v", session.ID, err)
		return err
	}

	log.Printf("Session %s: Bind transceiver successful for %s", session.ID, bind.SystemID)
	return nil
}
