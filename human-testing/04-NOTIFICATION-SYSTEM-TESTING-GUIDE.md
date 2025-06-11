# 🔔 Notification System - Human Testing Guide

**Created:** 11 Haziran 2025  
**Phase:** 4 - Notification System  
**Tester:** Murat  
**Status:** 📋 **READY FOR TESTING**

---

## 🎯 **TEST OVERVIEW**

Bu döküman Notification System'in kapsamlı testini içerir. Her test senaryosu adım adım açıklanmış ve beklenen sonuçlar belirtilmiştir.

### 🔧 **Test Environment Setup**
1. iOS Simulator veya fiziksel cihaz kullanın
2. Expo Go veya development build ile uygulamayı çalıştırın  
3. Notification permissions'ların granted olduğundan emin olun
4. Test sırasında zaman değişikliklerini simüle etmek için cihaz zamanını ayarlayabilirsiniz

---

## ✅ **BASIC FUNCTIONALITY TESTS**

### Test 1: Reminder Creation (Hatırlatıcı Oluşturma)
**Test ID:** NT-001  
**Priority:** High  
**Duration:** 5 dakika

**Steps:**
1. ✅ Ana sayfada bir not oluşturun ("Test Notu 1")
2. ✅ Edit mode'da not açın
3. ✅ Header'daki 🔔 butonuna dokunun
4. ✅ Reminder Form modal'ının açıldığını doğrulayın
5. ✅ Title field'ına "İlk Hatırlatıcım" yazın
6. ✅ Date picker'dan bugünden 1 saat sonrasını seçin
7. ✅ Time picker'dan doğru saati ayarlayın
8. ✅ "Kaydet" butonuna dokunun

**Expected Results:**
- [ ] Modal başarıyla açılır
- [ ] Form alanları düzgün çalışır
- [ ] Date/Time picker doğru değerleri alır
- [ ] Kaydet işlemi başarılı olur
- [ ] Modal kapanır ve reminder oluşturulur

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 2: Reminder List Display (Hatırlatıcı Listesi Görüntüleme)
**Test ID:** NT-002  
**Priority:** High  
**Duration:** 3 dakika

**Steps:**
1. ✅ Test 1'deki notu edit mode'da açın
2. ✅ Reminder section'ının görünür olduğunu doğrulayın
3. ✅ Oluşturduğunuz reminder'ın listede göründüğünü kontrol edin
4. ✅ Reminder card'ında doğru bilgilerin (title, date, time) göründüğünü doğrulayın
5. ✅ Status indicator'ın "upcoming" olarak göründüğünü kontrol edin

**Expected Results:**
- [ ] Reminder section görünür
- [ ] Reminder card doğru bilgileri gösterir
- [ ] Tarih ve saat formatları doğru
- [ ] Status indicator yeşil/mavi "upcoming" renkte

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 3: Multiple Reminders (Çoklu Hatırlatıcılar)
**Test ID:** NT-003  
**Priority:** High  
**Duration:** 7 dakika

**Steps:**
1. ✅ Aynı nota 3 farklı reminder ekleyin:
   - "Sabah Hatırlatma" - Yarın 09:00
   - "Öğle Hatırlatma" - Yarın 13:00  
   - "Akşam Hatırlatma" - Yarın 18:00
2. ✅ Her reminder'ın ayrı ayrı oluşturulduğunu doğrulayın
3. ✅ Reminder list'inde 4 item (önceki test + 3 yeni) göründüğünü kontrol edin
4. ✅ Tarihe göre sıralandığını doğrulayın

**Expected Results:**
- [ ] 4 reminder başarıyla oluşturulur
- [ ] Liste kronolojik sırada gösterir
- [ ] Her reminder unique ID'ye sahip
- [ ] Scroll edilebilir liste düzgün çalışır

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## ⚡ **ADVANCED FUNCTIONALITY TESTS**

### Test 4: Smart Date Suggestions (Akıllı Tarih Önerileri)
**Test ID:** NT-004  
**Priority:** Medium  
**Duration:** 5 dakika

**Steps:**
1. ✅ Yeni bir reminder oluşturmaya başlayın
2. ✅ Smart date suggestions section'ının göründüğünü doğrulayın
3. ✅ "Yarın 09:00", "1 Hafta Sonra", "1 Ay Sonra" gibi önerilerin listelendiğini kontrol edin
4. ✅ Bir öneriye dokunun
5. ✅ Date/time picker'ın otomatik güncellendiğini doğrulayın

