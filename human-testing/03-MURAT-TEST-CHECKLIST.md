# 🧪 Murat'ın Sub-Notes Test Listesi

**Test Tarihi:** 11 Haziran 2025  
**Test Eden:** Murat  
**Sistem:** Sub-Notes Phase 2 Implementation

---

## 📱 **TEST ORTAMI HAZIRLIĞI**

### 1. Uygulamayı Başlat
```bash
cd my-note-app
npx expo start --clear
```

**Seçeneklerin:**
- [ ] iOS Simulator: Terminal'de `i` tuşuna bas
- [ ] Android Emulator: Terminal'de `a` tuşuna bas  
- [ ] Gerçek cihaz: QR kodu tara (Expo Go/Kamera)

### 2. Test Verisi Hazırla
**Başlamadan önce şunları oluştur:**
- [ ] 3-4 normal not (farklı tarihlerle)
- [ ] Bazılarına resim ekle
- [ ] Bazılarına etiket ekle
- [ ] 1-2 başlıksız not

---

## 🎯 **TEMEL ÖZELLIK TESTLERİ**

### ✅ Test 1: İlk Alt Not Oluşturma
**Adımlar:**
1. [ ] Varolan bir nota tıkla (Note Detail ekranına git)
2. [ ] En altta "Alt Notlar (0)" bölümünü bul
3. [ ] "Alt Not Ekle" butonuna bas
4. [ ] Modal açıldığını kontrol et
5. [ ] Formu doldur:
   - Başlık: "Test Alt Not 1"
   - İçerik: "Bu ilk test alt notum"
   - Etiket: "test"
6. [ ] "Kaydet" butonuna bas
7. [ ] Modal kapandığını kontrol et
8. [ ] Alt notun listede göründüğünü kontrol et

**Başarı Kriterleri:**
- [ ] Modal düzgün açılıp kapanıyor
- [ ] Alt not listede görünüyor
- [ ] Sol kenarında coral renkli çizgi var
- [ ] Ana not bilgisi görünüyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Burada gözlemlediğin şeyleri yaz]
```

---

### ✅ Test 2: Ana Ekranda Badge Kontrolü
**Adımlar:**
1. [ ] Ana ekrana dön (geri butonu ile)
2. [ ] Alt not eklediğin ana notun kartını bul
3. [ ] "+1 alt not" badge'inin göründüğünü kontrol et
4. [ ] Badge'e tıkla (nota değil, sadece badge'e!)
5. [ ] Note detail ekranına gidip alt notlar bölümünün göründüğünü kontrol et

**Başarı Kriterleri:**
- [ ] Badge görünüyor ve sayı doğru
- [ ] Badge mavi çerçeveli
- [ ] Badge tıklaması çalışıyor
- [ ] Doğru yere navigate ediyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Badge görünümü, pozisyonu, tıklama deneyimi hakkında notlar]
```

---

### ✅ Test 3: Çoklu Alt Not Yönetimi
**Adımlar:**
1. [ ] Aynı ana nota 2 alt not daha ekle:
   - "Alt Not 2" - sadece içerik (başlık yok)
   - "Alt Not 3" - hem başlık hem içerik hem etiket
2. [ ] Ana ekranda badge'in "+3 alt not" olduğunu kontrol et
3. [ ] Alt notlardan birini düzenle:
   - Uzun bas (long press)
   - Modal açıldığını kontrol et
   - Başlık/içerik değiştir
   - Kaydet
4. [ ] Alt notlardan birini sil:
   - Uzun bas
   - Alt tarafa "Alt Notu Sil" butonunu bul
   - Tıkla
   - Onay dialogunu kontrol et
   - Sil

**Başarı Kriterleri:**
- [ ] Çoklu alt not oluşturuluyor
- [ ] Badge sayısı güncelleniyor
- [ ] Düzenleme çalışıyor
- [ ] Silme onay dialogu var
- [ ] Silme işlemi çalışıyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Çoklu not yönetimi, performans, kullanıcı deneyimi hakkında]
```

---

### ✅ Test 4: Arama Fonksiyonu
**Adımlar:**
1. [ ] Arama ekranına git (🔍 simgesi)
2. [ ] Alt notlarda olan bir kelimeyi ara
3. [ ] Sonuçları kontrol et:
   - Alt notlar görünüyor mu?
   - Sol kenarında coral çizgi var mı?
   - "↑ Ana Not: [Ana Not Başlığı]" bilgisi var mı?
4. [ ] Bir alt nota tıkla
5. [ ] Doğru note detail ekranına gittiğini kontrol et

**Başarı Kriterleri:**
- [ ] Arama alt notları buluyor
- [ ] Görsel ayrım net (çizgi, parent bilgisi)
- [ ] Navigation çalışıyor
- [ ] Ana notlar da normal görünüyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Arama performansı, görsel ayrım, sonuç kalitesi hakkında]
```

---

