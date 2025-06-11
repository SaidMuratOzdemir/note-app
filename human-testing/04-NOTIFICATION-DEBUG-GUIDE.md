# 🔧 Notification System - Technical Debug Guide

**Created:** 11 Haziran 2025  
**Purpose:** Teknik problemleri çözme rehberi  
**Target:** Developer + Tester

---

## 🚨 **COMMON ISSUES & SOLUTIONS**

### ❌ **Issue 1: ReminderForm Modal Açılmıyor**
**Symptom:** 🔔 butona basıyorum ama modal gelmiyor

**Debug Steps:**
```typescript
// EditNoteScreen.tsx içinde kontrol et:
console.log('showReminderForm:', showReminderForm);
console.log('originalNote:', originalNote);

// Header button onClick'i kontrol et:
const headerButton = () => (
  <TouchableOpacity onPress={() => {
    console.log('Reminder button pressed');
    setShowReminderForm(true);
  }}>
```

**Possible Causes:**
- `showReminderForm` state güncellenmemiş
- `originalNote` null olabilir
- ReminderForm component import edilmemiş

---

### ❌ **Issue 2: TypeScript Prop Errors**
**Symptom:** "Property 'noteId' does not exist on type 'ReminderFormProps'"

**Debug Steps:**
```typescript
// ReminderForm.tsx içinde prop interface'i kontrol et:
interface ReminderFormProps {
  visible: boolean;
  note: Note;          // ← noteId değil, note olmalı
  onClose: () => void;
  onSave: () => void;
}

// EditNoteScreen.tsx'de kullanım:
<ReminderForm
  visible={showReminderForm}
  note={originalNote!}    // ← noteId değil, note
  onClose={() => setShowReminderForm(false)}
  onSave={handleReminderSaved}
/>
```

**Solution:** Props'ları ReminderForm component tanımına uygun kullan

---

### ❌ **Issue 3: Colors Type Errors**  
**Symptom:** "Property 'black' does not exist on type..."

**Debug Steps:**
```typescript
// src/theme/colors.ts kontrol et:
export const Colors = {
  neutral: {
    white: '#FFFFFF',
    darkGray: '#333333',
    // black: '#000000' ← Bu yoksa ekle
  },
  accent: {
    darkBlue: '#355070',
    // lightBlue: '#...' ← Bu yoksa Colors.accent.darkBlue kullan
  }
}
```

**Solution:** Var olmayan color'ları mevcut olanlarla değiştir

---

### ❌ **Issue 4: Notification Permission Issues**
**Symptom:** Permission alert çıkmıyor veya notifications çalışmıyor

**Debug Steps:**
```typescript
// App.tsx içinde:
useEffect(() => {
  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', status);
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('New permission status:', newStatus);
    }
  };
  checkPermissions();
}, []);
```

**Possible Solutions:**
- iOS Simulator'da reset permissions
- Physical device kullan
- expo-notifications version check et

---

## 🔍 **DEBUGGING COMMANDS**

### Development Console Commands:
```bash
# Metro bundler log'larını izle
cd my-note-app && npm start

# Type check
npx tsc --noEmit

# Expo doctor ile genel health check
npx expo doctor

# Dependencies check
npm ls expo-notifications
npm ls @react-native-community/datetimepicker
```

### iOS Simulator Reset:
```bash
# Simulator permissions reset
xcrun simctl privacy booted reset all

# Expo cache clear
npx expo r -c
```

---

## 📱 **TESTING SHORTCUTS**

### Quick Component Test:
```typescript
// EditNoteScreen.tsx'e temporary test button ekle:
<TouchableOpacity 
  style={{backgroundColor: 'red', padding: 20}}
  onPress={() => {
    console.log('TEST: Opening reminder form');
    setShowReminderForm(true);
  }}
>
  <Text>TEST REMINDER</Text>
</TouchableOpacity>
```

### Service Test:
```typescript
// App.tsx'e service test ekle:
useEffect(() => {
  const testReminderService = async () => {
    try {
      const service = ReminderService.getInstance();
      await service.initialize();
      console.log('✅ ReminderService initialized successfully');
    } catch (error) {
      console.error('❌ ReminderService failed:', error);
    }
  };
  testReminderService();
}, []);
```

---

## 🐛 **ERROR CODES & MEANINGS**

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `RMD_001` | ReminderService initialization failed | Check AsyncStorage permissions |
| `RMD_002` | Notification scheduling failed | Check notification permissions |
| `RMD_003` | Invalid reminder data | Validate reminder creation data |
| `RMD_004` | Storage operation failed | Check device storage space |

---

## 📊 **PERFORMANCE MONITORING**

### Memory Usage Check:
```typescript
// Monitor memory in development
const checkMemory = () => {
  if (__DEV__) {
    console.log('Memory usage info available in device dev tools');
  }
};
```

### Component Re-render Tracking:
```typescript
// ReminderList.tsx'e ekle:
useEffect(() => {
  console.log('ReminderList re-rendered');
});
```

---

## 🔧 **QUICK FIXES**

### Fix 1: Modal Not Showing
```typescript
// Force modal visibility for debug:
<ReminderForm
  visible={true}  // Hard-code true temporarily
  note={originalNote || { id: 'test', title: 'Test', content: 'test' } as Note}
  onClose={() => console.log('Modal close')}
  onSave={() => console.log('Modal save')}
/>
```

### Fix 2: Missing Dependencies
```bash
cd my-note-app
npm install expo-notifications @react-native-community/datetimepicker
npx expo install --fix
```

### Fix 3: Type Errors Quick Bypass
```typescript
// Temporary type assertion (sadece debug için):
note={originalNote as any}
```

---

## 📝 **LOGGING TEMPLATE**

Test sırasında bu format'ı kullan:

```
[TIMESTAMP] [COMPONENT] [ACTION] [RESULT]
[11:30:25] [EditNoteScreen] [Reminder Button Press] [SUCCESS: Modal opened]
[11:30:26] [ReminderForm] [Form Submit] [ERROR: Validation failed]
[11:30:27] [ReminderService] [Create Reminder] [SUCCESS: ID rem_123]
```

**Test Log File:** Create `/Users/murat/mobil_apps/note-app-with-codex/human-testing/test-session-[date].log`

---

## ✅ **FINAL VERIFICATION**

Before completing test:

1. **Console Clean:** No red errors in Metro bundler
2. **TypeScript Clean:** `npx tsc --noEmit` passes  
3. **Build Success:** `npx expo export` completes
4. **Basic Flow:** Create → Display → Delete reminder works

**Test Completion Checklist:**
- [ ] No console errors
- [ ] No TypeScript errors  
- [ ] Basic functionality working
- [ ] Performance acceptable
- [ ] Ready for demo

---

**Debug Session Notes:**
```
[Test notlarını buraya yaz]
```
