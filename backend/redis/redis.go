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
