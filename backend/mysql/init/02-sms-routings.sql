-- SMS Routings table
CREATE TABLE IF NOT EXISTS sms_routings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    source_type VARCHAR(50) NOT NULL COMMENT 'smpp, http',
    direction VARCHAR(50) NOT NULL COMMENT 'inbound, outbound',
    system_id VARCHAR(255) NULL COMMENT 'SMPP system ID',
    destination_address VARCHAR(255) NULL COMMENT 'Destination address pattern',
    target_type VARCHAR(50) NOT NULL COMMENT 'http, device_group, smpp',
    target_url VARCHAR(500) NULL COMMENT 'HTTP target URL',
    device_group_id INT NULL COMMENT 'Device group ID for target',
    target_system_id VARCHAR(255) NULL COMMENT 'SMPP target system ID',
    user_id INT NULL COMMENT 'User ID for HTTP source',
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 50,
    conditions TEXT NULL COMMENT 'JSON conditions',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_source_type (source_type),
    INDEX idx_direction (direction),
    INDEX idx_target_type (target_type),
    INDEX idx_is_active (is_active),
    INDEX idx_priority (priority),
    INDEX idx_deleted_at (deleted_at),
    
    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO sms_routings (name, description, source_type, direction, system_id, destination_address, target_type, target_url, is_active, priority) VALUES
('Default HTTP Inbound', 'Default routing for HTTP inbound messages', 'http', 'inbound', NULL, '*', 'http', 'https://api.example.com/webhook', TRUE, 50),
('SMPP Outbound to Device Group', 'Route SMPP outbound messages to device group', 'smpp', 'outbound', 'test_system', '*', 'device_group', NULL, TRUE, 60),
('HTTP to SMPP Bridge', 'Bridge HTTP messages to SMPP', 'http', 'outbound', NULL, '*', 'smpp', NULL, TRUE, 40); 