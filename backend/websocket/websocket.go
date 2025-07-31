package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"tsimsocketserver/auth"
	"tsimsocketserver/config"
	"tsimsocketserver/database"
	"tsimsocketserver/interfaces"
	"tsimsocketserver/models"
	"tsimsocketserver/redis"
	"tsimsocketserver/websocket_handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type WebSocketServer struct {
	connections   map[string]*models.DeviceConnection
	frontendConns map[string]*websocket.Conn
	mutex         sync.RWMutex
	connMutexes   map[string]*sync.Mutex // Mutex for each connection
	cfg           *config.Config
	redisService  *redis.RedisService
	serverID      string // Unique server instance ID
}

// Ensure WebSocketServer implements WebSocketServerInterface
var _ interfaces.WebSocketServerInterface = (*WebSocketServer)(nil)

func NewWebSocketServer(cfg *config.Config) *WebSocketServer {
	// Generate unique server ID
	hostname, _ := os.Hostname()
	serverID := fmt.Sprintf("%s_%d", hostname, time.Now().Unix())

	ws := &WebSocketServer{
		connections:   make(map[string]*models.DeviceConnection),
		frontendConns: make(map[string]*websocket.Conn),
		connMutexes:   make(map[string]*sync.Mutex),
		cfg:           cfg,
		serverID:      serverID,
	}

	// Initialize Redis service if available
	if redisService, err := redis.NewRedisService(cfg.Redis.URL); err == nil {
		ws.redisService = redisService
		log.Printf("WebSocket server initialized with Redis support (Server ID: %s)", serverID)

		// Start cleanup routine
		ws.redisService.StartWebSocketCleanupRoutine()

		// Restore connections from Redis on startup
		ws.restoreConnectionsFromRedis()
	} else {
		log.Printf("Warning: Failed to initialize Redis service: %v", ws)
		log.Printf("WebSocket server will run without Redis persistence (Server ID: %s)", serverID)
	}

	return ws
}

// restoreConnectionsFromRedis restores connection metadata from Redis on server startup
func (ws *WebSocketServer) restoreConnectionsFromRedis() {
	if ws.redisService == nil {
		return
	}

	connections, err := ws.redisService.GetAllWebSocketConnections()
	if err != nil {
		log.Printf("Warning: Failed to restore connections from Redis: %v", err)
		return
	}

	log.Printf("Found %d connections in Redis, checking for expired ones...", len(connections))

	expiredThreshold := time.Now().Add(-5 * time.Minute)
	for _, conn := range connections {
		if conn.LastHeartbeat.Before(expiredThreshold) {
			log.Printf("Removing expired connection from Redis: %s (Last heartbeat: %s)",
				conn.DeviceID, conn.LastHeartbeat.Format("2006-01-02 15:04:05"))
			ws.redisService.RemoveWebSocketConnection(conn.DeviceID, conn.ServerID)
		} else {
			log.Printf("Found active connection in Redis: %s (Type: %s, Last heartbeat: %s)",
				conn.DeviceID, conn.ConnectionType, conn.LastHeartbeat.Format("2006-01-02 15:04:05"))
		}
	}
}

// storeConnectionInRedis stores connection metadata in Redis
func (ws *WebSocketServer) storeConnectionInRedis(deviceID, deviceGroup, countrySite, connectionType string, isHandicap bool) {
	if ws.redisService == nil {
		return
	}

	conn := &redis.WebSocketConnection{
		DeviceID:       deviceID,
		DeviceGroup:    deviceGroup,
		CountrySite:    countrySite,
		ConnectionType: connectionType,
		IsHandicap:     isHandicap,
		ConnectedAt:    time.Now(),
		LastHeartbeat:  time.Now(),
		ServerID:       ws.serverID,
	}

	if err := ws.redisService.StoreWebSocketConnection(conn); err != nil {
		log.Printf("Warning: Failed to store connection in Redis: %v", err)
	}
}

// removeConnectionFromRedis removes connection metadata from Redis
func (ws *WebSocketServer) removeConnectionFromRedis(deviceID string) {
	if ws.redisService == nil {
		return
	}

	if err := ws.redisService.RemoveWebSocketConnection(deviceID, ws.serverID); err != nil {
		log.Printf("Warning: Failed to remove connection from Redis: %v", err)
	}
}

// updateHeartbeatInRedis updates heartbeat time in Redis
func (ws *WebSocketServer) updateHeartbeatInRedis(deviceID string) {
	if ws.redisService == nil {
		return
	}

	if err := ws.redisService.UpdateWebSocketHeartbeat(deviceID); err != nil {
		log.Printf("Warning: Failed to update heartbeat in Redis: %v", err)
	}
}

// HandleWebSocket handles device connections
func (ws *WebSocketServer) HandleWebSocket(c *fiber.Ctx) error {
	return websocket.New(func(conn *websocket.Conn) {
		ws.handleConnection(conn)
	})(c)
}

