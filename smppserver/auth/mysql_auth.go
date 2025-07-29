package auth

import (
	"context"
	"fmt"
	"log"
	"time"

	"smppserver/session"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User represents an SMPP user (shared with redis_auth.go)

// SmppUser represents the database model for SMPP users
type SmppUser struct {
	ID                    uint       `json:"id" gorm:"primaryKey"`
	SystemID              string     `json:"system_id" gorm:"uniqueIndex;not null;size:50"`
	Password              string     `json:"password" gorm:"not null;size:100"`
	MaxConnectionSpeed    int        `json:"max_connection_speed" gorm:"not null;default:100"`
	IsActive              bool       `json:"is_active" gorm:"not null;default:true"`
	IsOnline              bool       `json:"is_online" gorm:"not null;default:false"`
	LastConnectedAt       *time.Time `json:"last_connected_at"`
	LastDisconnectedAt    *time.Time `json:"last_disconnected_at"`
	LastIPAddress         *string    `json:"last_ip_address" gorm:"size:45"`
	ConnectionCount       int        `json:"connection_count" gorm:"not null;default:0"`
	TotalMessagesSent     int        `json:"total_messages_sent" gorm:"not null;default:0"`
	TotalMessagesReceived int        `json:"total_messages_received" gorm:"not null;default:0"`

	// MT Messaging Credentials
	MtSrcAddr              *string `json:"mt_src_addr" gorm:"size:50"`
	MtHttpThroughput       *string `json:"mt_http_throughput" gorm:"size:20"`
	MtBalance              *string `json:"mt_balance" gorm:"size:20"`
	MtSmppsThroughput      *string `json:"mt_smpps_throughput" gorm:"size:20"`
	MtSmsCount             *string `json:"mt_sms_count" gorm:"size:20"`
	MtEarlyPercent         *string `json:"mt_early_percent" gorm:"size:20"`
	MtPriorityFilter       *string `json:"mt_priority_filter" gorm:"size:10"`
	MtContentFilter        *string `json:"mt_content_filter" gorm:"size:255"`
	MtSrcAddrFilter        *string `json:"mt_src_addr_filter" gorm:"size:255"`
	MtDstAddrFilter        *string `json:"mt_dst_addr_filter" gorm:"size:255"`
	MtValidityPeriodFilter *string `json:"mt_validity_period_filter" gorm:"size:20"`
	MtHttpSend             bool    `json:"mt_http_send" gorm:"default:true"`
	MtHttpDlrMethod        bool    `json:"mt_http_dlr_method" gorm:"default:true"`
	MtHttpBalance          bool    `json:"mt_http_balance" gorm:"default:true"`
	MtSmppsSend            bool    `json:"mt_smpps_send" gorm:"default:true"`
	MtPriority             bool    `json:"mt_priority" gorm:"default:true"`
	MtHttpLongContent      bool    `json:"mt_http_long_content" gorm:"default:true"`
	MtSrcAddrAuth          bool    `json:"mt_src_addr_auth" gorm:"default:true"`
	MtDlrLevel             bool    `json:"mt_dlr_level" gorm:"default:true"`
	MtHttpRate             bool    `json:"mt_http_rate" gorm:"default:true"`
	MtValidityPeriod       bool    `json:"mt_validity_period" gorm:"default:true"`
	MtHttpBulk             bool    `json:"mt_http_bulk" gorm:"default:false"`
	MtHexContent           bool    `json:"mt_hex_content" gorm:"default:true"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SmppSession represents the database model for SMPP sessions
type SmppSession struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	SessionID  string    `json:"session_id" gorm:"uniqueIndex;not null;size:64"`
	SystemID   string    `json:"system_id" gorm:"not null;size:50"`
	RemoteAddr string    `json:"remote_addr" gorm:"not null;size:45"`
	BindType   string    `json:"bind_type" gorm:"not null;size:20"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// TableName specifies the table name for SmppUser
func (SmppUser) TableName() string {
	return "smpp_users"
}

// TableName specifies the table name for SmppSession
func (SmppSession) TableName() string {
	return "smpp_sessions"
}

// MySQLAuthManager manages SMPP user authentication via MySQL
type MySQLAuthManager struct {
	db             *gorm.DB
	sessionManager *session.SessionManager
	rateLimiter    *RateLimiter
	ctx            context.Context
}

// NewMySQLAuthManager creates a new MySQL-based auth manager
func NewMySQLAuthManager(dsn string, sessionManager *session.SessionManager) (*MySQLAuthManager, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL: %v", err)
	}

	// Auto migrate tables
	if err := db.AutoMigrate(&SmppUser{}, &SmppSession{}); err != nil {
		return nil, fmt.Errorf("failed to migrate tables: %v", err)
	}

	authManager := &MySQLAuthManager{
		db:             db,
		sessionManager: sessionManager,
		rateLimiter:    NewRateLimiter(),
		ctx:            context.Background(),
	}

	return authManager, nil
}

// AuthenticateUser authenticates a user via MySQL
func (am *MySQLAuthManager) AuthenticateUser(systemID, password string) (*SmppUser, error) {
	var smppUser SmppUser

	// Query user from database
	err := am.db.Where("system_id = ? AND password = ? AND is_active = ?",
		systemID, password, true).First(&smppUser).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found or invalid credentials")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	return &smppUser, nil
}

// CheckRateLimit checks if a user can send a message based on their TPS limits
func (am *MySQLAuthManager) CheckRateLimit(systemID string) (bool, error) {
	// Get user from database to get current TPS limits
	var smppUser SmppUser
	err := am.db.Where("system_id = ?", systemID).First(&smppUser).Error
	if err != nil {
		return false, fmt.Errorf("user not found: %v", err)
	}

	// Parse throughput values
	httpThroughput := 100  // Default value
	smppsThroughput := 100 // Default value

	if smppUser.MtHttpThroughput != nil && *smppUser.MtHttpThroughput != "" {
		if parsed, err := parseThroughput(*smppUser.MtHttpThroughput); err == nil {
			httpThroughput = parsed
		}
	}

	if smppUser.MtSmppsThroughput != nil && *smppUser.MtSmppsThroughput != "" {
		if parsed, err := parseThroughput(*smppUser.MtSmppsThroughput); err == nil {
			smppsThroughput = parsed
		}
	}

	// Check rate limit
	return am.rateLimiter.CheckRateLimit(systemID, httpThroughput, smppsThroughput)
}

// parseThroughput parses throughput string to integer
func parseThroughput(throughput string) (int, error) {
	// Handle common throughput formats like "100", "100/s", "100 TPS"
	// For now, just try to parse as integer
	var result int
	_, err := fmt.Sscanf(throughput, "%d", &result)
	if err != nil {
		return 100, fmt.Errorf("invalid throughput format: %s", throughput)
	}
	return result, nil
}

// GetActiveSessionsCount returns the number of active sessions for a user
func (am *MySQLAuthManager) GetActiveSessionsCount(systemID string) (int, error) {
	var count int64
	err := am.db.Model(&SmppSession{}).Where("system_id = ?", systemID).Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("failed to get session count: %v", err)
	}
	return int(count), nil
}

