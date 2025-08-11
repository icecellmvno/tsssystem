package protocol

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"unicode/utf16"
)

// PDU represents a Protocol Data Unit in SMPP
type PDU struct {
	CommandLength  uint32
	CommandID      uint32
	CommandStatus  uint32
	SequenceNumber uint32
	Body           []byte
}

// PDUHeader represents the header part of a PDU
type PDUHeader struct {
	CommandLength  uint32
	CommandID      uint32
	CommandStatus  uint32
	SequenceNumber uint32
}

// BindPDU represents bind request/response PDU
type BindPDU struct {
	SystemID         string
	Password         string
	SystemType       string
	InterfaceVersion uint8
	TON              uint8
	NPI              uint8
	AddressRange     string
}

// SubmitSMPDU represents submit_sm request PDU
type SubmitSMPDU struct {
	ServiceType          string
	SourceAddrTON        uint8
	SourceAddrNPI        uint8
	SourceAddr           string
	DestAddrTON          uint8
	DestAddrNPI          uint8
	DestinationAddr      string
	ESMClass             uint8
	ProtocolID           uint8
	PriorityFlag         uint8
	ScheduleDeliveryTime string
	ValidityPeriod       string
	RegisteredDelivery   uint8
	ReplaceIfPresentFlag uint8
	DataCoding           uint8
	SMDefaultMsgID       uint8
	SMLength             uint8
	ShortMessage         string
	OptionalParameters   map[uint16][]byte
}

// SubmitSMRespPDU represents submit_sm response PDU
type SubmitSMRespPDU struct {
	MessageID string
}

// DeliverSMPDU represents deliver_sm request PDU
type DeliverSMPDU struct {
	ServiceType          string
	SourceAddrTON        uint8
	SourceAddrNPI        uint8
	SourceAddr           string
	DestAddrTON          uint8
	DestAddrNPI          uint8
	DestinationAddr      string
	ESMClass             uint8
	ProtocolID           uint8
	PriorityFlag         uint8
	ScheduleDeliveryTime string
	ValidityPeriod       string
	RegisteredDelivery   uint8
	ReplaceIfPresentFlag uint8
	DataCoding           uint8
	SMDefaultMsgID       uint8
	SMLength             uint8
	ShortMessage         string
	OptionalParameters   map[uint16][]byte
}

// DeliverSMRespPDU represents deliver_sm response PDU
type DeliverSMRespPDU struct {
	MessageID string
}

// DataSMPDU represents data_sm request PDU
type DataSMPDU struct {
	ServiceType        string
	SourceAddrTON      uint8
	SourceAddrNPI      uint8
	SourceAddr         string
	DestAddrTON        uint8
	DestAddrNPI        uint8
	DestinationAddr    string
	ESMClass           uint8
	RegisteredDelivery uint8
	DataCoding         uint8
	OptionalParameters map[uint16][]byte
}

// DataSMRespPDU represents data_sm response PDU
type DataSMRespPDU struct {
	MessageID          string
	OptionalParameters map[uint16][]byte
}

// QuerySMPDU represents query_sm request PDU
type QuerySMPDU struct {
	MessageID     string
	SourceAddrTON uint8
	SourceAddrNPI uint8
	SourceAddr    string
}

// QuerySMRespPDU represents query_sm response PDU
type QuerySMRespPDU struct {
	MessageID    string
	FinalDate    string
	MessageState uint8
	ErrorCode    uint8
}

// CancelSMPDU represents cancel_sm request PDU
type CancelSMPDU struct {
	ServiceType     string
	MessageID       string
	SourceAddrTON   uint8
	SourceAddrNPI   uint8
	SourceAddr      string
	DestAddrTON     uint8
	DestAddrNPI     uint8
	DestinationAddr string
}

// CancelSMRespPDU represents cancel_sm response PDU
type CancelSMRespPDU struct {
	// Empty body
}

// ReplaceSMPDU represents replace_sm request PDU
type ReplaceSMPDU struct {
	MessageID            string
	SourceAddrTON        uint8
	SourceAddrNPI        uint8
	SourceAddr           string
	ScheduleDeliveryTime string
	ValidityPeriod       string
	RegisteredDelivery   uint8
	SMDefaultMsgID       uint8
	SMLength             uint8
	ShortMessage         string
}

// ReplaceSMRespPDU represents replace_sm response PDU
type ReplaceSMRespPDU struct {
	// Empty body
}

// OutbindPDU represents outbind request PDU
type OutbindPDU struct {
	SystemID string
	Password string
}

// AlertNotificationPDU represents alert_notification PDU
type AlertNotificationPDU struct {
	SourceAddrTON      uint8
	SourceAddrNPI      uint8
	SourceAddr         string
	ESMEAddrTON        uint8
	ESMEAddrNPI        uint8
	ESMEAddr           string
	OptionalParameters map[uint16][]byte
}

// EnquireLinkPDU represents enquire_link request/response PDU
type EnquireLinkPDU struct {
	// Empty body
}

// UnbindPDU represents unbind request/response PDU
type UnbindPDU struct {
	// Empty body
}

// GenericNACKPDU represents generic_nack PDU
type GenericNACKPDU struct {
	// Empty body
}

