# Card Duel 1-7 - Expo Setup Guide

Bu proje React Native Expo kullanarak mobil cihazlarda çalışacak şekilde yapılandırılmıştır.

## Gereksinimler

- Node.js (16.0 veya üzeri)
- npm veya yarn
- Expo CLI
- Expo Go uygulaması (mobil cihazınızda test için)

## Kurulum

1. **Expo CLI'yi yükleyin (eğer yüklü değilse):**
```bash
npm install -g @expo/cli
```

2. **Proje bağımlılıklarını yükleyin:**
```bash
cd CardDuel17
npm install
```

3. **Uygulamayı başlatın:**
```bash
npm start
```

## Çalıştırma

### Geliştirme Modunda
```bash
npm start
# veya
expo start
```

### Android'de Test
```bash
npm run android
# veya
expo start --android
```

### iOS'ta Test (macOS gerekli)
```bash
npm run ios
# veya
expo start --ios
```

### Web'de Test
```bash
npm run web
# veya
expo start --web
```

## Önemli Değişiklikler

Bu proje React Native CLI'den Expo'ya dönüştürülmüştür:

- ✅ Expo SDK 49.0.0 kullanıyor
- ✅ Expo StatusBar kullanıyor
- ✅ Expo vektör ikonları kullanıyor
- ✅ Expo audio (expo-av) kullanıyor
- ✅ Proper Expo app.json konfigürasyonu
- ✅ Babel ve Metro yapılandırması Expo uyumlu

## Sorun Giderme

1. **Metro bundler cache problemi:**
```bash
expo start --clear
```

2. **Node modules problemi:**
```bash
rm -rf node_modules
npm install
```

3. **Expo Go'da bağlantı sorunu:**
   - Aynı WiFi ağında olduğunuzdan emin olun
   - Firewall ayarlarını kontrol edin

## Build (APK/IPA)

### Android APK
```bash
expo build:android
```

### iOS IPA (Apple Developer hesabı gerekli)
```bash
expo build:ios
```

## Backend Bağlantısı

Backend servisi ayrı olarak çalıştırılmalıdır:
```bash
npm run backend
```

Backend .NET Core ile yazılmıştır ve `backend/` klasöründe bulunur.

## Özellikler

- 🎴 Kart oyunu mekaniği
- 🤖 AI rakip (farklı zorluk seviyeleri)
- 🌐 Online multiplayer
- 👥 Arkadaşlarla oyun
- 📱 Mobil uyumlu UI
- 🎵 Ses efektleri
- 💾 Oyun durumu kaydetme