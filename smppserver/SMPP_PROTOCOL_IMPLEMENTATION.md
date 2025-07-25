# SMPP Protocol Implementation

This document provides a comprehensive overview of the complete SMPP (Short Message Peer-to-Peer) protocol implementation in the TSIM Cloud SMPP Server.

## 📋 **Protocol Overview**

The SMPP server implements the full SMPP v3.4 protocol specification, supporting all major operations including bind operations, SMS messaging, session management, and advanced features.

## 🏗️ **Architecture**

The implementation follows a modular architecture with separate handlers for each protocol operation:

```
smppserver/
├── handler/
│   ├── interfaces.go                    # Handler interfaces
│   ├── smpp_handler.go                  # Main SMPP handler (orchestrator)
│   ├── bind_handler.go                  # Bind operations
│   ├── sms_handler.go                   # SMS operations
│   ├── session_handler.go               # Session management
│   ├── data_sm_handler.go               # Data SM operations
│   ├── query_sm_handler.go              # Query SM operations
│   ├── cancel_sm_handler.go             # Cancel SM operations
│   ├── replace_sm_handler.go            # Replace SM operations
│   └── alert_notification_handler.go    # Alert notification operations
├── protocol/
│   ├── constants.go                     # SMPP constants and status codes
│   └── pdu.go                          # PDU structures and serialization
└── rabbitmq/
    └── rabbitmq.go                      # Message queue integration
```

## 🔧 **Supported SMPP Operations**

### 1. **Bind Operations**
- **bind_receiver** - ESME binds as receiver
- **bind_transmitter** - ESME binds as transmitter  
- **bind_transceiver** - ESME binds as transceiver
- **outbind** - SMSC initiates bind to ESME
- **unbind** - Terminate SMPP session

### 2. **SMS Operations**
- **submit_sm** - Submit short message
- **submit_sm_resp** - Submit short message response
- **deliver_sm** - Deliver short message
- **deliver_sm_resp** - Deliver short message response
- **data_sm** - Data short message
- **data_sm_resp** - Data short message response

### 3. **Query Operations**
- **query_sm** - Query message status
- **query_sm_resp** - Query message status response

### 4. **Cancel Operations**
- **cancel_sm** - Cancel short message
- **cancel_sm_resp** - Cancel short message response

### 5. **Replace Operations**
- **replace_sm** - Replace short message
- **replace_sm_resp** - Replace short message response

### 6. **Session Management**
- **enquire_link** - Keep-alive mechanism
- **enquire_link_resp** - Keep-alive response

### 7. **Alert Operations**
- **alert_notification** - Alert notification (no response)

## 📊 **PDU Structures**

### Core PDU Types
- `PDU` - Base protocol data unit
- `BindPDU` - Bind request/response
- `SubmitSMPDU` - Submit SM request
- `SubmitSMRespPDU` - Submit SM response
- `DeliverSMPDU` - Deliver SM request
- `DeliverSMRespPDU` - Deliver SM response
- `DataSMPDU` - Data SM request
- `DataSMRespPDU` - Data SM response
- `QuerySMPDU` - Query SM request
- `QuerySMRespPDU` - Query SM response
- `CancelSMPDU` - Cancel SM request
- `CancelSMRespPDU` - Cancel SM response
- `ReplaceSMPDU` - Replace SM request
- `ReplaceSMRespPDU` - Replace SM response
- `OutbindPDU` - Outbind request
- `AlertNotificationPDU` - Alert notification
- `EnquireLinkPDU` - Enquire link request/response
- `UnbindPDU` - Unbind request/response
- `GenericNACKPDU` - Generic negative acknowledgment

## 🔐 **Authentication & Security**

### Authentication Flow
1. **Bind Request** - ESME sends bind with system_id and password
2. **Validation** - Server validates credentials against Redis
3. **Connection Limits** - Checks active session count
4. **Session Creation** - Creates authenticated session
5. **Event Notification** - Publishes bind event to RabbitMQ

### Security Features
- Password-based authentication
- Connection limit enforcement
- Session state validation
- Remote address tracking

## 📡 **Message Queue Integration**

### RabbitMQ Queues
- `tsimcloud_route` - SMS messages
- `data_sm_route` - Data SM messages
- `query_sm_route` - Query SM messages
- `cancel_sm_route` - Cancel SM messages
- `replace_sm_route` - Replace SM messages
- `alert_notification_route` - Alert notifications
- `smpp_events` - Bidirectional events

