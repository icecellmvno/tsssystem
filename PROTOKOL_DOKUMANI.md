# TSimCloud Client Protocol Document

## Overview

TSimCloud Client is an SMS gateway application that runs on Android devices and communicates with a central server using WebSocket protocol. This document details the protocols and communication standards used by the application.

## 1. WebSocket Connection Protocol

### 1.1 Connection Setup

**Endpoint:** `ws://` or `wss://` URL (configured via QR code)

**Connection Parameters:**
- `api_key`: Authentication key (query parameter)
- `Queue-Name`: Queue name (HTTP header)
- `Device-Info`: Device information (JSON format in HTTP header)

**Example Connection URL:**
```
wss://example.com/ws?api_key=your_api_key_here
```

### 1.2 HTTP Headers

```http
Queue-Name: device_queue_name
Device-Info: {"device_id":"android_id","manufacturer":"Samsung","model":"Galaxy S21",...}
```

### 1.3 Connection States

- **Connection Successful:** `onOpen` callback is triggered
- **Connection Lost:** Automatic reconnection (5 second delay)
- **Error State:** Error is logged and reconnection is attempted

## 2. Message Formats

### 2.1 General JSON Message Structure

All messages use the following basic JSON format:

```json
{
  "type": "message_type",
  "timestamp": 1640995200000,
  "data": {
    // Message type specific data
  }
}
```

## 3. SERVER → CLIENT MESSAGES

### 3.1 Connection Confirmation
**Type:** `connection_established`

```json
{
  "type": "connection_established",
  "settings": {
    "battery_low_threshold": 20,
    "error_count_threshold": 5,
    "offline_threshold_minutes": 5,
    "signal_low_threshold": 2,
    "low_balance_threshold": "10.00",
    "enable_battery_alarms": true,
    "enable_error_alarms": true,
    "enable_offline_alarms": true,
    "enable_signal_alarms": true,
    "enable_sim_balance_alarms": true,
    "auto_disable_sim_on_alarm": false,
    "sim1_daily_sms_limit": 100,
    "sim1_monthly_sms_limit": 1000,
    "sim2_daily_sms_limit": 100,
    "sim2_monthly_sms_limit": 1000,
    "enable_sms_limits": false,
    "sms_limit_reset_hour": 0,
    "sim1_guard_interval": 1,
    "sim2_guard_interval": 1
  }
}
```

### 3.2 Send SMS Command
**Type:** `send_sms`

```json
{
  "type": "send_sms",
  "message_id": "unique_message_id",
  "data": {
    "sim_slot": 0,
    "phone_number": "+905551234567",
    "message": "SMS content",
    "priority": "normal|high|urgent"
  }
}
```

### 3.3 USSD Command
**Type:** `send_ussd`

```json
{
  "type": "send_ussd",
  "message_id": "unique_message_id",
  "data": {
    "sim_slot": 0,
    "ussd_code": "*100#",
    "session_id": "optional_session_id",
    "delay": 0
  }
}
```

### 3.4 RCS Command
**Type:** `send_rcs`

```json
{
  "type": "send_rcs",
  "message_id": "unique_message_id",
  "data": {
    "sim_slot": 0,
    "phone_number": "+905551234567",
    "message": "RCS message content",
    "message_type": "text|image|video|file"
  }
}
```

### 3.5 Find Device Command
**Type:** `find_device`

```json
{
  "type": "find_device",
  "data": {
    "message": "Find my device"
  }
}
```

### 3.6 Alarm Start Command
**Type:** `alarm_start`

```json
{
  "type": "alarm_start",
  "data": {
    "alarm_type": "sim_blocked",
    "message": "SIM card is blocked"
  }
}
```

### 3.7 Alarm Stop Command
**Type:** `alarm_stop`

```json
{
  "type": "alarm_stop"
}
```

## 4. CLIENT → SERVER MESSAGES

### 4.1 Heartbeat Message
**Type:** `heartbeat`

**Send Frequency:** 30 seconds

