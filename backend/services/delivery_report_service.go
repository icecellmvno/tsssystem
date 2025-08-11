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

	// If report is nil, it means we don't need to send delivery report for this status
	if report == nil {
		log.Printf("No delivery report needed for status: %s, message: %s", status, smsLog.MessageID)
		return nil
	}

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

	// Set source and destination addresses for delivery report
	// In SMPP delivery report: source_addr = original destination (where message was sent), destination_addr = original source (SMPP client)
	if smsLog.DestinationAddr != nil {
		report.SourceAddr = *smsLog.DestinationAddr // Orijinal hedef numara (mesajın gönderildiği yer)
	}
	if smsLog.SourceAddr != nil {
		report.DestinationAddr = *smsLog.SourceAddr // SMPP client adresi (mesajın geldiği yer)
	}

	// Set original text if available
	if smsLog.Message != nil {
		report.OriginalText = *smsLog.Message
	}

	// Convert status to SMPP message state (System specific standard)
	// Only send delivery reports for final statuses: delivered, undelivered, expired, rejected, etc.
	// System Message State Values:
	// 0 = SCHEDULED, 1 = ENROUTE, 2 = DELIVERED, 3 = EXPIRED, 4 = DELETED, 5 = UNDELIVERABLE, 6 = ACCEPTED, 7 = UNKNOWN, 8 = REJECTED
	switch status {
	case "sent":
		// Don't send delivery report for "sent" status from Android devices
		// This is an intermediate status, not a final delivery status
		log.Printf("Skipping delivery report for intermediate status: %s", status)
		return nil
	case "delivered":
		report.MessageState = 2 // DELIVERED (System standard)
		report.Delivered = true
		report.Failed = false
		report.FailureReason = ""
	case "failed", "undelivered":
		report.MessageState = 5 // UNDELIVERABLE (System standard)
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message undelivered"
	case "expired":
		report.MessageState = 3 // EXPIRED (System standard)
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message expired"
	case "rejected":
		report.MessageState = 8 // REJECTED (System standard)
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message rejected"
	case "timeout":
		report.MessageState = 6 // ACCEPTED (System standard)
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message timeout"
	case "cancelled":
		report.MessageState = 4 // DELETED (System standard)
		report.Delivered = false
		report.Failed = true
		report.FailureReason = "Message cancelled"
	default:
		// For intermediate statuses like "enroute", etc., don't send delivery report
		log.Printf("Skipping delivery report for intermediate status: %s", status)
		return nil
	}

	log.Printf("Created delivery report for message %s: status=%s, message_state=%d, delivered=%t, failed=%t",
		smsLog.MessageID, status, report.MessageState, report.Delivered, report.Failed)

	return report
}
