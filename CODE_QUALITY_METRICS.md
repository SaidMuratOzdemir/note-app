# Kod Kalitesi Metrik Sistemi

## 🎯 Genel Değerlendirme Kriterleri

### 1. **Kod Yapısı ve Organizasyon** (25 puan)
- **Fonksiyon/Class Büyüklüğü**
  - ✅ Fonksiyonlar ≤ 20 satır (5 puan)
  - ⚠️ 21-50 satır (3 puan)
  - ❌ >50 satır (0 puan)

- **Modülerlik**
  - ✅ Tek sorumluluk prensibi (5 puan)
  - ✅ İyi ayrıştırılmış modüller (5 puan)
  - ✅ Düşük coupling, yüksek cohesion (5 puan)

- **Dosya Organizasyonu**
  - ✅ Mantıklı klasör yapısı (5 puan)

### 2. **Performans ve Optimizasyon** (20 puan)
- **React Native Optimizasyonları**
  - ✅ useMemo/useCallback kullanımı (5 puan)
  - ✅ FlatList virtualization (3 puan)
  - ✅ İmage optimizasyonu (2 puan)

- **Bellek Yönetimi**
  - ✅ Memory leak kontrolü (5 puan)
  - ✅ Cleanup işlemleri (3 puan)
  - ✅ Event listener temizliği (2 puan)

### 3. **Kod Güvenliği** (15 puan)
- **Type Safety**
  - ✅ TypeScript kullanımı (5 puan)
  - ✅ Strict mode (3 puan)
  - ✅ Type guards (2 puan)

- **Error Handling**
  - ✅ Try-catch blokları (3 puan)
  - ✅ Graceful degradation (2 puan)

### 4. **Okunabilirlik ve Maintainability** (20 puan)
- **Naming Conventions**
  - ✅ Açıklayıcı isimler (5 puan)
  - ✅ Consistent naming (3 puan)
  - ✅ camelCase/PascalCase (2 puan)

- **Comments ve Documentation**
  - ✅ İşlevsel commentlar (5 puan)
  - ✅ JSDoc kullanımı (3 puan)
  - ✅ README/docs (2 puan)

### 5. **Duplicate Kod Analizi** (20 puan)
- **Duplicate Detection Levels**
  - ✅ Hiç duplicate yok (20 puan)
  - ⚠️ %5'ten az duplicate (15 puan)
  - ⚠️ %5-10 duplicate (10 puan)
  - ❌ %10'dan fazla duplicate (0 puan)

---

## 🔍 Duplicate Kod Tarama Sistemi

### **Duplicate Türleri:**

#### 1. **Exact Duplicates** (Tam Kopya)
- Karakter karakter aynı kod blokları
- **Algılama:** String comparison
- **Minimum:** 5+ satır
- **Kritik Seviye:** ❌ Yüksek

#### 2. **Structural Duplicates** (Yapısal Benzerlik)
- Aynı yapı, farklı değişken isimleri
- **Algılama:** AST (Abstract Syntax Tree) comparison
- **Minimum:** 3+ fonksiyon/method
- **Kritik Seviye:** ⚠️ Orta

#### 3. **Semantic Duplicates** (Anlamsal Benzerlik)
- Aynı işlevi yapan farklı implementasyonlar
- **Algılama:** Fonksiyon signature + behavior analysis
- **Minimum:** 2+ benzer fonksiyon
- **Kritik Seviye:** ⚠️ Orta

### **Tarama Komutları:**

```bash
# 1. Exact Duplicates - 5+ satır
grep -n -A 5 -B 1 "." src/**/*.{ts,tsx} | \
awk '/--/{print "---"} !/--/{print}' | \
uniq -c | sort -nr | head -20

# 2. Function Duplicates
grep -r "function\|const.*=.*=>" src/ | \
cut -d: -f2- | sort | uniq -c | sort -nr

# 3. Import Duplicates
grep -r "import.*from" src/ | \
cut -d: -f2- | sort | uniq -c | sort -nr

# 4. Component Structure Duplicates
grep -r "interface.*Props\|type.*Props" src/ | \
cut -d: -f2- | sort | uniq -c | sort -nr
```