**Data Structure:**
```json
{
  "type": "heartbeat",
  "timestamp": 1640995200000,
  "data": {
    "device_info": {
      "manufacturer": "Samsung",
      "model": "Galaxy S21",
      "android_version": "12",
      "device_id": "android_device_id",
      "sitename": "site_name",
      "device_group": "device_group_name"
    },
    "battery_level": 85,
    "battery_status": "charging",
    "signal_strength": 4,
    "signal_dbm": -65,
    "network_type": "LTE",
    "sim_cards": [
      {
        "slot_index": 0,
        "carrier_name": "Turkcell",
        "phone_number": "+905551234567",
        "network_mcc": "286",
        "network_mnc": "01",
        "is_active": true,
        "imei": "123456789012345",
        "imsi": "286011234567890",
        "iccid": "89860012345678901234",
        "signal_strength": 4,
        "signal_dbm": -65,
        "network_type": "LTE"
      }
    ],
    "location": {
      "latitude": 41.0082,
      "longitude": 28.9784
    }
  }
}
```

### 4.2 Device Status Message
**Type:** `device_status`

**Data Structure:**
```json
{
  "type": "device_status",
  "timestamp": 1640995200000,
  "data": {
    "status": "online|offline|error|maintenance",
    "device_group": "device_group_name",
    "sitename": "site_name",
    "details": {
      // Additional status information
    }
  }
}
```

### 4.3 Alarm Message
**Type:** `alarm`

