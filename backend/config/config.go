package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Database      DatabaseConfig      `mapstructure:"database"`
	JWT           JWTConfig           `mapstructure:"jwt"`
	Server        ServerConfig        `mapstructure:"server"`
	RabbitMQ      RabbitMQConfig      `mapstructure:"rabbitmq"`
	Redis         RedisConfig         `mapstructure:"redis"`
	WebSocketURL  string              `mapstructure:"websocket_url"`
	SmsMonitoring SmsMonitoringConfig `mapstructure:"sms_monitoring"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
}

type JWTConfig struct {
	Secret string `mapstructure:"secret"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
}

type RabbitMQConfig struct {
	URL      string `mapstructure:"url"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
}

type RedisConfig struct {
	URL string `mapstructure:"url"`
}

type SmsMonitoringConfig struct {
	MonitoringWindow     int `mapstructure:"monitoring_window"`      // Number of recent SMS to check
	MinSmsForCheck       int `mapstructure:"min_sms_for_check"`      // Minimum SMS count before checking
	MaintenanceThreshold int `mapstructure:"maintenance_threshold"`  // Number of non-delivered SMS to trigger maintenance
	CheckIntervalMinutes int `mapstructure:"check_interval_minutes"` // How often to run the monitoring (in minutes)
}

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
	)
}