// ReadPDU reads a complete PDU from the given reader
func ReadPDU(reader io.Reader) (*PDU, error) {
	// Read command length (4 bytes)
	lengthBytes := make([]byte, 4)
	if _, err := io.ReadFull(reader, lengthBytes); err != nil {
		return nil, fmt.Errorf("failed to read command length: %v", err)
	}
	commandLength := binary.BigEndian.Uint32(lengthBytes)

	if commandLength < 16 {
		return nil, fmt.Errorf("invalid command length: %d", commandLength)
	}

	// Read the rest of the PDU
	pduBytes := make([]byte, commandLength-4)
	if _, err := io.ReadFull(reader, pduBytes); err != nil {
		return nil, fmt.Errorf("failed to read PDU body: %v", err)
	}

	// Parse header
	if len(pduBytes) < 12 {
		return nil, fmt.Errorf("PDU body too short for header")
	}

	commandID := binary.BigEndian.Uint32(pduBytes[0:4])
	commandStatus := binary.BigEndian.Uint32(pduBytes[4:8])
	sequenceNumber := binary.BigEndian.Uint32(pduBytes[8:12])

	// Body is the remaining bytes
	body := pduBytes[12:]

	return &PDU{
		CommandLength:  commandLength,
		CommandID:      commandID,
		CommandStatus:  commandStatus,
		SequenceNumber: sequenceNumber,
		Body:           body,
	}, nil
}

// WritePDU writes a PDU to the given writer
func WritePDU(writer io.Writer, pdu *PDU) error {
	// Calculate total length
	totalLength := uint32(16 + len(pdu.Body))

	log.Printf("WritePDU: Writing PDU - TotalLength: %d, CommandID: 0x%08X, Status: 0x%08X, Seq: %d, BodyLen: %d",
		totalLength, pdu.CommandID, pdu.CommandStatus, pdu.SequenceNumber, len(pdu.Body))

	// Build complete PDU in memory first
	completePDU := make([]byte, 0, 16+len(pdu.Body))

	// Command length (4 bytes)
	lengthBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(lengthBytes, totalLength)
	completePDU = append(completePDU, lengthBytes...)

	// Command ID (4 bytes)
	commandIDBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(commandIDBytes, pdu.CommandID)
	completePDU = append(completePDU, commandIDBytes...)

	// Command status (4 bytes)
	statusBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(statusBytes, pdu.CommandStatus)
	completePDU = append(completePDU, statusBytes...)

	// Sequence number (4 bytes)
	seqBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(seqBytes, pdu.SequenceNumber)
	completePDU = append(completePDU, seqBytes...)

	// Body
	completePDU = append(completePDU, pdu.Body...)

	log.Printf("WritePDU: Complete PDU hex dump: %X", completePDU)

	// Write complete PDU in one operation - ensure all data is written
	bytesWritten := 0
	for bytesWritten < len(completePDU) {
		n, err := writer.Write(completePDU[bytesWritten:])
		if err != nil {
			log.Printf("WritePDU: Failed to write PDU (partial write): %v", err)
			return fmt.Errorf("failed to write complete PDU: %v", err)
		}
		bytesWritten += n
	}

	log.Printf("WritePDU: PDU written successfully in one operation (%d bytes)", bytesWritten)
	return nil
}

// ParseBindPDU parses a bind PDU from the body bytes
func ParseBindPDU(body []byte) (*BindPDU, error) {
	if len(body) == 0 {
		return nil, fmt.Errorf("bind PDU body is empty")
	}

	offset := 0

	// System ID (null-terminated)
	systemID, newOffset := readCString(body, offset)
	offset = newOffset

	// Password (null-terminated)
	password, newOffset := readCString(body, offset)
	offset = newOffset

	// System Type (null-terminated)
	systemType, newOffset := readCString(body, offset)
	offset = newOffset

	// Interface Version
	if offset >= len(body) {
		// Default to 0x34 if not provided
		return &BindPDU{
			SystemID:         systemID,
			Password:         password,
			SystemType:       systemType,
			InterfaceVersion: 0x34,
			TON:              0,
			NPI:              0,
			AddressRange:     "",
		}, nil
	}
	interfaceVersion := body[offset]
	offset++

	// TON
	if offset >= len(body) {
		return &BindPDU{
			SystemID:         systemID,
			Password:         password,
			SystemType:       systemType,
			InterfaceVersion: interfaceVersion,
			TON:              0,
			NPI:              0,
			AddressRange:     "",
		}, nil
	}
	ton := body[offset]
	offset++

	// NPI
	if offset >= len(body) {
		return &BindPDU{
			SystemID:         systemID,
			Password:         password,
			SystemType:       systemType,
			InterfaceVersion: interfaceVersion,
			TON:              ton,
			NPI:              0,
			AddressRange:     "",
		}, nil
	}
	npi := body[offset]
	offset++

	// Address Range (null-terminated)
	addressRange, _ := readCString(body, offset)

	return &BindPDU{
		SystemID:         systemID,
		Password:         password,
		SystemType:       systemType,
		InterfaceVersion: interfaceVersion,
		TON:              ton,
		NPI:              npi,
		AddressRange:     addressRange,
	}, nil
}

