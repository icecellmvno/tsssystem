package auth

// AuthManager interface defines the methods that any auth manager must implement
type AuthManager interface {
	AuthenticateUser(systemID, password string) (*SmppUser, error)
	GetActiveSessionsCount(systemID string) (int, error)
	IncrementMessageCount(systemID string, isSent bool) error
	AddSession(systemID, sessionID, remoteAddr, bindType string) error
	RemoveSession(systemID, sessionID string) error
	UpdateSessionActivity(sessionID string) error
	CheckRateLimit(systemID string) (bool, error)
	StartCleanupRoutine()
	DisconnectUserSessions(systemID string)
	Close() error
	GetUserStats(systemID string) (map[string]interface{}, error)
}