### ✅ Test 5: Tarih Bazlı Görünüm
**Adımlar:**
1. [ ] Takvim ekranına git (📅 simgesi)
2. [ ] Alt notların olduğu bir tarihe tıkla
3. [ ] DateNotes ekranında kontrol et:
   - Hem ana notlar hem alt notlar görünüyor mu?
   - Alt notlar görsel olarak ayrı mı?
   - Toplam sayı doğru mu?
4. [ ] Bir alt nota tıkla ve navigation'ı test et

**Başarı Kriterleri:**
- [ ] Tarih filtrelemesi alt notları dahil ediyor
- [ ] Görsel hiyerarşi korunuyor
- [ ] Navigation çalışıyor
- [ ] Sayım doğru

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Tarih bazlı filtreleme, görünüm kalitesi hakkında]
```

---

## 🚨 **HATA DURUMU TESTLERİ**

### ✅ Test 6: Form Validasyonu
**Adımlar:**
1. [ ] Alt not modal açarken sadece başlık gir (içerik boş bırak)
2. [ ] Kaydet butonuna bas
3. [ ] Hata mesajı çıkıyor mu?
4. [ ] Çok uzun başlık dene (100+ karakter)
5. [ ] Özel karakterlerle etiket dene (#, @, vb.)

**Başarı Kriterleri:**
- [ ] Boş içerik engelleniyor
- [ ] Hata mesajları anlaşılır
- [ ] Uzun içerik düzgün işleniyor
- [ ] Özel karakterler sorun çıkarmıyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Validasyon kalitesi, hata mesajları hakkında]
```

---

### ✅ Test 7: Veri Kalıcılığı
**Adımlar:**
1. [ ] Birkaç alt not oluştur
2. [ ] Uygulamayı tamamen kapat (force quit)
3. [ ] Uygulamayı tekrar aç
4. [ ] Tüm alt notların yerinde olduğunu kontrol et
5. [ ] Badge sayılarının doğru olduğunu kontrol et

**Başarı Kriterleri:**
- [ ] Veriler kaybolmuyor
- [ ] Badge sayıları doğru
- [ ] Tüm özellikler çalışmaya devam ediyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Veri kalıcılığı, storage stabilitesi hakkında]
```

---

## 🎨 **KULLANICI DENEYİMİ TESTLERİ**

### ✅ Test 8: Görsel Tasarım
**Kontrol Edilecekler:**
- [ ] Alt notların sol kenarında coral renkli çizgi var
- [ ] Badge'ler düzgün pozisyonlanmış
- [ ] Parent bilgisi net görünüyor
- [ ] Tipografi hiyerarşisi düzgün
- [ ] Renkler tutarlı
- [ ] İkonlar doğru yerde

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Görsel tasarım, kullanılabilirlik hakkında]
```

---

### ✅ Test 9: Performans
**Adımlar:**
1. [ ] Bir ana nota 5+ alt not ekle
2. [ ] Scroll performansını test et
3. [ ] Modal açma/kapama hızını test et
4. [ ] Ana ekran yenilenme hızını test et
5. [ ] Arama hızını test et

**Başarı Kriterleri:**
- [ ] Scroll akıcı
- [ ] Modal animasyonları smooth
- [ ] Ana ekran hızlı yükleniyor
- [ ] Arama anında sonuç veriyor

**Sonuç:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ SORUNLU

**Notlar:**
```
[Performans, animasyon kalitesi hakkında]
```

---

## 📊 **GENEL TEST SONUÇ RAPORU**

### Başarılı Testler: ___/9
### Başarısız Testler: ___/9  
### Sorunlu Testler: ___/9

### 🏆 **Genel Değerlendirme:**
- **Mükemmel (9/9):** Sistem tamamen hazır ✅
- **İyi (7-8/9):** Küçük iyileştirmeler gerekli ⭐
- **Orta (5-6/9):** Orta düzey düzeltmeler gerekli ⚠️
- **Kötü (0-4/9):** Majör sorunlar var ❌

**Seçimin:** ___________

---

## 🐛 **BULUNAN HATALAR**

### Hata 1:
- **Ne:** ________________________________
- **Nerede:** ____________________________
- **Nasıl tekrarlanır:** __________________
- **Öncelik:** Yüksek/Orta/Düşük

### Hata 2:
- **Ne:** ________________________________
- **Nerede:** ____________________________
- **Nasıl tekrarlanır:** __________________
- **Öncelik:** Yüksek/Orta/Düşük

### Hata 3:
- **Ne:** ________________________________
- **Nerede:** ____________________________
- **Nasıl tekrarlanır:** __________________
- **Öncelik:** Yüksek/Orta/Düşük

---

## 💡 **ÖNERİLER VE GÖZLEMLER**

### İyi Yanlar:
```
[Beğendiğin özellikler, iyi çalışan kısımlar]
```

### İyileştirilebilir:
```
[Daha iyi olabilecek kısımlar, öneriler]
```

### Eksik Kalan:
```
[Beklediğin ama olmayan özellikler]
```

---

**🎯 Test tamamlandı! Sonuçları yukardaki bölümlere doldur.**
