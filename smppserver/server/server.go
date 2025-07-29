package server

import (
	"fmt"
	"log"
	"net"
	"smppserver/auth"
	"smppserver/config"
	"smppserver/handler"
	"smppserver/rabbitmq"
	"smppserver/session"
)

type SMPServer struct {
	config         *config.Config
	authManager    *auth.MySQLAuthManager
	handler        *handler.SMPPHandler
	sessionManager *session.SessionManager
	rabbitMQClient *rabbitmq.RabbitMQClient
	listener       net.Listener
}

func NewSMPServer(config *config.Config) (*SMPServer, error) {
	// Initialize session manager first
	sessionConfig := &session.SessionConfig{
		MaxSessions:         config.Server.MaxSessions,
		SessionTimeout:      config.Server.SessionTimeout,
		EnquireLinkInterval: config.Server.EnquireLinkInterval,
		ReadTimeout:         config.Server.ReadTimeout,
		WriteTimeout:        config.Server.WriteTimeout,
	}
	sessionManager := session.NewSessionManager(sessionConfig)

	// Initialize MySQL-based auth manager
	authManager, err := auth.NewMySQLAuthManager(config.GetDatabaseDSN(), sessionManager)
	if err != nil {
		return nil, fmt.Errorf("failed to create MySQL auth manager: %v", err)
	}

	// Initialize RabbitMQ client
	rabbitMQConfig := &rabbitmq.Config{
		URL:                 config.RabbitMQ.URL,
		Exchange:            config.RabbitMQ.Exchange,
		Queue:               config.RabbitMQ.Queue,
		DeliveryReportQueue: config.RabbitMQ.DeliveryReportQueue,
	}
	rabbitMQClient, err := rabbitmq.NewRabbitMQClient(rabbitMQConfig)
	if err != nil {
		log.Printf("Warning: Failed to initialize RabbitMQ client: %v", err)
		// Continue without RabbitMQ if it fails to initialize
		rabbitMQClient = nil
	}

	// Start delivery report consumer if RabbitMQ is available
	if rabbitMQClient != nil {
		if err := rabbitMQClient.StartDeliveryReportConsumer(sessionManager); err != nil {
			log.Printf("Warning: Failed to start delivery report consumer: %v", err)
		}
	}

	// Initialize handler
	smppHandler := handler.NewSMPPHandler(authManager, sessionManager, rabbitMQClient)

	server := &SMPServer{
		config:         config,
		authManager:    authManager,
		handler:        smppHandler,
		sessionManager: sessionManager,
		rabbitMQClient: rabbitMQClient,
	}

	return server, nil
}

func (s *SMPServer) Start() error {
	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to start server: %v", err)
	}

	s.listener = listener
	log.Printf("SMPP Server started on %s", addr)

	// Start cleanup routine
	go s.authManager.StartCleanupRoutine()

	// Accept connections
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *SMPServer) handleConnection(conn net.Conn) {
	// Enable TCP Keepalive from config
	if tcpConn, ok := conn.(*net.TCPConn); ok {
		if s.config.Server.TCPKeepalive {
			if err := tcpConn.SetKeepAlive(true); err != nil {
				log.Printf("Failed to set TCP keepalive: %v", err)
			}
			if err := tcpConn.SetKeepAlivePeriod(s.config.Server.TCPKeepalivePeriod); err != nil {
				log.Printf("Failed to set TCP keepalive period: %v", err)
			}
			if err := tcpConn.SetLinger(int(s.config.Server.TCPLinger.Seconds())); err != nil {
				log.Printf("Failed to set TCP linger: %v", err)
			}
		}
	}

	sess := session.NewSession(conn, s.sessionManager.Config)

	// Add session to manager
	s.sessionManager.AddSession(sess)
	defer func() {
		s.sessionManager.RemoveSession(sess.ID)
		sess.Close()
	}()

	// Handle the session
	sess.HandleConnection(s.handler)
}

func (s *SMPServer) Stop() error {
	if s.listener != nil {
		s.listener.Close()
	}
	if s.authManager != nil {
		s.authManager.Close()
	}
	if s.rabbitMQClient != nil {
		s.rabbitMQClient.Close()
	}
	return nil
}