// SerializeBindPDU serializes a bind PDU to bytes
func SerializeBindPDU(bind *BindPDU) []byte {
	var result []byte

	// System ID
	result = append(result, []byte(bind.SystemID)...)
	result = append(result, 0)

	// Password
	result = append(result, []byte(bind.Password)...)
	result = append(result, 0)

	// System Type
	result = append(result, []byte(bind.SystemType)...)
	result = append(result, 0)

	// Interface Version
	result = append(result, bind.InterfaceVersion)

	// TON
	result = append(result, bind.TON)

	// NPI
	result = append(result, bind.NPI)

	// Address Range
	result = append(result, []byte(bind.AddressRange)...)
	result = append(result, 0)

	return result
}

// SerializeBindRespPDU creates a bind response PDU body (only SystemID)
func SerializeBindRespPDU(systemID string) []byte {
	var result []byte

	// Only SystemID in bind response
	result = append(result, []byte(systemID)...)
	result = append(result, 0) // null terminator

	log.Printf("SerializeBindRespPDU: SystemID=%q, Result=%X, Length=%d", systemID, result, len(result))

	return result
}

// ParseSubmitSMPDU parses a submit_sm PDU from the body bytes
func ParseSubmitSMPDU(body []byte) (*SubmitSMPDU, error) {
	if len(body) < 33 {
		return nil, fmt.Errorf("submit_sm PDU body too short")
	}

	offset := 0

	// Service Type (null-terminated)
	serviceType, newOffset := readCString(body, offset)
	offset = newOffset

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// Dest Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for dest addr TON")
	}
	destAddrTON := body[offset]
	offset++

	// Dest Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for dest addr NPI")
	}
	destAddrNPI := body[offset]
	offset++

	// Destination Addr (null-terminated)
	destinationAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// ESM Class
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for ESM class")
	}
	esmClass := body[offset]
	offset++

	// Protocol ID
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for protocol ID")
	}
	protocolID := body[offset]
	offset++

	// Priority Flag
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for priority flag")
	}
	priorityFlag := body[offset]
	offset++

	// Schedule Delivery Time (null-terminated)
	scheduleDeliveryTime, newOffset := readCString(body, offset)
	offset = newOffset

	// Validity Period (null-terminated)
	validityPeriod, newOffset := readCString(body, offset)
	offset = newOffset

	// Registered Delivery
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for registered delivery")
	}
	registeredDelivery := body[offset]
	offset++

	// Replace If Present Flag
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for replace if present flag")
	}
	replaceIfPresentFlag := body[offset]
	offset++

	// Data Coding
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for data coding")
	}
	dataCoding := body[offset]
	offset++

	// SM Default Msg ID
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for SM default msg ID")
	}
	smDefaultMsgID := body[offset]
	offset++

	// SM Length
	if offset >= len(body) {
		return nil, fmt.Errorf("submit_sm PDU body too short for SM length")
	}
	smLength := body[offset]
	offset++

	// Short Message
	var shortMessage string
	if smLength > 0 && offset+int(smLength) <= len(body) {
		shortMessage = string(body[offset : offset+int(smLength)])
		offset += int(smLength)
	}

	// Optional Parameters (if any)
	optionalParameters := make(map[uint16][]byte)
	if offset < len(body) {
		// Parse optional parameters
		for offset < len(body) {
			if offset+4 > len(body) {
				break
			}
			tag := binary.BigEndian.Uint16(body[offset : offset+2])
			length := binary.BigEndian.Uint16(body[offset+2 : offset+4])
			offset += 4

			if offset+int(length) <= len(body) {
				optionalParameters[tag] = body[offset : offset+int(length)]
				offset += int(length)
			} else {
				break
			}
		}
	}

	return &SubmitSMPDU{
		ServiceType:          serviceType,
		SourceAddrTON:        sourceAddrTON,
		SourceAddrNPI:        sourceAddrNPI,
		SourceAddr:           sourceAddr,
		DestAddrTON:          destAddrTON,
		DestAddrNPI:          destAddrNPI,
		DestinationAddr:      destinationAddr,
		ESMClass:             esmClass,
		ProtocolID:           protocolID,
		PriorityFlag:         priorityFlag,
		ScheduleDeliveryTime: scheduleDeliveryTime,
		ValidityPeriod:       validityPeriod,
		RegisteredDelivery:   registeredDelivery,
		ReplaceIfPresentFlag: replaceIfPresentFlag,
		DataCoding:           dataCoding,
		SMDefaultMsgID:       smDefaultMsgID,
		SMLength:             smLength,
		ShortMessage:         shortMessage,
		OptionalParameters:   optionalParameters,
	}, nil
}

