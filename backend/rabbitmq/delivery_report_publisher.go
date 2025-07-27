package rabbitmq

import (
	"encoding/json"
	"log"

	"tsimsocketserver/types"

	amqp "github.com/rabbitmq/amqp091-go"
)

// DeliveryReportPublisher handles publishing delivery reports to SMPP server
type DeliveryReportPublisher struct {
	rabbitMQ *RabbitMQHandler
}

// NewDeliveryReportPublisher creates a new delivery report publisher
func NewDeliveryReportPublisher(rabbitMQ *RabbitMQHandler) *DeliveryReportPublisher {
	return &DeliveryReportPublisher{
		rabbitMQ: rabbitMQ,
	}
}

// PublishDeliveryReport publishes a delivery report to the SMPP server
func (drp *DeliveryReportPublisher) PublishDeliveryReport(report *types.DeliveryReportMessage) error {
	// Convert message to JSON
	body, err := json.Marshal(report)
	if err != nil {
		return err
	}

	// Publish to delivery report queue
	err = drp.rabbitMQ.channel.Publish(
		"tsimcloudrouter", // exchange
		"delivery_report", // routing key
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)
	if err != nil {
		log.Printf("Failed to publish delivery report: %v", err)
		return err
	}

	log.Printf("Published delivery report for message: %s, status: %d", report.MessageID, report.MessageState)
	return nil
}
