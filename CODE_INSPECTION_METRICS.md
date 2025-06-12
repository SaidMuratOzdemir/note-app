# 📊 KOD İNCELEME METRİK SİSTEMİ

## 🎯 İNCELEME KATEGORİLERİ VE PUANLAMA

### **1. KRİTİK HATALAR VE ERRORS (Ağırlık: 40%)**
- **Derleme Hataları** (Kritik: -20 puan her biri)
- **Çalışma Zamanı Hataları** (Kritik: -15 puan her biri)  
- **Tip Güvenliği Sorunları** (Yüksek: -10 puan her biri)
- **Import/Export Hataları** (Yüksek: -8 puan her biri)
- **Mantık Hataları** (Orta: -5 puan her biri)

### **2. PERFORMANS SORUNLARI (Ağırlık: 25%)**
- **Bellek Sızıntıları** (Kritik: -15 puan her biri)
- **Gereksiz Re-render'lar** (Yüksek: -8 puan her biri)
- **Render'da Ağır Hesaplamalar** (Yüksek: -6 puan her biri)
- **Verimsiz Algoritmalar** (Orta: -4 puan her biri)
- **Büyük Bundle Etkisi** (Orta: -3 puan her biri)

### **3. GÜVENLİK AÇIKLARI (Ağırlık: 20%)**
- **Veri Maruziyeti** (Kritik: -20 puan her biri)
- **Production'da Console Log** (Yüksek: -10 puan her biri)
- **Güvenli Olmayan Harici Çağrılar** (Yüksek: -8 puan her biri)
- **Input Validasyon Eksikliği** (Orta: -5 puan her biri)

### **4. KOD KALİTESİ VE SÜRDÜRÜLEBİLİRLİK (Ağırlık: 15%)**
- **Kod Duplikasyonu** (Yüksek: -6 puan her blok)
- **Karmaşık Fonksiyonlar** (Orta: -4 puan her biri)
- **Kötü İsimlendirme** (Düşük: -2 puan her biri)
- **Eksik Dokümantasyon** (Düşük: -1 puan her biri)
- **Tutarsız Desenler** (Düşük: -2 puan her biri)

### **5. UI/UX KALİTE KRİTERLERİ (Ağırlık: 10%)**
- **Responsive Design Eksikliği** (Yüksek: -8 puan her sorun)
- **Accessibility Ihlalleri** (Yüksek: -6 puan her ihlal)
- **Görsel Tutarsızlık** (Orta: -4 puan her durum)
- **Loading/Error State Eksikliği** (Orta: -3 puan her eksik)
- **Touch Target Boyut Sorunları** (Düşük: -2 puan her sorun)

### **6. FONKSİYONELLİK METRİKLERİ (Ağırlık: 8%)**
- **Feature Eksiklikleri** (Kritik: -15 puan her eksik)
- **Edge Case Kontrolsüzlüğü** (Yüksek: -8 puan her durum)
- **Input Validasyon Eksikliği** (Yüksek: -6 puan her eksik)
- **State Tutarsızlığı** (Orta: -5 puan her sorun)
- **Business Logic Hataları** (Yüksek: -10 puan her hata)

### **7. MİMARİ KALİTE KRİTERLERİ (Ağırlık: 7%)**
- **Separation of Concerns İhlali** (Yüksek: -8 puan her ihlal)
- **DRY Principle İhlali** (Orta: -5 puan her tekrar)
- **Kötü Component Composition** (Orta: -4 puan her durum)
- **Scalability Sorunları** (Yüksek: -7 puan her sorun)
- **Maintainability Eksikliği** (Orta: -3 puan her sorun)

### **8. ENTEGRASYON NOKTALARI (Ağırlık: 5%)**
- **Props Drilling** (Orta: -5 puan her derin geçiş)
- **Navigation Sorunları** (Yüksek: -8 puan her sorun)
- **Service Call Tutarsızlığı** (Yüksek: -6 puan her tutarsızlık)
- **Cross-Component Communication Sorunları** (Orta: -4 puan her sorun)
- **Side Effect Kontrolsüzlüğü** (Yüksek: -7 puan her durum)

## 🔍 DUPLICATE KOD TESPİT METRİKLERİ

### **Duplikasyon Önem Seviyeleri:**

