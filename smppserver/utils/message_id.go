package utils

import (
	"crypto/rand"
	"encoding/hex"
	"sync/atomic"
	"time"
)

// globalCounter provides per-process monotonicity for IDs generated within the same nanosecond
var globalCounter uint64

// GenerateMessageID returns a collision-resistant, process-unique message ID.
// Format: msg_<unix_nano>_<counter>_<random_4bytes>
// - unix_nano provides time ordering
// - counter ensures uniqueness when multiple goroutines call in the same instant
// - random adds extra entropy across processes/hosts
func GenerateMessageID() string {
	now := time.Now().UnixNano()
	counter := atomic.AddUint64(&globalCounter, 1)

	// 4 bytes random suffix
	var rb [4]byte
	_, _ = rand.Read(rb[:])

	// Build hex parts to avoid allocations from fmt
	// Using hex for random; time and counter via base 10 for readability
	return "msg_" + itoa64(now) + "_" + itoaU64(counter) + "_" + hex.EncodeToString(rb[:])
}

// Simple, allocation-free integer to string helpers
func itoa64(v int64) string { return itoaU64(uint64(v)) }

func itoaU64(v uint64) string {
	if v == 0 {
		return "0"
	}
	var buf [20]byte // max for uint64
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	return string(buf[i:])
}
