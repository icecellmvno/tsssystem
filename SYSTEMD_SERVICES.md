# TsimCloud Systemd Services

Bu dokümantasyon, TsimCloud backend ve SMPP server için systemd servislerinin kurulumunu ve yönetimini açıklar.

## 📁 Dizin Yapısı

### Kaynak Kodlar
```
/opt/tssystem/          # Kaynak kodlar burada
├── backend/
├── smppserver/
└── frontend/
```

### Deploy Edilen Dosyalar
```
/opt/tsimcloud/         # Deploy edilen dosyalar burada
├── backend/
│   ├── server (binary)
│   ├── logs/
│   └── static/
├── smppserver/
│   ├── server (binary)
│   └── logs/
├── config/
│   ├── backend.yaml
│   └── smpp.yaml
├── logs/
└── monitor-services.sh
```

## 🚀 Kurulum

### Otomatik Kurulum

```bash
# Script'i çalıştırılabilir yap
chmod +x install-services.sh

# Kurulumu başlat
sudo ./install-services.sh
```

### Manuel Kurulum

```bash
# 1. Kullanıcı oluştur
sudo useradd -r -s /bin/bash -d /opt/tsimcloud tsimcloud
sudo groupadd tsimcloud
sudo usermod -a -G tsimcloud tsimcloud

# 2. Dizinleri oluştur
sudo mkdir -p /opt/tsimcloud/{backend,smppserver,logs,config}
sudo mkdir -p /opt/tsimcloud/backend/{logs,static}
sudo mkdir -p /opt/tsimcloud/smppserver/logs

# 3. İzinleri ayarla
sudo chown -R tsimcloud:tsimcloud /opt/tsimcloud
sudo chmod -R 755 /opt/tsimcloud

# 4. Kaynak kodlarından build et
cd /opt/tssystem/backend
go build -o server ./cmd/server/
sudo cp server /opt/tsimcloud/backend/
sudo chmod +x /opt/tsimcloud/backend/server

cd /opt/tssystem/smppserver
go build -o server ./cmd/server/
sudo cp server /opt/tsimcloud/smppserver/
sudo chmod +x /opt/tsimcloud/smppserver/server

# 5. Konfigürasyon dosyalarını kopyala
sudo cp /opt/tssystem/backend/config/config.yaml /opt/tsimcloud/config/backend.yaml
sudo cp /opt/tssystem/smppserver/config/config.yaml /opt/tsimcloud/config/smpp.yaml

# 6. Systemd servislerini kur
sudo cp tsimcloud-backend.service /etc/systemd/system/
sudo cp tsimcloud-smpp.service /etc/systemd/system/
sudo systemctl daemon-reload

# 7. Servisleri etkinleştir
sudo systemctl enable tsimcloud-backend.service
sudo systemctl enable tsimcloud-smpp.service
```

## 🔧 Servis Yönetimi

### Servisleri Başlatma

```bash
# Backend servisini başlat
sudo systemctl start tsimcloud-backend.service

# SMPP servisini başlat
sudo systemctl start tsimcloud-smpp.service

# Her ikisini birden başlat
sudo systemctl start tsimcloud-backend.service tsimcloud-smpp.service
```

### Servisleri Durdurma

```bash
# Backend servisini durdur
sudo systemctl stop tsimcloud-backend.service

# SMPP servisini durdur
sudo systemctl stop tsimcloud-smpp.service

# Her ikisini birden durdur
sudo systemctl stop tsimcloud-backend.service tsimcloud-smpp.service
```

### Servisleri Yeniden Başlatma

```bash
# Backend servisini yeniden başlat
sudo systemctl restart tsimcloud-backend.service

# SMPP servisini yeniden başlat
sudo systemctl restart tsimcloud-smpp.service

# Her ikisini birden yeniden başlat
sudo systemctl restart tsimcloud-backend.service tsimcloud-smpp.service
```

### Servis Durumunu Kontrol Etme

```bash
# Backend servis durumu
sudo systemctl status tsimcloud-backend.service

# SMPP servis durumu
sudo systemctl status tsimcloud-smpp.service

# Her ikisinin durumu
sudo systemctl status tsimcloud-backend.service tsimcloud-smpp.service
```

## 📊 Monitoring ve Logging

### Log Dosyaları

```bash
# Systemd journal logları
sudo journalctl -u tsimcloud-backend.service -f
sudo journalctl -u tsimcloud-smpp.service -f

# Uygulama logları
sudo tail -f /opt/tsimcloud/logs/*.log

# Monitoring logları
sudo tail -f /opt/tsimcloud/logs/monitor.log
```

### Monitoring Script

```bash
# Manuel monitoring
sudo /opt/tsimcloud/monitor-services.sh

# Monitoring script'ini çalıştırılabilir yap
sudo chmod +x /opt/tsimcloud/monitor-services.sh
```

### Otomatik Monitoring

Monitoring script'i her 5 dakikada bir otomatik olarak çalışır ve:
- Servislerin durumunu kontrol eder
- Çalışmayan servisleri otomatik olarak yeniden başlatır
- Kaynak kullanımını raporlar

## 🔍 Troubleshooting

