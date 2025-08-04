package session

import (
	"context"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"smppserver/protocol"
)

// SessionState represents the current state of an SMPP session
type SessionState int

const (
	StateOpen SessionState = iota
	StateBoundRX
	StateBoundTX
	StateBoundTRX
	StateClosed
)

// Session represents an SMPP session
type Session struct {
	ID                string
	Conn              net.Conn
	State             SessionState
	SystemID          string
	Password          string
	SystemType        string
	InterfaceVersion  uint8
	AddressRange      string
	SequenceNumber    uint32
	LastActivity      time.Time
	LastReceivedAt    time.Time // Son alınan PDU zamanı
	EnquireLinkTicker *time.Ticker
	Context           context.Context
	Cancel            context.CancelFunc
	Mutex             sync.RWMutex
	MessageQueue      chan *protocol.PDU
	IsAuthenticated   bool
}

// SessionManager manages all active SMPP sessions
type SessionManager struct {
	sessions    map[string]*Session
	mutex       sync.RWMutex
	Config      *SessionConfig
	authManager interface {
		RemoveSession(systemID, sessionID string) error
	}
}

// SessionConfig holds configuration for session management
type SessionConfig struct {
	MaxSessions         int
	SessionTimeout      time.Duration
	EnquireLinkInterval time.Duration
	ReadTimeout         time.Duration
	WriteTimeout        time.Duration
}

// NewSessionManager creates a new session manager
func NewSessionManager(config *SessionConfig, authManager interface {
	RemoveSession(systemID, sessionID string) error
}) *SessionManager {
	return &SessionManager{
		sessions:    make(map[string]*Session),
		Config:      config,
		authManager: authManager,
	}
}

// NewSession creates a new SMPP session
func NewSession(conn net.Conn, config *SessionConfig) *Session {
	ctx, cancel := context.WithCancel(context.Background())

	now := time.Now()

	session := &Session{
		ID:              generateSessionID(),
		Conn:            conn,
		State:           StateOpen,
		SequenceNumber:  1,
		LastActivity:    now,
		LastReceivedAt:  now,
		Context:         ctx,
		Cancel:          cancel,
		MessageQueue:    make(chan *protocol.PDU, 100),
		IsAuthenticated: false,
	}

	// Set connection timeouts
	conn.SetReadDeadline(time.Now().Add(config.ReadTimeout))
	conn.SetWriteDeadline(time.Now().Add(config.WriteTimeout))

	return session
}

// AddSession adds a session to the manager
func (sm *SessionManager) AddSession(session *Session) error {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	if len(sm.sessions) >= sm.Config.MaxSessions {
		return fmt.Errorf("maximum number of sessions reached")
	}

	sm.sessions[session.ID] = session
	log.Printf("Session %s added. Total sessions: %d", session.ID, len(sm.sessions))
	return nil
}

// RemoveSession removes a session from the manager
func (sm *SessionManager) RemoveSession(sessionID string) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	if session, exists := sm.sessions[sessionID]; exists {
		// Auth manager'dan da session'ı kaldır
		if sm.authManager != nil && session.SystemID != "" {
			if err := sm.authManager.RemoveSession(session.SystemID, sessionID); err != nil {
				log.Printf("Failed to remove session from auth manager: %v", err)
			}
		}

		session.Close()
		delete(sm.sessions, sessionID)
		log.Printf("Session %s removed from session manager. Total sessions: %d", sessionID, len(sm.sessions))
	}
}

// GetSession retrieves a session by ID
func (sm *SessionManager) GetSession(sessionID string) (*Session, bool) {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	session, exists := sm.sessions[sessionID]
	return session, exists
}

// GetSessionBySystemID retrieves a session by system ID
func (sm *SessionManager) GetSessionBySystemID(systemID string) (*Session, bool) {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	for _, session := range sm.sessions {
		if session.SystemID == systemID {
			return session, true
		}
	}
	return nil, false
}

// GetSessionsBySystemID gets all sessions for a given system ID
func (sm *SessionManager) GetSessionsBySystemID(systemID string) []*Session {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	var sessions []*Session
	for _, session := range sm.sessions {
		if session.SystemID == systemID {
			sessions = append(sessions, session)
		}
	}
	return sessions
}

// GetAllSessions returns all active sessions
func (sm *SessionManager) GetAllSessions() []*Session {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()

	sessions := make([]*Session, 0, len(sm.sessions))
	for _, session := range sm.sessions {
		sessions = append(sessions, session)
	}
	return sessions
}

// CloseAllSessions closes all active sessions
func (sm *SessionManager) CloseAllSessions() {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	for _, session := range sm.sessions {
		session.Close()
	}
	sm.sessions = make(map[string]*Session)
}

