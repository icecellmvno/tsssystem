#!/bin/bash

# TsimCloud Systemd Services Installation Script
# Bu script backend ve SMPP server için systemd servislerini kurar

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonları
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Root kontrolü
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Bu script root yetkisi gerektirir"
        exit 1
    fi
}

# TsimCloud kullanıcısı oluştur
create_user() {
    log_info "TsimCloud kullanıcısı oluşturuluyor..."
    
    if ! id "tsimcloud" &>/dev/null; then
        useradd -r -s /bin/bash -d /opt/tsimcloud tsimcloud
        log_success "TsimCloud kullanıcısı oluşturuldu"
    else
        log_info "TsimCloud kullanıcısı zaten mevcut"
    fi
    
    # Grup oluştur
    if ! getent group tsimcloud >/dev/null 2>&1; then
        groupadd tsimcloud
        log_success "TsimCloud grubu oluşturuldu"
    fi
    
    # Kullanıcıyı gruba ekle
    usermod -a -G tsimcloud tsimcloud
}

# Dizin yapısını oluştur
create_directories() {
    log_info "Dizin yapısı oluşturuluyor..."
    
    # Ana dizinler
    mkdir -p /opt/tsimcloud/{backend,smppserver,logs,config}
    mkdir -p /opt/tsimcloud/backend/{logs,static}
    mkdir -p /opt/tsimcloud/smppserver/logs
    
    # İzinleri ayarla
    chown -R tsimcloud:tsimcloud /opt/tsimcloud
    chmod -R 755 /opt/tsimcloud
    
    log_success "Dizin yapısı oluşturuldu"
}

# Binary dosyalarını kopyala
copy_binaries() {
    log_info "Binary dosyaları kopyalanıyor..."
    
    # Kaynak kodlarından build et
    log_info "Kaynak kodlarından build ediliyor..."
    
    # Backend build
    if [[ -d "backend" ]]; then
        cd backend
        log_info "Backend build ediliyor..."
        if go build -o backend-server ./cmd/server/; then
            cp -f backend-server /opt/tsimcloud/backend/server
            chmod +x /opt/tsimcloud/backend/server
            log_success "Backend build edildi ve kopyalandı"
        else
            log_error "Backend build başarısız"
            return 1
        fi
        cd ..
    else
        log_warning "Backend kaynak kodu bulunamadı"
    fi
    
    # SMPP server build
    if [[ -d "smppserver" ]]; then
        cd smppserver
        log_info "SMPP server build ediliyor..."
        if go build -o smpp-server ./cmd/server/; then
            cp -f smpp-server /opt/tsimcloud/smppserver/server
            chmod +x /opt/tsimcloud/smppserver/server
            log_success "SMPP server build edildi ve kopyalandı"
        else
            log_error "SMPP server build başarısız"
            return 1
        fi
        cd ..
    else
        log_warning "SMPP server kaynak kodu bulunamadı"
    fi
}

