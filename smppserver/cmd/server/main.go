package main

import (
	"log"
	"os"
	"os/signal"
	"smppserver/config"
	"smppserver/server"
	"syscall"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Create and start server
	srv, err := server.NewSMPServer(cfg)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	// Start server in goroutine
	go func() {
		if err := srv.Start(); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	log.Println("Shutdown signal received")

	// Stop server gracefully
	if err := srv.Stop(); err != nil {
		log.Printf("Failed to stop server: %v", err)
	}

	log.Println("SMPP Server stopped")
}
