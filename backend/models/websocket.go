package models

type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp int64       `json:"timestamp"`
	UserID    uint        `json:"user_id,omitempty"`
}

type WebSocketConnection struct {
	UserID uint
	Conn   interface{}
}
