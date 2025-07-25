-- Create filters table
CREATE TABLE IF NOT EXISTS `filters` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `type` varchar(100) NOT NULL,
    `description` text,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `config` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_filters_type` (`type`),
    KEY `idx_filters_is_active` (`is_active`),
    KEY `idx_filters_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample filters for testing
INSERT INTO `filters` (`name`, `type`, `description`, `is_active`, `config`) VALUES
('Default Transparent Filter', 'TransparentFilter', 'Default filter that always matches any message criteria', 1, '{}'),
('Test Connector Filter', 'ConnectorFilter', 'Test filter for connector matching', 1, '{"connector_id": "test_connector_1"}'),
('Test User Filter', 'UserFilter', 'Test filter for user matching', 1, '{"user_id": "test_user_1"}'),
('Test Group Filter', 'GroupFilter', 'Test filter for group matching', 1, '{"group_id": "test_group_1"}'),
('Test Source Address Filter', 'SourceAddrFilter', 'Test filter for source address matching', 1, '{"address": "+1234567890"}'),
('Test Destination Address Filter', 'DestinationAddrFilter', 'Test filter for destination address matching', 1, '{"address": "+0987654321"}'),
('Test Message Content Filter', 'ShortMessageFilter', 'Test filter for message content matching', 1, '{"pattern": "test.*message"}'),
('Test Date Interval Filter', 'DateIntervalFilter', 'Test filter for date interval matching', 1, '{"start_date": "2024-01-01", "end_date": "2024-12-31"}'),
('Test Time Interval Filter', 'TimeIntervalFilter', 'Test filter for time interval matching', 1, '{"start_time": "09:00", "end_time": "17:00"}'),
('Test Tag Filter', 'TagFilter', 'Test filter for tag matching', 1, '{"tag": "test_tag"}'),
('Test Python Script Filter', 'EvalPyFilter', 'Test filter using Python script', 1, '{"script_path": "/path/to/script.py", "script_content": "def filter_message(message):\n    return True"}'); 