**Expected Results:**
- [ ] Smart suggestions doğru hesaplanır
- [ ] Öneriler mantıklı ve kullanışlı
- [ ] Tıklama ile otomatik seçim çalışır
- [ ] UI smooth ve responsive

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 5: Recurring Reminders (Tekrarlanan Hatırlatıcılar)
**Test ID:** NT-005  
**Priority:** Medium  
**Duration:** 6 dakika

**Steps:**
1. ✅ Yeni reminder oluştururken frequency seçin:
   - "Daily" (Günlük)
   - "Weekly" (Haftalık)  
   - "Monthly" (Aylık)
2. ✅ Her frequency için ayrı reminder oluşturun
3. ✅ Recurring indicator'ların görüntülendiğini doğrulayın
4. ✅ Next trigger date'in doğru hesaplandığını kontrol edin

**Expected Results:**
- [ ] Frequency seçimi düzgün çalışır
- [ ] Recurring iconları/badges görünür
- [ ] Next trigger dates doğru hesaplanır
- [ ] Once vs Recurring ayrımı net

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 6: Reminder Actions (Hatırlatıcı İşlemleri)
**Test ID:** NT-006  
**Priority:** High  
**Duration:** 8 dakika

**Steps:**
1. ✅ Reminder card'ında swipe left yapın
2. ✅ Delete action'ının görüntülendiğini doğrulayın
3. ✅ Complete action'ını test edin
4. ✅ Edit action'ını test edin (varsa)
5. ✅ Long press ile context menu'nun açıldığını kontrol edin

**Expected Results:**
- [ ] Swipe gestures düzgün çalışır
- [ ] Action buttons responsive
- [ ] Delete işlemi confirmation alert gösterir
- [ ] Complete işlemi status'u değiştirir

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## 🔄 **INTEGRATION TESTS**

### Test 7: Note Integration (Not Entegrasyonu)
**Test ID:** NT-007  
**Priority:** High  
**Duration:** 10 dakika

**Steps:**
1. ✅ Note Detail Screen'den reminder access'i test edin
2. ✅ HomeScreen'de reminder indicator'ları kontrol edin
3. ✅ Note silme işleminde reminder'ların da silindiğini doğrulayın
4. ✅ Note update işleminin reminder'ları etkilemediğini kontrol edin
5. ✅ SubNote'lar için reminder functionality'sini test edin

**Expected Results:**
- [ ] Reminder access tüm ekranlardan mümkün
- [ ] Note silme reminder'ları da siler
- [ ] Note update reminder'ları korur
- [ ] SubNote reminder'ları parent'tan bağımsız

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 8: Notification Permissions (Bildirim İzinleri)
**Test ID:** NT-008  
**Priority:** High  
**Duration:** 5 dakika

**Steps:**
1. ✅ Uygulamayı ilk açtığında permission request'i görüntülendiğini doğrulayın
2. ✅ "Deny" seçip uygulamanın nasıl davrandığını test edin
3. ✅ Settings'tan izni açıp tekrar test edin
4. ✅ App.tsx'deki notification handler'ın çalıştığını kontrol edin

**Expected Results:**
- [ ] Permission request uygun zamanda gösterilir
- [ ] Deny durumunda graceful handling
- [ ] Permission grant sonrası düzgün çalışma
- [ ] Background notifications test edilebilir

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## 📱 **USER EXPERIENCE TESTS**

### Test 9: UI/UX Responsiveness (Arayüz Duyarlılığı)
**Test ID:** NT-009  
**Priority:** Medium  
**Duration:** 8 dakika

**Steps:**
1. ✅ Reminder Form modal'ının animasyonlarını test edin
2. ✅ Loading states'lerin düzgün gösterildiğini doğrulayın
3. ✅ Error handling'i test edin (geçersiz tarih girişi vs.)
4. ✅ Form validation'ların çalıştığını kontrol edin
5. ✅ Keyboard handling'i test edin

**Expected Results:**
- [ ] Smooth animations ve transitions
- [ ] Clear loading indicators
- [ ] User-friendly error messages
- [ ] Proper form validation
- [ ] Good keyboard behavior

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

