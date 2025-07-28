-- Update SMS routings table to support multiple device groups
-- Remove HTTP and SMPP target columns, add device_group_ids JSON column

ALTER TABLE sms_routings 
DROP COLUMN IF EXISTS target_url,
DROP COLUMN IF EXISTS device_group_id,
DROP COLUMN IF EXISTS target_system_id,
ADD COLUMN device_group_ids JSON;

-- Create junction table for many-to-many relationship (optional, for future use)
CREATE TABLE IF NOT EXISTS sms_routing_device_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sms_routing_id BIGINT UNSIGNED NOT NULL,
    device_group_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_sms_routing_device_groups_sms_routing_id (sms_routing_id),
    INDEX idx_sms_routing_device_groups_device_group_id (device_group_id),
    INDEX idx_sms_routing_device_groups_deleted_at (deleted_at),
    FOREIGN KEY (sms_routing_id) REFERENCES sms_routings(id) ON DELETE CASCADE,
    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE CASCADE
); 