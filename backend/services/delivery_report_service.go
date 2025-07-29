package services

import (
	"encoding/json"
	"log"
	"time"

	"tsimsocketserver/models"
	"tsimsocketserver/types"
)

// DeliveryReportService handles delivery report operations
type DeliveryReportService struct {
	publishDeliveryReport func(*types.DeliveryReportMessage) error
}

// NewDeliveryReportService creates a new delivery report service
func NewDeliveryReportService(publishFunc func(*types.DeliveryReportMessage) error) *DeliveryReportService {
	return &DeliveryReportService{
		publishDeliveryReport: publishFunc,
	}
}

// PublishDeliveryReport publishes a delivery report to SMPP server
func (drs *DeliveryReportService) PublishDeliveryReport(smsLog models.SmsLog, status string) error {
	// Check if this is an SMPP message by checking source_connector
	if smsLog.SourceConnector == nil || *smsLog.SourceConnector != "smpp" {
		return nil // Not an SMPP message, skip
	}

	// Parse metadata to get SMPP system ID
	var metadata map[string]interface{}
	if smsLog.Metadata == nil {
		log.Printf("No metadata found for SMPP message: %s", smsLog.MessageID)
		return nil
	}

	if err := json.Unmarshal([]byte(*smsLog.Metadata), &metadata); err != nil {
		log.Printf("Failed to parse metadata for message %s: %v", smsLog.MessageID, err)
		return err
	}

	systemID, ok := metadata["system_id"].(string)
	if !ok {
		log.Printf("No system_id found in metadata for message: %s", smsLog.MessageID)
		return nil
	}

	// Create delivery report message
	report := drs.createDeliveryReport(smsLog, systemID, status)

	// Publish to RabbitMQ
	if err := drs.publishDeliveryReport(report); err != nil {
		log.Printf("Failed to publish delivery report for message %s: %v", smsLog.MessageID, err)
		return err
	}

	log.Printf("Successfully published delivery report for SMPP message: %s, status: %s", smsLog.MessageID, status)
	return nil
}

// createDeliveryReport creates a delivery report from SMS log data
func (drs *DeliveryReportService) createDeliveryReport(smsLog models.SmsLog, systemID, status string) *types.DeliveryReportMessage {
	now := time.Now()
	nowStr := now.Format("20060102150405")

	report := &types.DeliveryReportMessage{
		MessageID:  smsLog.MessageID,
		SystemID:   systemID,
		FinalDate:  nowStr,
		SubmitDate: nowStr,
		DoneDate:   nowStr,
	}

	// Set source and destination addresses (swapped for delivery report)
	// In delivery report: source_addr = destination (where message was sent), destination_addr = source (where message came from)
	if smsLog.DestinationAddr != nil {
		report.SourceAddr = *smsLog.DestinationAddr // Hedef numara (mesajın gideceği yer)
	}
	if smsLog.SourceAddr != nil {
		report.DestinationAddr = *smsLog.SourceAddr // SMPP client adresi (mesajın geldiği yer)
	}

	// Convert status to SMPP message state
	switch status {
	case "delivered":
		report.MessageState = 2 // DELIVERED
		report.Delivered = true
		report.Failed = false
	case "failed":
		report.MessageState = 4 // UNDELIVERABLE
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Delivery failed"
	case "expired":
		report.MessageState = 2 // EXPIRED
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message expired"
	case "rejected":
		report.MessageState = 7 // REJECTED
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message rejected"
	default:
		report.MessageState = 6 // UNKNOWN
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Unknown status"
	}

	return report
}