// IncrementMessageCount increments message counters for a user
func (am *MySQLAuthManager) IncrementMessageCount(systemID string, isSent bool) error {
	updateField := "total_messages_received"
	if isSent {
		updateField = "total_messages_sent"
	}

	err := am.db.Model(&SmppUser{}).
		Where("system_id = ?", systemID).
		Update(updateField, gorm.Expr(updateField+" + ?", 1)).Error

	if err != nil {
		return fmt.Errorf("failed to increment message counter: %v", err)
	}

	return nil
}

// AddSession adds a session to MySQL
func (am *MySQLAuthManager) AddSession(systemID, sessionID, remoteAddr, bindType string) error {
	session := SmppSession{
		SessionID:  sessionID,
		SystemID:   systemID,
		RemoteAddr: remoteAddr,
		BindType:   bindType,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := am.db.Create(&session).Error; err != nil {
		return fmt.Errorf("failed to add session to database: %v", err)
	}

	// Update user connection status
	now := time.Now()
	err := am.db.Model(&SmppUser{}).
		Where("system_id = ?", systemID).
		Updates(map[string]interface{}{
			"is_online":         true,
			"last_connected_at": &now,
			"last_ip_address":   remoteAddr,
			"connection_count":  gorm.Expr("connection_count + ?", 1),
			"updated_at":        now,
		}).Error

	if err != nil {
		return fmt.Errorf("failed to update user connection status: %v", err)
	}

	log.Printf("Session added for user %s: %s", systemID, sessionID)
	return nil
}

// RemoveSession removes a session from MySQL
func (am *MySQLAuthManager) RemoveSession(systemID, sessionID string) error {
	// Delete session
	err := am.db.Where("session_id = ? AND system_id = ?", sessionID, systemID).Delete(&SmppSession{}).Error
	if err != nil {
		return fmt.Errorf("failed to remove session: %v", err)
	}

	// Check if user has any remaining sessions
	var remainingSessions int64
	err = am.db.Model(&SmppSession{}).Where("system_id = ?", systemID).Count(&remainingSessions).Error
	if err != nil {
		return fmt.Errorf("failed to check remaining sessions: %v", err)
	}

	// If no remaining sessions, update user status to offline
	if remainingSessions == 0 {
		now := time.Now()
		err = am.db.Model(&SmppUser{}).
			Where("system_id = ?", systemID).
			Updates(map[string]interface{}{
				"is_online":            false,
				"last_disconnected_at": &now,
				"updated_at":           now,
			}).Error

		if err != nil {
			return fmt.Errorf("failed to update user offline status: %v", err)
		}
	}

	log.Printf("Session removed for user %s: %s", systemID, sessionID)
	return nil
}

// UpdateSessionActivity updates the last activity timestamp for a session
func (am *MySQLAuthManager) UpdateSessionActivity(sessionID string) error {
	now := time.Now()
	err := am.db.Model(&SmppSession{}).
		Where("session_id = ?", sessionID).
		Update("updated_at", now).Error

	if err != nil {
		return fmt.Errorf("failed to update session activity: %v", err)
	}

	return nil
}

// StartCleanupRoutine starts a routine to clean up expired sessions
func (am *MySQLAuthManager) StartCleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for range ticker.C {
			am.cleanupExpiredSessions()
		}
	}()
}