#### **1. TAM DUPLİKATLAR** (Kritik: -10 puan)
```typescript
// ÖRNEK: Aynı fonksiyon farklı dosyalarda
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

#### **2. YAPISAL DUPLİKATLAR** (Yüksek: -6 puan)
```typescript
// ÖRNEK: Benzer mantık, farklı değişken isimleri
const processUserData = (user) => { /* similar logic */ };
const handleCustomerInfo = (customer) => { /* similar logic */ };
```

#### **3. SEMANTİK DUPLİKATLAR** (Orta: -4 puan)
```typescript
// ÖRNEK: Aynı işi farklı şekilde yapan fonksiyonlar
const getUserAge1 = (birthDate) => new Date().getFullYear() - birthDate.getFullYear();
const calculateAge = (birth) => Math.floor((Date.now() - birth) / 31557600000);
```

### **Duplikasyon Tespit Kriterleri:**
- **Fonksiyon Benzerliği**: >80% kod benzerliği olan fonksiyonlar
- **Komponent Benzerliği**: Benzer yapı/props'lu React komponentleri
- **Mantık Desenleri**: Tekrarlayan conditional mantık veya algoritmalar
- **Import Desenleri**: Dosyalar arası aynı import kombinasyonları
- **Style Desenleri**: Tekrarlayan StyleSheet tanımları

## 📋 İNCELEME KONTROL LİSTESİ

### **Faz 1: Otomatik Taramalar**
- [ ] TypeScript derleme kontrolü
- [ ] ESLint kural ihlalleri
- [ ] Console statement tespiti
- [ ] Import/export validasyonu
- [ ] Performans anti-pattern'leri

### **Faz 2: Duplicate Kod Analizi**
- [ ] Tam kod bloğu eşleştirme (5+ satır)
- [ ] Fonksiyon imza benzerlik analizi
- [ ] Komponent yapı karşılaştırması
- [ ] Utility fonksiyon duplikasyon kontrolü
- [ ] Style tanım örtüşme tespiti

### **Faz 3: Manuel Kod İncelemesi**
- [ ] İş mantığı doğruluğu
- [ ] React best practices uyumluluğu
- [ ] Bellek sızıntısı potansiyel değerlendirmesi
- [ ] Güvenlik açığı analizi
- [ ] Performans optimizasyon fırsatları

## 🏆 PUANLAMA SİSTEMİ

### **Kalite Puanı Hesaplama:**
```
Temel Puan: 100 puan
Final Puan = Temel Puan + (Tüm kesintilerin toplamı)
```

### **Kalite Notları:**
- **A+ (95-100)**: Production hazır, mükemmel kalite
- **A (85-94)**: İyi kalite, küçük iyileştirmeler gerekli
- **B (70-84)**: Kabul edilebilir, orta düzey sorunlar
- **C (50-69)**: Kötü kalite, önemli refaktoring gerekli
- **F (<50)**: Kritik sorunlar, büyük yeniden yazım gerekli

### **Öncelik Matrisi:**
1. **ACİL** (Kritik hatalar, güvenlik sorunları)
2. **YÜKSEK** (Performans, büyük duplikasyonlar)
3. **ORTA** (Kod kalitesi, küçük duplikasyonlar)
4. **DÜŞÜK** (Dokümantasyon, stil tutarlılığı)

## 🛠️ İNCELEME ARAÇLARI VE KOMUTLARI

### **Sistematik Yaklaşımlar:**

#### **1. Derleme Kontrolü**
```bash
npx tsc --noEmit
```

#### **2. Console Tespiti**
```bash
grep -r "console\." --include="*.ts" --include="*.tsx" src/
```

#### **3. Duplicate Tespit Komutları**
```bash
# Aynı fonksiyon isimleri
grep -r "function\|const.*=" --include="*.ts" --include="*.tsx" src/ | sort | uniq -d

# Benzer import yapıları
grep -r "^import" --include="*.ts" --include="*.tsx" src/ | sort | uniq -c | sort -nr
```

#### **4. Import Analizi**
```bash
# Kullanılmayan importlar
npx ts-unused-exports tsconfig.json --excludePathsFromReport=".*\.d\.ts"
```

#### **5. Performans Tarama**
```bash
# React anti-pattern'leri
grep -r "useEffect.*\[\]" --include="*.tsx" src/
grep -r "useState.*function" --include="*.tsx" src/
```

#### **6. Güvenlik Tarama**
```bash
# Hassas veri maruziyeti
grep -r "password\|token\|secret" --include="*.ts" --include="*.tsx" src/
```

## 📊 RAPORLAMA FORMATI

### **İnceleme Raporu Yapısı:**
```markdown
## DOSYA İNCELEME RAPORU
**Dosya**: [filepath]
**Kalite Puanı**: [puan]/100 ([not])
**Kritik Sorunlar**: [sayı]
**Bulunan Duplikasyonlar**: [sayı]

### KRİTİK SORUNLAR:
- [Sorun türü]: [Açıklama] (Etki: [puan kesintisi])

### DUPLİKASYONLAR:
- [Tür]: [Açıklama] (Satırlar: X-Y, Benzerlik: Z%)

### ÖNERİLER:
1. [Öncelik]: [Gerekli aksiyon]

### METRİKLER:
- Kod Satır Sayısı: [sayı]
- Karmaşıklık Puanı: [değer]
- Test Kapsamı: [yüzde]
```

## 🔧 DUPLICATE KOD TESPİT ALGORİTMASI

### **Adım 1: Exact Match Detection**
```typescript
// 5+ satır tam eşleşme
const detectExactDuplicates = (files: string[]) => {
  // Implementation logic
};
```

### **Adım 2: Structural Similarity**
```typescript
// AST bazlı yapısal karşılaştırma
const detectStructuralSimilarity = (ast1: AST, ast2: AST) => {
  // Implementation logic
};
```

### **Adım 3: Semantic Analysis**
```typescript
// Fonksiyonel eşdeğerlik kontrolü
const detectSemanticDuplicates = (functions: Function[]) => {
  // Implementation logic
};
```

## 📈 KALITE TRENDİ TAKİBİ

### **Metrikler:**
- **Duplicate Oranı**: Toplam kodun ne kadarı duplike
- **Karmaşıklık Skoru**: Ortalama fonksiyon karmaşıklığı
- **Güvenlik Skoru**: Güvenlik açığı yoğunluğu
- **Performans Skoru**: Performance anti-pattern yoğunluğu

### **Hedef Değerler:**
- Duplicate Oranı: <5%
- Karmaşıklık: <10 (cyclomatic complexity)
- Güvenlik Skoru: 0 açık
- Performans Skoru: 0 anti-pattern

---

Bu metrik sistem ile herhangi bir dosyayı kapsamlı şekilde inceleyebilirim! 🔍

Dosya analizi istediğinizde bu kriterleri sistematik olarak uygulayacağım.
