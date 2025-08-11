package handlers

import (
	"tsimsocketserver/config"

	"os"
	"path/filepath"
	"sync"

	"github.com/gofiber/fiber/v2"
	"gopkg.in/yaml.v3"
)

type ConfigHandler struct {
	configPath string
	config     *config.Config
	mutex      sync.RWMutex
}

func NewConfigHandler() *ConfigHandler {
	handler := &ConfigHandler{
		configPath: "./config/config.yaml",
	}

	// Load initial configuration
	if cfg, err := config.LoadConfig(); err == nil {
		handler.config = cfg
	}

	return handler
}

// GetSmsMonitoringConfig returns the current SMS monitoring configuration
func (h *ConfigHandler) GetSmsMonitoringConfig(c *fiber.Ctx) error {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if h.config == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Configuration not loaded",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    h.config.SmsMonitoring,
	})
}

// UpdateSmsMonitoringConfig updates the SMS monitoring configuration
func (h *ConfigHandler) UpdateSmsMonitoringConfig(c *fiber.Ctx) error {
	var request struct {
		MonitoringWindow     int `json:"monitoring_window"`
		MinSmsForCheck       int `json:"min_sms_for_check"`
		MaintenanceThreshold int `json:"maintenance_threshold"`
		CheckIntervalMinutes int `json:"check_interval_minutes"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate the input
	if request.MonitoringWindow < 1 || request.MinSmsForCheck < 1 ||
		request.MaintenanceThreshold < 1 || request.CheckIntervalMinutes < 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "All values must be greater than 0",
		})
	}

	if request.MinSmsForCheck > request.MonitoringWindow {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "min_sms_for_check cannot be greater than monitoring_window",
		})
	}

	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Load current config from file to get latest values
	cfg, err := config.LoadConfig()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to load current configuration",
		})
	}

	// Update SMS monitoring config
	cfg.SmsMonitoring.MonitoringWindow = request.MonitoringWindow
	cfg.SmsMonitoring.MinSmsForCheck = request.MinSmsForCheck
	cfg.SmsMonitoring.MaintenanceThreshold = request.MaintenanceThreshold
	cfg.SmsMonitoring.CheckIntervalMinutes = request.CheckIntervalMinutes

	// Save to file
	if err := h.saveConfigToFile(cfg); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save configuration",
		})
	}

	// Update in-memory configuration for immediate use
	h.config = cfg

	return c.JSON(fiber.Map{
		"success": true,
		"message": "SMS monitoring configuration updated successfully and reloaded",
		"data":    cfg.SmsMonitoring,
	})
}

// ReloadConfig reloads the configuration from file
func (h *ConfigHandler) ReloadConfig(c *fiber.Ctx) error {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	cfg, err := config.LoadConfig()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to reload configuration",
		})
	}

	h.config = cfg

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Configuration reloaded successfully",
		"data":    cfg.SmsMonitoring,
	})
}

// GetCurrentConfig returns the current in-memory configuration
func (h *ConfigHandler) GetCurrentConfig() *config.Config {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	return h.config
}

// saveConfigToFile saves the configuration to the YAML file
func (h *ConfigHandler) saveConfigToFile(cfg *config.Config) error {
	// Create a map structure for YAML marshaling
	configMap := map[string]interface{}{
		"database": map[string]interface{}{
			"host":     cfg.Database.Host,
			"port":     cfg.Database.Port,
			"user":     cfg.Database.User,
			"password": cfg.Database.Password,
			"name":     cfg.Database.Name,
		},
		"jwt": map[string]interface{}{
			"secret": cfg.JWT.Secret,
		},
		"server": map[string]interface{}{
			"port": cfg.Server.Port,
		},
		"websocket_url": cfg.WebSocketURL,
		"rabbitmq": map[string]interface{}{
			"url": cfg.RabbitMQ.URL,
		},
		"redis": map[string]interface{}{
			"url": cfg.Redis.URL,
		},
		"smpp": map[string]interface{}{
			"enquire_link_interval": "30s",
			"session_timeout":       "60s",
		},
		"logging": map[string]interface{}{
			"level":  "info",
			"format": "json",
		},
		"sms_monitoring": map[string]interface{}{
			"monitoring_window":      cfg.SmsMonitoring.MonitoringWindow,
			"min_sms_for_check":      cfg.SmsMonitoring.MinSmsForCheck,
			"maintenance_threshold":  cfg.SmsMonitoring.MaintenanceThreshold,
			"check_interval_minutes": cfg.SmsMonitoring.CheckIntervalMinutes,
		},
	}

	// Marshal to YAML
	yamlData, err := yaml.Marshal(configMap)
	if err != nil {
		return err
	}

	// Ensure the config directory exists
	configDir := filepath.Dir(h.configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	// Write to file
	return os.WriteFile(h.configPath, yamlData, 0644)
}
