# Frontend SMS Routing Features

Bu dokümantasyon, frontend'de SMS routing özelliklerini açıklar.

## Özellikler

### 🎯 **SMS Routing Sayfası**

Frontend'de `/sms-routing` sayfasında aşağıdaki özellikler bulunur:

#### **SMS Gönderme Formu**
- **Telefon Numarası**: Hedef telefon numarası
- **Mesaj**: SMS içeriği (karakter sayısı gösterilir)
- **Öncelik**: Low, Normal, High, Urgent
- **SIM Slot**: SIM 1 veya SIM 2 seçimi
- **Cihaz Grubu**: Opsiyonel filtreleme
- **Ülke Sitesi**: Opsiyonel filtreleme
- **Teslimat Raporu**: İsteğe bağlı teslimat raporu

#### **İstatistikler Paneli**
- **Toplam SMS**: Belirtilen tarih aralığındaki toplam SMS sayısı
- **Aktif Cihazlar**: Çevrimiçi Android cihaz sayısı
- **Durum Dağılımı**: SMS durumlarına göre dağılım
  - Delivered (Teslim Edildi)
  - Sent (Gönderildi)
  - Failed (Başarısız)
  - Pending (Beklemede)

#### **Aktif Cihazlar Listesi**
- Çevrimiçi Android cihazların listesi
- Cihaz adı ve IMEI bilgileri
- Çevrimiçi/çevrimdışı durumu

## Dosya Yapısı

```
frontend/src/
├── pages/sms-routing/
│   └── index.tsx              # Ana SMS routing sayfası
├── services/
│   └── sms-routing.ts         # SMS routing API servisleri
└── components/app-sidebar.tsx # Navigation menüsü
```

## API Endpoints

### **SMS Gönderme**
```typescript
POST /api/sms-routing/send
```

**Request Body:**
```json
{
  "destination_addr": "+1234567890",
  "message": "Test SMS message",
  "priority": "normal",
  "sim_slot": 1,
  "delivery_report": true,
  "device_group_id": 1,
  "country_site_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "MSG20250725080000",
  "device_count": 5,
  "devices": ["IMEI1", "IMEI2", "IMEI3"],
  "message": "SMS routed successfully"
}
```

### **İstatistikler**
```typescript
GET /api/sms-routing/stats?start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
{
  "total_sms": 150,
  "status_stats": [
    {"status": "delivered", "count": 120},
    {"status": "sent", "count": 20},
    {"status": "failed", "count": 10}
  ],
  "device_group_stats": [
    {"device_group": "Group A", "count": 80},
    {"device_group": "Group B", "count": 70}
  ],
  "active_device_count": 15,
  "date_range": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }
}
```

### **Aktif Cihazlar**
```typescript
GET /api/sms-routing/active-devices?device_group_id=1&country_site_id=1
```

**Response:**
```json
{
  "devices": [
    {
      "id": 1,
      "imei": "123456789012345",
      "name": "Device 1",
      "device_group": "Group A",
      "country_site": "Site A",
      "is_online": true,
      "is_active": true
    }
  ],
  "count": 1
}
```

## Kullanım

### **SMS Gönderme**
1. `/sms-routing` sayfasına gidin
2. Telefon numarası ve mesaj girin
3. İsteğe bağlı ayarları yapılandırın
4. "Send SMS" butonuna tıklayın

### **Filtreleme**
- **Cihaz Grubu**: Belirli bir cihaz grubuna SMS gönderme
- **Ülke Sitesi**: Belirli bir ülke sitesindeki cihazlara SMS gönderme
- **SIM Slot**: Hangi SIM kartını kullanacağınızı seçin

### **İzleme**
- **Gerçek Zamanlı İstatistikler**: Sayfa yüklendiğinde güncel istatistikler
- **Aktif Cihaz Listesi**: Çevrimiçi cihazların anlık durumu
- **SMS Durumu**: Gönderilen SMS'lerin durumu

## Hata Yönetimi

### **Yaygın Hatalar**
- **Telefon numarası eksik**: "Phone number and message are required"
- **Mesaj eksik**: "Phone number and message are required"
- **Aktif cihaz yok**: "No active Android devices found"
- **WebSocket bağlantı hatası**: "Failed to send via WebSocket"

### **Hata Gösterimi**
- Kırmızı alert kutusu ile hata mesajları
- Yeşil alert kutusu ile başarı mesajları
- Loading spinner ile işlem durumu

## Güvenlik

- **Authentication**: Tüm endpoint'ler kimlik doğrulama gerektirir
- **Authorization**: Kullanıcı yetkileri kontrol edilir
- **Input Validation**: Tüm girdiler doğrulanır

## Performans

- **Lazy Loading**: Sayfa yüklendiğinde veriler asenkron olarak yüklenir
- **Caching**: API yanıtları önbelleğe alınır
- **Debouncing**: Form girişlerinde debouncing uygulanır

## Geliştirme

### **Yeni Özellik Ekleme**
1. `services/sms-routing.ts` dosyasına yeni API endpoint'i ekleyin
2. `pages/sms-routing/index.tsx` dosyasına UI bileşenini ekleyin
3. Gerekirse yeni route'ları `App.tsx`'e ekleyin

### **Stil Değişiklikleri**
- Tailwind CSS kullanılır
- Shadcn/ui bileşenleri kullanılır
- Responsive tasarım desteklenir

## Test

### **Manuel Test**
1. Aktif Android cihazların bağlı olduğundan emin olun
2. SMS gönderme formunu doldurun
3. Gönderilen SMS'lerin cihazlara ulaştığını kontrol edin
4. SMS loglarında kayıtları kontrol edin

### **API Test**
```bash
# SMS gönderme testi
curl -X POST http://localhost:7001/api/sms-routing/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination_addr": "+1234567890",
    "message": "Test message",
    "priority": "normal"
  }'
``` 