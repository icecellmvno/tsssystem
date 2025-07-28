#!/bin/bash

# TsimCloud Nginx Setup Script
# Bu script tsimcloud.icell.cloud için Nginx reverse proxy kurulumunu otomatikleştirir

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

# Sistem kontrolü
check_system() {
    log_info "Sistem kontrolü yapılıyor..."
    
    if command -v apt-get &> /dev/null; then
        PACKAGE_MANAGER="apt"
        log_success "Ubuntu/Debian sistemi tespit edildi"
    elif command -v yum &> /dev/null; then
        PACKAGE_MANAGER="yum"
        log_success "CentOS/RHEL sistemi tespit edildi"
    elif command -v dnf &> /dev/null; then
        PACKAGE_MANAGER="dnf"
        log_success "Fedora sistemi tespit edildi"
    else
        log_error "Desteklenmeyen sistem"
        exit 1
    fi
}

# Nginx kurulumu
install_nginx() {
    log_info "Nginx kuruluyor..."
    
    if [[ $PACKAGE_MANAGER == "apt" ]]; then
        apt update
        apt install -y nginx certbot python3-certbot-nginx
    elif [[ $PACKAGE_MANAGER == "yum" ]]; then
        yum install -y epel-release
        yum install -y nginx certbot python3-certbot-nginx
    elif [[ $PACKAGE_MANAGER == "dnf" ]]; then
        dnf install -y nginx certbot python3-certbot-nginx
    fi
    
    log_success "Nginx kurulumu tamamlandı"
}

# SSL sertifikası alma
setup_ssl() {
    log_info "SSL sertifikası alınıyor..."
    
    read -p "E-posta adresinizi girin: " EMAIL
    read -p "Domain adını girin (tsimcloud.icell.cloud): " DOMAIN
    DOMAIN=${DOMAIN:-tsimcloud.icell.cloud}
    
    # Certbot ile SSL sertifikası alma
    certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email --non-interactive
    
    log_success "SSL sertifikası başarıyla alındı"
}

# Nginx konfigürasyonu
setup_nginx_config() {
    log_info "Nginx konfigürasyonu ayarlanıyor..."
    
    # Mevcut konfigürasyonu yedekle
    if [[ -f /etc/nginx/sites-available/default ]]; then
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
        log_info "Varsayılan konfigürasyon yedeklendi"
    fi
    
    # Yeni konfigürasyonu kopyala
    cp nginx.conf /etc/nginx/sites-available/tsimcloud.icell.cloud
    
    # Symlink oluştur
    ln -sf /etc/nginx/sites-available/tsimcloud.icell.cloud /etc/nginx/sites-enabled/
    
    # Varsayılan siteyi devre dışı bırak
    rm -f /etc/nginx/sites-enabled/default
    
    # Log dizinini oluştur
    mkdir -p /var/log/nginx
    
    log_success "Nginx konfigürasyonu ayarlandı"
}

# Firewall ayarları
setup_firewall() {
    log_info "Firewall ayarları yapılıyor..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 'Nginx Full'
        ufw allow 80
        ufw allow 443
        log_success "UFW firewall ayarları yapıldı"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        log_success "Firewalld ayarları yapıldı"
    else
        log_warning "Firewall bulunamadı, manuel olarak 80 ve 443 portlarını açın"
    fi
}

# SSL sertifikası yenileme cron job'ı
setup_ssl_renewal() {
    log_info "SSL sertifikası otomatik yenileme ayarlanıyor..."
    
    # Cron job ekle
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL sertifikası otomatik yenileme ayarlandı"
}

# Log rotation ayarları
setup_log_rotation() {
    log_info "Log rotation ayarları yapılıyor..."
    
    cat > /etc/logrotate.d/tsimcloud << EOF
/var/log/nginx/tsimcloud.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \`cat /var/run/nginx.pid\`
    endscript
}
EOF
    
    log_success "Log rotation ayarları yapıldı"
}

# Nginx test ve başlatma
test_and_start_nginx() {
    log_info "Nginx konfigürasyonu test ediliyor..."
    
    if nginx -t; then
        log_success "Nginx konfigürasyonu geçerli"
        
        # Nginx'i yeniden başlat
        systemctl reload nginx
        systemctl enable nginx
        
        log_success "Nginx başarıyla başlatıldı"
    else
        log_error "Nginx konfigürasyonu hatalı"
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Sistem sağlık kontrolü yapılıyor..."
    
    # Nginx durumu
    if systemctl is-active --quiet nginx; then
        log_success "Nginx çalışıyor"
    else
        log_error "Nginx çalışmıyor"
        return 1
    fi
    
    # Port kontrolü
    if netstat -tlnp | grep -q ":80 "; then
        log_success "Port 80 dinleniyor"
    else
        log_error "Port 80 dinlenmiyor"
        return 1
    fi
    
    if netstat -tlnp | grep -q ":443 "; then
        log_success "Port 443 dinleniyor"
    else
        log_error "Port 443 dinlenmiyor"
        return 1
    fi
    
    # SSL sertifikası kontrolü
    if [[ -f /etc/letsencrypt/live/tsimcloud.icell.cloud/cert.pem ]]; then
        log_success "SSL sertifikası mevcut"
    else
        log_warning "SSL sertifikası bulunamadı"
    fi
}

# Ana fonksiyon
main() {
    log_info "TsimCloud Nginx Setup başlatılıyor..."
    
    check_root
    check_system
    install_nginx
    setup_ssl
    setup_nginx_config
    setup_firewall
    setup_ssl_renewal
    setup_log_rotation
    test_and_start_nginx
    health_check
    
    log_success "Nginx kurulumu tamamlandı!"
    log_info "Domain: https://tsimcloud.icell.cloud"
    log_info "Log dosyaları: /var/log/nginx/tsimcloud.*.log"
    log_info "Konfigürasyon: /etc/nginx/sites-available/tsimcloud.icell.cloud"
}

# Script başlatma
main "$@" 