package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client *redis.Client
	ctx    context.Context
}

type SmppUserEvent struct {
	Type      string      `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Source    string      `json:"source"`
	Data      interface{} `json:"data"`
}

func NewRedisService(redisURL string) (*RedisService, error) {
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

	service := &RedisService{
		client: client,
		ctx:    ctx,
	}

	return service, nil
}

// PublishSmppUserEvent publishes SMPP user events to Redis
func (r *RedisService) PublishSmppUserEvent(event *SmppUserEvent) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %v", err)
	}

	// Publish to Redis channel
	err = r.client.Publish(r.ctx, "smpp_user_events", eventBytes).Err()
	if err != nil {
		return fmt.Errorf("failed to publish event to Redis: %v", err)
	}

	log.Printf("Successfully published SMPP user event to Redis: %s", event.Type)
	return nil
}

// CacheSmppUser caches SMPP user data in Redis
func (r *RedisService) CacheSmppUser(systemID string, userData interface{}) error {
	userKey := fmt.Sprintf("smpp_user:%s", systemID)
	userBytes, err := json.Marshal(userData)
	if err != nil {
		return fmt.Errorf("failed to marshal user data: %v", err)
	}

	// Cache user data with 1 hour expiration
	err = r.client.Set(r.ctx, userKey, userBytes, time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to cache user data: %v", err)
	}

	log.Printf("Successfully cached SMPP user data for: %s", systemID)
	return nil
}

// GetCachedSmppUser retrieves cached SMPP user data from Redis
func (r *RedisService) GetCachedSmppUser(systemID string) ([]byte, error) {
	userKey := fmt.Sprintf("smpp_user:%s", systemID)
	userData, err := r.client.Get(r.ctx, userKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("user not found in cache")
		}
		return nil, fmt.Errorf("failed to get user from cache: %v", err)
	}

	return []byte(userData), nil
}

// DeleteCachedSmppUser removes cached SMPP user data from Redis
func (r *RedisService) DeleteCachedSmppUser(systemID string) error {
	userKey := fmt.Sprintf("smpp_user:%s", systemID)
	err := r.client.Del(r.ctx, userKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete user from cache: %v", err)
	}

	log.Printf("Successfully deleted cached SMPP user data for: %s", systemID)
	return nil
}

// UpdateUserConnectionStatus updates user connection status in Redis
func (r *RedisService) UpdateUserConnectionStatus(systemID string, isOnline bool, ipAddress string) error {
	statusKey := fmt.Sprintf("smpp_user_status:%s", systemID)
	statusData := map[string]interface{}{
		"is_online":  isOnline,
		"ip_address": ipAddress,
		"updated_at": time.Now().Unix(),
	}

	statusBytes, err := json.Marshal(statusData)
	if err != nil {
		return fmt.Errorf("failed to marshal status data: %v", err)
	}

	// Cache status with 30 minutes expiration
	err = r.client.Set(r.ctx, statusKey, statusBytes, 30*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("failed to update user status: %v", err)
	}

	log.Printf("Successfully updated connection status for user: %s (online: %t)", systemID, isOnline)
	return nil
}

// GetUserConnectionStatus gets user connection status from Redis
func (r *RedisService) GetUserConnectionStatus(systemID string) (map[string]interface{}, error) {
	statusKey := fmt.Sprintf("smpp_user_status:%s", systemID)
	statusData, err := r.client.Get(r.ctx, statusKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("user status not found in cache")
		}
		return nil, fmt.Errorf("failed to get user status: %v", err)
	}

	var status map[string]interface{}
	if err := json.Unmarshal([]byte(statusData), &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal status data: %v", err)
	}

	return status, nil
}

// IncrementMessageCounter increments message counter for a user
func (r *RedisService) IncrementMessageCounter(systemID string, isSent bool) error {
	var counterKey string
	if isSent {
		counterKey = fmt.Sprintf("smpp_messages_sent:%s", systemID)
	} else {
		counterKey = fmt.Sprintf("smpp_messages_received:%s", systemID)
	}

	_, err := r.client.Incr(r.ctx, counterKey).Result()
	if err != nil {
		return fmt.Errorf("failed to increment message counter: %v", err)
	}

	// Set expiration for counter (24 hours)
	r.client.Expire(r.ctx, counterKey, 24*time.Hour)

	return nil
}

// GetMessageCounter gets message counter for a user
func (r *RedisService) GetMessageCounter(systemID string, isSent bool) (int64, error) {
	var counterKey string
	if isSent {
		counterKey = fmt.Sprintf("smpp_messages_sent:%s", systemID)
	} else {
		counterKey = fmt.Sprintf("smpp_messages_received:%s", systemID)
	}

	count, err := r.client.Get(r.ctx, counterKey).Int64()
	if err != nil {
		if err == redis.Nil {
			return 0, nil // Return 0 if counter doesn't exist
		}
		return 0, fmt.Errorf("failed to get message counter: %v", err)
	}

	return count, nil
}

// Close closes the Redis connection
func (r *RedisService) Close() error {
	if r.client != nil {
		return r.client.Close()
	}
	return nil
}

// WebSocketConnection represents a websocket connection stored in Redis
type WebSocketConnection struct {
	DeviceID       string    `json:"device_id"`
	DeviceGroup    string    `json:"device_group"`
	CountrySite    string    `json:"country_site"`
	ConnectionType string    `json:"connection_type"` // android, frontend
	IsHandicap     bool      `json:"is_handicap"`
	ConnectedAt    time.Time `json:"connected_at"`
	LastHeartbeat  time.Time `json:"last_heartbeat"`
	ServerID       string    `json:"server_id"` // Which server instance this connection belongs to
}

// StoreWebSocketConnection stores a websocket connection in Redis
func (r *RedisService) StoreWebSocketConnection(conn *WebSocketConnection) error {
	connKey := fmt.Sprintf("websocket_connection:%s", conn.DeviceID)
	connBytes, err := json.Marshal(conn)
	if err != nil {
		return fmt.Errorf("failed to marshal connection data: %v", err)
	}

	// Store connection with 1 hour expiration (will be refreshed on heartbeat)
	err = r.client.Set(r.ctx, connKey, connBytes, time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to store connection in Redis: %v", err)
	}

	// Also add to set of all connections for this server
	serverConnectionsKey := fmt.Sprintf("websocket_server_connections:%s", conn.ServerID)
	err = r.client.SAdd(r.ctx, serverConnectionsKey, conn.DeviceID).Err()
	if err != nil {
		return fmt.Errorf("failed to add connection to server set: %v", err)
	}

	// Set expiration for server connections set
	r.client.Expire(r.ctx, serverConnectionsKey, time.Hour)

	log.Printf("Successfully stored websocket connection in Redis: %s (Type: %s)", conn.DeviceID, conn.ConnectionType)
	return nil
}

// GetWebSocketConnection retrieves a websocket connection from Redis
func (r *RedisService) GetWebSocketConnection(deviceID string) (*WebSocketConnection, error) {
	connKey := fmt.Sprintf("websocket_connection:%s", deviceID)
	connData, err := r.client.Get(r.ctx, connKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("connection not found in Redis")
		}
		return nil, fmt.Errorf("failed to get connection from Redis: %v", err)
	}

	var conn WebSocketConnection
	if err := json.Unmarshal([]byte(connData), &conn); err != nil {
		return nil, fmt.Errorf("failed to unmarshal connection data: %v", err)
	}

	return &conn, nil
}

// RemoveWebSocketConnection removes a websocket connection from Redis
func (r *RedisService) RemoveWebSocketConnection(deviceID, serverID string) error {
	connKey := fmt.Sprintf("websocket_connection:%s", deviceID)

	// Remove connection data
	err := r.client.Del(r.ctx, connKey).Err()
	if err != nil {
		return fmt.Errorf("failed to remove connection from Redis: %v", err)
	}

	// Remove from server connections set
	serverConnectionsKey := fmt.Sprintf("websocket_server_connections:%s", serverID)
	err = r.client.SRem(r.ctx, serverConnectionsKey, deviceID).Err()
	if err != nil {
		return fmt.Errorf("failed to remove connection from server set: %v", err)
	}

	log.Printf("Successfully removed websocket connection from Redis: %s", deviceID)
	return nil
}

// UpdateWebSocketHeartbeat updates the last heartbeat time for a connection
func (r *RedisService) UpdateWebSocketHeartbeat(deviceID string) error {
	conn, err := r.GetWebSocketConnection(deviceID)
	if err != nil {
		return err
	}

	conn.LastHeartbeat = time.Now()
	return r.StoreWebSocketConnection(conn)
}

// GetServerConnections returns all connections for a specific server
func (r *RedisService) GetServerConnections(serverID string) ([]string, error) {
	serverConnectionsKey := fmt.Sprintf("websocket_server_connections:%s", serverID)
	connections, err := r.client.SMembers(r.ctx, serverConnectionsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get server connections: %v", err)
	}

	return connections, nil
}

// GetAllWebSocketConnections returns all websocket connections from Redis
func (r *RedisService) GetAllWebSocketConnections() ([]*WebSocketConnection, error) {
	// Get all connection keys
	pattern := "websocket_connection:*"
	keys, err := r.client.Keys(r.ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get connection keys: %v", err)
	}

	var connections []*WebSocketConnection
	for _, key := range keys {
		connData, err := r.client.Get(r.ctx, key).Result()
		if err != nil {
			log.Printf("Warning: failed to get connection data for key %s: %v", key, err)
			continue
		}

		var conn WebSocketConnection
		if err := json.Unmarshal([]byte(connData), &conn); err != nil {
			log.Printf("Warning: failed to unmarshal connection data for key %s: %v", key, err)
			continue
		}

		connections = append(connections, &conn)
	}

	return connections, nil
}

// CleanupExpiredConnections removes connections that haven't had a heartbeat in the last 5 minutes
func (r *RedisService) CleanupExpiredConnections() error {
	connections, err := r.GetAllWebSocketConnections()
	if err != nil {
		return err
	}

	expiredThreshold := time.Now().Add(-5 * time.Minute)
	var expiredConnections []string

	for _, conn := range connections {
		if conn.LastHeartbeat.Before(expiredThreshold) {
			expiredConnections = append(expiredConnections, conn.DeviceID)
		}
	}

	for _, deviceID := range expiredConnections {
		conn, err := r.GetWebSocketConnection(deviceID)
		if err != nil {
			continue
		}

		log.Printf("Removing expired websocket connection: %s (Last heartbeat: %s)",
			deviceID, conn.LastHeartbeat.Format("2006-01-02 15:04:05"))

		r.RemoveWebSocketConnection(deviceID, conn.ServerID)
	}

	if len(expiredConnections) > 0 {
		log.Printf("Cleaned up %d expired websocket connections", len(expiredConnections))
	}

	return nil
}

// StartWebSocketCleanupRoutine starts a routine to clean up expired websocket connections
func (r *RedisService) StartWebSocketCleanupRoutine() {
	ticker := time.NewTicker(2 * time.Minute) // Check every 2 minutes
	go func() {
		for range ticker.C {
			if err := r.CleanupExpiredConnections(); err != nil {
				log.Printf("Error cleaning up expired websocket connections: %v", err)
			}
		}
	}()
	log.Println("Started websocket connection cleanup routine")
}