### Yaygın Sorunlar

1. **Servis Başlatılamıyor**
   ```bash
   # Detaylı hata mesajlarını gör
   sudo journalctl -u tsimcloud-backend.service --no-pager -l
   sudo journalctl -u tsimcloud-smpp.service --no-pager -l
   ```

2. **Port Çakışması**
   ```bash
   # Portları kontrol et
   sudo netstat -tlnp | grep -E "(7001|2775)"
   
   # Çakışan servisleri bul
   sudo lsof -i :7001
   sudo lsof -i :2775
   ```

3. **İzin Sorunları**
   ```bash
   # Dizin izinlerini kontrol et
ls -la /opt/tsimcloud/

# İzinleri düzelt
sudo chown -R tsimcloud:tsimcloud /opt/tsimcloud
sudo chmod -R 755 /opt/tsimcloud
   ```

### Debug Komutları

```bash
# Servis konfigürasyonunu kontrol et
sudo systemctl cat tsimcloud-backend.service
sudo systemctl cat tsimcloud-smpp.service

# Servis bağımlılıklarını kontrol et
sudo systemctl list-dependencies tsimcloud-backend.service
sudo systemctl list-dependencies tsimcloud-smpp.service

# Sistem kaynaklarını kontrol et
sudo systemctl show tsimcloud-backend.service --property=LimitNOFILE
sudo systemctl show tsimcloud-smpp.service --property=LimitNOFILE
```

## 🔒 Güvenlik

### Systemd Güvenlik Ayarları

- **NoNewPrivileges**: Yeni ayrıcalık edinmeyi engeller
- **PrivateTmp**: Geçici dosyaları izole eder
- **ProtectSystem**: Sistem dosyalarını korur
- **ProtectHome**: Home dizinini korur
- **ReadWritePaths**: Sadece belirli dizinlere yazma izni

### Kullanıcı İzinleri

```bash
# TsimCloud kullanıcısı sadece gerekli dizinlere erişebilir
sudo -u tsimcloud ls -la /opt/tsimcloud/

# Sistem dizinlerine erişim engellenmiş
sudo -u tsimcloud ls /etc/  # Hata verecek
```

## 📈 Performans

### Resource Limits

- **LimitNOFILE**: 65536 (açık dosya sayısı)
- **LimitNPROC**: 4096 (process sayısı)

### Monitoring

```bash
# CPU ve Memory kullanımı
sudo systemctl show tsimcloud-backend.service --property=CPUUsageNSec
sudo systemctl show tsimcloud-smpp.service --property=MemoryCurrent

# Process bilgileri
ps aux | grep -E "(tsimcloud-backend|tsimcloud-smpp)" | grep -v grep
```

## 🔄 Güncelleme

### Binary Güncelleme

```bash
# Servisleri durdur
sudo systemctl stop tsimcloud-backend.service tsimcloud-smpp.service

# Yeni binary'leri kopyala
sudo cp backend/server /opt/tsimcloud/backend/
sudo cp smppserver/server /opt/tsimcloud/smppserver/
sudo chmod +x /opt/tsimcloud/backend/server
sudo chmod +x /opt/tsimcloud/smppserver/server

# Servisleri başlat
sudo systemctl start tsimcloud-backend.service tsimcloud-smpp.service
```

### Konfigürasyon Güncelleme

```bash
# Konfigürasyon dosyalarını güncelle
sudo cp backend/config/config.yaml /opt/tsimcloud/config/backend.yaml
sudo cp smppserver/config/config.yaml /opt/tsimcloud/config/smpp.yaml

# Servisleri yeniden başlat
sudo systemctl restart tsimcloud-backend.service tsimcloud-smpp.service
```

## 🗑️ Kaldırma

### Servisleri Kaldırma

```bash
# Servisleri durdur ve devre dışı bırak
sudo systemctl stop tsimcloud-backend.service tsimcloud-smpp.service
sudo systemctl disable tsimcloud-backend.service tsimcloud-smpp.service

# Servis dosyalarını sil
sudo rm /etc/systemd/system/tsimcloud-backend.service
sudo rm /etc/systemd/system/tsimcloud-smpp.service

# Systemd'yi yeniden yükle
sudo systemctl daemon-reload

# Dizinleri sil (isteğe bağlı)
sudo rm -rf /opt/tsimcloud

# Kullanıcıyı sil (isteğe bağlı)
sudo userdel tsimcloud
sudo groupdel tsimcloud
```

## 📞 Destek

Sorun yaşarsanız:

1. **Log dosyalarını kontrol edin**
   ```bash
   sudo journalctl -u tsimcloud-backend.service -f
   sudo journalctl -u tsimcloud-smpp.service -f
   ```

2. **Servis durumunu kontrol edin**
   ```bash
   sudo systemctl status tsimcloud-backend.service
   sudo systemctl status tsimcloud-smpp.service
   ```

3. **Monitoring script'ini çalıştırın**
   ```bash
   sudo /opt/tssystem/monitor-services.sh
   ```

4. **Sistem kaynaklarını kontrol edin**
   ```bash
   free -h
   df -h
   top
   ``` 