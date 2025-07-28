# Nginx Setup for tsimcloud.icell.cloud

Bu dokümantasyon, tsimcloud.icell.cloud domain'i için Nginx reverse proxy kurulumunu açıklar.

## Özellikler

- ✅ HTTP/HTTPS proxy
- ✅ WebSocket proxy desteği
- ✅ SSL/TLS sertifikası (Let's Encrypt)
- ✅ Rate limiting
- ✅ Gzip sıkıştırma
- ✅ Security headers
- ✅ Static file serving
- ✅ SPA routing desteği

## Kurulum Adımları

### 1. Nginx Kurulumu

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# veya
sudo dnf install nginx
```

### 2. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası alma
sudo certbot --nginx -d tsimcloud.icell.cloud

# Otomatik yenileme için cron job
sudo crontab -e
# Aşağıdaki satırı ekleyin:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Konfigürasyonu

```bash
# Mevcut konfigürasyonu yedekle
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Yeni konfigürasyonu kopyala
sudo cp nginx.conf /etc/nginx/sites-available/tsimcloud.icell.cloud

# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/tsimcloud.icell.cloud /etc/nginx/sites-enabled/

# Varsayılan siteyi devre dışı bırak
sudo rm /etc/nginx/sites-enabled/default

# Konfigürasyonu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl reload nginx
```

### 4. Firewall Ayarları

```bash
# UFW (Ubuntu)
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 5. Log Dosyaları

```bash
# Log dizinini oluştur
sudo mkdir -p /var/log/nginx

# Log dosyalarını izle
sudo tail -f /var/log/nginx/tsimcloud.access.log
sudo tail -f /var/log/nginx/tsimcloud.error.log
```

## Konfigürasyon Detayları

### Upstream Servers

- **Backend API**: `127.0.0.1:7001` (Go backend)
- **Frontend Dev**: `127.0.0.1:5173` (Vite dev server)

### Rate Limiting

- **API**: 10 request/second, burst 20
- **WebSocket**: 30 connection/second, burst 50

### SSL/TLS

- **Protocols**: TLSv1.2, TLSv1.3
- **Ciphers**: Modern, güvenli cipher suite'ler
- **HSTS**: 1 yıl max-age

### Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Route Yapısı

```
/                    → Frontend (SPA)
/api/*              → Backend API (port 7001)
/ws                 → WebSocket (port 7001)
/dev/*              → Development frontend (port 5173)
/health             → Health check endpoint
```

## Performans Optimizasyonları

### Gzip Sıkıştırma

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
```

### Caching

- **Static assets**: 1 yıl
- **HTML files**: 1 saat
- **API responses**: No cache (dynamic)

### HTTP/2 Server Push

Kritik CSS ve JS dosyaları için server push aktif.

## Monitoring ve Logging

### Access Log Format

```nginx
log_format tsimcloud '$remote_addr - $remote_user [$time_local] '
                     '"$request" $status $body_bytes_sent '
                     '"$http_referer" "$http_user_agent" '
                     'rt=$request_time uct="$upstream_connect_time" '
                     'uht="$upstream_header_time" urt="$upstream_response_time"';
```

### Error Monitoring

```bash
# Hata loglarını izle
sudo tail -f /var/log/nginx/tsimcloud.error.log | grep -E "(error|warn)"

# 5xx hatalarını say
sudo grep " 5[0-9][0-9] " /var/log/nginx/tsimcloud.access.log | wc -l
```

## Troubleshooting

### Nginx Test

```bash
# Konfigürasyon testi
sudo nginx -t

# Syntax kontrolü
sudo nginx -T | grep -A 10 -B 10 "tsimcloud"
```

### SSL Test

```bash
# SSL sertifikası kontrolü
openssl s_client -connect tsimcloud.icell.cloud:443 -servername tsimcloud.icell.cloud

# SSL Labs test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=tsimcloud.icell.cloud"
```

### WebSocket Test

```bash
# WebSocket bağlantı testi
wscat -c wss://tsimcloud.icell.cloud/ws
```

### Backend Health Check

```bash
# API health check
curl -k https://tsimcloud.icell.cloud/health

# Backend direkt test
curl http://localhost:7001/health
```

## Güvenlik Kontrolleri

### SSL/TLS Güvenlik

```bash
# SSL sertifikası süresi
openssl x509 -in /etc/letsencrypt/live/tsimcloud.icell.cloud/cert.pem -text -noout | grep "Not After"

# Güvenlik testi
nmap --script ssl-enum-ciphers -p 443 tsimcloud.icell.cloud
```

### Rate Limiting Test

```bash
# Rate limiting test
for i in {1..15}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://tsimcloud.icell.cloud/api/health
  sleep 0.1
done
```

## Maintenance

### Log Rotation

```bash
# Logrotate konfigürasyonu
sudo nano /etc/logrotate.d/tsimcloud

# İçerik:
/var/log/nginx/tsimcloud.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### Backup

```bash
# Konfigürasyon yedekleme
sudo cp /etc/nginx/sites-available/tsimcloud.icell.cloud /backup/nginx/
sudo cp /etc/letsencrypt/live/tsimcloud.icell.cloud/ /backup/ssl/ -r
```

## Sorun Giderme

### Yaygın Hatalar

1. **502 Bad Gateway**: Backend servisi çalışmıyor
2. **504 Gateway Timeout**: Backend timeout
3. **SSL Handshake Failed**: Sertifika sorunu
4. **WebSocket Upgrade Failed**: WebSocket proxy ayarları

### Debug Komutları

```bash
# Nginx process durumu
sudo systemctl status nginx

# Port dinleme durumu
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Backend servis durumu
sudo systemctl status your-backend-service

# SSL sertifikası durumu
sudo certbot certificates
```

## Güncellemeler

### Nginx Güncelleme

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade nginx

# CentOS/RHEL
sudo yum update nginx
# veya
sudo dnf update nginx
```

### Konfigürasyon Güncelleme

```bash
# Konfigürasyonu yeniden yükle
sudo nginx -s reload

# Tam restart (gerekirse)
sudo systemctl restart nginx
``` 