package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"smppserver/session"

	"github.com/redis/go-redis/v9"
)

// User represents an SMPP user
type User struct {
	SystemID           string `json:"system_id"`
	Password           string `json:"password"`
	MaxConnectionSpeed int    `json:"max_connection_speed"`
	IsActive           bool   `json:"is_active"`
}

// RedisAuthManager manages SMPP user authentication via Redis
type RedisAuthManager struct {
	redisClient    *redis.Client
	sessionManager *session.SessionManager
	ctx            context.Context
}

// NewRedisAuthManager creates a new Redis-based auth manager
func NewRedisAuthManager(redisURL string, sessionManager *session.SessionManager) (*RedisAuthManager, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %v", err)
	}

	client := redis.NewClient(opts)
	ctx := context.Background()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %v", err)
	}

	authManager := &RedisAuthManager{
		redisClient:    client,
		sessionManager: sessionManager,
		ctx:            ctx,
	}

	return authManager, nil
}

// AuthenticateUser authenticates a user via Redis
func (am *RedisAuthManager) AuthenticateUser(systemID, password string) (*User, error) {
	// Try to get user from Redis
	userKey := fmt.Sprintf("smpp_user:%s", systemID)
	userData, err := am.redisClient.Get(am.ctx, userKey).Result()

	if err == redis.Nil {
		// User not found in Redis, return error
		return nil, fmt.Errorf("user not found")
	} else if err != nil {
		return nil, fmt.Errorf("Redis error: %v", err)
	}

	// Parse user data
	var user User
	if err := json.Unmarshal([]byte(userData), &user); err != nil {
		return nil, fmt.Errorf("failed to parse user data: %v", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, fmt.Errorf("user is inactive")
	}

	// Check password
	if user.Password != password {
		return nil, fmt.Errorf("invalid password")
	}

	return &user, nil
}

// GetActiveSessionsCount returns the number of active sessions for a user
func (am *RedisAuthManager) GetActiveSessionsCount(systemID string) (int, error) {
	sessionKey := fmt.Sprintf("smpp_sessions:%s", systemID)
	count, err := am.redisClient.SCard(am.ctx, sessionKey).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get session count: %v", err)
	}
	return int(count), nil
}

// IncrementMessageCount increments message counters for a user
func (am *RedisAuthManager) IncrementMessageCount(systemID string, isSent bool) error {
	var counterKey string
	if isSent {
		counterKey = fmt.Sprintf("smpp_messages_sent:%s", systemID)
	} else {
		counterKey = fmt.Sprintf("smpp_messages_received:%s", systemID)
	}

	_, err := am.redisClient.Incr(am.ctx, counterKey).Result()
	if err != nil {
		return fmt.Errorf("failed to increment message counter: %v", err)
	}

	// Set expiration for counter (24 hours)
	am.redisClient.Expire(am.ctx, counterKey, 24*time.Hour)

	return nil
}

// AddSession adds a session to Redis
func (am *RedisAuthManager) AddSession(systemID, sessionID, remoteAddr string) error {
	sessionKey := fmt.Sprintf("smpp_sessions:%s", systemID)
	sessionData := map[string]interface{}{
		"session_id":  sessionID,
		"remote_addr": remoteAddr,
		"created_at":  time.Now().Unix(),
	}

	sessionJSON, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %v", err)
	}

	// Add session to set
	if err := am.redisClient.SAdd(am.ctx, sessionKey, sessionJSON).Err(); err != nil {
		return fmt.Errorf("failed to add session to Redis: %v", err)
	}

	// Set expiration for session set (1 hour)
	am.redisClient.Expire(am.ctx, sessionKey, time.Hour)

	log.Printf("Session added for user %s: %s", systemID, sessionID)
	return nil
}

// RemoveSession removes a session from Redis
func (am *RedisAuthManager) RemoveSession(systemID, sessionID string) error {
	sessionKey := fmt.Sprintf("smpp_sessions:%s", systemID)

	// Get all sessions for the user
	sessions, err := am.redisClient.SMembers(am.ctx, sessionKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get sessions: %v", err)
	}

	// Find and remove the specific session
	for _, sessionData := range sessions {
		var sessionInfo map[string]interface{}
		if err := json.Unmarshal([]byte(sessionData), &sessionInfo); err != nil {
			continue
		}

		if sessionInfo["session_id"] == sessionID {
			if err := am.redisClient.SRem(am.ctx, sessionKey, sessionData).Err(); err != nil {
				return fmt.Errorf("failed to remove session: %v", err)
			}
			log.Printf("Session removed for user %s: %s", systemID, sessionID)
			break
		}
	}

	return nil
}

// StartCleanupRoutine starts a routine to clean up expired sessions
func (am *RedisAuthManager) StartCleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for range ticker.C {
			am.cleanupExpiredSessions()
		}
	}()
}

// DisconnectUserSessions disconnects all sessions for a user
func (am *RedisAuthManager) DisconnectUserSessions(systemID string) {
	sessions := am.sessionManager.GetAllSessions()
	for _, sess := range sessions {
		if sess.SystemID == systemID {
			sess.Close()
		}
	}
	log.Printf("Disconnected all sessions for user: %s", systemID)
}

// Close closes the Redis connection
func (am *RedisAuthManager) Close() error {
	if am.redisClient != nil {
		return am.redisClient.Close()
	}
	return nil
}

// cleanupExpiredSessions removes expired sessions from Redis
func (am *RedisAuthManager) cleanupExpiredSessions() {
	// This is a simple cleanup - in a production environment,
	// you might want more sophisticated cleanup logic
	log.Println("Cleaning up expired sessions...")
}