// SerializeSubmitSMPDU serializes a submit_sm PDU to bytes
func SerializeSubmitSMPDU(submit *SubmitSMPDU) []byte {
	var result []byte

	// Service Type
	result = append(result, []byte(submit.ServiceType)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, submit.SourceAddrTON)

	// Source Addr NPI
	result = append(result, submit.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(submit.SourceAddr)...)
	result = append(result, 0)

	// Dest Addr TON
	result = append(result, submit.DestAddrTON)

	// Dest Addr NPI
	result = append(result, submit.DestAddrNPI)

	// Destination Addr
	result = append(result, []byte(submit.DestinationAddr)...)
	result = append(result, 0)

	// ESM Class
	result = append(result, submit.ESMClass)

	// Protocol ID
	result = append(result, submit.ProtocolID)

	// Priority Flag
	result = append(result, submit.PriorityFlag)

	// Schedule Delivery Time
	result = append(result, []byte(submit.ScheduleDeliveryTime)...)
	result = append(result, 0)

	// Validity Period
	result = append(result, []byte(submit.ValidityPeriod)...)
	result = append(result, 0)

	// Registered Delivery
	result = append(result, submit.RegisteredDelivery)

	// Replace If Present Flag
	result = append(result, submit.ReplaceIfPresentFlag)

	// Data Coding
	result = append(result, submit.DataCoding)

	// SM Default Msg ID
	result = append(result, submit.SMDefaultMsgID)

	// SM Length
	result = append(result, submit.SMLength)

	// Short Message
	if submit.SMLength > 0 {
		result = append(result, []byte(submit.ShortMessage)...)
	}

	// Optional Parameters
	for tag, value := range submit.OptionalParameters {
		tagBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(tagBytes, tag)
		result = append(result, tagBytes...)

		lengthBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(lengthBytes, uint16(len(value)))
		result = append(result, lengthBytes...)

		result = append(result, value...)
	}

	return result
}

// SerializeSubmitSMRespPDU serializes a submit_sm_resp PDU to bytes
func SerializeSubmitSMRespPDU(resp *SubmitSMRespPDU) []byte {
	var result []byte

	// Message ID (null-terminated)
	result = append(result, []byte(resp.MessageID)...)
	result = append(result, 0)

	return result
}

// ParseSubmitSMRespPDU parses a submit_sm_resp PDU from the body bytes
func ParseSubmitSMRespPDU(body []byte) (*SubmitSMRespPDU, error) {
	messageID, _ := readCString(body, 0)
	return &SubmitSMRespPDU{
		MessageID: messageID,
	}, nil
}

// ParseDataSMPDU parses a data_sm PDU from the body bytes
func ParseDataSMPDU(body []byte) (*DataSMPDU, error) {
	if len(body) < 21 {
		return nil, fmt.Errorf("data_sm PDU body too short")
	}

	offset := 0

	// Service Type (null-terminated)
	serviceType, newOffset := readCString(body, offset)
	offset = newOffset

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// Dest Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for dest addr TON")
	}
	destAddrTON := body[offset]
	offset++

	// Dest Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for dest addr NPI")
	}
	destAddrNPI := body[offset]
	offset++

	// Destination Addr (null-terminated)
	destinationAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// ESM Class
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for ESM class")
	}
	esmClass := body[offset]
	offset++

	// Registered Delivery
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for registered delivery")
	}
	registeredDelivery := body[offset]
	offset++

	// Data Coding
	if offset >= len(body) {
		return nil, fmt.Errorf("data_sm PDU body too short for data coding")
	}
	dataCoding := body[offset]
	offset++

	// Optional Parameters (if any)
	optionalParameters := make(map[uint16][]byte)
	if offset < len(body) {
		// Parse optional parameters
		for offset < len(body) {
			if offset+4 > len(body) {
				break
			}
			tag := binary.BigEndian.Uint16(body[offset : offset+2])
			length := binary.BigEndian.Uint16(body[offset+2 : offset+4])
			offset += 4

			if offset+int(length) <= len(body) {
				optionalParameters[tag] = body[offset : offset+int(length)]
				offset += int(length)
			} else {
				break
			}
		}
	}

	return &DataSMPDU{
		ServiceType:        serviceType,
		SourceAddrTON:      sourceAddrTON,
		SourceAddrNPI:      sourceAddrNPI,
		SourceAddr:         sourceAddr,
		DestAddrTON:        destAddrTON,
		DestAddrNPI:        destAddrNPI,
		DestinationAddr:    destinationAddr,
		ESMClass:           esmClass,
		RegisteredDelivery: registeredDelivery,
		DataCoding:         dataCoding,
		OptionalParameters: optionalParameters,
	}, nil
}

// SerializeDataSMPDU serializes a data_sm PDU to bytes
func SerializeDataSMPDU(data *DataSMPDU) []byte {
	var result []byte

	// Service Type
	result = append(result, []byte(data.ServiceType)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, data.SourceAddrTON)

	// Source Addr NPI
	result = append(result, data.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(data.SourceAddr)...)
	result = append(result, 0)

	// Dest Addr TON
	result = append(result, data.DestAddrTON)

	// Dest Addr NPI
	result = append(result, data.DestAddrNPI)

	// Destination Addr
	result = append(result, []byte(data.DestinationAddr)...)
	result = append(result, 0)

	// ESM Class
	result = append(result, data.ESMClass)

	// Registered Delivery
	result = append(result, data.RegisteredDelivery)

	// Data Coding
	result = append(result, data.DataCoding)

	// Optional Parameters
	for tag, value := range data.OptionalParameters {
		tagBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(tagBytes, tag)
		result = append(result, tagBytes...)

		lengthBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(lengthBytes, uint16(len(value)))
		result = append(result, lengthBytes...)

		result = append(result, value...)
	}

	return result
}

// SerializeDataSMRespPDU serializes a data_sm_resp PDU to bytes
func SerializeDataSMRespPDU(resp *DataSMRespPDU) []byte {
	var result []byte

	// Message ID (null-terminated)
	result = append(result, []byte(resp.MessageID)...)
	result = append(result, 0)

	// Optional Parameters
	for tag, value := range resp.OptionalParameters {
		tagBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(tagBytes, tag)
		result = append(result, tagBytes...)

		lengthBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(lengthBytes, uint16(len(value)))
		result = append(result, lengthBytes...)

		result = append(result, value...)
	}

	return result
}

