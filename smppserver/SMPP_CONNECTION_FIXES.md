# SMPP Connection Stability Fixes

This document outlines the fixes implemented to resolve SMPP bind connection issues and TCP packet problems.

## Issues Identified

1. **Unstable Bind Connections**: Connections were frequently dropping after 30-60 seconds
2. **TCP Packet Fragmentation**: SMPP server wasn't sending complete TCP packets in one operation
3. **Aggressive Timeouts**: Session timeouts and enquire link intervals were too short
4. **Poor TCP Configuration**: Missing TCP optimizations for real-time communication

## Fixes Implemented

### 1. Configuration Improvements

**File**: `config/config.yaml`
- Increased read/write timeouts from 30s to 60s
- Increased session timeout from 60s to 300s
- Increased enquire link interval from 30s to 60s
- Added TCP linger setting (5s)
- Increased TCP keepalive period to 60s

**Production Configuration**: `config/config.production.yaml`
- Even more conservative settings for production use
- 120s read/write timeouts
- 600s session timeout
- 90s enquire link interval

### 2. TCP Connection Optimizations

**File**: `server/server.go`
- Added TCP_NODELAY to disable Nagle's algorithm
- Increased TCP buffer sizes (64KB read/write)
- Better TCP keepalive configuration

### 3. Session Management Improvements

**File**: `session/session.go`
- Increased enquire link interval to 60s
- Extended timeout check from 60s to 120s
- Improved session cleanup routine (every 2 minutes instead of 1)
- Better error handling and logging

### 4. PDU Writing Fixes

**File**: `protocol/pdu.go`
- Ensured complete PDU is written in one operation
- Added partial write handling to prevent packet fragmentation
- Improved error reporting for write operations

### 5. Connection Monitoring

**File**: `tools/connection_monitor.go`
- Diagnostic tool to test connection stability
- Measures response times and success rates
- Helps identify connection issues

## How to Apply Fixes

### 1. Update Configuration

```bash
# For development/testing
cp config/config.yaml config/config.yaml.backup
# Use the updated config.yaml

# For production
cp config/config.production.yaml config/config.yaml
```

### 2. Rebuild and Restart Server

```bash
cd smppserver
go build -o smppserver cmd/server/main.go
./smppserver
```

### 3. Test Connection Stability

```bash
# Test with the monitoring tool
go run tools/connection_monitor.go 127.0.0.1:2775
```

## Monitoring and Troubleshooting

### Key Log Messages to Watch

1. **Connection Establishment**:
   ```
   Session session_xxx: Bind transceiver successful for user
   ```

2. **Enquire Link Activity**:
   ```
   Session session_xxx: Received enquire_link
   Session session_xxx: Received enquire_link_resp
   ```

3. **Connection Issues**:
   ```
   Session session_xxx: No enquire_link_resp or PDU received in 120s, closing session
   ```

### Performance Metrics

- **Session Timeout**: 300s (5 minutes)
- **Enquire Link Interval**: 60s
- **TCP Keepalive**: 60s
- **Read/Write Timeouts**: 60s

### Troubleshooting Steps

1. **Check Server Logs**:
   ```bash
   tail -f smppserver.log | grep "Session"
   ```

2. **Monitor Active Sessions**:
   ```bash
   netstat -an | grep 2775
   ```

3. **Test Connection Stability**:
   ```bash
   go run tools/connection_monitor.go <server_ip>:2775
   ```

4. **Check TCP Settings**:
   ```bash
   ss -i | grep 2775
   ```

## Expected Results

After applying these fixes:

1. **Stable Connections**: Bind connections should remain stable for extended periods
2. **Reduced Disconnections**: Fewer automatic disconnections after 30-60 seconds
3. **Better Performance**: Improved response times and throughput
4. **Complete TCP Packets**: All PDU responses sent in single TCP packets

## Additional Recommendations

1. **Network Configuration**:
   - Ensure firewall allows persistent connections
   - Configure load balancers for TCP session affinity
   - Monitor network latency and packet loss

2. **System Tuning**:
   ```bash
   # Increase TCP buffer sizes
   echo 'net.core.rmem_max = 16777216' >> /etc/sysctl.conf
   echo 'net.core.wmem_max = 16777216' >> /etc/sysctl.conf
   sysctl -p
   ```

3. **Monitoring**:
   - Set up alerts for connection drops
   - Monitor session count and response times
   - Track failed bind attempts

## Rollback Plan

If issues persist, you can rollback to the previous configuration:

```bash
cp config/config.yaml.backup config/config.yaml
# Restart the server
```

## Support

For additional support or questions about these fixes, please refer to the SMPP protocol documentation or contact the development team. 