// CleanupInactiveSessions removes sessions that have timed out
func (sm *SessionManager) CleanupInactiveSessions() {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	now := time.Now()
	removedCount := 0

	for sessionID, session := range sm.sessions {
		// Use a more conservative timeout check
		if now.Sub(session.LastActivity) > sm.Config.SessionTimeout {
			log.Printf("Session %s: Removing due to inactivity (last activity: %v, timeout: %v)",
				sessionID, session.LastActivity, sm.Config.SessionTimeout)

			// Auth manager'dan da session'ı kaldır
			if sm.authManager != nil && session.SystemID != "" {
				if err := sm.authManager.RemoveSession(session.SystemID, sessionID); err != nil {
					log.Printf("Failed to remove session from auth manager during cleanup: %v", err)
				}
			}

			session.Close()
			delete(sm.sessions, sessionID)
			removedCount++
		}
	}

	if removedCount > 0 {
		log.Printf("Session manager cleanup: Removed %d inactive sessions. Remaining sessions: %d", removedCount, len(sm.sessions))
	} else {
		log.Printf("Session manager cleanup: No inactive sessions found. Total sessions: %d", len(sm.sessions))
	}
}

// StartCleanupRoutine starts a background routine to clean up inactive sessions
func (sm *SessionManager) StartCleanupRoutine() {
	ticker := time.NewTicker(2 * time.Minute) // Run cleanup every 2 minutes instead of every minute
	go func() {
		for range ticker.C {
			sm.CleanupInactiveSessions()
		}
	}()
}

// SetState sets the session state
func (s *Session) SetState(state SessionState) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	s.State = state
	s.LastActivity = time.Now()
}

// GetState returns the current session state
func (s *Session) GetState() SessionState {
	s.Mutex.RLock()
	defer s.Mutex.RUnlock()
	return s.State
}

// IsBound returns true if the session is in a bound state
func (s *Session) IsBound() bool {
	state := s.GetState()
	isBound := state == StateBoundRX || state == StateBoundTX || state == StateBoundTRX
	log.Printf("Session %s: IsBound check - State: %d, IsBound: %t", s.ID, state, isBound)
	return isBound
}

// CanReceive returns true if the session can receive messages
func (s *Session) CanReceive() bool {
	state := s.GetState()
	return state == StateBoundRX || state == StateBoundTRX
}

// CanTransmit returns true if the session can transmit messages
func (s *Session) CanTransmit() bool {
	state := s.GetState()
	return state == StateBoundTX || state == StateBoundTRX
}

// CanSendPDU returns true if the session can send PDUs
func (s *Session) CanSendPDU() bool {
	s.Mutex.RLock()
	defer s.Mutex.RUnlock()
	state := s.State
	conn := s.Conn
	return state != StateClosed && conn != nil
}

// UpdateActivity updates the last activity time
func (s *Session) UpdateActivity() {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	s.LastActivity = time.Now()
}

// GetNextSequenceNumber returns the next sequence number
func (s *Session) GetNextSequenceNumber() uint32 {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	seq := s.SequenceNumber
	s.SequenceNumber++
	return seq
}

// SendPDU sends a PDU to the client
func (s *Session) SendPDU(pdu *protocol.PDU) error {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()

	log.Printf("Session %s: SendPDU called - proceeding with send", s.ID)

	// Set write deadline with longer timeout for better stability
	s.Conn.SetWriteDeadline(time.Now().Add(time.Second * 60))

	log.Printf("Session %s: Sending PDU - CommandID: 0x%08X, Status: 0x%08X, Seq: %d, BodyLen: %d",
		s.ID, pdu.CommandID, pdu.CommandStatus, pdu.SequenceNumber, len(pdu.Body))

	log.Printf("Session %s: PDU Body hex: %X", s.ID, pdu.Body)

	// Write PDU
	if err := protocol.WritePDU(s.Conn, pdu); err != nil {
		log.Printf("Session %s: Failed to send PDU: %v", s.ID, err)
		return fmt.Errorf("failed to send PDU: %v", err)
	}

	s.LastActivity = time.Now()
	log.Printf("Session %s: PDU sent successfully", s.ID)
	return nil
}

