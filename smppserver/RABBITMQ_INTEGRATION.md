# RabbitMQ Integration for SMPP Server

This document describes the RabbitMQ integration implemented in the SMPP server for publishing submit_sm messages with concatenation information and consuming delivery reports.

## Overview

The SMPP server now:
1. Publishes all submit_sm messages to a RabbitMQ queue named `tsimcloudrouter` with detailed message information including concatenation parameters
2. Consumes delivery reports from the `tsimcloud_delivery_report` queue and forwards them to SMPP clients

## Configuration

### RabbitMQ Configuration

Add the following configuration to `config/config.yaml`:

```yaml
rabbitmq:
  url: "amqp://guest:guest@localhost:5672/"
  exchange: "tsimcloudrouter"
  queue: "tsimcloudrouter"
  delivery_report_queue: "tsimcloud_delivery_report"
```

## Message Structures

### Submit SM Message

The published submit_sm messages follow this JSON structure:

```json
{
  "message_id": "MSG20250725080000",
  "system_id": "tarik",
  "source_addr": "MySMSService",
  "destination_addr": "436641234567",
  "short_message": "test sms text",
  "data_coding": 0,
  "esm_class": 0,
  "registered_delivery": 0,
  "priority_flag": 0,
  "service_type": "",
  "protocol_id": 0,
  "schedule_delivery_time": "",
  "validity_period": "",
  "replace_if_present_flag": 0,
  "sm_default_msg_id": 0,
  "optional_parameters": {
    "0x020C": 1,
    "0x020E": 3,
    "0x020F": 1
  },
  "concatenation": {
    "reference_number": 1,
    "total_segments": 3,
    "sequence_number": 1
  }
}
```

### Delivery Report Message

The consumed delivery report messages follow this JSON structure:

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

## Concatenation Support

The system automatically detects and extracts concatenation information from SMPP optional parameters:

### Supported Concatenation Parameters

- `0x020C` - SAR_MSG_REF_NUM (Reference number)
- `0x020E` - SAR_TOTAL_SEGMENTS (Total segments)
- `0x020F` - SAR_SEGMENT_SEQNUM (Sequence number)

### Concatenation Information Structure

```json
{
  "reference_number": 1,    // Unique reference for the concatenated message
  "total_segments": 3,      // Total number of segments
  "sequence_number": 1      // Current segment number (1-based)
}
```

## Delivery Report Processing

### Message States

- `0` - ENROUTE
- `1` - DELIVERED
- `2` - EXPIRED
- `3` - DELETED
- `4` - UNDELIVERABLE
- `5` - ACCEPTED
- `6` - UNKNOWN
- `7` - REJECTED

### Delivery Report Flow

1. External system publishes delivery report to `tsimcloud_delivery_report` queue
2. SMPP server consumes the delivery report
3. Server finds all sessions for the specified system ID
4. Server sends deliver_sm PDU to each session with delivery report data
5. SMPP client receives the delivery report

## Implementation Details

### Key Files

1. **`rabbitmq/rabbitmq.go`** - RabbitMQ client implementation with consumer
2. **`handler/sms_handler.go`** - SMS handler with RabbitMQ publishing
3. **`protocol/constants.go`** - SMPP optional parameter constants
4. **`config/config.go`** - Configuration structure
5. **`server/server.go`** - Server initialization with RabbitMQ
6. **`session/session.go`** - Session management with system ID lookup

### Key Functions

- `ExtractConcatenationInfo()` - Extracts concatenation info from optional parameters
- `ConvertOptionalParamsToString()` - Converts optional parameters to JSON-friendly format
- `PublishSubmitSM()` - Publishes messages to RabbitMQ
- `StartDeliveryReportConsumer()` - Starts consuming delivery reports
- `handleDeliveryReport()` - Processes delivery report messages
- `sendDeliveryReportToSession()` - Sends delivery report to SMPP client
- `GetSessionsBySystemID()` - Finds sessions by system ID

## Testing

### Test Submit SM Publishing

The server automatically publishes submit_sm messages when received from SMPP clients.

### Test Delivery Report Consumer

Use the test script to verify delivery report functionality:

```bash
go build -o test_delivery_report.exe test_delivery_report.go
./test_delivery_report.exe
```

## Error Handling

- If RabbitMQ is unavailable, the server continues to function normally
- Failed RabbitMQ publishes are logged but don't affect SMPP message processing
- The server gracefully handles RabbitMQ connection failures
- Delivery report processing errors are logged but don't crash the server

## Queue Setup

The system automatically:
1. Declares the `tsimcloudrouter` exchange (direct type, durable)
2. Declares the `tsimcloudrouter` queue (durable) for submit_sm messages
3. Declares the `tsimcloud_delivery_report` queue (durable) for delivery reports
4. Binds both queues to the exchange with appropriate routing keys

## Message Flow

### Submit SM Flow
1. SMPP client sends submit_sm
2. Server processes the message
3. Concatenation info is extracted from optional parameters
4. Message is published to RabbitMQ with full details
5. SMPP response is sent back to client

### Delivery Report Flow
1. External system publishes delivery report to RabbitMQ
2. SMPP server consumes the delivery report
3. Server finds sessions for the system ID
4. Server sends deliver_sm PDU to each session
5. SMPP client receives delivery report

## Monitoring

Check RabbitMQ management interface to monitor:
- Queue depths for both queues
- Message rates for publishing and consuming
- Consumer status
- Connection health
- Message routing

## Optional Parameters in Delivery Reports

The server includes the following optional parameters in delivery report PDUs:
- `0x0427` - Message state
- `0x001E` - Receipted message ID 