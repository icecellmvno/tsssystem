-- Schedule Tasks Tables
-- This script creates the schedule_tasks and schedule_task_executions tables

USE tsim_socket_server;

-- Create schedule_tasks table
CREATE TABLE IF NOT EXISTS schedule_tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_group_id BIGINT UNSIGNED NOT NULL,
    task_type ENUM('ussd', 'sms') NOT NULL,
    command TEXT NOT NULL,
    recipient VARCHAR(255),
    frequency ENUM('hourly', 'daily', 'weekly', 'monthly', 'custom') NOT NULL,
    cron_expression VARCHAR(255),
    time VARCHAR(10) NOT NULL,
    day_of_week INT,
    day_of_month INT,
    month INT,
    interval_minutes INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    dual_sim_support BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_to_single_sim BOOLEAN NOT NULL DEFAULT TRUE,
    max_retries INT NOT NULL DEFAULT 3,
    retry_delay_minutes INT NOT NULL DEFAULT 5,
    status ENUM('active', 'paused', 'completed', 'failed') NOT NULL DEFAULT 'active',
    last_executed_at TIMESTAMP NULL,
    next_execution_at TIMESTAMP NULL,
    execution_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_group_id (device_group_id),
    INDEX idx_task_type (task_type),
    INDEX idx_frequency (frequency),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active),
    INDEX idx_next_execution_at (next_execution_at),
    INDEX idx_created_at (created_at),
    INDEX idx_status_active (status, is_active),
    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create schedule_task_executions table
CREATE TABLE IF NOT EXISTS schedule_task_executions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    schedule_task_id BIGINT UNSIGNED NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    status ENUM('pending', 'running', 'completed', 'failed') NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_schedule_task_id (schedule_task_id),
    INDEX idx_device_id (device_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_started_at (started_at),
    FOREIGN KEY (schedule_task_id) REFERENCES schedule_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 