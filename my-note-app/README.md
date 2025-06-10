# Daily Note App - Günlük Tarzı Not Tutma Uygulaması

Modern ve sade tasarımlı React Native günlük uygulaması. Expo ile geliştirilmiştir.

## 🌟 Özellikler

### ✅ Temel Özellikler
- **Ana Sayfa (HomeScreen)**: Bugünün tarihi ve günlük notların listesi
- **Yeni Not Ekleme**: Başlık, içerik, etiket ve fotoğraf ekleme
- **Not Detayı**: Tam içerik görüntüleme, düzenleme ve silme
- **Not Düzenleme**: Mevcut notları güncelleme
- **Arama**: Tüm notlarda metin ve etiket arama

### 📱 Kullanıcı Deneyimi
- **Pastel Renkli Kartlar**: Her not farklı renkte görünür
- **Fotoğraf Desteği**: Notlara resim ekleme ve görüntüleme
- **Etiket Sistemi**: `#etiket` formatında etiketleme
- **Türkçe Tarih Formatı**: Bugün, dün formatında tarih gösterimi
- **Modern Arayüz**: Yuvarlatılmış köşeler, gölgeler ve animasyonlar

### 🔧 Teknik Özellikler
- **AsyncStorage**: Yerel veri saklama
- **TypeScript**: Tip güvenliği
- **React Navigation**: Sayfa geçişleri
- **Expo Image Picker**: Fotoğraf seçimi
- **UUID**: Benzersiz not kimlikleri

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── FAB.tsx         # Floating Action Button
│   ├── NoteCard.tsx    # Not kartı bileşeni
│   └── TagPill.tsx     # Etiket gösterimi
├── screens/            # Uygulama ekranları
│   ├── HomeScreen.tsx         # Ana sayfa
│   ├── NewNoteScreen.tsx      # Yeni not ekleme
│   ├── EditNoteScreen.tsx     # Not düzenleme
│   ├── NoteDetailScreen.tsx   # Not detayı
│   └── SearchScreen.tsx       # Arama ekranı
├── services/           # Veri servisleri
│   └── storage.ts      # AsyncStorage yardımcıları
├── types/              # TypeScript tipleri
│   └── Note.ts         # Not veri modeli
├── theme/              # Tasarım sistemi
│   ├── colors.ts       # Renk paleti
│   └── typography.ts   # Yazı stilleri
└── navigation/         # Navigasyon yapısı
    └── RootStack.tsx   # Ana navigasyon
```

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler
- Node.js 18+
- Expo CLI
- Android Studio (Android için) veya Xcode (iOS için)

### Kurulum
1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme sunucusunu başlatın:**
   ```bash
   npx expo start
   ```

3. **Uygulamayı test edin:**
   - **Telefon**: QR kodu Expo Go uygulaması ile tarayın
   - **Android Emulator**: `a` tuşuna basın
   - **iOS Simulator**: `i` tuşuna basın
   - **Web Browser**: `w` tuşuna basın

## 💾 Veri Modeli

```typescript
interface Note {
  id: string;              // UUID
  title?: string;          // İsteğe bağlı başlık
  content: string;         // Ana metin içeriği
  createdAt: string;       // ISO 8601 tarih formatı
  tags?: string[];         // Etiket listesi
  imageUri?: string;       // Fotoğraf URI'si
}
```

## 🎨 Tasarım Sistemi

- **Arka Plan**: Açık krem (#FAF9F6)
- **Metin**: Koyu gri (#333)
- **Kartlar**: Pastel renkler (#FFCDB2, #CDB4DB, vb.)
- **Köşe Yuvarlaklığı**: 12px
- **Gölgeler**: iOS ve Android uyumlu

## 📋 Kullanım Kılavuzu

### Not Ekleme
1. Ana sayfada sağ alttaki + butonuna dokunun
2. Başlık ekleyin (isteğe bağlı)
3. Not içeriğinizi yazın
4. Etiketler ekleyin (örn: #iş #önemli)
5. İsterseniz fotoğraf ekleyin
6. Sağ üstteki "Kaydet" butonuna dokunun

### Not Arama
1. Ana sayfada sağ üstteki 🔍 butonuna dokunun
2. Arama kutusuna kelime, cümle veya etiket yazın
3. Sonuçlar tarih grupları halinde görünür

### Not Düzenleme
1. Bir nota dokunarak detay sayfasını açın
2. Sağ üstteki ✏️ butonuna dokunun
3. Değişikliklerinizi yapın
4. "Kaydet" butonuna dokunun

## 🔮 Gelecek Özellikler

- **📅 Takvim Görünümü**: Geçmiş günlere erişim
- **🔔 Hatırlatıcılar**: Push notification desteği
- **🌙 Gece Modu**: Karanlık tema
- **📤 Dışa Aktarma**: PDF/Text export
- **☁️ Bulut Senkronizasyonu**: Çoklu cihaz desteği

## 🛠️ Geliştirme

```bash
# Bağımlılık ekleme
npm install <package-name>

# Temiz başlatma
npx expo start --clear

# Tip kontrolü
npx tsc --noEmit

# Build (production)
npx expo build:android
npx expo build:ios
```

## 📄 Lisans

Bu proje özel kullanım için geliştirilmiştir.
