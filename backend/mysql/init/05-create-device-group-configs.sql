-- Create device_group_configs table
CREATE TABLE IF NOT EXISTS `device_group_configs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `sms_routing_id` bigint unsigned NOT NULL,
    `device_group_id` bigint unsigned NOT NULL,
    `priority` int NOT NULL DEFAULT 50,
    `total_sms_count` int NOT NULL DEFAULT 1000,
    
    -- Device Selection Strategy
    `device_selection_strategy` varchar(50) NOT NULL DEFAULT 'round_robin',
    `target_device_ids` text,
    `max_devices_per_message` int NOT NULL DEFAULT 1,
    
    -- SIM Card Configuration
    `sim_slot_preference` int NOT NULL DEFAULT 1,
    `sim_card_selection_strategy` varchar(50) NOT NULL DEFAULT 'preferred',
    
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` timestamp NULL DEFAULT NULL,
    
    PRIMARY KEY (`id`),
    KEY `idx_device_group_configs_sms_routing_id` (`sms_routing_id`),
    KEY `idx_device_group_configs_device_group_id` (`device_group_id`),
    KEY `idx_device_group_configs_deleted_at` (`deleted_at`),
    
    CONSTRAINT `fk_device_group_configs_sms_routing` FOREIGN KEY (`sms_routing_id`) REFERENCES `sms_routings` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_device_group_configs_device_group` FOREIGN KEY (`device_group_id`) REFERENCES `device_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 