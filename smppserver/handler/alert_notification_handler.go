package handler

import (
	"log"
	"smppserver/auth"
	"smppserver/protocol"
	"smppserver/session"
)

// AlertNotificationHandler handles alert_notification operations
type AlertNotificationHandler struct {
	authManager    *auth.RedisAuthManager
	sessionManager *session.SessionManager
}

// NewAlertNotificationHandler creates a new alert notification handler
func NewAlertNotificationHandler(authManager *auth.RedisAuthManager, sessionManager *session.SessionManager) *AlertNotificationHandler {
	return &AlertNotificationHandler{
		authManager:    authManager,
		sessionManager: sessionManager,
	}
}

// HandleAlertNotification handles alert_notification requests
func (h *AlertNotificationHandler) HandleAlertNotification(session *session.Session, pdu *protocol.PDU) error {
	alert, err := protocol.ParseAlertNotificationPDU(pdu.Body)
	if err != nil {
		log.Printf("Session %s: Failed to parse alert_notification: %v", session.ID, err)
		return nil // Alert notifications don't have responses
	}

	log.Printf("Session %s: Alert notification from %s", session.ID, alert.SourceAddr)

	// Alert notifications don't require a response
	return nil
}
