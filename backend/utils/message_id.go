package utils

import (
	"strconv"
	"time"
)

// GenerateMessageID generates a unique message ID
func GenerateMessageID() string {
	return "msg_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
