package rabbitmq

import (
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQHandler struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func NewRabbitMQHandler() *RabbitMQHandler {
	return &RabbitMQHandler{}
}

// Connect establishes connection to RabbitMQ
func (r *RabbitMQHandler) Connect(url string) error {
	var err error

	// Try to connect with retry mechanism
	for i := 0; i < 5; i++ {
		r.conn, err = amqp.Dial(url)
		if err == nil {
			break
		}
		log.Printf("Failed to connect to RabbitMQ, retrying in 5 seconds... (attempt %d/5)", i+1)
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		return err
	}

	r.channel, err = r.conn.Channel()
	if err != nil {
		return err
	}

	log.Println("Successfully connected to RabbitMQ")
	return nil
}

// CreateQueue creates a new queue in RabbitMQ
func (r *RabbitMQHandler) CreateQueue(queueName string) error {
	if r.channel == nil {
		return amqp.ErrClosed
	}

	// Declare queue
	_, err := r.channel.QueueDeclare(
		queueName, // name
		true,      // durable (survives server restart)
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)

	if err != nil {
		log.Printf("Failed to create queue %s: %v", queueName, err)
		return err
	}

	log.Printf("Successfully created queue: %s", queueName)
	return nil
}

// DeleteQueue deletes a queue from RabbitMQ
func (r *RabbitMQHandler) DeleteQueue(queueName string) error {
	if r.channel == nil {
		return amqp.ErrClosed
	}

	// Delete queue
	_, err := r.channel.QueueDelete(
		queueName, // name
		false,     // ifUnused
		false,     // ifEmpty
		false,     // noWait
	)

	if err != nil {
		log.Printf("Failed to delete queue %s: %v", queueName, err)
		return err
	}

	log.Printf("Successfully deleted queue: %s", queueName)
	return nil
}

// PublishMessage publishes a message to a queue
func (r *RabbitMQHandler) PublishMessage(queueName string, message []byte) error {
	if r.channel == nil {
		return amqp.ErrClosed
	}

	err := r.channel.Publish(
		"",        // exchange
		queueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        message,
			Timestamp:   time.Now(),
		},
	)

	if err != nil {
		log.Printf("Failed to publish message to queue %s: %v", queueName, err)
		return err
	}

	log.Printf("Successfully published message to queue: %s", queueName)
	return nil
}

// ConsumeQueue starts consuming messages from a queue
func (r *RabbitMQHandler) ConsumeQueue(queueName string, handler func([]byte) error) error {
	if r.channel == nil {
		return amqp.ErrClosed
	}

	msgs, err := r.channel.Consume(
		queueName, // queue
		"",        // consumer
		true,      // auto-ack
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)

	if err != nil {
		log.Printf("Failed to start consuming from queue %s: %v", queueName, err)
		return err
	}

	go func() {
		for msg := range msgs {
			log.Printf("Received message from queue %s: %s", queueName, string(msg.Body))

			if err := handler(msg.Body); err != nil {
				log.Printf("Error processing message from queue %s: %v", queueName, err)
			}
		}
	}()

	log.Printf("Started consuming from queue: %s", queueName)
	return nil
}

// GetQueueInfo returns information about a queue
func (r *RabbitMQHandler) GetQueueInfo(queueName string) (amqp.Queue, error) {
	if r.channel == nil {
		return amqp.Queue{}, amqp.ErrClosed
	}

	return r.channel.QueueInspect(queueName)
}

// Close closes the RabbitMQ connection
func (r *RabbitMQHandler) Close() error {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		return r.conn.Close()
	}
	return nil
}
