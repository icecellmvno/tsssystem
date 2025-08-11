# SMS Monitoring Service

## English

### Overview
The SMS Monitoring Service is an automated system that monitors SMS delivery patterns for devices and automatically switches them to maintenance mode when delivery failures are detected.

### Features
- **Automatic Monitoring**: Continuously monitors SMS delivery status for all active devices
- **Smart Detection**: Analyzes the last N SMS attempts to detect delivery patterns
- **Maintenance Mode**: Automatically switches devices to maintenance mode when delivery failures exceed threshold
- **Alarm Generation**: Creates alarm logs for maintenance mode events
- **Configurable Parameters**: Adjustable monitoring window, minimum SMS count, and failure threshold

### Configuration
```go
type SmsMonitoringService struct {
    MonitoringWindow     int // Number of recent SMS to check (default: 10)
    MinSmsForCheck       int // Minimum SMS count before checking (default: 5)
    MaintenanceThreshold int // Number of non-delivered SMS to trigger maintenance (default: 5)
}
```

### How It Works
1. **Data Collection**: Retrieves the last N SMS logs for each device
2. **Pattern Analysis**: Counts delivered vs. non-delivered SMS
3. **Decision Making**: If no SMS delivered in the monitoring window and failures exceed threshold, enters maintenance mode
4. **Action**: Disables device and creates alarm log

### Usage
```go
// Create service instance
service := NewSmsMonitoringService()

// Monitor specific device
err := service.CheckDeviceSmsDeliveryStatus("device_imei")

// Monitor all devices
err := service.MonitorAllDevices()

// Update configuration
service.SetConfiguration(15, 8, 6) // window=15, minCheck=8, threshold=6
```

### Maintenance Mode Triggers
- **Condition**: No SMS delivered in the last N attempts
- **Threshold**: Configurable failure count (default: 5)
- **Action**: Device enters maintenance mode and is disabled
- **Alarm**: Automatic alarm log creation

---

## বাংলা

### সংক্ষিপ্ত বিবরণ
এসএমএস মনিটরিং সার্ভিস হল একটি স্বয়ংক্রিয় সিস্টেম যা ডিভাইসগুলির জন্য এসএমএস ডেলিভারি প্যাটার্ন পর্যবেক্ষণ করে এবং ডেলিভারি ব্যর্থতা সনাক্ত হলে স্বয়ংক্রিয়ভাবে তাদের রক্ষণাবেক্ষণ মোডে স্যুইচ করে।

### বৈশিষ্ট্যসমূহ
- **স্বয়ংক্রিয় পর্যবেক্ষণ**: সমস্ত সক্রিয় ডিভাইসের জন্য এসএমএস ডেলিভারি স্ট্যাটাস ক্রমাগত পর্যবেক্ষণ করে
- **স্মার্ট সনাক্তকরণ**: ডেলিভারি প্যাটার্ন সনাক্ত করতে শেষ N এসএমএস প্রচেষ্টা বিশ্লেষণ করে
- **রক্ষণাবেক্ষণ মোড**: ব্যর্থতা থ্রেশহোল্ড ছাড়িয়ে গেলে স্বয়ংক্রিয়ভাবে ডিভাইসগুলিকে রক্ষণাবেক্ষণ মোডে স্যুইচ করে
- **অ্যালার্ম উৎপাদন**: রক্ষণাবেক্ষণ মোড ইভেন্টের জন্য অ্যালার্ম লগ তৈরি করে
- **কনফিগারযোগ্য প্যারামিটার**: সামঞ্জস্যযোগ্য মনিটরিং উইন্ডো, ন্যূনতম এসএমএস সংখ্যা এবং ব্যর্থতা থ্রেশহোল্ড

### কনফিগারেশন
```go
type SmsMonitoringService struct {
    MonitoringWindow     int // পর্যবেক্ষণ করার জন্য সাম্প্রতিক এসএমএস সংখ্যা (ডিফল্ট: ১০)
    MinSmsForCheck       int // পর্যবেক্ষণ শুরু করার আগে ন্যূনতম এসএমএস সংখ্যা (ডিফল্ট: ৫)
    MaintenanceThreshold int // রক্ষণাবেক্ষণ ট্রিগার করার জন্য অ-ডেলিভার্ড এসএমএস সংখ্যা (ডিফল্ট: ৫)
}
```

### কিভাবে কাজ করে
১. **ডেটা সংগ্রহ**: প্রতিটি ডিভাইসের জন্য শেষ N এসএমএস লগ পুনরুদ্ধার করে
২. **প্যাটার্ন বিশ্লেষণ**: ডেলিভার্ড বনাম অ-ডেলিভার্ড এসএমএস গণনা করে
৩. **সিদ্ধান্ত গ্রহণ**: যদি মনিটরিং উইন্ডোতে কোন এসএমএস ডেলিভার না হয় এবং ব্যর্থতা থ্রেশহোল্ড ছাড়িয়ে যায়, তাহলে রক্ষণাবেক্ষণ মোডে প্রবেশ করে
৪. **কর্ম**: ডিভাইস নিষ্ক্রিয় করে এবং অ্যালার্ম লগ তৈরি করে

### ব্যবহার
```go
// সার্ভিস ইনস্ট্যান্স তৈরি করুন
service := NewSmsMonitoringService()

// নির্দিষ্ট ডিভাইস পর্যবেক্ষণ করুন
err := service.CheckDeviceSmsDeliveryStatus("device_imei")

// সমস্ত ডিভাইস পর্যবেক্ষণ করুন
err := service.MonitorAllDevices()

// কনফিগারেশন আপডেট করুন
service.SetConfiguration(15, 8, 6) // উইন্ডো=১৫, ন্যূনতমচেক=৮, থ্রেশহোল্ড=৬
```

### রক্ষণাবেক্ষণ মোড ট্রিগার
- **শর্ত**: শেষ N প্রচেষ্টায় কোন এসএমএস ডেলিভার হয়নি
- **থ্রেশহোল্ড**: কনফিগারযোগ্য ব্যর্থতা সংখ্যা (ডিফল্ট: ৫)
- **কর্ম**: ডিভাইস রক্ষণাবেক্ষণ মোডে প্রবেশ করে এবং নিষ্ক্রিয় হয়
- **অ্যালার্ম**: স্বয়ংক্রিয় অ্যালার্ম লগ তৈরি

### গুরুত্বপূর্ণ নোট
- এই সার্ভিস শুধুমাত্র সক্রিয় এবং রক্ষণাবেক্ষণ মোডে নেই এমন ডিভাইসগুলিকে পর্যবেক্ষণ করে
- রক্ষণাবেক্ষণ মোডে প্রবেশ করার পর, ডিভাইস স্বয়ংক্রিয়ভাবে নিষ্ক্রিয় হয়ে যায়
- প্রতিটি রক্ষণাবেক্ষণ মোড ইভেন্টের জন্য একটি অ্যালার্ম লগ তৈরি হয়
- কনফিগারেশন প্যারামিটারগুলি রানটাইমে পরিবর্তন করা যেতে পারে 