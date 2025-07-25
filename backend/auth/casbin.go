package auth

import (
	"log"

	"tsimsocketserver/database"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
)

var Enforcer *casbin.Enforcer

func InitializeCasbin() error {
	adapter, err := gormadapter.NewAdapterByDB(database.GetDB())
	if err != nil {
		return err
	}

	Enforcer, err = casbin.NewEnforcer("config/rbac_model.conf", adapter)
	if err != nil {
		return err
	}

	if err := loadDefaultPolicies(); err != nil {
		return err
	}

	log.Println("Casbin initialized successfully")
	return nil
}

func loadDefaultPolicies() error {
	// Admin policies
	Enforcer.AddPolicy("admin", "/api/users", "GET")
	Enforcer.AddPolicy("admin", "/api/users", "POST")
	Enforcer.AddPolicy("admin", "/api/users/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/users/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/users/:id", "DELETE")

	// Admin roles policies
	Enforcer.AddPolicy("admin", "/api/roles", "GET")
	Enforcer.AddPolicy("admin", "/api/roles", "POST")
	Enforcer.AddPolicy("admin", "/api/roles/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/roles/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/roles/:id", "DELETE")

	// Admin permissions policies
	Enforcer.AddPolicy("admin", "/api/permissions", "GET")
	Enforcer.AddPolicy("admin", "/api/permissions", "POST")
	Enforcer.AddPolicy("admin", "/api/permissions/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/permissions/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/permissions/:id", "DELETE")

	// Admin sitename policies
	Enforcer.AddPolicy("admin", "/api/sitenames", "GET")
	Enforcer.AddPolicy("admin", "/api/sitenames", "POST")
	Enforcer.AddPolicy("admin", "/api/sitenames/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/sitenames/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/sitenames/:id", "DELETE")

	// Admin device group policies
	Enforcer.AddPolicy("admin", "/api/device-groups", "GET")
	Enforcer.AddPolicy("admin", "/api/device-groups", "POST")
	Enforcer.AddPolicy("admin", "/api/device-groups/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/device-groups/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/device-groups/:id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/device-groups/:id/qr", "GET")

	// Admin devices policies
	Enforcer.AddPolicy("admin", "/api/devices", "GET")
	Enforcer.AddPolicy("admin", "/api/devices/connected", "GET")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id", "GET")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/sms", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/ussd", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/find", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/alarm/start", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/alarm/stop", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/alarm", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/toggle", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/maintenance/enter", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/maintenance/exit", "POST")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/devices/:device_id/name", "PUT")

	// Admin alarm logs policies
	Enforcer.AddPolicy("admin", "/api/alarm-logs", "GET")
	Enforcer.AddPolicy("admin", "/api/alarm-logs/stats", "GET")
	Enforcer.AddPolicy("admin", "/api/alarm-logs/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/alarm-logs/:id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/alarm-logs", "DELETE")

	// Admin SMPP users policies
	Enforcer.AddPolicy("admin", "/api/smpp-users", "GET")
	Enforcer.AddPolicy("admin", "/api/smpp-users", "POST")
	Enforcer.AddPolicy("admin", "/api/smpp-users/stats", "GET")
	Enforcer.AddPolicy("admin", "/api/smpp-users/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/smpp-users/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/smpp-users/:id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/smpp-users/:id/connection-status", "PUT")

	// Admin blacklist numbers policies
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers", "GET")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers", "POST")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/bulk-import", "POST")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/bulk-paste", "POST")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/:id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/blacklist-numbers/bulk-delete", "DELETE")

	// Admin SMS logs policies
	Enforcer.AddPolicy("admin", "/api/sms-logs", "GET")
	Enforcer.AddPolicy("admin", "/api/sms-logs/filter-options", "GET")
	Enforcer.AddPolicy("admin", "/api/sms-logs/:id", "GET")

	// Admin USSD logs policies
	Enforcer.AddPolicy("admin", "/api/ussd-logs", "GET")
	Enforcer.AddPolicy("admin", "/api/ussd-logs/filter-options", "GET")
	Enforcer.AddPolicy("admin", "/api/ussd-logs/:id", "GET")

	// Admin SIM cards policies
	Enforcer.AddPolicy("admin", "/api/sim-cards", "GET")
	Enforcer.AddPolicy("admin", "/api/sim-cards", "POST")
	Enforcer.AddPolicy("admin", "/api/sim-cards/filter-options", "GET")
	Enforcer.AddPolicy("admin", "/api/sim-cards/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/sim-cards/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/sim-cards/:id", "DELETE")

	// Admin filters policies
	Enforcer.AddPolicy("admin", "/api/filters", "GET")
	Enforcer.AddPolicy("admin", "/api/filters", "POST")
	Enforcer.AddPolicy("admin", "/api/filters/:id", "GET")
	Enforcer.AddPolicy("admin", "/api/filters/:id", "PUT")
	Enforcer.AddPolicy("admin", "/api/filters/:id", "DELETE")
	Enforcer.AddPolicy("admin", "/api/filters/bulk-delete", "DELETE")
	Enforcer.AddPolicy("admin", "/api/filters/:id/toggle", "PATCH")

	// Admin bulk SMS policies
	Enforcer.AddPolicy("admin", "/api/bulk-sms/send", "POST")
	Enforcer.AddPolicy("admin", "/api/bulk-sms/status", "GET")

	// Admin QR generation policies
	Enforcer.AddPolicy("admin", "/api/qr/generate", "POST")

	// Admin websocket config policies
	Enforcer.AddPolicy("admin", "/api/websocket-config", "GET")

	// Manager policies
	Enforcer.AddPolicy("manager", "/api/users", "GET")
	Enforcer.AddPolicy("manager", "/api/roles", "GET")
	Enforcer.AddPolicy("manager", "/api/permissions", "GET")
	Enforcer.AddPolicy("manager", "/api/sitenames", "GET")
	Enforcer.AddPolicy("manager", "/api/sitenames/:id", "GET")
	Enforcer.AddPolicy("manager", "/api/device-groups", "GET")
	Enforcer.AddPolicy("manager", "/api/device-groups/:id", "GET")
	Enforcer.AddPolicy("manager", "/api/device-groups/:id/qr", "GET")
	Enforcer.AddPolicy("manager", "/api/devices", "GET")
	Enforcer.AddPolicy("manager", "/api/devices/connected", "GET")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id", "GET")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id/sms", "POST")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id/ussd", "POST")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id/find", "POST")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id/maintenance/enter", "POST")
	Enforcer.AddPolicy("manager", "/api/devices/:device_id/maintenance/exit", "POST")
	Enforcer.AddPolicy("manager", "/api/alarm-logs", "GET")
	Enforcer.AddPolicy("manager", "/api/alarm-logs/stats", "GET")
	Enforcer.AddPolicy("manager", "/api/alarm-logs/:id", "GET")
	Enforcer.AddPolicy("manager", "/api/websocket-config", "GET")

	// Manager SMPP users policies (read-only)
	Enforcer.AddPolicy("manager", "/api/smpp-users", "GET")
	Enforcer.AddPolicy("manager", "/api/smpp-users/stats", "GET")
	Enforcer.AddPolicy("manager", "/api/smpp-users/:id", "GET")

	// Manager blacklist numbers policies (read-only)
	Enforcer.AddPolicy("manager", "/api/blacklist-numbers", "GET")
	Enforcer.AddPolicy("manager", "/api/blacklist-numbers/:id", "GET")

	// Manager SMS logs policies (read-only)
	Enforcer.AddPolicy("manager", "/api/sms-logs", "GET")
	Enforcer.AddPolicy("manager", "/api/sms-logs/filter-options", "GET")
	Enforcer.AddPolicy("manager", "/api/sms-logs/:id", "GET")

	// Manager USSD logs policies (read-only)
	Enforcer.AddPolicy("manager", "/api/ussd-logs", "GET")
	Enforcer.AddPolicy("manager", "/api/ussd-logs/filter-options", "GET")
	Enforcer.AddPolicy("manager", "/api/ussd-logs/:id", "GET")

	// Manager SIM cards policies (read-only)
	Enforcer.AddPolicy("manager", "/api/sim-cards", "GET")
	Enforcer.AddPolicy("manager", "/api/sim-cards/filter-options", "GET")
	Enforcer.AddPolicy("manager", "/api/sim-cards/:id", "GET")

	// Manager filters policies (read-only)
	Enforcer.AddPolicy("manager", "/api/filters", "GET")
	Enforcer.AddPolicy("manager", "/api/filters/:id", "GET")

	// Manager bulk SMS policies (read-only)
	Enforcer.AddPolicy("manager", "/api/bulk-sms/status", "GET")

	// Manager QR generation policies (read-only)
	Enforcer.AddPolicy("manager", "/api/qr/generate", "POST")

	// Operator policies
	Enforcer.AddPolicy("operator", "/api/sitenames", "GET")
	Enforcer.AddPolicy("operator", "/api/sitenames/:id", "GET")
	Enforcer.AddPolicy("operator", "/api/device-groups", "GET")
	Enforcer.AddPolicy("operator", "/api/device-groups/:id", "GET")
	Enforcer.AddPolicy("operator", "/api/device-groups/:id/qr", "GET")
	Enforcer.AddPolicy("operator", "/api/devices", "GET")
	Enforcer.AddPolicy("operator", "/api/devices/connected", "GET")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id", "GET")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id/sms", "POST")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id/ussd", "POST")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id/find", "POST")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id/maintenance/enter", "POST")
	Enforcer.AddPolicy("operator", "/api/devices/:device_id/maintenance/exit", "POST")
	Enforcer.AddPolicy("operator", "/api/alarm-logs", "GET")
	Enforcer.AddPolicy("operator", "/api/alarm-logs/stats", "GET")
	Enforcer.AddPolicy("operator", "/api/alarm-logs/:id", "GET")
	Enforcer.AddPolicy("operator", "/api/websocket-config", "GET")

	// Operator SMPP users policies (read-only)
	Enforcer.AddPolicy("operator", "/api/smpp-users", "GET")
	Enforcer.AddPolicy("operator", "/api/smpp-users/stats", "GET")
	Enforcer.AddPolicy("operator", "/api/smpp-users/:id", "GET")

	// Operator blacklist numbers policies (read-only)
	Enforcer.AddPolicy("operator", "/api/blacklist-numbers", "GET")
	Enforcer.AddPolicy("operator", "/api/blacklist-numbers/:id", "GET")

	// Operator SMS logs policies (read-only)
	Enforcer.AddPolicy("operator", "/api/sms-logs", "GET")
	Enforcer.AddPolicy("operator", "/api/sms-logs/filter-options", "GET")
	Enforcer.AddPolicy("operator", "/api/sms-logs/:id", "GET")

	// Operator USSD logs policies (read-only)
	Enforcer.AddPolicy("operator", "/api/ussd-logs", "GET")
	Enforcer.AddPolicy("operator", "/api/ussd-logs/filter-options", "GET")
	Enforcer.AddPolicy("operator", "/api/ussd-logs/:id", "GET")

	// Operator SIM cards policies (read-only)
	Enforcer.AddPolicy("operator", "/api/sim-cards", "GET")
	Enforcer.AddPolicy("operator", "/api/sim-cards/filter-options", "GET")
	Enforcer.AddPolicy("operator", "/api/sim-cards/:id", "GET")

	// Operator filters policies (read-only)
	Enforcer.AddPolicy("operator", "/api/filters", "GET")
	Enforcer.AddPolicy("operator", "/api/filters/:id", "GET")

	// Operator bulk SMS policies (read-only)
	Enforcer.AddPolicy("operator", "/api/bulk-sms/status", "GET")

	// Operator QR generation policies (read-only)
	Enforcer.AddPolicy("operator", "/api/qr/generate", "POST")

	// User policies
	Enforcer.AddPolicy("user", "/api/profile", "GET")
	Enforcer.AddPolicy("user", "/api/users/profile", "GET")
	Enforcer.AddPolicy("user", "/api/users/profile", "PUT")
	Enforcer.AddPolicy("user", "/api/devices", "GET")
	Enforcer.AddPolicy("user", "/api/alarm-logs", "GET")
	Enforcer.AddPolicy("user", "/api/websocket-config", "GET")
	Enforcer.AddPolicy("user", "/ws", "GET")

	// Public policies
	Enforcer.AddPolicy("public", "/api/auth/login", "POST")
	Enforcer.AddPolicy("public", "/api/auth/register", "POST")
	Enforcer.AddPolicy("public", "/api/auth/forgot-password", "POST")
	Enforcer.AddPolicy("public", "/health", "GET")

	return nil
}

func CheckPermission(subject, object, action string) bool {
	ok, err := Enforcer.Enforce(subject, object, action)
	if err != nil {
		log.Printf("Error checking permission: %v", err)
		return false
	}
	return ok
}
