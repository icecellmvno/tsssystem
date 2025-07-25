package protocol

import (
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"io"
	"log"
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

	// Write command length
	lengthBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(lengthBytes, totalLength)
	log.Printf("WritePDU: Command length bytes: %02X %02X %02X %02X", lengthBytes[0], lengthBytes[1], lengthBytes[2], lengthBytes[3])
	if _, err := writer.Write(lengthBytes); err != nil {
		log.Printf("WritePDU: Failed to write command length: %v", err)
		return fmt.Errorf("failed to write command length: %v", err)
	}

	// Write command ID
	commandIDBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(commandIDBytes, pdu.CommandID)
	log.Printf("WritePDU: Command ID bytes: %02X %02X %02X %02X", commandIDBytes[0], commandIDBytes[1], commandIDBytes[2], commandIDBytes[3])
	if _, err := writer.Write(commandIDBytes); err != nil {
		log.Printf("WritePDU: Failed to write command ID: %v", err)
		return fmt.Errorf("failed to write command ID: %v", err)
	}

	// Write command status
	statusBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(statusBytes, pdu.CommandStatus)
	log.Printf("WritePDU: Command status bytes: %02X %02X %02X %02X", statusBytes[0], statusBytes[1], statusBytes[2], statusBytes[3])
	if _, err := writer.Write(statusBytes); err != nil {
		log.Printf("WritePDU: Failed to write command status: %v", err)
		return fmt.Errorf("failed to write command status: %v", err)
	}

	// Write sequence number
	seqBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(seqBytes, pdu.SequenceNumber)
	log.Printf("WritePDU: Sequence number bytes: %02X %02X %02X %02X", seqBytes[0], seqBytes[1], seqBytes[2], seqBytes[3])
	if _, err := writer.Write(seqBytes); err != nil {
		log.Printf("WritePDU: Failed to write sequence number: %v", err)
		return fmt.Errorf("failed to write sequence number: %v", err)
	}

	// Write body if present
	if len(pdu.Body) > 0 {
		log.Printf("WritePDU: Body bytes: %X", pdu.Body)
		if _, err := writer.Write(pdu.Body); err != nil {
			log.Printf("WritePDU: Failed to write PDU body: %v", err)
			return fmt.Errorf("failed to write PDU body: %v", err)
		}
	}

	log.Printf("WritePDU: PDU written successfully")
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
