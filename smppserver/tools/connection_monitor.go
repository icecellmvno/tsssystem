package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"time"
)

type ConnectionStats struct {
	Timestamp         time.Time `json:"timestamp"`
	ActiveConnections int       `json:"active_connections"`
	TotalConnections  int       `json:"total_connections"`
	FailedConnections int       `json:"failed_connections"`
	AvgResponseTime   int64     `json:"avg_response_time_ms"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run connection_monitor.go <server_host:port>")
		fmt.Println("Example: go run connection_monitor.go 127.0.0.1:2775")
		os.Exit(1)
	}

	serverAddr := os.Args[1]
	log.Printf("Starting SMPP connection monitor for %s", serverAddr)

	// Test connection stability
	testConnectionStability(serverAddr)
}

func testConnectionStability(serverAddr string) {
	stats := &ConnectionStats{
		Timestamp: time.Now(),
	}

	for i := 0; i < 10; i++ {
		log.Printf("Test %d: Attempting connection to %s", i+1, serverAddr)

		start := time.Now()
		conn, err := net.DialTimeout("tcp", serverAddr, 10*time.Second)
		if err != nil {
			log.Printf("Test %d: Failed to connect: %v", i+1, err)
			stats.FailedConnections++
			continue
		}

		stats.TotalConnections++

		// Test basic SMPP bind
		if testSMPPBind(conn) {
			stats.ActiveConnections++
		} else {
			stats.FailedConnections++
		}

		responseTime := time.Since(start).Milliseconds()
		stats.AvgResponseTime = (stats.AvgResponseTime + responseTime) / 2

		conn.Close()
		time.Sleep(2 * time.Second) // Wait between tests
	}

	// Print results
	statsJSON, _ := json.MarshalIndent(stats, "", "  ")
	log.Printf("Connection test results:\n%s", string(statsJSON))
}

func testSMPPBind(conn net.Conn) bool {
	// Create a simple bind_transceiver request
	bindRequest := createBindRequest("testuser", "testpass")

	// Send bind request
	_, err := conn.Write(bindRequest)
	if err != nil {
		log.Printf("Failed to send bind request: %v", err)
		return false
	}

	// Read response
	response := make([]byte, 1024)
	conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	n, err := conn.Read(response)
	if err != nil {
		log.Printf("Failed to read bind response: %v", err)
		return false
	}

	if n >= 16 {
		// Check if response indicates success (status 0)
		status := uint32(response[8])<<24 | uint32(response[9])<<16 | uint32(response[10])<<8 | uint32(response[11])
		if status == 0 {
			log.Printf("Bind successful")
			return true
		} else {
			log.Printf("Bind failed with status: 0x%08X", status)
			return false
		}
	}

	log.Printf("Invalid response length: %d", n)
	return false
}

func createBindRequest(systemID, password string) []byte {
	// Build bind_transceiver PDU
	body := make([]byte, 0)
	body = append(body, []byte(systemID)...)
	body = append(body, 0) // null terminator
	body = append(body, []byte(password)...)
	body = append(body, 0)             // null terminator
	body = append(body, []byte("")...) // system type
	body = append(body, 0)             // null terminator
	body = append(body, 0x34)          // interface version
	body = append(body, 0)             // TON
	body = append(body, 0)             // NPI
	body = append(body, []byte("")...) // address range
	body = append(body, 0)             // null terminator

	// Build complete PDU
	pdu := make([]byte, 0)

	// Command length (4 bytes)
	length := uint32(16 + len(body))
	pdu = append(pdu, byte(length>>24), byte(length>>16), byte(length>>8), byte(length))

	// Command ID (4 bytes) - BIND_TRANSCEIVER
	pdu = append(pdu, 0, 0, 0, 0x09)

	// Command status (4 bytes)
	pdu = append(pdu, 0, 0, 0, 0)

	// Sequence number (4 bytes)
	pdu = append(pdu, 0, 0, 0, 1)

	// Body
	pdu = append(pdu, body...)

	return pdu
}