// SendResponse sends a response PDU to the client
func (s *Session) SendResponse(commandID uint32, status uint32, body []byte, sequenceNumber uint32) error {
	// Check if session can send responses
	if !s.CanSendPDU() {
		log.Printf("Session %s: Cannot send response - session is not in valid state", s.ID)
		return fmt.Errorf("cannot send response - session is not in valid state")
	}

	log.Printf("Session %s: Creating response PDU - CommandID: 0x%08X, Status: 0x%08X, Seq: %d, BodyLen: %d, Body: %X",
		s.ID, commandID, status, sequenceNumber, len(body), body)

	response := &protocol.PDU{
		CommandLength:  uint32(16 + len(body)),
		CommandID:      commandID,
		CommandStatus:  status,
		SequenceNumber: sequenceNumber,
		Body:           body,
	}

	log.Printf("Session %s: Response PDU created - TotalLength: %d", s.ID, response.CommandLength)

	// Add detailed PDU logging with hex dump
	log.Printf("Session %s: Generated bind response PDU: ID=0x%08X, Status=0x%08X, Seq=%d, Body=%X",
		s.ID, response.CommandID, response.CommandStatus, response.SequenceNumber, response.Body)

	return s.SendPDU(response)
}

// SendGenericNACK sends a generic NACK
func (s *Session) SendGenericNACK(sequenceNumber uint32) error {
	// Check if session can send NACKs
	if !s.CanSendPDU() {
		log.Printf("Session %s: Cannot send generic NACK - session is not in valid state", s.ID)
		return fmt.Errorf("cannot send generic NACK - session is not in valid state")
	}

	response := &protocol.PDU{
		CommandLength:  16,
		CommandID:      protocol.GENERIC_NACK,
		CommandStatus:  protocol.ESME_RSYSERR,
		SequenceNumber: sequenceNumber,
		Body:           []byte{},
	}

	return s.SendPDU(response)
}

// StartEnquireLink starts the enquire link routine
func (s *Session) StartEnquireLink() {
	s.EnquireLinkTicker = time.NewTicker(time.Duration(60) * time.Second)
	go func() {
		for {
			select {
			case <-s.EnquireLinkTicker.C:
				if s.GetState() != StateClosed && s.CanSendPDU() {
					enquireLink := &protocol.PDU{
						CommandLength:  16,
						CommandID:      protocol.ENQUIRE_LINK,
						CommandStatus:  0,
						SequenceNumber: s.GetNextSequenceNumber(),
						Body:           []byte{},
					}
					if err := s.SendPDU(enquireLink); err != nil {
						log.Printf("Failed to send enquire_link to session %s: %v", s.ID, err)
						s.Close()
						return
					}
					// Timeout kontrolü: Son alınan PDU üzerinden 120 saniye geçtiyse session'ı kapat
					if time.Since(s.LastReceivedAt) > 120*time.Second {
						log.Printf("Session %s: No enquire_link_resp or PDU received in 120s, closing session", s.ID)
						s.Close()
						return
					}
				}
			case <-s.Context.Done():
				return
			}
		}
	}()
}

// StopEnquireLink stops the enquire link routine
func (s *Session) StopEnquireLink() {
	if s.EnquireLinkTicker != nil {
		s.EnquireLinkTicker.Stop()
	}
}

// Close closes the session
func (s *Session) Close() {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()

	if s.State == StateClosed {
		return
	}

	s.State = StateClosed
	s.StopEnquireLink()
	s.Cancel()

	if s.Conn != nil {
		s.Conn.Close()
	}

	close(s.MessageQueue)

	log.Printf("Session %s closed", s.ID)
}

// HandleConnection handles the SMPP connection
func (s *Session) HandleConnection(handler SessionHandler) {
	defer s.Close()

	log.Printf("Starting SMPP session %s from %s", s.ID, s.Conn.RemoteAddr())

	// Start enquire link routine
	s.StartEnquireLink()

	// Handle incoming PDUs
	for {
		select {
		case <-s.Context.Done():
			return
		default:
			// Set read deadline - use longer timeout for better stability
			s.Conn.SetReadDeadline(time.Now().Add(time.Second * 60))

			// Read PDU
			pdu, err := protocol.ReadPDU(s.Conn)
			if err != nil {
				log.Printf("Session %s: failed to read PDU: %v", s.ID, err)
				return
			}

			// Her PDU alındığında zamanı güncelle
			s.LastReceivedAt = time.Now()

			// Update activity
			s.UpdateActivity()

			// Handle PDU
			if err := handler.HandlePDU(s, pdu); err != nil {
				log.Printf("Session %s: failed to handle PDU: %v", s.ID, err)
				// Only send generic NACK if session is still valid
				if s.CanSendPDU() {
					s.SendGenericNACK(pdu.SequenceNumber) // Use pdu.SequenceNumber for NACK
				}
			}
		}
	}
}

// SessionHandler defines the interface for handling SMPP PDUs
type SessionHandler interface {
	HandlePDU(session *Session, pdu *protocol.PDU) error
}

// generateSessionID generates a unique session ID
func generateSessionID() string {
	return fmt.Sprintf("session_%d", time.Now().UnixNano())
}