// ParseQuerySMPDU parses a query_sm PDU from the body bytes
func ParseQuerySMPDU(body []byte) (*QuerySMPDU, error) {
	if len(body) < 17 {
		return nil, fmt.Errorf("query_sm PDU body too short")
	}

	offset := 0

	// Message ID (null-terminated)
	messageID, newOffset := readCString(body, offset)
	offset = newOffset

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("query_sm PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("query_sm PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, _ := readCString(body, offset)

	return &QuerySMPDU{
		MessageID:     messageID,
		SourceAddrTON: sourceAddrTON,
		SourceAddrNPI: sourceAddrNPI,
		SourceAddr:    sourceAddr,
	}, nil
}

// SerializeQuerySMPDU serializes a query_sm PDU to bytes
func SerializeQuerySMPDU(query *QuerySMPDU) []byte {
	var result []byte

	// Message ID
	result = append(result, []byte(query.MessageID)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, query.SourceAddrTON)

	// Source Addr NPI
	result = append(result, query.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(query.SourceAddr)...)
	result = append(result, 0)

	return result
}

// SerializeQuerySMRespPDU serializes a query_sm_resp PDU to bytes
func SerializeQuerySMRespPDU(resp *QuerySMRespPDU) []byte {
	var result []byte

	// Message ID
	result = append(result, []byte(resp.MessageID)...)
	result = append(result, 0)

	// Final Date
	result = append(result, []byte(resp.FinalDate)...)
	result = append(result, 0)

	// Message State
	result = append(result, resp.MessageState)

	// Error Code
	result = append(result, resp.ErrorCode)

	return result
}

// ParseCancelSMPDU parses a cancel_sm PDU from the body bytes
func ParseCancelSMPDU(body []byte) (*CancelSMPDU, error) {
	if len(body) < 25 {
		return nil, fmt.Errorf("cancel_sm PDU body too short")
	}

	offset := 0

	// Service Type (null-terminated)
	serviceType, newOffset := readCString(body, offset)
	offset = newOffset

	// Message ID (null-terminated)
	messageID, newOffset := readCString(body, offset)
	offset = newOffset

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("cancel_sm PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("cancel_sm PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// Dest Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("cancel_sm PDU body too short for dest addr TON")
	}
	destAddrTON := body[offset]
	offset++

	// Dest Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("cancel_sm PDU body too short for dest addr NPI")
	}
	destAddrNPI := body[offset]
	offset++

	// Destination Addr (null-terminated)
	destinationAddr, _ := readCString(body, offset)

	return &CancelSMPDU{
		ServiceType:     serviceType,
		MessageID:       messageID,
		SourceAddrTON:   sourceAddrTON,
		SourceAddrNPI:   sourceAddrNPI,
		SourceAddr:      sourceAddr,
		DestAddrTON:     destAddrTON,
		DestAddrNPI:     destAddrNPI,
		DestinationAddr: destinationAddr,
	}, nil
}

// SerializeCancelSMPDU serializes a cancel_sm PDU to bytes
func SerializeCancelSMPDU(cancel *CancelSMPDU) []byte {
	var result []byte

	// Service Type
	result = append(result, []byte(cancel.ServiceType)...)
	result = append(result, 0)

	// Message ID
	result = append(result, []byte(cancel.MessageID)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, cancel.SourceAddrTON)

	// Source Addr NPI
	result = append(result, cancel.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(cancel.SourceAddr)...)
	result = append(result, 0)

	// Dest Addr TON
	result = append(result, cancel.DestAddrTON)

	// Dest Addr NPI
	result = append(result, cancel.DestAddrNPI)

	// Destination Addr
	result = append(result, []byte(cancel.DestinationAddr)...)
	result = append(result, 0)

	return result
}

// SerializeCancelSMRespPDU serializes a cancel_sm_resp PDU to bytes
func SerializeCancelSMRespPDU() []byte {
	// Cancel SM response has no body
	return []byte{}
}