// DisconnectUserSessions disconnects all sessions for a user
func (am *MySQLAuthManager) DisconnectUserSessions(systemID string) {
	// Remove all sessions for the user
	err := am.db.Where("system_id = ?", systemID).Delete(&SmppSession{}).Error
	if err != nil {
		log.Printf("Failed to remove sessions for user %s: %v", systemID, err)
		return
	}

	// Update user status to offline
	now := time.Now()
	err = am.db.Model(&SmppUser{}).
		Where("system_id = ?", systemID).
		Updates(map[string]interface{}{
			"is_online":            false,
			"last_disconnected_at": &now,
			"updated_at":           now,
		}).Error

	if err != nil {
		log.Printf("Failed to update user offline status for %s: %v", systemID, err)
	}

	// Close all sessions in session manager
	sessions := am.sessionManager.GetAllSessions()
	for _, sess := range sessions {
		if sess.SystemID == systemID {
			sess.Close()
		}
	}

	log.Printf("Disconnected all sessions for user: %s", systemID)
}

// Close closes the database connection
func (am *MySQLAuthManager) Close() error {
	if am.db != nil {
		sqlDB, err := am.db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// cleanupExpiredSessions removes expired sessions from database
func (am *MySQLAuthManager) cleanupExpiredSessions() {
	// Remove sessions older than 1 hour
	expiredTime := time.Now().Add(-1 * time.Hour)

	err := am.db.Where("updated_at < ?", expiredTime).Delete(&SmppSession{}).Error
	if err != nil {
		log.Printf("Failed to cleanup expired sessions: %v", err)
		return
	}

	log.Println("Cleaned up expired sessions")
}

// GetUserStats returns statistics for a specific user
func (am *MySQLAuthManager) GetUserStats(systemID string) (map[string]interface{}, error) {
	var user SmppUser
	err := am.db.Where("system_id = ?", systemID).First(&user).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	var activeSessions int64
	err = am.db.Model(&SmppSession{}).Where("system_id = ?", systemID).Count(&activeSessions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get active sessions count: %v", err)
	}

	stats := map[string]interface{}{
		"system_id":               user.SystemID,
		"is_online":               user.IsOnline,
		"connection_count":        user.ConnectionCount,
		"total_messages_sent":     user.TotalMessagesSent,
		"total_messages_received": user.TotalMessagesReceived,
		"active_sessions":         activeSessions,
		"last_connected_at":       user.LastConnectedAt,
		"last_disconnected_at":    user.LastDisconnectedAt,
		"last_ip_address":         user.LastIPAddress,
	}

	return stats, nil
}
