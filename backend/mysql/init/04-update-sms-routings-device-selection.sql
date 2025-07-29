-- Update SMS routings table to support device selection strategy and SIM card preferences
-- Add new columns for device selection and SIM card configuration

ALTER TABLE sms_routings 
ADD COLUMN device_selection_strategy VARCHAR(50) DEFAULT 'round_robin' COMMENT 'round_robin, least_used, random, specific',
ADD COLUMN target_device_ids JSON COMMENT 'JSON array of specific device IMEIs for specific strategy',
ADD COLUMN max_devices_per_message INT DEFAULT 1 COMMENT 'How many devices to use per message',
ADD COLUMN sim_slot_preference INT DEFAULT 1 COMMENT '1 or 2, which SIM slot to prefer',
ADD COLUMN sim_card_selection_strategy VARCHAR(50) DEFAULT 'preferred' COMMENT 'preferred, round_robin, least_used';

-- Add indexes for better performance
ALTER TABLE sms_routings 
ADD INDEX idx_device_selection_strategy (device_selection_strategy),
ADD INDEX idx_sim_slot_preference (sim_slot_preference);

-- Update existing records to have default values
UPDATE sms_routings SET 
device_selection_strategy = 'round_robin',
max_devices_per_message = 1,
sim_slot_preference = 1,
sim_card_selection_strategy = 'preferred'
WHERE device_selection_strategy IS NULL; 