// ParseReplaceSMPDU parses a replace_sm PDU from the body bytes
func ParseReplaceSMPDU(body []byte) (*ReplaceSMPDU, error) {
	if len(body) < 17 {
		return nil, fmt.Errorf("replace_sm PDU body too short")
	}

	offset := 0

	// Message ID (null-terminated)
	messageID, newOffset := readCString(body, offset)
	offset = newOffset

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("replace_sm PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("replace_sm PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// Schedule Delivery Time (null-terminated)
	scheduleDeliveryTime, newOffset := readCString(body, offset)
	offset = newOffset

	// Validity Period (null-terminated)
	validityPeriod, newOffset := readCString(body, offset)
	offset = newOffset

	// Registered Delivery
	if offset >= len(body) {
		return nil, fmt.Errorf("replace_sm PDU body too short for registered delivery")
	}
	registeredDelivery := body[offset]
	offset++

	// SM Default Msg ID
	if offset >= len(body) {
		return nil, fmt.Errorf("replace_sm PDU body too short for SM default msg ID")
	}
	smDefaultMsgID := body[offset]
	offset++

	// SM Length
	if offset >= len(body) {
		return nil, fmt.Errorf("replace_sm PDU body too short for SM length")
	}
	smLength := body[offset]
	offset++

	// Short Message
	var shortMessage string
	if smLength > 0 && offset+int(smLength) <= len(body) {
		shortMessage = string(body[offset : offset+int(smLength)])
	}

	return &ReplaceSMPDU{
		MessageID:            messageID,
		SourceAddrTON:        sourceAddrTON,
		SourceAddrNPI:        sourceAddrNPI,
		SourceAddr:           sourceAddr,
		ScheduleDeliveryTime: scheduleDeliveryTime,
		ValidityPeriod:       validityPeriod,
		RegisteredDelivery:   registeredDelivery,
		SMDefaultMsgID:       smDefaultMsgID,
		SMLength:             smLength,
		ShortMessage:         shortMessage,
	}, nil
}

// SerializeReplaceSMPDU serializes a replace_sm PDU to bytes
func SerializeReplaceSMPDU(replace *ReplaceSMPDU) []byte {
	var result []byte

	// Message ID
	result = append(result, []byte(replace.MessageID)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, replace.SourceAddrTON)

	// Source Addr NPI
	result = append(result, replace.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(replace.SourceAddr)...)
	result = append(result, 0)

	// Schedule Delivery Time
	result = append(result, []byte(replace.ScheduleDeliveryTime)...)
	result = append(result, 0)

	// Validity Period
	result = append(result, []byte(replace.ValidityPeriod)...)
	result = append(result, 0)

	// Registered Delivery
	result = append(result, replace.RegisteredDelivery)

	// SM Default Msg ID
	result = append(result, replace.SMDefaultMsgID)

	// SM Length
	result = append(result, replace.SMLength)

	// Short Message
	if replace.SMLength > 0 {
		result = append(result, []byte(replace.ShortMessage)...)
	}

	return result
}

// SerializeReplaceSMRespPDU serializes a replace_sm_resp PDU to bytes
func SerializeReplaceSMRespPDU() []byte {
	// Replace SM response has no body
	return []byte{}
}

// ParseOutbindPDU parses an outbind PDU from the body bytes
func ParseOutbindPDU(body []byte) (*OutbindPDU, error) {
	if len(body) < 2 {
		return nil, fmt.Errorf("outbind PDU body too short")
	}

	offset := 0

	// System ID (null-terminated)
	systemID, newOffset := readCString(body, offset)
	offset = newOffset

	// Password (null-terminated)
	password, _ := readCString(body, offset)

	return &OutbindPDU{
		SystemID: systemID,
		Password: password,
	}, nil
}

// SerializeOutbindPDU serializes an outbind PDU to bytes
func SerializeOutbindPDU(outbind *OutbindPDU) []byte {
	var result []byte

	// System ID
	result = append(result, []byte(outbind.SystemID)...)
	result = append(result, 0)

	// Password
	result = append(result, []byte(outbind.Password)...)
	result = append(result, 0)

	return result
}

// ParseAlertNotificationPDU parses an alert_notification PDU from the body bytes
func ParseAlertNotificationPDU(body []byte) (*AlertNotificationPDU, error) {
	if len(body) < 13 {
		return nil, fmt.Errorf("alert_notification PDU body too short")
	}

	offset := 0

	// Source Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("alert_notification PDU body too short for source addr TON")
	}
	sourceAddrTON := body[offset]
	offset++

	// Source Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("alert_notification PDU body too short for source addr NPI")
	}
	sourceAddrNPI := body[offset]
	offset++

	// Source Addr (null-terminated)
	sourceAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// ESME Addr TON
	if offset >= len(body) {
		return nil, fmt.Errorf("alert_notification PDU body too short for ESME addr TON")
	}
	esmeAddrTON := body[offset]
	offset++

	// ESME Addr NPI
	if offset >= len(body) {
		return nil, fmt.Errorf("alert_notification PDU body too short for ESME addr NPI")
	}
	esmeAddrNPI := body[offset]
	offset++

	// ESME Addr (null-terminated)
	esmeAddr, newOffset := readCString(body, offset)
	offset = newOffset

	// Optional Parameters (if any)
	optionalParameters := make(map[uint16][]byte)
	if offset < len(body) {
		// Parse optional parameters
		for offset < len(body) {
			if offset+4 > len(body) {
				break
			}
			tag := binary.BigEndian.Uint16(body[offset : offset+2])
			length := binary.BigEndian.Uint16(body[offset+2 : offset+4])
			offset += 4

			if offset+int(length) <= len(body) {
				optionalParameters[tag] = body[offset : offset+int(length)]
				offset += int(length)
			} else {
				break
			}
		}
	}

	return &AlertNotificationPDU{
		SourceAddrTON:      sourceAddrTON,
		SourceAddrNPI:      sourceAddrNPI,
		SourceAddr:         sourceAddr,
		ESMEAddrTON:        esmeAddrTON,
		ESMEAddrNPI:        esmeAddrNPI,
		ESMEAddr:           esmeAddr,
		OptionalParameters: optionalParameters,
	}, nil
}