### Test 10: Accessibility (Erişilebilirlik)
**Test ID:** NT-010  
**Priority:** Low  
**Duration:** 6 dakika

**Steps:**
1. ✅ VoiceOver (iOS) ile reminder components'leri test edin
2. ✅ Touch target'ların yeterince büyük olduğunu doğrulayın
3. ✅ Color contrast'ın yeterli olduğunu kontrol edin
4. ✅ Alternative text'lerin mevcut olduğunu doğrulayın

**Expected Results:**
- [ ] VoiceOver support çalışır
- [ ] Touch targets 44px minimum
- [ ] Good color contrast ratios
- [ ] Meaningful accessibility labels

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## 🛠️ **PERFORMANCE TESTS**

### Test 11: Memory and Performance (Bellek ve Performans)
**Test ID:** NT-011  
**Priority:** Medium  
**Duration:** 10 dakika

**Steps:**
1. ✅ 50+ reminder oluşturun
2. ✅ App performance'ını gözlemleyin
3. ✅ Memory usage'ı iOS/Android dev tools ile kontrol edin
4. ✅ Large list scrolling performance'ını test edin
5. ✅ Background app behavior'ını test edin

**Expected Results:**
- [ ] Large lists smooth scroll
- [ ] Memory usage reasonable
- [ ] No memory leaks
- [ ] Good background performance

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## 🚨 **EDGE CASE TESTS**

### Test 12: Edge Cases (Sınır Durumları)
**Test ID:** NT-012  
**Priority:** Medium  
**Duration:** 12 dakika

**Steps:**
1. ✅ Geçmiş tarih seçmeye çalışın
2. ✅ Çok uzak gelecek tarih (10 yıl sonra) test edin
3. ✅ Network olmadan reminder oluşturmayı test edin
4. ✅ App kill edip restart ettikten sonra reminder'ları kontrol edin
5. ✅ Timezone change simulasyonu yapın
6. ✅ Aynı anda çok fazla reminder oluşturmayı test edin

**Expected Results:**
- [ ] Past date selection blocked or warned
- [ ] Far future dates handled gracefully
- [ ] Offline functionality works
- [ ] Data persistence after app restart
- [ ] Timezone handling correct
- [ ] Concurrent operations handled

**Actual Results:**
```
[Test sonuçlarını buraya yazın]
```

---

## 📊 **TEST SUMMARY TEMPLATE**

### Overall Test Results
**Test Date:** [Date]  
**Tester:** Murat  
**Device:** [iOS/Android Device]  
**App Version:** [Version]

| Test ID | Test Name | Status | Priority | Notes |
|---------|-----------|--------|----------|--------|
| NT-001 | Reminder Creation | ⏳ | High | |
| NT-002 | Reminder List Display | ⏳ | High | |
| NT-003 | Multiple Reminders | ⏳ | High | |
| NT-004 | Smart Date Suggestions | ⏳ | Medium | |
| NT-005 | Recurring Reminders | ⏳ | Medium | |
| NT-006 | Reminder Actions | ⏳ | High | |
| NT-007 | Note Integration | ⏳ | High | |
| NT-008 | Notification Permissions | ⏳ | High | |
| NT-009 | UI/UX Responsiveness | ⏳ | Medium | |
| NT-010 | Accessibility | ⏳ | Low | |
| NT-011 | Memory and Performance | ⏳ | Medium | |
| NT-012 | Edge Cases | ⏳ | Medium | |

### Critical Issues Found
```
[Kritik problemleri buraya yazın]
```

### Minor Issues Found  
```
[Küçük problemleri buraya yazın]
```

### Suggestions for Improvement
```
[İyileştirme önerilerinizi buraya yazın]
```

### Overall Rating
- **Functionality:** [ /10]
- **Usability:** [ /10]  
- **Performance:** [ /10]
- **Stability:** [ /10]

**Overall Score:** [ /40]

---

## 🎯 **FINAL CHECKLIST**

Tüm testler tamamlandıktan sonra:

- [ ] Ana functionality düzgün çalışıyor
- [ ] UI/UX kullanıcı dostu
- [ ] Performance kabul edilebilir seviyede
- [ ] Critical bug'lar yok
- [ ] Integration sorunsuz
- [ ] Accessibility requirements karşılanmış
- [ ] Edge case'ler handle edilmiş

**Test Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Completed

**Sign-off:** [Tester Signature and Date]
