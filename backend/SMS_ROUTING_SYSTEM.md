# SMS Routing System

This document describes the SMS routing system that routes SMS messages from the SMPP server to active Android devices via RabbitMQ.

## Overview

The SMS routing system consists of the following components:

1. **SMPP Server** - Publishes SMS messages to RabbitMQ
2. **Backend SMS Router** - Consumes SMPP messages and routes them to active Android devices
3. **Android Devices** - Receive SMS messages via WebSocket and send delivery reports
4. **Delivery Report System** - Sends delivery reports back to the SMPP server

## Message Flow

### 1. SMPP → RabbitMQ → Backend → Android

```
SMPP Client → SMPP Server → RabbitMQ → Backend SMS Router → Android Devices
```

1. SMPP client sends `submit_sm` to SMPP server
2. SMPP server publishes message to `tsimcloudrouter` queue
3. Backend SMS router consumes message and finds active Android devices
4. SMS router sends message to each active device via WebSocket
5. Android device receives message and sends SMS

### 2. Android → Backend → RabbitMQ → SMPP

```
Android Device → Backend → RabbitMQ → SMPP Server → SMPP Client
```

1. Android device sends delivery report via WebSocket
2. Backend updates SMS log and publishes delivery report to RabbitMQ
3. SMPP server consumes delivery report and sends to SMPP client

## Configuration

### RabbitMQ Setup

The system automatically sets up the following queues and exchanges:

- **Exchange**: `tsimcloudrouter` (direct, durable)
- **Queue**: `tsimcloudrouter` (for SMPP messages)
- **Queue**: `tsimcloud_delivery_report` (for delivery reports)

### Backend Configuration

Add the following to your `config.yaml`:

```yaml
rabbitmq:
  url: "amqp://guest:guest@localhost:5672/"
```

## Components

### 1. SMS Router (`rabbitmq/sms_router.go`)

Consumes SMPP messages from RabbitMQ and routes them to active Android devices.

**Key Functions:**
- `StartRouting()` - Starts consuming SMPP messages
- `processSmppMessage()` - Processes individual SMPP messages
- `findActiveAndroidDevices()` - Finds active Android devices
- `routeMessageToDevice()` - Routes message to specific device

### 2. Delivery Report Service (`services/delivery_report_service.go`)

Handles delivery report operations and publishes them back to SMPP server.

**Key Functions:**
- `PublishDeliveryReport()` - Publishes delivery report to RabbitMQ
- `createDeliveryReport()` - Creates delivery report from SMS log

### 3. SMS Handlers (`websocket_handlers/sms.go`)

Handles SMS-related WebSocket messages from Android devices.

**Key Functions:**
- `HandleSmsDeliveryReport()` - Processes delivery reports from devices
- `HandleSmsLog()` - Processes SMS log updates

## Message Structures

### SMPP Submit SM Message

```json
{
  "message_id": "MSG20250725080000",
  "system_id": "tarik",
  "source_addr": "MySMSService",
  "destination_addr": "436641234567",
  "short_message": "test sms text",
  "data_coding": 0,
  "esm_class": 0,
  "registered_delivery": 1,
  "priority_flag": 0,
  "service_type": "",
  "protocol_id": 0,
  "schedule_delivery_time": "",
  "validity_period": "",
  "replace_if_present_flag": 0,
  "sm_default_msg_id": 0,
  "optional_parameters": {},
  "concatenation": {
    "reference_number": 1,
    "total_segments": 3,
    "sequence_number": 1
  }
}
```

### Delivery Report Message

```json
{
  "message_id": "MSG20250725080000",
  "system_id": "tarik",
  "source_addr": "MySMSService",
  "destination_addr": "436641234567",
  "message_state": 2,
  "error_code": 0,
  "final_date": "20250725080000",
  "submit_date": "20250725075900",
  "done_date": "20250725080000",
  "delivered": true,
  "failed": false,
  "failure_reason": ""
}
```

## Message States

- `0` - ENROUTE
- `1` - DELIVERED
- `2` - EXPIRED
- `3` - DELETED
- `4` - UNDELIVERABLE
- `5` - ACCEPTED
- `6` - UNKNOWN
- `7` - REJECTED

## Testing

### Test SMS Routing

Use the test script to verify the SMS routing system:

```bash
cd backend
go run test_sms_routing.go
```

This will:
1. Connect to RabbitMQ
2. Publish a test SMPP message
3. Verify the message is routed to active devices

### Prerequisites

1. RabbitMQ server running
2. Backend server running
3. Active Android devices connected via WebSocket
4. SMPP server configured to publish to `tsimcloudrouter` queue

## Error Handling

- If no active devices are found, SMS is logged with "failed" status
- If WebSocket delivery fails, SMS is logged with error message
- If RabbitMQ is unavailable, system continues to function normally
- Delivery report failures are logged but don't affect message processing

## Monitoring

Check the following logs for system status:

- Backend logs for SMS routing and delivery report processing
- RabbitMQ management interface for queue depths and message rates
- Android device logs for SMS delivery status

## Troubleshooting

### Common Issues

1. **No active devices found**
   - Check device status in database
   - Verify devices are online and connected via WebSocket

2. **SMS not delivered**
   - Check WebSocket connection status
   - Verify device is active and online
   - Check SMS log for error messages

3. **Delivery reports not received**
   - Verify RabbitMQ connection
   - Check delivery report queue configuration
   - Ensure SMPP server is consuming delivery reports

### Debug Commands

```bash
# Check RabbitMQ queues
rabbitmqctl list_queues

# Check RabbitMQ exchanges
rabbitmqctl list_exchanges

# Check SMS logs in database
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 10;

# Check active devices
SELECT * FROM devices WHERE is_active = 1 AND is_online = 1;
``` 