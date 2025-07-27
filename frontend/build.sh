#!/bin/bash

# Frontend Build Script
# Bu script frontend'i build eder ve backend static klasörüne kopyalar

echo "🚀 Frontend build işlemi başlatılıyor..."

# TypeScript kontrolü
echo "📝 TypeScript kontrolü yapılıyor..."
npm run lint

# Build işlemi
echo "🔨 Frontend build ediliyor..."
npm run build

# Build başarılı mı kontrol et
if [ $? -eq 0 ]; then
    echo "✅ Frontend başarıyla build edildi!"
    echo "📁 Build dosyaları backend/static klasörüne kopyalandı"
    echo ""
    echo "📊 Build özeti:"
    echo "   - Çıktı klasörü: ../backend/static"
    echo "   - HTML dosyası: index.html"
    echo "   - Assets klasörü: assets/"
    echo "   - Icon dosyası: vite.svg"
    echo ""
    echo "🎯 Backend'i başlatmak için:"
    echo "   cd ../backend"
    echo "   go run cmd/server/main.go"
    echo ""
    echo "🌐 Uygulamaya erişmek için:"
    echo "   http://localhost:7001"
else
    echo "❌ Build işlemi başarısız oldu!"
    exit 1
fi 