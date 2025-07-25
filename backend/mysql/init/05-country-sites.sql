-- Country Sites table migration
-- This script creates the country_sites table (renamed from sitenames)

USE tsim_socket_server;

-- Create country_sites table
CREATE TABLE IF NOT EXISTS country_sites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    country_phone_code VARCHAR(10) NOT NULL,
    manager_user BIGINT UNSIGNED NOT NULL,
    operator_user BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_name (name),
    INDEX idx_country_phone_code (country_phone_code),
    INDEX idx_manager_user (manager_user),
    INDEX idx_operator_user (operator_user),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints if users table exists
-- ALTER TABLE country_sites ADD CONSTRAINT fk_country_sites_manager_user FOREIGN KEY (manager_user) REFERENCES users(id);
-- ALTER TABLE country_sites ADD CONSTRAINT fk_country_sites_operator_user FOREIGN KEY (operator_user) REFERENCES users(id); 