// SerializeAlertNotificationPDU serializes an alert_notification PDU to bytes
func SerializeAlertNotificationPDU(alert *AlertNotificationPDU) []byte {
	var result []byte

	// Source Addr TON
	result = append(result, alert.SourceAddrTON)

	// Source Addr NPI
	result = append(result, alert.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(alert.SourceAddr)...)
	result = append(result, 0)

	// ESME Addr TON
	result = append(result, alert.ESMEAddrTON)

	// ESME Addr NPI
	result = append(result, alert.ESMEAddrNPI)

	// ESME Addr
	result = append(result, []byte(alert.ESMEAddr)...)
	result = append(result, 0)

	// Optional Parameters
	for tag, value := range alert.OptionalParameters {
		tagBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(tagBytes, tag)
		result = append(result, tagBytes...)

		lengthBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(lengthBytes, uint16(len(value)))
		result = append(result, lengthBytes...)

		result = append(result, value...)
	}

	return result
}

// SerializeEnquireLinkPDU serializes an enquire_link PDU to bytes
func SerializeEnquireLinkPDU() []byte {
	// Enquire link has no body
	return []byte{}
}

// SerializeUnbindPDU serializes an unbind PDU to bytes
func SerializeUnbindPDU() []byte {
	// Unbind has no body
	return []byte{}
}

// SerializeGenericNACKPDU serializes a generic_nack PDU to bytes
func SerializeGenericNACKPDU() []byte {
	// Generic NACK has no body
	return []byte{}
}

// DecodeShortMessage decodes short message based on data coding
func DecodeShortMessage(data []byte, dataCoding uint8) (string, error) {
	switch dataCoding {
	case 0: // SMSC Default Alphabet
		return decodeGSM7Bit(data)
	case 1: // IA5 (CCITT T.50)/ASCII (ANSI X3.4)
		return string(data), nil
	case 2: // Octet unspecified (8-bit binary)
		return string(data), nil
	case 3: // Latin 1 (ISO-8859-1)
		return string(data), nil
	case 4: // Octet unspecified (8-bit binary)
		return string(data), nil
	case 5: // JIS (X 0208-1990)
		return string(data), nil // Simplified for now
	case 6: // Cyrillic (ISO-8859-5)
		return string(data), nil
	case 7: // Latin/Hebrew (ISO-8859-8)
		return string(data), nil
	case 8: // UCS2 (ISO/IEC-10646)
		return decodeUCS2(data)
	case 9: // Pictogram Encoding
		return string(data), nil // Simplified for now
	case 10: // ISO-2022-JP (Music Codes)
		return string(data), nil // Simplified for now
	case 13: // Extended Kanji JIS(X 0212-1990)
		return string(data), nil // Simplified for now
	case 14: // KS C 5601
		return string(data), nil // Simplified for now
	case 240: // Reserved for future use
		return string(data), nil
	case 241: // Reserved for future use
		return string(data), nil
	case 242: // Reserved for future use
		return string(data), nil
	case 243: // Reserved for future use
		return string(data), nil
	case 244: // Reserved for future use
		return string(data), nil
	case 245: // Reserved for future use
		return string(data), nil
	case 246: // Reserved for future use
		return string(data), nil
	case 247: // Reserved for future use
		return string(data), nil
	case 248: // Reserved for future use
		return string(data), nil
	case 249: // Reserved for future use
		return string(data), nil
	case 250: // Reserved for future use
		return string(data), nil
	case 251: // Reserved for future use
		return string(data), nil
	case 252: // Reserved for future use
		return string(data), nil
	case 253: // Reserved for future use
		return string(data), nil
	case 254: // Reserved for future use
		return string(data), nil
	case 255: // Reserved for future use
		return string(data), nil
	default:
		return string(data), nil
	}
}

// decodeUCS2 decodes UCS2 (UTF-16BE) encoded data
func decodeUCS2(data []byte) (string, error) {
	if len(data)%2 != 0 {
		return "", fmt.Errorf("UCS2 data length must be even, got %d", len(data))
	}

	// Convert bytes to uint16 slice (UTF-16BE)
	runes := make([]uint16, len(data)/2)
	for i := 0; i < len(data); i += 2 {
		runes[i/2] = binary.BigEndian.Uint16(data[i : i+2])
	}

	// Convert UTF-16 to UTF-8
	return string(utf16.Decode(runes)), nil
}