### **Duplicate Analiz Araçları:**

#### **Manuel Kontrol:**
```bash
# Büyük fonksiyonları bul
find src/ -name "*.tsx" -exec wc -l {} \; | sort -nr

# Benzer dosya isimlerini bul
find src/ -name "*.tsx" | sort | \
awk -F/ '{print $NF}' | sort | uniq -c | sort -nr
```

#### **Advanced Detection:**
```bash
# Structural similarity (sed ile normalization)
for file in src/**/*.{ts,tsx}; do
  sed 's/[a-zA-Z_][a-zA-Z0-9_]*/VAR/g' "$file" | \
  sed 's/[0-9]\+/NUM/g' | \
  sed 's/"[^"]*"/STR/g'
done | sort | uniq -c | sort -nr
```

---

## 📊 Puanlama Sistemi

### **Toplam Puan: 100**
- **90-100:** 🥇 A+ (Mükemmel)
- **80-89:** 🥈 A (Çok İyi)
- **70-79:** 🥉 B (İyi)
- **60-69:** ⚠️ C (Orta)
- **50-59:** ❌ D (Zayıf)
- **<50:** 💀 F (Başarısız)

### **Kritik Sorunlar (Otomatik -20 puan):**
- ❌ Compilation errors
- ❌ Runtime crashes
- ❌ Memory leaks
- ❌ Security vulnerabilities
- ❌ %15+ duplicate kod

---

## 🔧 Otomatik Kontrol Komutları

### **1. Syntax ve Type Errors:**
```bash
cd my-note-app
npm run tsc --noEmit
```

### **2. Linting Errors:**
```bash
npx eslint src/ --ext .ts,.tsx
```

### **3. Bundle Size Analysis:**
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output bundle.js
ls -lh bundle.js
```

### **4. Performance Issues:**
```bash
# Büyük componentleri bul
find src/components -name "*.tsx" -exec wc -l {} \; | sort -nr | head -10

# UseEffect temizlik kontrolü
grep -r "useEffect" src/ | grep -v "return.*cleanup\|return.*clear"
```

### **5. Console.log Kalıntıları:**
```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx"
```

---

## 📋 Manuel İnceleme Checklist

### **Her Dosya İçin:**
- [ ] **Fonksiyon büyüklükleri** ≤ 20 satır
- [ ] **Import/Export** düzeni temiz
- [ ] **TypeScript types** doğru tanımlanmış
- [ ] **Error handling** mevcut
- [ ] **Performance optimizasyonları** uygulanmış
- [ ] **Memory leaks** yok
- [ ] **Console.log** kalıntısı yok
- [ ] **Dead code** yok
- [ ] **Duplicate logic** yok

### **Component Özel Kontrollar:**
- [ ] **Props validation** var
- [ ] **UseEffect cleanup** var
- [ ] **Memoization** gerekli yerlerde uygulanmış
- [ ] **Key props** listlerde doğru
- [ ] **Accessibility** özellikleri var

### **Service/Utils Kontrollar:**
- [ ] **Single responsibility** principle
- [ ] **Pure functions** mümkün olduğunca
- [ ] **Error boundaries** tanımlanmış
- [ ] **Async/await** doğru kullanılmış
- [ ] **Resource cleanup** implementasyonu var

---

## 🎯 Prioritization Matrix

### **Yüksek Öncelik:**
1. Compilation errors
2. Runtime crashes  
3. Memory leaks
4. Security issues
5. Performance bottlenecks

### **Orta Öncelik:**
6. Code duplications
7. Large functions/files
8. Missing error handling
9. Type safety issues
10. Poor naming conventions

### **Düşük Öncelik:**
11. Missing comments
12. Minor style issues
13. Optimization opportunities
14. Documentation gaps

---

Bu metrik sistemi ile kodunuzu sistematik olarak değerlendirip, kalite hedeflerinize ulaşabilirsiniz. Hangi dosyaları incelememi istiyorsunuz?