func (ws *WebSocketServer) handleConnection(conn *websocket.Conn) {
	defer func() {
		conn.Close()
	}()

	// Enhanced connection logging
	log.Printf("=== NEW CONNECTION ATTEMPT ===")
	log.Printf("Remote Address: %s", conn.RemoteAddr().String())
	log.Printf("Connection started at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	// Get connection type from query parameters
	connectionType := conn.Query("type")
	log.Printf("Connection type: %s", connectionType)

	switch connectionType {
	case "android":
		ws.handleAndroidConnection(conn)
	case "frontend":
		ws.handleFrontendConnection(conn)
	default:
		log.Printf("ERROR: Connection rejected - Invalid connection type: %s", connectionType)
		conn.WriteJSON(fiber.Map{
			"error": "Invalid connection type. Must be 'android' or 'frontend'",
		})
	}
}

func (ws *WebSocketServer) handleAndroidConnection(conn *websocket.Conn) {
	// Authentication - Device API key validation
	apiKey := conn.Query("api_key")
	if apiKey == "" {
		log.Printf("ERROR: Connection rejected - API key missing")
		conn.WriteJSON(fiber.Map{
			"error": "API key required",
		})
		return
	}
	log.Printf("API Key provided: %s", apiKey[:8]+"...") // Log first 8 chars for security

	// Get IMEI from query parameters
	imei := conn.Query("imei")
	if imei == "" {
		log.Printf("ERROR: Connection rejected - IMEI missing")
		conn.WriteJSON(fiber.Map{
			"error": "IMEI required",
		})
		return
	}
	log.Printf("IMEI provided: %s", imei)

	// Validate API key against device_groups table
	var deviceGroup models.DeviceGroup
	if err := database.GetDB().Where("api_key = ?", apiKey).First(&deviceGroup).Error; err != nil {
		log.Printf("ERROR: Connection rejected - Invalid API key: %s", apiKey[:8]+"...")
		conn.WriteJSON(fiber.Map{
			"error": "Invalid API key",
		})
		return
	}
	log.Printf("API Key validated for device group: %s", deviceGroup.DeviceGroup)

	// Check if device group is active
	if deviceGroup.Status != "active" {
		log.Printf("ERROR: Connection rejected - Device group not active: %s (Status: %s)",
			deviceGroup.DeviceGroup, deviceGroup.Status)
		conn.WriteJSON(fiber.Map{
			"error": "Device group is not active",
		})
		return
	}
	log.Printf("Device group status verified: %s", deviceGroup.Status)

	// Use IMEI as device ID for connection tracking
	deviceID := imei

	// Register connection
	ws.mutex.Lock()
	ws.connections[deviceID] = &models.DeviceConnection{
		DeviceID:    deviceID,
		DeviceGroup: deviceGroup.DeviceGroup,
		CountrySite: deviceGroup.CountrySite,
		Conn:        conn,
		IsHandicap:  false, // All devices use same authentication now
	}
	ws.mutex.Unlock()

	// Store connection metadata in Redis
	ws.storeConnectionInRedis(deviceID, deviceGroup.DeviceGroup, deviceGroup.CountrySite, "android", false)

	log.Printf("=== CONNECTION ESTABLISHED ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Device Group: %s", deviceGroup.DeviceGroup)
	log.Printf("Country Site: %s", deviceGroup.CountrySite)
	log.Printf("Connection registered at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	// Save device info to database
	websocket_handlers.SaveDeviceToDatabase(deviceID, deviceGroup, ws)

	// Send connection confirmation with device settings
	settings := ws.getDeviceSettingsFromGroup(deviceGroup)
	conn.WriteJSON(models.WebSocketMessage{
		Type:      "connection_established",
		Data:      models.ConnectionEstablishedData{Settings: settings},
		Timestamp: time.Now().UnixMilli(),
	})
	log.Printf("Connection confirmation sent to device: %s", deviceID)

	log.Printf("Device connected: %s (Group: %s, Site: %s)", deviceID, deviceGroup.DeviceGroup, deviceGroup.CountrySite)

	// Handle messages
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("=== CONNECTION ERROR ===")
			log.Printf("Device ID: %s", deviceID)
			log.Printf("Error reading message: %v", err)
			log.Printf("Connection terminated at: %s", time.Now().Format("2006-01-02 15:04:05.000"))
			break
		}

		var wsMessage models.WebSocketMessage
		if err := json.Unmarshal(message, &wsMessage); err != nil {
			log.Printf("=== MESSAGE PARSE ERROR ===")
			log.Printf("Device ID: %s", deviceID)
			log.Printf("Error parsing message: %v", err)
			log.Printf("Raw message: %s", string(message))
			conn.WriteJSON(fiber.Map{
				"error": "Invalid message format",
			})
			continue
		}

		ws.handleMessage(deviceID, wsMessage)
	}

	// Update device offline status in database
	log.Printf("=== DEVICE DISCONNECTING ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Disconnection started at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	websocket_handlers.UpdateDeviceOfflineWithBroadcast(ws, deviceID)

	// Cleanup on disconnect
	ws.mutex.Lock()
	delete(ws.connections, deviceID)
	delete(ws.connMutexes, deviceID) // Clean up connection mutex
	ws.mutex.Unlock()

	// Remove connection metadata from Redis
	ws.removeConnectionFromRedis(deviceID)

	log.Printf("=== DEVICE DISCONNECTED ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Connection removed from registry")
	log.Printf("Disconnection completed at: %s", time.Now().Format("2006-01-02 15:04:05.000"))
	log.Printf("===========================")
}

func (ws *WebSocketServer) handleFrontendConnection(conn *websocket.Conn) {
	// Authentication - JWT token validation
	token := conn.Query("token")
	if token == "" {
		log.Printf("ERROR: Frontend connection rejected - JWT token missing")
		conn.WriteJSON(fiber.Map{
			"error": "JWT token required",
		})
		return
	}
	log.Printf("JWT token provided: %s", token[:8]+"...") // Log first 8 chars for security

	// Validate JWT token
	claims, err := auth.ValidateToken(token, ws.cfg)
	if err != nil {
		log.Printf("ERROR: Frontend connection rejected - Invalid JWT token: %v", err)

		// Send more specific error message
		errorMsg := "Invalid token"
		if err.Error() == "token is expired" {
			errorMsg = "Token expired"
		}

		conn.WriteJSON(fiber.Map{
			"error": errorMsg,
		})
		return
	}
	log.Printf("JWT token validated for user: %s (Role: %s)", claims.Username, claims.Role)

	// Frontend connection - use user info
	deviceID := fmt.Sprintf("frontend_user_%d", claims.UserID)

	// Register frontend connection in frontendConns map
	ws.mutex.Lock()
	ws.frontendConns[deviceID] = conn
	ws.mutex.Unlock()

	// Store connection metadata in Redis
	ws.storeConnectionInRedis(deviceID, "", "", "frontend", false)

	log.Printf("=== FRONTEND CONNECTION ESTABLISHED ===")
	log.Printf("Frontend User ID: %s", deviceID)
	log.Printf("Username: %s", claims.Username)
	log.Printf("Role: %s", claims.Role)
	log.Printf("Connection registered at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	// Send connection confirmation to frontend
	conn.WriteJSON(models.WebSocketMessage{
		Type: "connection_established",
		Data: map[string]interface{}{
			"message": "Frontend connected successfully",
		},
		Timestamp: time.Now().UnixMilli(),
	})
	log.Printf("Connection confirmation sent to frontend user: %s", deviceID)

	log.Printf("Frontend user connected: %s (User: %s, Role: %s)", deviceID, claims.Username, claims.Role)

	// Handle messages for frontend
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("=== FRONTEND CONNECTION ERROR ===")
			log.Printf("Frontend User ID: %s", deviceID)
			log.Printf("Error reading message: %v", err)
			log.Printf("Connection terminated at: %s", time.Now().Format("2006-01-02 15:04:05.000"))
			break
		}

		var wsMessage models.WebSocketMessage
		if err := json.Unmarshal(message, &wsMessage); err != nil {
			log.Printf("=== FRONTEND MESSAGE PARSE ERROR ===")
			log.Printf("Frontend User ID: %s", deviceID)
			log.Printf("Error parsing message: %v", err)
			log.Printf("Raw message: %s", string(message))
			conn.WriteJSON(fiber.Map{
				"error": "Invalid message format",
			})
			continue
		}

		ws.handleMessage(deviceID, wsMessage)
	}

	// Cleanup on disconnect
	log.Printf("=== FRONTEND USER DISCONNECTING ===")
	log.Printf("Frontend User ID: %s", deviceID)
	log.Printf("Disconnection started at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	ws.mutex.Lock()
	delete(ws.frontendConns, deviceID)
	delete(ws.connMutexes, deviceID) // Clean up connection mutex
	ws.mutex.Unlock()

	// Remove connection metadata from Redis
	ws.removeConnectionFromRedis(deviceID)

	log.Printf("=== FRONTEND USER DISCONNECTED ===")
	log.Printf("Frontend User ID: %s", deviceID)
	log.Printf("Connection removed from registry")
	log.Printf("Disconnection completed at: %s", time.Now().Format("2006-01-02 15:04:05.000"))
	log.Printf("===========================")
}

func (ws *WebSocketServer) handleMessage(deviceID string, message models.WebSocketMessage) {
	startTime := time.Now()

	// Enhanced request logging
	log.Printf("=== REQUEST RECEIVED ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message Type: %s", message.Type)
	log.Printf("Timestamp: %d", message.Timestamp)
	log.Printf("Raw Data: %+v", message.Data)
	log.Printf("Processing started at: %s", startTime.Format("2006-01-02 15:04:05.000"))

	switch message.Type {
	case "ping":
		log.Printf("Processing PING request from %s", deviceID)
		// Echo back ping
		ws.sendToDevice(deviceID, models.WebSocketMessage{
			Type:      "pong",
			Data:      "pong",
			Timestamp: time.Now().UnixMilli(),
		})
		log.Printf("PING response sent to %s", deviceID)

	case "heartbeat":
		log.Printf("Processing HEARTBEAT request from %s", deviceID)
		// Handle heartbeat message
		var heartbeatData models.HeartbeatData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &heartbeatData)
			log.Printf("Heartbeat data parsed: Battery=%d%%, Signal=%d/5, Network=%s",
				heartbeatData.BatteryLevel, heartbeatData.SignalStrength, heartbeatData.NetworkType)
		}
		websocket_handlers.HandleHeartbeat(ws, deviceID, heartbeatData)

		// Update heartbeat in Redis
		ws.updateHeartbeatInRedis(deviceID)

		log.Printf("Heartbeat processed for %s", deviceID)

	case "device_status":
		log.Printf("Processing DEVICE_STATUS request from %s", deviceID)
		// Handle device status message
		var statusData models.DeviceStatusData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &statusData)
			log.Printf("Device status data parsed: Status=%s", statusData.Status)
		}
		websocket_handlers.HandleDeviceStatus(ws, deviceID, statusData)
		log.Printf("Device status processed for %s", deviceID)

	case "alarm":
		log.Printf("Processing ALARM request from %s", deviceID)
		// Handle alarm message
		var alarmData models.AlarmData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmData)
			log.Printf("Alarm data parsed: Type=%s, Message=%s, Severity=%s",
				alarmData.AlarmType, alarmData.Message, alarmData.Severity)
		}

		// Check if it's a SIM card change alarm
		if alarmData.AlarmType == "sim_card_change" {
			log.Printf("=== SIM CARD CHANGE ALARM DETECTED ===")
			log.Printf("Device ID: %s", deviceID)
			log.Printf("Message: %s", alarmData.Message)
			log.Printf("Severity: %s", alarmData.Severity)

			// Check for specific SIM tray scenarios
			if strings.Contains(alarmData.Message, "SIM tray opened") {
				log.Printf("SIM TRAY SCENARIO: Tray opened - all SIM cards removed")
			} else if strings.Contains(alarmData.Message, "SIM tray closed") {
				log.Printf("SIM TRAY SCENARIO: Tray closed - SIM cards reinserted")
			} else if strings.Contains(alarmData.Message, "IMSI changed") {
				log.Printf("SIM TRAY SCENARIO: IMSI change detected - different SIM cards")
			} else if strings.Contains(alarmData.Message, "SIM card count changed") {
				log.Printf("SIM TRAY SCENARIO: Card count change - partial tray operation")
			} else {
				log.Printf("SIM TRAY SCENARIO: General configuration change")
			}

			websocket_handlers.HandleSimCardChangeAlarm(ws, deviceID, alarmData)
		} else {
			websocket_handlers.HandleAlarm(ws, deviceID, alarmData)
		}
		log.Printf("Alarm processed for %s", deviceID)

	case "alarm_resolved":
		log.Printf("Processing ALARM_RESOLVED request from %s", deviceID)
		// Handle alarm resolved message
		var alarmData models.AlarmData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmData)
			log.Printf("Alarm resolved data parsed: Type=%s, Message=%s, Severity=%s",
				alarmData.AlarmType, alarmData.Message, alarmData.Severity)
		}

		// Check if it's a SIM card change alarm resolution
		if alarmData.AlarmType == "sim_card_change" {
			log.Printf("=== SIM CARD CHANGE ALARM RESOLVED ===")
			log.Printf("Device ID: %s", deviceID)
			log.Printf("Message: %s", alarmData.Message)
			log.Printf("Severity: %s", alarmData.Severity)

			// Check for specific resolution scenarios
			if strings.Contains(alarmData.Message, "SIM tray closed with same IMSIs") {
				log.Printf("RESOLUTION SCENARIO: Same IMSIs detected - normal operation resumed")
			} else if strings.Contains(alarmData.Message, "SIM card reinserted") {
				log.Printf("RESOLUTION SCENARIO: Cards reinserted - tray operation completed")
			} else if strings.Contains(alarmData.Message, "SIM card configuration resolved") {
				log.Printf("RESOLUTION SCENARIO: Configuration resolved - system stable")
			} else {
				log.Printf("RESOLUTION SCENARIO: General resolution")
			}

			websocket_handlers.HandleSimCardChangeAlarmResolved(ws, deviceID, alarmData)
		} else {
			// Handle other alarm resolutions
			log.Printf("Other alarm resolved: %s", alarmData.AlarmType)
			websocket_handlers.LogAlarmResolvedToDatabase(deviceID, alarmData)
		}
		log.Printf("Alarm resolved processed for %s", deviceID)

	case "sms_log":
		log.Printf("Processing SMS_LOG request from %s", deviceID)
		// Handle SMS log message
		var smsLogData models.SmsLogData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &smsLogData)
			log.Printf("SMS log data parsed: Status=%s, Phone=%s, Message=%s",
				smsLogData.Status, smsLogData.PhoneNumber, smsLogData.Message)
		}
		websocket_handlers.HandleSmsLog(ws, deviceID, smsLogData)
		log.Printf("SMS log processed for %s", deviceID)

	case "sms_message":
		log.Printf("Processing SMS_MESSAGE request from %s", deviceID)
		// Handle SMS message
		var smsMessageData models.SmsMessageData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &smsMessageData)
			log.Printf("SMS message data parsed: Direction=%s, Phone=%s",
				smsMessageData.Direction, smsMessageData.PhoneNumber)
		}
		websocket_handlers.HandleSmsMessage(ws, deviceID, smsMessageData)
		log.Printf("SMS message processed for %s", deviceID)

	case "ussd_response":
		log.Printf("Processing USSD_RESPONSE request from %s", deviceID)
		// Handle USSD response
		var ussdResponseData models.UssdResponseData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &ussdResponseData)
			log.Printf("USSD response data parsed: Status=%s, Response=%s",
				ussdResponseData.Status, ussdResponseData.Response)
		}
		websocket_handlers.HandleUssdResponse(ws, deviceID, ussdResponseData)
		log.Printf("USSD response processed for %s", deviceID)

	case "ussd_response_failed":
		log.Printf("Processing USSD_RESPONSE_FAILED request from %s", deviceID)
		// Handle USSD response failed
		var ussdResponseFailedData models.UssdResponseFailedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &ussdResponseFailedData)
			log.Printf("USSD response failed data parsed: Error=%s", ussdResponseFailedData.ErrorMessage)
		}
		websocket_handlers.HandleUssdResponseFailed(ws, deviceID, ussdResponseFailedData)
		log.Printf("USSD response failed processed for %s", deviceID)

	case "sms_delivery_report":
		log.Printf("Processing SMS_DELIVERY_REPORT request from %s", deviceID)
		// Handle SMS delivery report
		var smsDeliveryReportData models.SmsDeliveryReportData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &smsDeliveryReportData)
			log.Printf("SMS delivery report data parsed: Status=%s, Phone=%s, MessageID=%s",
				smsDeliveryReportData.Status, smsDeliveryReportData.PhoneNumber, smsDeliveryReportData.MessageID)
		}
		websocket_handlers.HandleSmsDeliveryReport(ws, deviceID, smsDeliveryReportData)
		log.Printf("SMS delivery report processed for %s", deviceID)

	case "mms_received":
		log.Printf("Processing MMS_RECEIVED request from %s", deviceID)
		// Handle MMS received
		var mmsReceivedData models.MmsReceivedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &mmsReceivedData)
			log.Printf("MMS received data parsed: Sender=%s, Subject=%s, Parts=%d",
				mmsReceivedData.Sender, mmsReceivedData.Subject, mmsReceivedData.PartsCount)
		}
		websocket_handlers.HandleMmsReceived(ws, deviceID, mmsReceivedData)
		log.Printf("MMS received processed for %s", deviceID)

	case "rcs_received":
		log.Printf("Processing RCS_RECEIVED request from %s", deviceID)
		// Handle RCS received
		var rcsReceivedData models.RcsReceivedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &rcsReceivedData)
			log.Printf("RCS received data parsed: Sender=%s, Type=%s",
				rcsReceivedData.Sender, rcsReceivedData.MessageType)
		}
		websocket_handlers.HandleRcsReceived(ws, deviceID, rcsReceivedData)
		log.Printf("RCS received processed for %s", deviceID)

	case "ussd_code":
		log.Printf("Processing USSD_CODE request from %s", deviceID)
		// Handle USSD code
		var ussdCodeData models.UssdCodeData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &ussdCodeData)
			log.Printf("USSD code data parsed: Code=%s, Sender=%s",
				ussdCodeData.UssdCode, ussdCodeData.Sender)
		}
		websocket_handlers.HandleUssdCode(ws, deviceID, ussdCodeData)
		log.Printf("USSD code processed for %s", deviceID)

	case "find_device_success":
		log.Printf("Processing FIND_DEVICE_SUCCESS request from %s", deviceID)
		// Handle find device success
		var findDeviceSuccessData models.FindDeviceSuccessData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &findDeviceSuccessData)
			log.Printf("Find device success data parsed: Message=%s", findDeviceSuccessData.Message)
		}
		websocket_handlers.HandleFindDeviceSuccess(ws, deviceID, findDeviceSuccessData)
		log.Printf("Find device success processed for %s", deviceID)

	case "find_device_failed":
		log.Printf("Processing FIND_DEVICE_FAILED request from %s", deviceID)
		// Handle find device failed
		var findDeviceFailedData models.FindDeviceFailedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &findDeviceFailedData)
			log.Printf("Find device failed data parsed: Error=%s", findDeviceFailedData.Error)
		}
		websocket_handlers.HandleFindDeviceFailed(ws, deviceID, findDeviceFailedData)
		log.Printf("Find device failed processed for %s", deviceID)

	case "alarm_started":
		log.Printf("Processing ALARM_STARTED request from %s", deviceID)
		// Handle alarm started
		var alarmStartedData models.AlarmStartedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmStartedData)
			log.Printf("Alarm started data parsed: Type=%s, Message=%s",
				alarmStartedData.AlarmType, alarmStartedData.Message)
		}
		websocket_handlers.HandleAlarmStarted(ws, deviceID, alarmStartedData)
		log.Printf("Alarm started processed for %s", deviceID)

	case "alarm_failed":
		log.Printf("Processing ALARM_FAILED request from %s", deviceID)
		// Handle alarm failed
		var alarmFailedData models.AlarmFailedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmFailedData)
			log.Printf("Alarm failed data parsed: Type=%s, Error=%s",
				alarmFailedData.AlarmType, alarmFailedData.Error)
		}
		websocket_handlers.HandleAlarmFailed(ws, deviceID, alarmFailedData)
		log.Printf("Alarm failed processed for %s", deviceID)

	case "alarm_stopped":
		log.Printf("Processing ALARM_STOPPED request from %s", deviceID)
		// Handle alarm stopped
		var alarmStoppedData models.AlarmStoppedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmStoppedData)
			log.Printf("Alarm stopped data parsed: Status=%s", alarmStoppedData.Status)
		}
		websocket_handlers.HandleAlarmStopped(ws, deviceID, alarmStoppedData)
		log.Printf("Alarm stopped processed for %s", deviceID)

	case "alarm_stop_failed":
		log.Printf("Processing ALARM_STOP_FAILED request from %s", deviceID)
		// Handle alarm stop failed
		var alarmStopFailedData models.AlarmStopFailedData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &alarmStopFailedData)
			log.Printf("Alarm stop failed data parsed: Error=%s", alarmStopFailedData.Error)
		}
		websocket_handlers.HandleAlarmStopFailed(ws, deviceID, alarmStopFailedData)
		log.Printf("Alarm stop failed processed for %s", deviceID)

	case "ussd_cancelled":
		log.Printf("Processing USSD_CANCELLED request from %s", deviceID)
		// Handle USSD cancelled
		var ussdCancelledData models.UssdCancelledData
		if data, ok := message.Data.(map[string]interface{}); ok {
			jsonData, _ := json.Marshal(data)
			json.Unmarshal(jsonData, &ussdCancelledData)
			log.Printf("USSD cancelled data parsed: Code=%s, Reason=%s",
				ussdCancelledData.UssdCode, ussdCancelledData.Reason)
		}
		websocket_handlers.HandleUssdCancelled(ws, deviceID, ussdCancelledData)
		log.Printf("USSD cancelled processed for %s", deviceID)

	default:
		log.Printf("WARNING: Unknown message type '%s' from device %s", message.Type, deviceID)
		log.Printf("Unknown message data: %+v", message.Data)
	}

	// Log processing completion
	processingTime := time.Since(startTime)
	log.Printf("=== REQUEST COMPLETED ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message Type: %s", message.Type)
	log.Printf("Processing Time: %v", processingTime)
	log.Printf("Completed at: %s", time.Now().Format("2006-01-02 15:04:05.000"))
	log.Printf("=========================")
}