**Data Structure:**
```json
{
  "type": "alarm",
  "timestamp": 1640995200000,
  "data": {
    "alarm_type": "battery_low|signal_low|sim_balance_low|error_count|offline",
    "message": "Alarm description",
    "severity": "warning|error|critical",
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.4 SMS Log Message
**Type:** `sms_log`

**Data Structure:**
```json
{
  "type": "sms_log",
  "timestamp": 1640995200000,
  "data": {
    "sim_slot": 0,
    "phone_number": "+905551234567",
    "message": "SMS content",
    "status": "sent|failed|delivered",
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.5 SMS Message (Incoming/Outgoing)
**Type:** `sms_message`

**Data Structure:**
```json
{
  "type": "sms_message",
  "timestamp": 1640995200000,
  "data": {
    "phone_number": "+905551234567",
    "message": "SMS content",
    "direction": "received|sent",
    "sim_slot": 0,
    "timestamp": 1640995200000,
    "formatted_timestamp": "2024-01-01 12:00:00",
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.6 SMS Delivery Report
**Type:** `sms_delivery_report`

**Data Structure:**
```json
{
  "type": "sms_delivery_report",
  "timestamp": 1640995200000,
  "data": {
    "phone_number": "+905551234567",
    "message_id": "unique_message_id",
    "status": "delivered|failed|pending",
    "sim_slot": 0,
    "timestamp": 1640995200000,
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.7 USSD Response Message
**Type:** `ussd_response`

**Data Structure:**
```json
{
  "type": "ussd_response",
  "timestamp": 1640995200000,
  "data": {
    "session_id": "session_identifier",
    "message_id": "message_identifier",
    "response": "Raw USSD response text",
    "cleaned_response": "Cleaned USSD response",
    "status": "RESPONSE_RECEIVED",
    "is_menu": true,
    "auto_cancel": true,
    "timestamp": 1640995200000
  }
}
```

### 4.8 USSD Response Failed Message
**Type:** `ussd_response_failed`

**Data Structure:**
```json
{
  "type": "ussd_response_failed",
  "timestamp": 1640995200000,
  "data": {
    "session_id": "session_identifier",
    "message_id": "message_identifier",
    "ussd_code": "*100#",
    "sim_slot": 0,
    "failure_code": 1,
    "error_message": "USSD request failed - Network error",
    "status": "FAILED"
  }
}
```

### 4.9 MMS Received Message
**Type:** `mms_received`

**Data Structure:**
```json
{
  "type": "mms_received",
  "timestamp": 1640995200000,
  "data": {
    "sender": "+905551234567",
    "subject": "MMS Subject",
    "parts_count": 2,
    "sim_slot": 0,
    "timestamp": 1640995200000,
    "device_group": "device_group_name",
    "sitename": "site_name",
    "parts": [
      {
        "content_type": "text/plain",
        "content_id": "text_001",
        "file_name": "message.txt",
        "data_size": 150
      },
      {
        "content_type": "image/jpeg",
        "content_id": "image_001",
        "file_name": "photo.jpg",
        "data_size": 102400
      }
    ]
  }
}
```

### 4.10 RCS Received Message
**Type:** `rcs_received`

**Data Structure:**
```json
{
  "type": "rcs_received",
  "timestamp": 1640995200000,
  "data": {
    "sender": "+905551234567",
    "message": "RCS message content",
    "message_type": "text|image|video|file",
    "sim_slot": 0,
    "timestamp": 1640995200000,
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.11 USSD Code Message
**Type:** `ussd_code`

**Data Structure:**
```json
{
  "type": "ussd_code",
  "timestamp": 1640995200000,
  "data": {
    "sender": "+905551234567",
    "ussd_code": "*100#",
    "sim_slot": 0,
    "timestamp": 1640995200000,
    "device_group": "device_group_name",
    "sitename": "site_name"
  }
}
```

### 4.12 Find Device Success Message
**Type:** `find_device_success`

**Data Structure:**
```json
{
  "type": "find_device_success",
  "timestamp": 1640995200000,
  "data": {
    "message": "Find my device",
    "status": "success",
    "timestamp": 1640995200000
  }
}
```

### 4.13 Find Device Failed Message
**Type:** `find_device_failed`

**Data Structure:**
```json
{
  "type": "find_device_failed",
  "timestamp": 1640995200000,
  "data": {
    "message": "Find my device",
    "status": "failed",
    "error": "Error description",
    "timestamp": 1640995200000
  }
}
```

### 4.14 Alarm Started Message
**Type:** `alarm_started`

**Data Structure:**
```json
{
  "type": "alarm_started",
  "timestamp": 1640995200000,
  "data": {
    "alarm_type": "sim_blocked",
    "message": "SIM card is blocked",
    "status": "started",
    "timestamp": 1640995200000
  }
}
```

### 4.15 Alarm Failed Message
**Type:** `alarm_failed`

**Data Structure:**
```json
{
  "type": "alarm_failed",
  "timestamp": 1640995200000,
  "data": {
    "alarm_type": "sim_blocked",
    "message": "SIM card is blocked",
    "status": "failed",
    "error": "Error description",
    "timestamp": 1640995200000
  }
}
```

### 4.16 Alarm Stopped Message
**Type:** `alarm_stopped`

**Data Structure:**
```json
{
  "type": "alarm_stopped",
  "timestamp": 1640995200000,
  "data": {
    "status": "stopped",
    "timestamp": 1640995200000
  }
}
```

### 4.17 Alarm Stop Failed Message
**Type:** `alarm_stop_failed`

**Data Structure:**
```json
{
  "type": "alarm_stop_failed",
  "timestamp": 1640995200000,
  "data": {
    "status": "failed",
    "error": "Error description",
    "timestamp": 1640995200000
  }
}
```

### 4.18 USSD Cancelled Message
**Type:** `ussd_cancelled`

**Data Structure:**
```json
{
  "type": "ussd_cancelled",
  "timestamp": 1640995200000,
  "data": {
    "session_id": "session_identifier",
    "message_id": "message_identifier",
    "ussd_code": "*100#",
    "sim_slot": 0,
    "status": "CANCELLED",
    "reason": "auto_cancel_menu",
    "timestamp": 1640995200000
  }
}
```

## 5. Device Configuration Protocol

### 5.1 QR Code Format

QR code contains the following JSON format:

```json
{
  "device_group": "group_name",
  "sitename": "site_name",
  "websocket_url": "wss://example.com/ws",
  "api_key": "your_api_key",
  "queue_name": "device_queue",
  "battery_low_threshold": 20,
  "error_count_threshold": 5,
  "offline_threshold_minutes": 5,
  "signal_low_threshold": 2,
  "low_balance_threshold": "10.00",
  "enable_battery_alarms": true,
  "enable_error_alarms": true,
  "enable_offline_alarms": true,
  "enable_signal_alarms": true,
  "enable_sim_balance_alarms": true,
  "auto_disable_sim_on_alarm": false,
  "sim1_daily_sms_limit": 100,
  "sim1_monthly_sms_limit": 1000,
  "sim2_daily_sms_limit": 100,
  "sim2_monthly_sms_limit": 1000,
  "enable_sms_limits": false,
  "sms_limit_reset_hour": 0,
  "sim1_guard_interval": 1,
  "sim2_guard_interval": 1,
  "timestamp": "2024-01-01 12:00:00"
}
```

## 6. SMS Processing Protocol

### 6.1 SMS Sending Process

1. **Command Reception:** Receive `send_sms` command via WebSocket
2. **Validation:** Check SIM card protection rules
3. **Sending:** Send SMS using Android SMS Manager
4. **Logging:** Send result as `sms_log` via WebSocket

### 6.2 SMS Statuses

- `sent`: SMS sent successfully
- `failed`: SMS sending failed
- `delivered`: SMS delivered (delivery report)

### 6.3 SMS Delivery Report Statuses

- `delivered`: SMS delivered successfully
- `failed`: SMS delivery failed
- `pending`: SMS delivery status pending

### 6.4 USSD Error Codes

When USSD operations fail, the following error codes are returned:

- `-1`: Operation failed or cancelled
- `1`: Network error
- `2`: Invalid USSD code
- `3`: Service not available
- `4`: SIM card error
- `5`: Timeout
- `6`: User cancelled
- `7`: Network busy
- `8`: Invalid USSD string

### 6.5 USSD Response Statuses

- `RESPONSE_RECEIVED`: USSD response received successfully
- `FAILED`: USSD operation failed
- `TIMEOUT`: USSD operation timed out
- `CANCELLED`: USSD operation cancelled

### 6.6 USSD Menu Auto-Cancel System

USSD responses containing menus are automatically cancelled:

**Menu Detection Criteria:**
- Words like "menu", "seçenek", "option"
- Numbered options like "1.", "2.", "3."
- Commands like "seçiniz", "select", "giriniz", "enter"
- Navigation like "geri", "back", "çıkış", "exit", "iptal", "cancel"

**Cancel Mechanism:**
- Automatic cancel with 2 second delay
- Send cancel USSD codes: "0", "00", "000", "99", "999", "*0#", "*00#", "*000#", "*99#", "*999#"
- Close system dialogs
- Return to home screen
- Bring application to foreground

### 6.7 SIM Card Protection Rules

- **Daily SMS Limit:** Maximum daily SMS count per SIM
- **Monthly SMS Limit:** Maximum monthly SMS count per SIM
- **Guard Interval:** Minimum waiting time between consecutive SMS
- **Balance Check:** Prevent SMS sending when balance is low

## 7. Alarm System Protocol

### 7.1 Alarm Types

1. **Battery Low Alarm:** Battery level is low
2. **Signal Low Alarm:** Signal level is low
3. **SIM Balance Low Alarm:** SIM card balance is low
4. **Error Count Alarm:** Error count threshold exceeded
5. **Offline Alarm:** Device offline for specified duration
6. **SIM Blocked Alarm:** SIM card blocked
7. **SMS Blocked Alarm:** SMS sending blocked
8. **MMS Blocked Alarm:** MMS sending blocked
9. **USSD Blocked Alarm:** USSD operation blocked

### 7.2 Alarm Severity Levels

- `warning`: Warning level
- `error`: Error level
- `critical`: Critical level

## 8. Security Protocol

### 8.1 Authentication

- **API Key:** Sent as query parameter in WebSocket connection
- **Device ID:** Unique device identifier (Android ID)
- **IMEI/IMSI:** Additional verification with SIM card information

### 8.2 Data Encryption

- **WebSocket:** WSS (WebSocket Secure) usage recommended
- **Data:** JSON messages sent unencrypted

## 9. Error Management Protocol

### 9.1 Connection Errors

- **Automatic Reconnection:** With 5 second delay
- **Maximum Attempts:** Unlimited (continuous retry)
- **Error Logging:** All errors logged to Android logcat

### 9.2 SMS Errors

- **Send Failed:** `sms_log` with `failed` status
- **SIM Card Error:** Alarm triggered
- **Network Error:** Retry mechanism

## 10. Performance Parameters

### 10.1 Timeout Values

- **WebSocket Connection:** 30 seconds
- **WebSocket Read:** 30 seconds
- **WebSocket Write:** 30 seconds
- **Heartbeat Interval:** 30 seconds

### 10.2 Limit Values

- **SMS Send Rate:** Limited by guard interval
- **WebSocket Message Size:** Unlimited (practically)
- **Connection Count:** 1 active connection

## 11. Logging and Monitoring

### 11.1 Log Levels

- **DEBUG:** Detailed operation information
- **INFO:** Important events
- **WARNING:** Warning conditions
- **ERROR:** Error conditions

### 11.2 Log Categories

- **WebSocket:** Connection and message operations
- **SMS:** SMS sending and receiving operations
- **Device:** Device status and information
- **Alarm:** Alarm triggering and management

## 12. Compatibility

### 12.1 Android Versions

- **Minimum:** Android 5.0 (API 21)
- **Recommended:** Android 8.0+ (API 26+)
- **Tested:** Android 12 (API 31)

### 12.2 Hardware Requirements

- **SIM Card:** Minimum 1, maximum 2 SIM card support
- **Network:** GSM/CDMA/LTE support
- **Memory:** Minimum 100MB free space
- **Processor:** ARM or x86 architecture

## 13. Example Usage Scenarios

### 13.1 Initial Setup

1. QR code scanning
2. WebSocket connection establishment
3. Sending device information
4. Receiving and saving settings
5. Starting heartbeat

### 13.2 SMS Sending

1. Receiving `send_sms` command from server
2. Checking SIM card protection rules
3. Sending SMS
4. Reporting result with `sms_log`

### 13.3 Alarm Triggering

1. Status check (battery, signal, etc.)
2. Checking threshold values
3. Creating alarm message
4. Sending via WebSocket

### 13.4 USSD Operation

1. Receiving `send_ussd` command from server
2. Checking SIM card protection rules
3. Sending USSD code
4. Receiving and processing response
5. Auto-cancel if menu
6. Reporting result with `ussd_response`

### 13.5 Incoming SMS Processing

1. Sending `sms_message` with `direction: "received"` when SMS received
2. Special processing if contains USSD code
3. If MMS, sending detailed information with `mms_received`
4. If RCS, processing with `rcs_received`

### 13.6 SMS Delivery Report

1. Waiting for delivery report after SMS sent
2. Sending `sms_delivery_report` on status change
3. Triggering alarm on failure

### 13.7 Device Finding

1. Receiving `find_device` command from server
2. Showing notification and playing sound
3. Reporting success/failure status

### 13.8 Alarm Management

1. Receiving `alarm_start` command from server
2. Showing notification and starting vibration
3. Reporting success status with `alarm_started`
4. Receiving `alarm_stop` command from server
5. Stopping alarm and reporting with `alarm_stopped`

### 13.9 RCS Message Sending

1. Receiving `send_rcs` command from server
2. Sending RCS message
3. Reporting result

### 13.10 USSD Delay Parameter

1. Receiving `send_ussd` command with `delay` parameter from server
2. Waiting for specified duration
3. Sending USSD code

---

**Document Version:** 1.0  
**Last Update:** 2024-01-01  
**Prepared by:** TSimCloud Development Team

## 14. Rust Server Implementation Guide

### 14.1 Technology Stack

**Backend Framework:** Rust with Axum  
**Database:** PostgreSQL with Diesel ORM  
**Message Queue:** RabbitMQ  
**Cache:** Redis  
**WebSocket:** Axum WebSocket support  

### 14.2 Project Structure

```
tsimcloud-server/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── device.rs
│   │   ├── message.rs
│   │   └── alarm.rs
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── websocket.rs
│   │   ├── device.rs
│   │   └── message.rs
│   ├── services/
│   │   ├── mod.rs
│   │   ├── rabbitmq.rs
│   │   ├── redis.rs
│   │   └── websocket.rs
│   └── schema.rs
├── migrations/
└── .env
```

### 14.3 Dependencies (Cargo.toml)

```toml
[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
diesel = { version = "2.1", features = ["postgres", "chrono"] }
diesel_migrations = "2.1"
redis = { version = "0.23", features = ["tokio-comp"] }
lapin = "3.0"
uuid = { version = "1.0", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
tracing = "0.1"
tracing-subscriber = "0.3"
dotenv = "0.15"
anyhow = "1.0"
thiserror = "1.0"
```

### 14.4 Database Models

```rust
// src/models/device.rs
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = crate::schema::devices)]
pub struct Device {
    pub id: String,
    pub device_group: String,
    pub sitename: String,
    pub api_key: String,
    pub queue_name: String,
    pub last_heartbeat: Option<DateTime<Utc>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// src/models/message.rs
#[derive(Debug, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = crate::schema::messages)]
pub struct Message {
    pub id: String,
    pub device_id: String,
    pub message_type: String,
    pub data: serde_json::Value,
    pub status: String,
    pub created_at: DateTime<Utc>,
}
```

### 14.5 WebSocket Handler

```rust
// src/handlers/websocket.rs
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

pub struct WebSocketManager {
    connections: Arc<RwLock<HashMap<String, WebSocket>>>,
    rabbitmq_service: Arc<RabbitMQService>,
    redis_service: Arc<RedisService>,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    axum::extract::Query(params): axum::extract::Query<HashMap<String, String>>,
) -> impl IntoResponse {
    let api_key = params.get("api_key").cloned();
    
    ws.on_upgrade(|socket| handle_socket(socket, api_key))
}

async fn handle_socket(socket: WebSocket, api_key: Option<String>) {
    let (mut sender, mut receiver) = socket.split();
    
    // Validate API key
    if let Some(key) = api_key {
        if !validate_api_key(&key).await {
            return;
        }
    }
    
    // Send connection confirmation
    let connection_msg = serde_json::json!({
        "type": "connection_established",
        "settings": get_device_settings().await
    });
    
    if let Err(_) = sender.send(Message::Text(connection_msg.to_string())).await {
        return;
    }
    
    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(message) = serde_json::from_str::<serde_json::Value>(&text) {
                    handle_client_message(message).await;
                }
            }
            Ok(Message::Close(_)) => break,
            _ => {}
        }
    }
}
```

### 14.6 RabbitMQ Service

```rust
// src/services/rabbitmq.rs
use lapin::{Connection, Channel, options::BasicPublishOptions, BasicProperties};
use serde_json::Value;

pub struct RabbitMQService {
    channel: Channel,
}

impl RabbitMQService {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::connect("amqp://localhost:5672").await?;
        let channel = conn.create_channel().await?;
        
        // Declare queues
        channel.queue_declare("device_commands", Default::default(), Default::default()).await?;
        channel.queue_declare("device_events", Default::default(), Default::default()).await?;
        
        Ok(Self { channel })
    }
    
    pub async fn publish_command(&self, device_id: &str, command: Value) -> Result<(), Box<dyn std::error::Error>> {
        let routing_key = format!("device.{}", device_id);
        
        self.channel
            .basic_publish(
                "",
                &routing_key,
                BasicPublishOptions::default(),
                &serde_json::to_vec(&command)?,
                BasicProperties::default(),
            )
            .await?;
            
        Ok(())
    }
    
    pub async fn consume_events<F>(&self, callback: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: Fn(Value) + Send + 'static,
    {
        let mut consumer = self.channel
            .basic_consume("device_events", "event_consumer", Default::default(), Default::default())
            .await?;
            
        while let Some(delivery) = consumer.next().await {
            if let Ok(delivery) = delivery {
                if let Ok(event) = serde_json::from_slice::<Value>(&delivery.data) {
                    callback(event);
                }
                delivery.ack(Default::default()).await?;
            }
        }
        
        Ok(())
    }
}
```

### 14.7 Redis Service

```rust
// src/services/redis.rs
use redis::{Client, Commands, AsyncCommands};
use serde_json::Value;

pub struct RedisService {
    client: Client,
}

impl RedisService {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let client = Client::open("redis://localhost:6379")?;
        Ok(Self { client })
    }
    
    pub async fn cache_device_status(&self, device_id: &str, status: Value) -> Result<(), Box<dyn std::error::Error>> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("device:{}:status", device_id);
        
        conn.set_ex(&key, serde_json::to_string(&status)?, 300).await?;
        Ok(())
    }
    
    pub async fn get_device_status(&self, device_id: &str) -> Result<Option<Value>, Box<dyn std::error::Error>> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("device:{}:status", device_id);
        
        if let Ok(data) = conn.get::<_, Option<String>>(&key).await {
            if let Some(json_str) = data {
                return Ok(Some(serde_json::from_str(&json_str)?));
            }
        }
        
        Ok(None)
    }
    
    pub async fn increment_sms_counter(&self, device_id: &str, sim_slot: i32) -> Result<i64, Box<dyn std::error::Error>> {
        let mut conn = self.client.get_async_connection().await?;
        let key = format!("device:{}:sim{}:sms:{}", device_id, sim_slot, chrono::Utc::now().format("%Y-%m-%d"));
        
        let count: i64 = conn.incr(&key, 1).await?;
        conn.expire(&key, 86400).await?; // 24 hours
        
        Ok(count)
    }
}
```

### 14.8 Main Application

```rust
// src/main.rs
use axum::Router;
use std::sync::Arc;
use tracing_subscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    // Initialize services
    let rabbitmq_service = Arc::new(RabbitMQService::new().await?);
    let redis_service = Arc::new(RedisService::new()?);
    
    // Create WebSocket manager
    let ws_manager = Arc::new(WebSocketManager::new(rabbitmq_service.clone(), redis_service.clone()));
    
    // Build router
    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .route("/api/devices", get(get_devices))
        .route("/api/devices/:id/status", get(get_device_status))
        .route("/api/devices/:id/send-sms", post(send_sms))
        .route("/api/devices/:id/send-ussd", post(send_ussd))
        .with_state(ws_manager);
    
    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("Server running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await?;
    
    Ok(())
}
```

### 14.9 API Endpoints

```rust
// src/handlers/device.rs
use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SendSmsRequest {
    pub sim_slot: i32,
    pub phone_number: String,
    pub message: String,
    pub priority: Option<String>,
}