# Konfigürasyon dosyalarını kopyala
copy_configs() {
    log_info "Konfigürasyon dosyaları kopyalanıyor..."
    
    # Backend config
    if [[ -f "backend/config/config.yaml" ]]; then
        cp -f backend/config/config.yaml /opt/tsimcloud/config/backend.yaml
        log_success "Backend config kopyalandı"
    fi
    
    # SMPP server config
    if [[ -f "smppserver/config/config.yaml" ]]; then
        cp -f smppserver/config/config.yaml /opt/tsimcloud/config/smpp.yaml
        log_success "SMPP server config kopyalandı"
    fi
    
    # İzinleri ayarla
    chown -R tsimcloud:tsimcloud /opt/tsimcloud/config
    chmod 644 /opt/tsimcloud/config/*.yaml
}

# Systemd servislerini kur
install_services() {
    log_info "Systemd servisleri kuruluyor..."
    
    # Servis dosyalarını kopyala
    cp -f tsimcloud-backend.service /etc/systemd/system/
    cp -f tsimcloud-smpp.service /etc/systemd/system/
    
    # Systemd'yi yeniden yükle
    systemctl daemon-reload
    
    # Servisleri etkinleştir
    systemctl enable tsimcloud-backend.service
    systemctl enable tsimcloud-smpp.service
    
    log_success "Systemd servisleri kuruldu"
}

# Logrotate konfigürasyonu
setup_logrotate() {
    log_info "Logrotate konfigürasyonu ayarlanıyor..."
    
    cat > /etc/logrotate.d/tsimcloud-services << EOF
/opt/tsimcloud/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 tsimcloud tsimcloud
    postrotate
        systemctl reload tsimcloud-backend.service
        systemctl reload tsimcloud-smpp.service
    endscript
}
EOF
    
    log_success "Logrotate konfigürasyonu ayarlandı"
}

# Monitoring script'i oluştur
create_monitoring_script() {
    log_info "Monitoring script'i oluşturuluyor..."
    
    cat > /opt/tsimcloud/monitor-services.sh << 'EOF'
#!/bin/bash

# TsimCloud Services Monitoring Script

BACKEND_STATUS=$(systemctl is-active tsimcloud-backend.service)
SMPP_STATUS=$(systemctl is-active tsimcloud-smpp.service)

echo "=== TsimCloud Services Status ==="
echo "Backend Service: $BACKEND_STATUS"
echo "SMPP Service: $SMPP_STATUS"
echo "================================"

# Check if services are running
if [[ "$BACKEND_STATUS" != "active" ]]; then
    echo "WARNING: Backend service is not running!"
    systemctl restart tsimcloud-backend.service
fi

if [[ "$SMPP_STATUS" != "active" ]]; then
    echo "WARNING: SMPP service is not running!"
    systemctl restart tsimcloud-smpp.service
fi

# Check resource usage
echo ""
echo "=== Resource Usage ==="
ps aux | grep -E "(tsimcloud-backend|tsimcloud-smpp)" | grep -v grep
echo "====================="
EOF
    
    chmod +x /opt/tsimcloud/monitor-services.sh
    chown tsimcloud:tsimcloud /opt/tsimcloud/monitor-services.sh
    
    log_success "Monitoring script'i oluşturuldu"
}

# Cron job ekle
setup_cron() {
    log_info "Cron job ayarlanıyor..."
    
    # Monitoring için cron job
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/tsimcloud/monitor-services.sh >> /opt/tsimcloud/logs/monitor.log 2>&1") | crontab -
    
    log_success "Cron job ayarlandı"
}

# Servisleri başlat
start_services() {
    log_info "Servisler başlatılıyor..."
    
    # Backend servisini başlat
    systemctl start tsimcloud-backend.service
    sleep 5
    
    # SMPP servisini başlat
    systemctl start tsimcloud-smpp.service
    sleep 5
    
    log_success "Servisler başlatıldı"
}

# Health check
health_check() {
    log_info "Servis sağlık kontrolü yapılıyor..."
    
    # Backend kontrolü
    if systemctl is-active --quiet tsimcloud-backend.service; then
        log_success "Backend servisi çalışıyor"
    else
        log_error "Backend servisi çalışmıyor"
        systemctl status tsimcloud-backend.service
    fi
    
    # SMPP kontrolü
    if systemctl is-active --quiet tsimcloud-smpp.service; then
        log_success "SMPP servisi çalışıyor"
    else
        log_error "SMPP servisi çalışmıyor"
        systemctl status tsimcloud-smpp.service
    fi
    
    # Port kontrolü
    if netstat -tlnp | grep -q ":7001 "; then
        log_success "Backend port 7001 dinleniyor"
    else
        log_warning "Backend port 7001 dinlenmiyor"
    fi
    
    if netstat -tlnp | grep -q ":2775 "; then
        log_success "SMPP port 2775 dinleniyor"
    else
        log_warning "SMPP port 2775 dinlenmiyor"
    fi
}

# Ana fonksiyon
main() {
    log_info "TsimCloud Systemd Services kurulumu başlatılıyor..."
    
    check_root
    create_user
    create_directories
    copy_binaries
    copy_configs
    install_services
    setup_logrotate
    create_monitoring_script
    setup_cron
    start_services
    health_check
    
    log_success "Kurulum tamamlandı!"
    echo ""
    echo "=== Kullanım Komutları ==="
    echo "Servisleri durdur: systemctl stop tsimcloud-backend.service tsimcloud-smpp.service"
    echo "Servisleri başlat: systemctl start tsimcloud-backend.service tsimcloud-smpp.service"
    echo "Servisleri yeniden başlat: systemctl restart tsimcloud-backend.service tsimcloud-smpp.service"
    echo "Servis durumunu kontrol et: systemctl status tsimcloud-backend.service tsimcloud-smpp.service"
    echo "Log'ları izle: journalctl -u tsimcloud-backend.service -f"
    echo "Monitoring: /opt/tsimcloud/monitor-services.sh"
    echo "========================"
}

# Script başlatma
main "$@" 