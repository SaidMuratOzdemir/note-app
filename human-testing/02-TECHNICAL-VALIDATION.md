# 🔧 Sub-Notes System - Technical Validation Tests

**Purpose:** Automated and technical tests to validate implementation  
**Target:** Compilation, type safety, and basic functionality validation

---

## 🚀 **Compilation and Type Safety Tests**

### Test 1: TypeScript Compilation
```bash
cd my-note-app
npx tsc --noEmit
```

**Expected Result:** No TypeScript errors

**Common Issues to Check:**
- [ ] Note interface properly extended with parentId, reminders, scheduledDate
- [ ] SubNote and ParentNote types working correctly
- [ ] All imports resolve properly
- [ ] Function signatures match interfaces

---

### Test 2: Metro Bundler Compilation
```bash
cd my-note-app
npm start
```

**Expected Result:** 
- [ ] Metro bundler starts without errors
- [ ] QR code appears
- [ ] No red error screens in app
- [ ] All screens accessible

---

## 📱 **Component Integration Tests**

### Test 3: SubNoteBadge Component
**File:** `src/components/SubNoteBadge.tsx`

**Manual Check:**
```typescript
// Component should accept these props without TypeScript errors
interface SubNoteBadgeProps {
  count: number;
  onPress: () => void;
  style?: any;
}
```

**Test Cases:**
- [ ] `count={0}` → component returns null
- [ ] `count={5}` → displays "+5 alt not"
- [ ] `onPress` prop is called when tapped
- [ ] Style prop applies correctly

---

### Test 4: SubNoteCard Component
**File:** `src/components/SubNoteCard.tsx`

**Props Validation:**
```typescript
interface SubNoteCardProps {
  note: Note; // Must have parentId
  parentNote: Note; // Must NOT have parentId
  onPress: () => void;
  onLongPress?: () => void;
}
```

**Test Cases:**
- [ ] Displays sub-note content, not parent content
- [ ] Shows parent context correctly
- [ ] Left border indicator visible
- [ ] Long press functionality works
- [ ] Images display properly if present
- [ ] Tags display with proper styling

---

### Test 5: SubNoteModal Component
**File:** `src/components/SubNoteModal.tsx`

**Props Validation:**
```typescript
interface SubNoteModalProps {
  visible: boolean;
  parentNote: Note;
  editingSubNote?: Note;
  onSave: (subNoteData: Partial<Note>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}
```

**Test Cases:**
- [ ] Modal opens/closes based on visible prop
- [ ] Pre-fills data when editingSubNote provided
- [ ] Calls onSave with proper data structure
- [ ] Validation prevents empty content submission
- [ ] Delete button only shows when editing
- [ ] Tag management works correctly

---

## 🗄️ **Storage Service Tests**

### Test 6: Sub-Notes Storage Functions
**File:** `src/services/storage.ts`

**Functions to Test:**
```typescript
// These functions should exist and work correctly
getParentNotes(): Promise<Note[]>
getSubNotes(parentId: string): Promise<Note[]>
getSubNoteCount(parentId: string): Promise<number>
createSubNote(parentId: string, noteData: Partial<Note>): Promise<Note>
deleteSubNote(subNoteId: string): Promise<void>
convertToSubNote(noteId: string, parentId: string): Promise<void>
getNoteFamily(parentId: string): Promise<{parent: Note; subNotes: Note[]}>
```

**Test Data Creation:**
1. [ ] Create a parent note manually
2. [ ] Use createSubNote to add sub-note
3. [ ] Verify getSubNotes returns the sub-note
4. [ ] Verify getSubNoteCount returns correct count
5. [ ] Test deleteSubNote removes correctly

---

### Test 7: SubNoteUtils Functions
**File:** `src/utils/subNoteUtils.ts`

**Functions to Test:**
```typescript
SubNoteUtils.isSubNote(note: Note): boolean
SubNoteUtils.isParentNote(note: Note): boolean
SubNoteUtils.getSubNoteCountFromArray(parentId: string, notes: Note[]): number
SubNoteUtils.getSubNotesFromArray(parentId: string, notes: Note[]): Note[]
SubNoteUtils.getParentNotesFromArray(notes: Note[]): Note[]
SubNoteUtils.getNoteDepth(note: Note, allNotes: Note[]): number
SubNoteUtils.getAllDescendants(parentId: string, allNotes: Note[]): Note[]
SubNoteUtils.canMakeSubNote(noteId: string, parentId: string, allNotes: Note[]): boolean
```

