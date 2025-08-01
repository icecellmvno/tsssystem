-- Add SMS limit tracking fields to devices table
ALTER TABLE devices 
ADD COLUMN sim1_daily_sms_used INT DEFAULT 0,
ADD COLUMN sim1_monthly_sms_used INT DEFAULT 0,
ADD COLUMN sim1_daily_limit_reset_at TIMESTAMP NULL,
ADD COLUMN sim1_monthly_limit_reset_at TIMESTAMP NULL,
ADD COLUMN sim2_daily_sms_used INT DEFAULT 0,
ADD COLUMN sim2_monthly_sms_used INT DEFAULT 0,
ADD COLUMN sim2_daily_limit_reset_at TIMESTAMP NULL,
ADD COLUMN sim2_monthly_limit_reset_at TIMESTAMP NULL;

-- Remove sms_limit field from device_sim_cards table as it's now managed in device_group
ALTER TABLE device_sim_cards DROP COLUMN sms_limit;

-- Add indexes for better performance
CREATE INDEX idx_devices_sms_limits ON devices(imei, sim1_daily_sms_used, sim1_monthly_sms_used, sim2_daily_sms_used, sim2_monthly_sms_used); 