pub async fn send_sms(
    Path(device_id): Path<String>,
    State(ws_manager): State<Arc<WebSocketManager>>,
    Json(request): Json<SendSmsRequest>,
) -> Json<serde_json::Value> {
    let command = serde_json::json!({
        "type": "send_sms",
        "message_id": uuid::Uuid::new_v4().to_string(),
        "data": {
            "sim_slot": request.sim_slot,
            "phone_number": request.phone_number,
            "message": request.message,
            "priority": request.priority.unwrap_or_else(|| "normal".to_string())
        }
    });
    
    if let Err(e) = ws_manager.send_to_device(&device_id, command).await {
        return Json(serde_json::json!({
            "error": format!("Failed to send SMS: {}", e)
        }));
    }
    
    Json(serde_json::json!({
        "status": "sent",
        "message_id": command["message_id"]
    }))
}
```

### 14.10 Environment Configuration

```env
# .env
DATABASE_URL=postgres://username:password@localhost/tsimcloud
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
API_SECRET_KEY=your_secret_key_here
SERVER_PORT=3000
```

### 14.11 Database Migrations

```sql
-- migrations/2024_01_01_000001_create_devices.sql
CREATE TABLE devices (
    id VARCHAR(255) PRIMARY KEY,
    device_group VARCHAR(255) NOT NULL,
    sitename VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    queue_name VARCHAR(255) NOT NULL,
    last_heartbeat TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- migrations/2024_01_01_000002_create_messages.sql
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL REFERENCES devices(id),
    message_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_device_id ON messages(device_id);
CREATE INDEX idx_messages_type ON messages(message_type);
```

### 14.12 Deployment

```dockerfile
# Dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/tsimcloud-server /usr/local/bin/
EXPOSE 3000
CMD ["tsimcloud-server"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:password@postgres/tsimcloud
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - postgres
      - redis
      - rabbitmq
      
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tsimcloud
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password

volumes:
  postgres_data:
```

### 14.13 Key Features

1. **WebSocket Management**: Handles multiple device connections with proper authentication
2. **Message Queue**: Uses RabbitMQ for reliable message delivery and command distribution
3. **Caching**: Redis for device status caching and SMS counters
4. **Database**: PostgreSQL with Diesel ORM for persistent storage
5. **API Endpoints**: RESTful API for device management and SMS/USSD sending
6. **Error Handling**: Comprehensive error handling with proper logging
7. **Scalability**: Designed for horizontal scaling with stateless architecture

### 14.14 Performance Considerations

- **Connection Pooling**: Use connection pools for database and Redis
- **Message Batching**: Batch messages when possible for better throughput
- **Caching Strategy**: Cache frequently accessed data in Redis
- **Load Balancing**: Use multiple server instances behind a load balancer
- **Monitoring**: Implement metrics collection for performance monitoring 