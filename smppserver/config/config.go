package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	RabbitMQ RabbitMQConfig `mapstructure:"rabbitmq"`
	Logging  LoggingConfig  `mapstructure:"logging"`
	SMPP     SMPPConfig     `mapstructure:"smpp"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Host                 string        `mapstructure:"host"`
	Port                 int           `mapstructure:"port"`
	ReadTimeout          time.Duration `mapstructure:"read_timeout"`
	WriteTimeout         time.Duration `mapstructure:"write_timeout"`
	MaxSessions          int           `mapstructure:"max_sessions"`
	SessionTimeout       time.Duration `mapstructure:"session_timeout"`
	EnquireLinkInterval  time.Duration `mapstructure:"enquire_link_interval"`
	TCPKeepalive         bool          `mapstructure:"tcp_keepalive"`
	TCPKeepalivePeriod   time.Duration `mapstructure:"tcp_keepalive_period"`
	TCPLinger            time.Duration `mapstructure:"tcp_linger"`
}

type SMPServerConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
}

// RedisConfig removed - using MySQL for authentication

type RabbitMQConfig struct {
	URL                 string `mapstructure:"url"`
	Exchange            string `mapstructure:"exchange"`
	Queue               string `mapstructure:"queue"`
	DeliveryReportQueue string `mapstructure:"delivery_report_queue"`
}

type SMPPConfig struct {
	EnquireLinkInterval time.Duration `mapstructure:"enquire_link_interval"`
	SessionTimeout      time.Duration `mapstructure:"session_timeout"`
}

type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

var AppConfig *Config

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("../backend/config")
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}

	config := &Config{}
	if err := viper.Unmarshal(config); err != nil {
		return nil, err
	}

	return config, nil
}

func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
	)
}
