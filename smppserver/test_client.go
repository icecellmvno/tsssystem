package main

import (
	"encoding/binary"
	"io"
	"log"
	"net"
)

func main() {
	// Connect to SMPP server
	conn, err := net.Dial("tcp", "127.0.0.1:2775")
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	log.Println("Connected to SMPP server")

	// Create bind_transceiver request
	systemID := "login"
	password := "password"
	systemType := ""
	interfaceVersion := uint8(0x34)
	ton := uint8(0)
	npi := uint8(0)
	addressRange := ""

	// Build PDU body
	var body []byte
	body = append(body, []byte(systemID)...)
	body = append(body, 0) // null terminator
	body = append(body, []byte(password)...)
	body = append(body, 0) // null terminator
	body = append(body, []byte(systemType)...)
	body = append(body, 0) // null terminator
	body = append(body, interfaceVersion)
	body = append(body, ton)
	body = append(body, npi)
	body = append(body, []byte(addressRange)...)
	body = append(body, 0) // null terminator

	// Create PDU
	commandLength := uint32(16 + len(body))
	commandID := uint32(0x00000009) // BIND_TRANSCEIVER
	commandStatus := uint32(0)
	sequenceNumber := uint32(1)

	// Build complete PDU
	var pdu []byte

	// Command length (4 bytes)
	lengthBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(lengthBytes, commandLength)
	pdu = append(pdu, lengthBytes...)

	// Command ID (4 bytes)
	commandIDBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(commandIDBytes, commandID)
	pdu = append(pdu, commandIDBytes...)

	// Command status (4 bytes)
	statusBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(statusBytes, commandStatus)
	pdu = append(pdu, statusBytes...)

	// Sequence number (4 bytes)
	seqBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(seqBytes, sequenceNumber)
	pdu = append(pdu, seqBytes...)

	// Body
	pdu = append(pdu, body...)

	log.Printf("Sending bind_transceiver request:")
	log.Printf("Command Length: %d", commandLength)
	log.Printf("Command ID: 0x%08X", commandID)
	log.Printf("Command Status: 0x%08X", commandStatus)
	log.Printf("Sequence Number: %d", sequenceNumber)
	log.Printf("Body: %X", body)
	log.Printf("Complete PDU: %X", pdu)

	// Send PDU
	_, err = conn.Write(pdu)
	if err != nil {
		log.Fatalf("Failed to send PDU: %v", err)
	}

	log.Println("PDU sent successfully")

	// Read response length first
	respLengthBytes := make([]byte, 4)
	_, err = conn.Read(respLengthBytes)
	if err != nil {
		log.Fatalf("Failed to read response length: %v", err)
	}

	responseLength := binary.BigEndian.Uint32(respLengthBytes)
	log.Printf("Response length: %d", responseLength)

	// Read the rest of the response
	responseBody := make([]byte, responseLength-4)
	n, err := io.ReadFull(conn, responseBody)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}
	log.Printf("Read %d bytes for response body", n)

	// Combine length and body
	fullResponse := append(respLengthBytes, responseBody...)
	log.Printf("Received full response (%d bytes): %X", len(fullResponse), fullResponse)

	// Parse response
	if len(fullResponse) >= 16 {
		respLength := binary.BigEndian.Uint32(fullResponse[0:4])
		respCommandID := binary.BigEndian.Uint32(fullResponse[4:8])
		respStatus := binary.BigEndian.Uint32(fullResponse[8:12])
		respSeq := binary.BigEndian.Uint32(fullResponse[12:16])
		respBody := fullResponse[16:]

		log.Printf("Response parsed:")
		log.Printf("  Length: %d", respLength)
		log.Printf("  Command ID: 0x%08X", respCommandID)
		log.Printf("  Status: 0x%08X", respStatus)
		log.Printf("  Sequence: %d", respSeq)
		log.Printf("  Body: %X", respBody)

		if len(respBody) > 0 {
			// Parse SystemID from response body
			end := 0
			for end < len(respBody) && respBody[end] != 0 {
				end++
			}
			systemID := string(respBody[:end])
			log.Printf("  SystemID: %s", systemID)
		}
	}
}
