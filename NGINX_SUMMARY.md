# TsimCloud Nginx Kurulum Özeti

## 📁 Oluşturulan Dosyalar

1. **`nginx.conf`** - Ana Nginx konfigürasyon dosyası
2. **`NGINX_SETUP.md`** - Detaylı kurulum dokümantasyonu
3. **`docker-compose.nginx.yml`** - Docker ile kurulum
4. **`setup-nginx.sh`** - Otomatik kurulum script'i
5. **`NGINX_SUMMARY.md`** - Bu özet dosyası

## 🚀 Hızlı Kurulum

### Manuel Kurulum
```bash
# 1. Nginx kurulumu
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx

# 2. Konfigürasyonu kopyala
sudo cp nginx.conf /etc/nginx/sites-available/tsimcloud.icell.cloud

# 3. Symlink oluştur
sudo ln -s /etc/nginx/sites-available/tsimcloud.icell.cloud /etc/nginx/sites-enabled/

# 4. SSL sertifikası al
sudo certbot --nginx -d tsimcloud.icell.cloud

# 5. Nginx'i yeniden başlat
sudo nginx -t && sudo systemctl reload nginx
```

### Otomatik Kurulum (Linux)
```bash
sudo ./setup-nginx.sh
```

### Docker ile Kurulum
```bash
docker-compose -f docker-compose.nginx.yml up -d
```

## 🔧 Konfigürasyon Özellikleri

### Proxy Ayarları
- **Backend API**: `127.0.0.1:7001` → `/api/*`
- **WebSocket**: `127.0.0.1:7001` → `/ws`
- **Frontend Dev**: `127.0.0.1:5173` → `/dev/*`
- **Production**: Static files → `/`

### Güvenlik
- ✅ SSL/TLS (Let's Encrypt)
- ✅ Rate limiting (API: 10r/s, WS: 30r/s)
- ✅ Security headers
- ✅ HTTP/2 desteği
- ✅ Gzip sıkıştırma

### Performans
- ✅ Keepalive connections
- ✅ Static file caching
- ✅ HTTP/2 server push
- ✅ Buffer optimizasyonu

## 🌐 Route Yapısı

```
https://tsimcloud.icell.cloud/
├── /                    → Frontend (SPA)
├── /api/*              → Backend API
├── /ws                 → WebSocket
├── /dev/*              → Development
└── /health             → Health check
```

## 📊 Monitoring

### Log Dosyaları
- Access: `/var/log/nginx/tsimcloud.access.log`
- Error: `/var/log/nginx/tsimcloud.error.log`

### Health Check
```bash
curl https://tsimcloud.icell.cloud/health
```

### SSL Test
```bash
curl -s "https://api.ssllabs.com/api/v3/analyze?host=tsimcloud.icell.cloud"
```

## 🔍 Troubleshooting

### Yaygın Sorunlar

1. **502 Bad Gateway**
   ```bash
   # Backend servisini kontrol et
   sudo systemctl status your-backend-service
   curl http://localhost:7001/health
   ```

2. **SSL Handshake Failed**
   ```bash
   # Sertifika durumunu kontrol et
   sudo certbot certificates
   sudo certbot renew
   ```

3. **WebSocket Bağlantı Hatası**
   ```bash
   # WebSocket proxy ayarlarını kontrol et
   sudo nginx -t
   sudo tail -f /var/log/nginx/tsimcloud.error.log
   ```

### Debug Komutları
```bash
# Nginx durumu
sudo systemctl status nginx

# Konfigürasyon testi
sudo nginx -t

# Port kontrolü
sudo netstat -tlnp | grep :443

# Log izleme
sudo tail -f /var/log/nginx/tsimcloud.access.log
```

## 📝 Önemli Notlar

### Konfigürasyon Değişiklikleri
- Konfigürasyon dosyası: `/etc/nginx/sites-available/tsimcloud.icell.cloud`
- Değişiklik sonrası: `sudo nginx -t && sudo systemctl reload nginx`

### SSL Sertifikası
- Otomatik yenileme: Her gün saat 12:00
- Manuel yenileme: `sudo certbot renew`
- Sertifika yolu: `/etc/letsencrypt/live/tsimcloud.icell.cloud/`

### Firewall
- Port 80 (HTTP)
- Port 443 (HTTPS)
- WebSocket upgrade için gerekli

## 🎯 Sonraki Adımlar

1. **Domain DNS ayarları** - A kaydını sunucu IP'sine yönlendir
2. **Backend servisleri** - Go backend ve frontend'i başlat
3. **Monitoring** - Log dosyalarını izlemeye başla
4. **Backup** - Konfigürasyon dosyalarını yedekle

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. Nginx konfigürasyon testini çalıştırın
3. Backend servislerinin çalıştığından emin olun
4. Firewall ayarlarını kontrol edin 