func (ws *WebSocketServer) sendToDevice(deviceID string, message models.WebSocketMessage) {
	log.Printf("=== SENDING MESSAGE TO DEVICE ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message Type: %s", message.Type)
	log.Printf("Message Data: %+v", message.Data)
	log.Printf("Timestamp: %d", message.Timestamp)
	log.Printf("Sending at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	// Check if device exists in Redis first (if Redis is available)
	// Temporarily disabled for fallback mechanism testing
	/*
		if ws.redisService != nil {
			if _, err := ws.redisService.GetWebSocketConnection(deviceID); err != nil {
				log.Printf("ERROR: Device %s not found in Redis connections", deviceID)
				log.Printf("=== MESSAGE SEND FAILED ===")
				return
			}
		}
	*/

	// Get or create mutex for this connection
	ws.mutex.Lock()
	connMutex, exists := ws.connMutexes[deviceID]
	if !exists {
		connMutex = &sync.Mutex{}
		ws.connMutexes[deviceID] = connMutex
	}
	ws.mutex.Unlock()

	// Lock the connection mutex to prevent concurrent writes
	connMutex.Lock()
	defer connMutex.Unlock()

	// First check if it's a frontend connection
	ws.mutex.RLock()
	frontendConn, frontendExists := ws.frontendConns[deviceID]
	ws.mutex.RUnlock()

	if frontendExists {
		if err := frontendConn.WriteJSON(message); err != nil {
			log.Printf("ERROR: Failed to send message to frontend %s: %v", deviceID, err)
		} else {
			log.Printf("Message sent successfully to frontend: %s", deviceID)
		}
		log.Printf("=== MESSAGE SEND COMPLETED ===")
		return
	}

	// Then check if it's a device connection
	ws.mutex.RLock()
	conn, exists := ws.connections[deviceID]
	ws.mutex.RUnlock()

	if exists {
		if wsConn, ok := conn.Conn.(*websocket.Conn); ok {
			if err := wsConn.WriteJSON(message); err != nil {
				log.Printf("ERROR: Failed to send message to device %s: %v", deviceID, err)
			} else {
				log.Printf("Message sent successfully to device: %s", deviceID)
			}
		} else {
			log.Printf("ERROR: Invalid connection type for device %s", deviceID)
		}
	} else {
		log.Printf("ERROR: Device %s not found in local connections", deviceID)
	}

	log.Printf("=== MESSAGE SEND COMPLETED ===")
}

// BroadcastMessage is a public method to broadcast messages to frontend clients
func (ws *WebSocketServer) BroadcastMessage(message models.WebSocketMessage) {
	ws.mutex.RLock()
	frontendConnsCopy := make(map[string]*websocket.Conn)
	for k, v := range ws.frontendConns {
		frontendConnsCopy[k] = v
	}
	ws.mutex.RUnlock()

	messageJSON, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling WebSocket message: %v", err)
		return
	}

	log.Printf("Broadcasting to %d frontend clients: %s", len(frontendConnsCopy), message.Type)

	// Send to frontend connections only
	for connID, conn := range frontendConnsCopy {
		// Get or create mutex for this connection
		ws.mutex.Lock()
		connMutex, exists := ws.connMutexes[connID]
		if !exists {
			connMutex = &sync.Mutex{}
			ws.connMutexes[connID] = connMutex
		}
		ws.mutex.Unlock()

		// Lock the connection mutex to prevent concurrent writes
		connMutex.Lock()
		if err := conn.WriteMessage(websocket.TextMessage, messageJSON); err != nil {
			log.Printf("Error sending message to frontend %s: %v", connID, err)
			// Remove failed connection
			ws.mutex.Lock()
			delete(ws.frontendConns, connID)
			delete(ws.connMutexes, connID)
			ws.mutex.Unlock()
		}
		connMutex.Unlock()
	}
}