**Test Cases:**
- [ ] isSubNote returns true for notes with parentId
- [ ] isParentNote returns true for notes without parentId
- [ ] Count functions return correct numbers
- [ ] Array filtering functions work correctly
- [ ] Depth calculation works for nested hierarchy
- [ ] Cycle prevention validation works

---

## 🖥️ **Screen Integration Tests**

### Test 8: HomeScreen Integration
**File:** `src/screens/HomeScreen.tsx`

**Required Functions:**
```typescript
const getSubNoteCount = (parentId: string): number
const handleSubNotesBadgePress = (parentNote: Note) => void
```

**Test Cases:**
- [ ] Only parent notes appear in main list
- [ ] Sub-note badges appear with correct counts
- [ ] Badge tap navigates to note detail
- [ ] Pull-to-refresh updates badge counts

---

### Test 9: NoteDetailScreen Integration
**File:** `src/screens/NoteDetailScreen.tsx`

**Required Functions:**
```typescript
const handleCreateSubNote = () => void
const handleEditSubNote = (subNote: Note) => void
const handleSaveSubNote = async (subNoteData: Partial<Note>) => void
const handleDeleteSubNote = async () => void
```

**Test Cases:**
- [ ] Sub-notes section appears for parent notes only
- [ ] "Alt Not Ekle" button works
- [ ] Sub-note list displays correctly
- [ ] Modal integration works for create/edit/delete

---

### Test 10: SearchScreen Integration
**File:** `src/screens/SearchScreen.tsx`

**Test Cases:**
- [ ] Search results include both parent and sub-notes
- [ ] Sub-notes display with SubNoteCard component
- [ ] Parent notes display with NoteCard component
- [ ] Parent context shown correctly for sub-notes
- [ ] Navigation works from search results

---

### Test 11: DateNotesScreen Integration
**File:** `src/screens/DateNotesScreen.tsx`

**Test Cases:**
- [ ] Date filtering includes sub-notes
- [ ] Visual distinction between parent and sub-notes
- [ ] Count includes both types of notes
- [ ] Navigation works correctly

---

## ⚡ **Performance Tests**

### Test 12: Large Dataset Performance
**Test Data:** Create 50 parent notes, each with 5 sub-notes (250 total notes)

**Metrics to Check:**
- [ ] App startup time < 3 seconds
- [ ] Home screen rendering < 1 second
- [ ] Search response time < 500ms
- [ ] Note detail loading < 500ms
- [ ] Sub-note modal opening < 200ms

### Test 13: Memory Usage
**Tools:** React Native Debugger or Metro performance monitor

**Metrics:**
- [ ] Memory usage stays under 100MB with large dataset
- [ ] No memory leaks during navigation
- [ ] Garbage collection works properly

---

## 🔒 **Data Integrity Tests**

### Test 14: Storage Consistency
**Test Cases:**
1. [ ] Create parent note → verify storage
2. [ ] Add sub-note → verify parentId set correctly
3. [ ] Delete parent → verify sub-notes handling
4. [ ] Edit sub-note → verify parent relationship unchanged
5. [ ] App restart → verify data persistence

### Test 15: Edge Case Data Handling
**Test Cases:**
- [ ] Sub-note with missing parent (orphaned)
- [ ] Parent note with corrupted sub-note references
- [ ] Very long note content (>10,000 characters)
- [ ] Special characters in titles and content
- [ ] Empty arrays and undefined values

---

## 📊 **Test Results Template**

### Compilation Tests: ✅/❌
- TypeScript compilation: ___
- Metro bundler: ___
- Import resolution: ___

### Component Tests: ✅/❌
- SubNoteBadge: ___
- SubNoteCard: ___
- SubNoteModal: ___

### Storage Tests: ✅/❌
- Storage functions: ___
- SubNoteUtils: ___
- Data persistence: ___

### Screen Integration: ✅/❌
- HomeScreen: ___
- NoteDetailScreen: ___
- SearchScreen: ___
- DateNotesScreen: ___

### Performance Tests: ✅/❌
- Large dataset: ___
- Memory usage: ___
- Response times: ___

### Data Integrity: ✅/❌
- Storage consistency: ___
- Edge cases: ___

---

## 🚨 **Known Issues to Monitor**

### Potential Problem Areas:
1. **Parent Note Deletion:** What happens to sub-notes?
2. **Circular References:** Prevention working correctly?
3. **Storage Migration:** Existing notes compatibility?
4. **Memory Leaks:** Modal and navigation cleanup?
5. **Performance:** Large datasets causing slowdown?

### Debug Commands:
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Bundle analysis
npx expo export --dev

# Performance profiling
# Use React Native Debugger or Flipper
```

---

**End of Technical Validation Guide**
