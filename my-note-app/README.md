# Daily Note App - Günlük Tarzı Not Tutma Uygulaması

Modern tasarım sistemi ile geliştirilmiş React Native günlük uygulaması. Expo ile geliştirilmiştir.

## 🌟 Özellikler

### ✅ Temel Özellikler
- **Ana Sayfa (HomeScreen)**: Bugünün tarihi, günlük notların listesi ve yenileme desteği
- **Yeni Not Ekleme**: Başlık, içerik, etiket ve **çoklu fotoğraf** ekleme
- **Not Detayı**: Tam içerik görüntüleme, düzenleme ve silme
- **Not Düzenleme**: Mevcut notları güncelleme
- **Arama**: Tüm notlarda metin ve etiket arama (EmptyState ile)
- **📅 Takvim Görünümü**: Tarihlere göre not görüntüleme ve ekleme
- **📆 Tarih Bazlı Notlar**: Seçilen tarihe ait notları görme ve yeni not ekleme

### 🎨 Modern Tasarım Sistemi
- **Tutarlı Renkler**: 4 pastel renk rotasyonu ile not kartları
- **Modern Tipografi**: Okunabilir fontlar ve doğru hiyerarşi
- **Ionicons**: Profesyonel ikon seti
- **EmptyState Bileşeni**: Bilgilendirici boş durumlar
- **Pull-to-Refresh**: Ana sayfada yenileme desteği
- **Modern FAB**: Yapılandırılabilir floating action button

### 📱 Kullanıcı Deneyimi
- **Çoklu Fotoğraf Desteği**: Notlara birden fazla resim ekleme ve yatay kaydırma
- **Etiket Sistemi**: `#etiket` formatında etiketleme ve "+X daha" gösterimi
- **Türkçe Tarih Formatı**: Bugün, dün formatında tarih gösterimi
- **Cross-Platform**: iOS ve Android'de tutarlı görünüm
- **Responsive**: Farklı ekran boyutlarında uyumlu

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
│   ├── EmptyState.tsx  # Modern boş durum bileşeni
│   ├── FAB.tsx         # Floating Action Button (Ionicons ile)
│   ├── NoteCard.tsx    # Not kartı bileşeni (yeni tasarım sistemi)
│   └── TagPill.tsx     # Etiket gösterimi
├── screens/            # Uygulama ekranları
│   ├── HomeScreen.tsx         # Ana sayfa (pull-to-refresh ile)
│   ├── NewNoteScreen.tsx      # Yeni not ekleme
│   ├── EditNoteScreen.tsx     # Not düzenleme
│   ├── NoteDetailScreen.tsx   # Not detayı
│   ├── SearchScreen.tsx       # Arama ekranı (EmptyState ile)
│   ├── CalendarScreen.tsx     # Takvim görünümü
│   └── DateNotesScreen.tsx    # Tarih bazlı notlar
├── services/           # Veri servisleri
│   └── storage.ts      # AsyncStorage yardımcıları
├── types/              # TypeScript tipleri
│   └── Note.ts         # Not veri modeli
├── theme/              # Modern tasarım sistemi
│   ├── index.ts        # Tema export hub'ı
│   ├── colors.ts       # Renk paleti sistemi
│   ├── typography.ts   # Tipografi sistemi
│   └── layout.ts       # Layout sabitleri
└── navigation/         # Navigasyon yapısı
    └── RootStack.tsx   # Ana navigasyon
```

## 🎨 Tasarım Sistemi

### Renk Paleti
```typescript
export const Colors = {
  // Ana pastel renk paleti (4 renk rotasyonu)
  primaryPastels: ['#FFCDB2', '#CDB4DB', '#A8E6CF', '#FFE066'],
  
  // Vurgu renkleri
  accent: {
    coral: '#FFB4A2',      // Etiketler için
    mauveGray: '#6D6875',  // İkincil etiketler
    darkBlue: '#355070',   // Metin vurgusu
    fuchsia: '#9E0059',    // Özel vurgular
  },
  
  // Nötr renkler
  neutral: {
    white: '#FFFFFF',
    lightGray1: '#F2F2F2',
    lightGray2: '#E0E0E0', 
    mediumGray: '#CCCCCC',
    darkGray: '#333333',
  },
  
  // Fonksiyonel renkler
  fabBlue: '#007AFF',      // iOS mavi FAB
  textGray: '#666666',     // İkincil metin
};
```

### Tipografi
```typescript
export const Typography = {
  h1: { fontSize: 28, fontWeight: 'bold', lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 30 },
  body: { fontSize: 14, lineHeight: 20 },
  date: { fontSize: 18, fontWeight: '500' },
  timestamp: { fontSize: 12 },
  tag: { fontSize: 12, fontWeight: '500' },
};
```

### Layout Sabitleri
```typescript
export const Layout = {
  screenPadding: 16,      // Ekran kenar boşluğu
  cardRadius: 12,         // Kart köşe yuvarlaklığı
  imageSize: 80,          // Standart görsel boyutu
  fabSize: 56,            // FAB boyutu
  minTouchSize: 44,       // Minimum dokunma hedefi
};
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
  imageUris?: string[];    // Çoklu fotoğraf URI'leri
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
5. İsterseniz **birden fazla fotoğraf** ekleyin
6. Sağ üstteki "Kaydet" butonuna dokunun

### Takvim Kullanımı
1. Ana sayfada sağ üstteki 📅 butonuna dokunun
2. Takvimde istediğiniz tarihe dokunun
3. O tarihteki notları görün veya yeni not ekleyin
4. Not bulunan günler yeşil renkte gösterilir
5. Bugün mavi renkte vurgulanır

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

- **🔔 Hatırlatıcılar**: Push notification desteği
- **🌙 Gece Modu**: Karanlık tema
- **📤 Dışa Aktarma**: PDF/Text export
- **☁️ Bulut Senkronizasyonu**: Çoklu cihaz desteği
- **🎨 Tema Seçenekleri**: Farklı renk paletleri

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
