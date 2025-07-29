package auth

import (
	"fmt"
	"log"
	"sync"
	"time"
)

// RateLimiter manages TPS (Transactions Per Second) rate limiting for SMPP users
type RateLimiter struct {
	mu       sync.RWMutex
	limits   map[string]*UserRateLimit
	cleanup  *time.Ticker
	stopChan chan bool
}

// UserRateLimit tracks rate limiting for a specific user
type UserRateLimit struct {
	SystemID        string
	HttpThroughput  int // HTTP TPS limit
	SmppsThroughput int // SMPP TPS limit
	WindowStart     time.Time
	RequestCount    int
	LastRequest     time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter() *RateLimiter {
	rl := &RateLimiter{
		limits:   make(map[string]*UserRateLimit),
		cleanup:  time.NewTicker(1 * time.Minute), // Cleanup every minute
		stopChan: make(chan bool),
	}

	// Start cleanup routine
	go rl.cleanupRoutine()

	return rl
}

// CheckRateLimit checks if a user can send a message based on their TPS limits
func (rl *RateLimiter) CheckRateLimit(systemID string, httpThroughput, smppsThroughput int) (bool, error) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	limit, exists := rl.limits[systemID]

	if !exists {
		// Create new rate limit entry
		limit = &UserRateLimit{
			SystemID:        systemID,
			HttpThroughput:  httpThroughput,
			SmppsThroughput: smppsThroughput,
			WindowStart:     now,
			RequestCount:    0,
			LastRequest:     now,
		}
		rl.limits[systemID] = limit
	}

	// Check if we need to reset the window (1 second window)
	if now.Sub(limit.WindowStart) >= time.Second {
		limit.WindowStart = now
		limit.RequestCount = 0
	}

	// Check SMPP throughput limit
	if limit.RequestCount >= smppsThroughput {
		log.Printf("Rate limit exceeded for user %s: %d requests in current window (limit: %d)",
			systemID, limit.RequestCount, smppsThroughput)
		return false, fmt.Errorf("rate limit exceeded: %d TPS limit", smppsThroughput)
	}

	// Increment request count
	limit.RequestCount++
	limit.LastRequest = now

	return true, nil
}

// GetUserRateLimit returns the current rate limit info for a user
func (rl *RateLimiter) GetUserRateLimit(systemID string) (*UserRateLimit, bool) {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	limit, exists := rl.limits[systemID]
	return limit, exists
}

// UpdateUserLimits updates the rate limits for a user
func (rl *RateLimiter) UpdateUserLimits(systemID string, httpThroughput, smppsThroughput int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if limit, exists := rl.limits[systemID]; exists {
		limit.HttpThroughput = httpThroughput
		limit.SmppsThroughput = smppsThroughput
		log.Printf("Updated rate limits for user %s: HTTP=%d, SMPP=%d", systemID, httpThroughput, smppsThroughput)
	}
}

// cleanupRoutine removes old rate limit entries
func (rl *RateLimiter) cleanupRoutine() {
	for {
		select {
		case <-rl.cleanup.C:
			rl.mu.Lock()
			now := time.Now()
			for systemID, limit := range rl.limits {
				// Remove entries older than 5 minutes
				if now.Sub(limit.LastRequest) > 5*time.Minute {
					delete(rl.limits, systemID)
					log.Printf("Cleaned up rate limit entry for user: %s", systemID)
				}
			}
			rl.mu.Unlock()
		case <-rl.stopChan:
			rl.cleanup.Stop()
			return
		}
	}
}

// Stop stops the rate limiter
func (rl *RateLimiter) Stop() {
	rl.stopChan <- true
}

// GetStats returns rate limiting statistics
func (rl *RateLimiter) GetStats() map[string]interface{} {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	stats := map[string]interface{}{
		"total_users": len(rl.limits),
		"users":       make(map[string]interface{}),
	}

	for systemID, limit := range rl.limits {
		stats["users"].(map[string]interface{})[systemID] = map[string]interface{}{
			"http_throughput":  limit.HttpThroughput,
			"smpps_throughput": limit.SmppsThroughput,
			"current_requests": limit.RequestCount,
			"window_start":     limit.WindowStart,
			"last_request":     limit.LastRequest,
		}
	}

	return stats
}
