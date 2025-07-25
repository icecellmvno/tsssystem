# SMPP Server

Bu proje, hiçbir harici SMPP kütüphanesi kullanmadan sıfırdan yazılmış bir SMPP (Short Message Peer-to-Peer) sunucusudur. Backend'in mevcut database yapısını kullanarak SMPP kullanıcılarını yönetir.

## Özellikler

- **Tam SMPP Protokol Desteği**: SMPP v3.4 protokolünün tam implementasyonu
- **Backend Entegrasyonu**: Mevcut backend database yapısı ile entegre
- **Kullanıcı Yönetimi**: SMPP kullanıcılarının oluşturulması, güncellenmesi ve silinmesi
- **Session Yönetimi**: Bağlantı durumu takibi ve otomatik temizlik
- **Mesaj İşleme**: SMS gönderimi ve alımı
- **CLI Tool**: Kullanıcı yönetimi için komut satırı aracı

## Kurulum

### Gereksinimler

- Go 1.21+
- MySQL veritabanı
- Backend'in çalışır durumda olması

### Konfigürasyon

1. `config/config.yaml` dosyasını düzenleyin:

```yaml
server:
  port: 2775
  host: "0.0.0.0"
  max_connections: 1000
  read_timeout: 30
  write_timeout: 30

database:
  host: "localhost"
  port: "3306"
  user: "root"
  password: "password"
  name: "tsim_socketserver"

logging:
  level: "info"
  file: "logs/smpp_server.log"

smpp:
  default_ton: 1
  default_npi: 1
  max_message_length: 160
  session_timeout: 300
  enquire_link_interval: 30
```

### Çalıştırma

1. Bağımlılıkları yükleyin:
```bash
go mod tidy
```

2. SMPP sunucusunu başlatın:
```bash
go run main.go
```

3. CLI tool'u kullanın:
```bash
go run cmd/cli/main.go
```

## Kullanım

### SMPP Sunucusu

SMPP sunucusu varsayılan olarak 2775 portunda çalışır. SMPP istemcileri bu porta bağlanarak:

- `bind_receiver`: Sadece mesaj alma
- `bind_transmitter`: Sadece mesaj gönderme  
- `bind_transceiver`: Hem gönderme hem alma
- `submit_sm`: SMS gönderme
- `deliver_sm`: SMS alma
- `unbind`: Bağlantıyı kesme

işlemlerini gerçekleştirebilir.

### CLI Tool

CLI tool ile SMPP kullanıcılarını yönetebilirsiniz:

1. **Kullanıcı Listesi**: Tüm SMPP kullanıcılarını görüntüleme
2. **Kullanıcı Oluşturma**: Yeni SMPP kullanıcısı oluşturma
3. **Kullanıcı Güncelleme**: Mevcut kullanıcı bilgilerini güncelleme
4. **Kullanıcı Silme**: Kullanıcı silme (soft delete)
5. **Kullanıcı Detayları**: Kullanıcı detaylarını görüntüleme

## Veritabanı Yapısı

SMPP server, backend'in mevcut `smpp_users` tablosunu kullanır:

```sql
CREATE TABLE smpp_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    max_connection_speed INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_connected_at TIMESTAMP NULL,
    last_disconnected_at TIMESTAMP NULL,
    last_ip_address VARCHAR(45) NULL,
    connection_count INT NOT NULL DEFAULT 0,
    total_messages_sent INT NOT NULL DEFAULT 0,
    total_messages_received INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

Ayrıca session takibi için `smpp_sessions` tablosu kullanılır:

```sql
CREATE TABLE smpp_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    system_id VARCHAR(50) NOT NULL,
    remote_addr VARCHAR(45) NOT NULL,
    bind_type ENUM('receiver', 'transmitter', 'transceiver') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Protokol Desteği

### Desteklenen SMPP Komutları

- **Bind Komutları**:
  - `bind_receiver` (0x00000001)
  - `bind_transmitter` (0x00000002)
  - `bind_transceiver` (0x00000009)

- **Mesaj Komutları**:
  - `submit_sm` (0x00000004)
  - `deliver_sm` (0x00000005)

- **Bağlantı Komutları**:
  - `unbind` (0x00000006)
  - `enquire_link` (0x00000015)

### Desteklenen Parametreler

- **TON (Type of Number)**: 0-6
- **NPI (Numbering Plan Indicator)**: 0-12
- **Data Coding**: GSM7, 8BIT, UCS2, Latin1
- **ESM Class**: Default, Datagram, Forward, Store and Forward
- **Priority**: 0-3
- **Registered Delivery**: None, SMSC, SME, Both

## Güvenlik

- Kullanıcı kimlik doğrulama
- Bağlantı sayısı sınırlaması
- Session timeout
- IP adresi takibi
- Soft delete desteği

## Loglama

SMPP server, tüm işlemleri detaylı olarak loglar:

- Bağlantı olayları
- Kimlik doğrulama
- Mesaj işlemleri
- Hata durumları
- Session yönetimi

## Performans

- Eşzamanlı bağlantı desteği
- Otomatik session temizliği
- Bağlantı havuzu yönetimi
- Mesaj kuyruğu

## Geliştirme

### Proje Yapısı

```
smppserver/
├── config/          # Konfigürasyon dosyaları
├── protocol/        # SMPP protokol implementasyonu
├── session/         # Session yönetimi
├── auth/           # Kimlik doğrulama
├── handler/        # SMPP komut işleyicileri
├── message/        # Mesaj işleme
├── server/         # Ana sunucu
├── cmd/cli/        # CLI tool
└── main.go         # Giriş noktası
```

### Yeni Özellik Ekleme

1. Protokol desteği için `protocol/` klasörüne ekleme yapın
2. Handler'ları `handler/` klasöründe tanımlayın
3. Mesaj işleme için `message/` klasörünü genişletin
4. Konfigürasyon için `config/` klasörünü güncelleyin

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. 