func (ws *WebSocketServer) getDeviceSettingsFromGroup(deviceGroup models.DeviceGroup) models.DeviceSettings {
	return models.DeviceSettings{
		BatteryLowThreshold:     deviceGroup.BatteryLowThreshold,
		ErrorCountThreshold:     deviceGroup.ErrorCountThreshold,
		OfflineThresholdMinutes: deviceGroup.OfflineThresholdMinutes,
		SignalLowThreshold:      deviceGroup.SignalLowThreshold,
		LowBalanceThreshold:     deviceGroup.LowBalanceThreshold,
		EnableBatteryAlarms:     deviceGroup.EnableBatteryAlarms,
		EnableErrorAlarms:       deviceGroup.EnableErrorAlarms,
		EnableOfflineAlarms:     deviceGroup.EnableOfflineAlarms,
		EnableSignalAlarms:      deviceGroup.EnableSignalAlarms,
		EnableSimBalanceAlarms:  deviceGroup.EnableSimBalanceAlarms,
		AutoDisableSimOnAlarm:   deviceGroup.AutoDisableSimOnAlarm,
		Sim1DailySmsLimit:       deviceGroup.Sim1DailySmsLimit,
		Sim1MonthlySmsLimit:     deviceGroup.Sim1MonthlySmsLimit,
		Sim2DailySmsLimit:       deviceGroup.Sim2DailySmsLimit,
		Sim2MonthlySmsLimit:     deviceGroup.Sim2MonthlySmsLimit,
		EnableSmsLimits:         deviceGroup.EnableSmsLimits,
		SmsLimitResetHour:       deviceGroup.SmsLimitResetHour,
		Sim1GuardInterval:       deviceGroup.Sim1GuardInterval,
		Sim2GuardInterval:       deviceGroup.Sim2GuardInterval,
	}
}