### Message Types
- `SMSMessage` - Standard SMS
- `DataSMMessage` - Data SM with optional parameters
- `QuerySMMessage` - Query SM requests
- `CancelSMMessage` - Cancel SM requests
- `ReplaceSMMessage` - Replace SM requests
- `AlertNotificationMessage` - Alert notifications
- `BindMessage` - Session bind events

## 🎯 **Handler Implementation**

### Main Handler (`SMPPHandler`)
- Orchestrates all protocol operations
- Routes PDUs to appropriate handlers
- Manages session state
- Handles outbind operations

### Specialized Handlers
- **BindHandler** - Authentication and session binding
- **SMSHandler** - SMS message processing
- **SessionHandler** - Session lifecycle management
- **DataSMHandler** - Data SM processing
- **QuerySMHandler** - Message status queries
- **CancelSMHandler** - Message cancellation
- **ReplaceSMHandler** - Message replacement
- **AlertNotificationHandler** - Alert processing

## 📈 **Status Codes**

### Success Codes
- `ESME_ROK` - No Error

### Error Codes
- `ESME_RINVMSGLEN` - Invalid message length
- `ESME_RINVCMDLEN` - Invalid command length
- `ESME_RINVCMDID` - Invalid command ID
- `ESME_RINVBNDSTS` - Invalid bind status
- `ESME_RALYBND` - Already bound
- `ESME_RINVPASWD` - Invalid password
- `ESME_RINVSYSID` - Invalid system ID
- `ESME_RSYSERR` - System error
- `ESME_RMSGQFUL` - Message queue full
- `ESME_RTHROTTLED` - Throttling error

## 🔄 **Session States**

### State Management
- **StateOpen** (0) - Initial state
- **StateBoundRX** (1) - Bound as receiver
- **StateBoundTX** (2) - Bound as transmitter
- **StateBoundTRX** (3) - Bound as transceiver

### State Transitions
- Open → BoundRX (bind_receiver)
- Open → BoundTX (bind_transmitter)
- Open → BoundTRX (bind_transceiver)
- Any → Open (unbind)

## 🚀 **Features**

### Core Features
- ✅ Complete SMPP v3.4 protocol support
- ✅ Authentication and authorization
- ✅ Connection limit enforcement
- ✅ Message queue integration
- ✅ Session state management
- ✅ Error handling and logging
- ✅ Modular handler architecture

### Advanced Features
- ✅ Optional parameters support
- ✅ Message ID generation
- ✅ Bidirectional event system
- ✅ Real-time session monitoring
- ✅ Comprehensive logging
- ✅ Graceful error handling

## 🔧 **Configuration**

### Required Services
- **Redis** - Authentication and session storage
- **RabbitMQ** - Message queue system
- **MySQL** - User and configuration storage

### Environment Variables
- `REDIS_URL` - Redis connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `SMPP_PORT` - SMPP server port
- `LOG_LEVEL` - Logging level

## 📝 **Usage Examples**

### Basic Bind Operation
```go
// ESME connects and sends bind_transceiver
bindPDU := &protocol.BindPDU{
    SystemID: "testuser",
    Password: "password",
    SystemType: "",
    InterfaceVersion: 0x34,
    TON: 0,
    NPI: 0,
    AddressRange: "",
}
```

### Submit SM Operation
```go
// ESME sends submit_sm
submitPDU := &protocol.SubmitSMPDU{
    ServiceType: "",
    SourceAddr: "1234567890",
    DestinationAddr: "0987654321",
    ShortMessage: "Hello World",
    DataCoding: 0,
    // ... other fields
}
```

## 🛠️ **Testing**

### Test Coverage
- Unit tests for each handler
- Integration tests for protocol flow
- Performance tests for high load
- Security tests for authentication

### Test Commands
```bash
# Run all tests
go test ./...

# Run specific handler tests
go test ./handler -v

# Run protocol tests
go test ./protocol -v
```

## 📚 **References**

- [SMPP v3.4 Specification](https://smpp.org/SMPP_v3_4_Issue1_2.pdf)
- [SMPP Protocol Guide](https://smpp.org/SMPP_Protocol_Guide_v1_2.pdf)
- [SMPP Status Codes](https://smpp.org/SMPP_v3_4_Issue1_2.pdf#page=167)

## 🤝 **Contributing**

When adding new SMPP features:
1. Create new handler file if needed
2. Add PDU structures to protocol package
3. Update main handler routing
4. Add RabbitMQ message types
5. Update interfaces
6. Add comprehensive tests
7. Update documentation

---

**Note**: This implementation follows SMPP v3.4 specification and is designed for production use with proper error handling, logging, and scalability features. 