// decodeGSM7Bit decodes GSM 7-bit default alphabet
func decodeGSM7Bit(data []byte) (string, error) {
	// GSM 7-bit default alphabet mapping
	gsm7BitMap := map[byte]rune{
		0x00: '@', 0x01: '£', 0x02: '$', 0x03: '¥', 0x04: 'è', 0x05: 'é', 0x06: 'ù', 0x07: 'ì',
		0x08: 'ò', 0x09: 'Ç', 0x0A: '\n', 0x0B: 'Ø', 0x0C: 'ø', 0x0D: '\r', 0x0E: 'Å', 0x0F: 'å',
		0x10: 'Δ', 0x11: '_', 0x12: 'Φ', 0x13: 'Γ', 0x14: 'Λ', 0x15: 'Ω', 0x16: 'Π', 0x17: 'Ψ',
		0x18: 'Σ', 0x19: 'Θ', 0x1A: 'Ξ', 0x1B: '\x1B', 0x1C: 'Æ', 0x1D: 'æ', 0x1E: 'ß', 0x1F: 'É',
		0x20: ' ', 0x21: '!', 0x22: '"', 0x23: '#', 0x24: '¤', 0x25: '%', 0x26: '&', 0x27: '\'',
		0x28: '(', 0x29: ')', 0x2A: '*', 0x2B: '+', 0x2C: ',', 0x2D: '-', 0x2E: '.', 0x2F: '/',
		0x30: '0', 0x31: '1', 0x32: '2', 0x33: '3', 0x34: '4', 0x35: '5', 0x36: '6', 0x37: '7',
		0x38: '8', 0x39: '9', 0x3A: ':', 0x3B: ';', 0x3C: '<', 0x3D: '=', 0x3E: '>', 0x3F: '?',
		0x40: '¡', 0x41: 'A', 0x42: 'B', 0x43: 'C', 0x44: 'D', 0x45: 'E', 0x46: 'F', 0x47: 'G',
		0x48: 'H', 0x49: 'I', 0x4A: 'J', 0x4B: 'K', 0x4C: 'L', 0x4D: 'M', 0x4E: 'N', 0x4F: 'O',
		0x50: 'P', 0x51: 'Q', 0x52: 'R', 0x53: 'S', 0x54: 'T', 0x55: 'U', 0x56: 'V', 0x57: 'W',
		0x58: 'X', 0x59: 'Y', 0x5A: 'Z', 0x5B: 'Ä', 0x5C: 'Ö', 0x5D: 'Ñ', 0x5E: 'Ü', 0x5F: '§',
		0x60: '¿', 0x61: 'a', 0x62: 'b', 0x63: 'c', 0x64: 'd', 0x65: 'e', 0x66: 'f', 0x67: 'g',
		0x68: 'h', 0x69: 'i', 0x6A: 'j', 0x6B: 'k', 0x6C: 'l', 0x6D: 'm', 0x6E: 'n', 0x6F: 'o',
		0x70: 'p', 0x71: 'q', 0x72: 'r', 0x73: 's', 0x74: 't', 0x75: 'u', 0x76: 'v', 0x77: 'w',
		0x78: 'x', 0x79: 'y', 0x7A: 'z', 0x7B: 'ä', 0x7C: 'ö', 0x7D: 'ñ', 0x7E: 'ü', 0x7F: 'à',
	}

	result := make([]rune, 0, len(data))
	for _, b := range data {
		if char, exists := gsm7BitMap[b]; exists {
			result = append(result, char)
		} else {
			result = append(result, '?')
		}
	}

	return string(result), nil
}

// readCString reads a null-terminated string from the given offset
func readCString(data []byte, offset int) (string, int) {
	if offset >= len(data) {
		return "", offset
	}

	end := offset
	for end < len(data) && data[end] != 0 {
		end++
	}

	return string(data[offset:end]), end + 1
}

// String returns a string representation of the PDU for debugging
func (pdu *PDU) String() string {
	return fmt.Sprintf("PDU{Length:%d, ID:0x%08X, Status:0x%08X, Seq:%d, Body:%s}",
		pdu.CommandLength,
		pdu.CommandID,
		pdu.CommandStatus,
		pdu.SequenceNumber,
		hex.EncodeToString(pdu.Body))
}

// SerializeDeliverSMPDU serializes a deliver_sm PDU to bytes
func SerializeDeliverSMPDU(deliver *DeliverSMPDU) []byte {
	var result []byte

	// Service Type
	result = append(result, []byte(deliver.ServiceType)...)
	result = append(result, 0)

	// Source Addr TON
	result = append(result, deliver.SourceAddrTON)

	// Source Addr NPI
	result = append(result, deliver.SourceAddrNPI)

	// Source Addr
	result = append(result, []byte(deliver.SourceAddr)...)
	result = append(result, 0)

	// Dest Addr TON
	result = append(result, deliver.DestAddrTON)

	// Dest Addr NPI
	result = append(result, deliver.DestAddrNPI)

	// Destination Addr
	result = append(result, []byte(deliver.DestinationAddr)...)
	result = append(result, 0)

	// ESM Class
	result = append(result, deliver.ESMClass)

	// Protocol ID
	result = append(result, deliver.ProtocolID)

	// Priority Flag
	result = append(result, deliver.PriorityFlag)

	// Schedule Delivery Time
	result = append(result, []byte(deliver.ScheduleDeliveryTime)...)
	result = append(result, 0)

	// Validity Period
	result = append(result, []byte(deliver.ValidityPeriod)...)
	result = append(result, 0)

	// Registered Delivery
	result = append(result, deliver.RegisteredDelivery)

	// Replace If Present Flag
	result = append(result, deliver.ReplaceIfPresentFlag)

	// Data Coding
	result = append(result, deliver.DataCoding)

	// SM Default Msg ID
	result = append(result, deliver.SMDefaultMsgID)

	// SM Length
	result = append(result, deliver.SMLength)

	// Short Message
	if deliver.SMLength > 0 {
		result = append(result, []byte(deliver.ShortMessage)...)
	}

	// Optional Parameters
	for tag, value := range deliver.OptionalParameters {
		tagBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(tagBytes, tag)
		result = append(result, tagBytes...)

		lengthBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(lengthBytes, uint16(len(value)))
		result = append(result, lengthBytes...)

		result = append(result, value...)
	}

	return result
}