func (ws *WebSocketServer) getDefaultDeviceSettings() models.DeviceSettings {
	return models.DeviceSettings{
		BatteryLowThreshold:     20,
		ErrorCountThreshold:     5,
		OfflineThresholdMinutes: 5,
		SignalLowThreshold:      2,
		LowBalanceThreshold:     "10.00",
		EnableBatteryAlarms:     true,
		EnableErrorAlarms:       true,
		EnableOfflineAlarms:     true,
		EnableSignalAlarms:      true,
		EnableSimBalanceAlarms:  true,
		AutoDisableSimOnAlarm:   false,
		Sim1DailySmsLimit:       100,
		Sim1MonthlySmsLimit:     1000,
		Sim2DailySmsLimit:       100,
		Sim2MonthlySmsLimit:     1000,
		EnableSmsLimits:         false,
		SmsLimitResetHour:       0,
		Sim1GuardInterval:       1,
		Sim2GuardInterval:       1,
	}
}

// SendSms sends SMS command to device
func (ws *WebSocketServer) SendSms(deviceID string, data models.SendSmsData) error {
	log.Printf("=== SENDING SMS COMMAND ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("SIM Slot: %d", data.SimSlot)
	log.Printf("Phone Number: %s", data.PhoneNumber)
	log.Printf("Message: %s", data.Message)
	log.Printf("Priority: %s", data.Priority)
	log.Printf("Command sent at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	message := models.WebSocketMessage{
		Type:      "send_sms",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}

	ws.sendToDevice(deviceID, message)
	log.Printf("=== SMS COMMAND COMPLETED ===")
	return nil
}

// SendUssd sends USSD command to device
func (ws *WebSocketServer) SendUssd(deviceID string, data models.SendUssdData) error {
	log.Printf("=== SENDING USSD COMMAND ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("SIM Slot: %d", data.SimSlot)
	log.Printf("USSD Code: %s", data.UssdCode)
	log.Printf("Session ID: %s", data.SessionID)
	log.Printf("Delay: %d", data.Delay)
	log.Printf("Command sent at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	// Get device name
	var device models.Device
	var deviceName string
	if err := database.GetDB().Where("imei = ?", deviceID).First(&device).Error; err != nil {
		log.Printf("Error getting device name for %s: %v", deviceID, err)
		deviceName = ""
	} else {
		deviceName = device.Name
	}

	// Save USSD command to database as pending
	ussdLog := models.UssdLog{
		SessionID:       data.SessionID,
		DeviceID:        deviceID,
		DeviceName:      &deviceName,
		UssdCode:        data.UssdCode,
		RequestMessage:  nil,
		ResponseMessage: nil,
		Status:          "pending",
		SentAt:          nil,
		ReceivedAt:      nil,
		ErrorMessage:    nil,
		Metadata:        nil,
	}

	if err := database.GetDB().Create(&ussdLog).Error; err != nil {
		log.Printf("Error saving USSD command to database: %v", err)
	} else {
		log.Printf("USSD command saved to database for device %s", deviceID)
	}

	message := models.WebSocketMessage{
		Type:      "send_ussd",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}

	ws.sendToDevice(deviceID, message)
	log.Printf("=== USSD COMMAND COMPLETED ===")
	return nil
}

// FindDevice sends find device command
func (ws *WebSocketServer) FindDevice(deviceID string, data models.FindDeviceData) error {
	log.Printf("=== SENDING FIND DEVICE COMMAND ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Message: %s", data.Message)
	log.Printf("Command sent at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	message := models.WebSocketMessage{
		Type:      "find_device",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}

	ws.sendToDevice(deviceID, message)
	log.Printf("=== FIND DEVICE COMMAND COMPLETED ===")
	return nil
}

// StartAlarm sends alarm start command
func (ws *WebSocketServer) StartAlarm(deviceID string, data models.AlarmStartData) error {
	log.Printf("=== SENDING START ALARM COMMAND ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Alarm Type: %s", data.AlarmType)
	log.Printf("Message: %s", data.Message)
	log.Printf("Command sent at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	message := models.WebSocketMessage{
		Type:      "alarm_start",
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}

	ws.sendToDevice(deviceID, message)
	log.Printf("=== START ALARM COMMAND COMPLETED ===")
	return nil
}

// StopAlarm sends alarm stop command
func (ws *WebSocketServer) StopAlarm(deviceID string) error {
	log.Printf("=== SENDING STOP ALARM COMMAND ===")
	log.Printf("Device ID: %s", deviceID)
	log.Printf("Command sent at: %s", time.Now().Format("2006-01-02 15:04:05.000"))

	message := models.WebSocketMessage{
		Type:      "alarm_stop",
		Data:      map[string]interface{}{},
		Timestamp: time.Now().UnixMilli(),
	}

	ws.sendToDevice(deviceID, message)
	log.Printf("=== STOP ALARM COMMAND COMPLETED ===")
	return nil
}

// GetConnectedDevices returns list of connected devices
func (ws *WebSocketServer) GetConnectedDevices() []*models.DeviceConnection {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()

	devices := make([]*models.DeviceConnection, 0, len(ws.connections))
	for _, conn := range ws.connections {
		devices = append(devices, conn)
	}

	return devices
}
