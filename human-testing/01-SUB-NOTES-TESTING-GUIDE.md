# 🧪 Sub-Notes System - Human Testing Guide

**Test Date:** 11 Haziran 2025  
**System Version:** Sub-Notes Phase 2 Implementation  
**Tester:** [Your Name]

---

## 📋 **Test Environment Setup**

### Prerequisites
- [ ] App successfully starts (`npm start`)
- [ ] No compilation errors in terminal
- [ ] QR code appears for Expo Go
- [ ] Can open app on device/simulator

### Test Data Requirements
- [ ] Create at least 3-4 regular notes first
- [ ] Use different dates (today, yesterday, etc.)
- [ ] Include notes with images and tags
- [ ] Have some notes without titles

---

## 🎯 **Core Sub-Notes Functionality Tests**

### Test 1: Basic Sub-Note Creation
**Expected Behavior:** Users can create sub-notes under parent notes

**Steps:**
1. [ ] Open any existing note (go to Detail screen)
2. [ ] Look for "Alt Notlar (0)" section at bottom
3. [ ] Tap "Alt Not Ekle" button
4. [ ] Verify modal opens with title "Alt Not Ekle"
5. [ ] See parent note context: "Ana Not: [Parent Title]"
6. [ ] Fill in:
   - Title: "Test Alt Not 1"
   - Content: "Bu bir test alt notudur"
   - Tags: "test alt"
7. [ ] Tap "Kaydet"
8. [ ] Verify modal closes
9. [ ] See sub-note appears in list with visual indicator (left border)
10. [ ] Verify parent note context shows properly

**Success Criteria:**
- ✅ Modal opens/closes smoothly
- ✅ Sub-note appears with visual hierarchy
- ✅ Parent context is displayed correctly
- ✅ Left border indicator is visible

---

### Test 2: Sub-Note Badge Display on Home Screen
**Expected Behavior:** Parent notes show "+X alt not" badge on home screen

**Steps:**
1. [ ] Go back to Home screen
2. [ ] Find the parent note you just added sub-note to
3. [ ] Verify "+1 alt not" badge appears below the note content
4. [ ] Badge should have blue border and icon
5. [ ] Tap the badge (not the note card itself)
6. [ ] Verify it navigates to the note detail screen

**Success Criteria:**
- ✅ Badge appears with correct count
- ✅ Badge has proper styling (blue border, icon)
- ✅ Badge tap navigates to detail screen
- ✅ Badge doesn't interfere with note card layout

---

### Test 3: Multiple Sub-Notes Management
**Expected Behavior:** Users can create, edit, and delete multiple sub-notes

**Steps:**
1. [ ] In the same parent note, create 2 more sub-notes:
   - "Alt Not 2" with content and tags
   - "Alt Not 3" with only content (no title)
2. [ ] Verify all 3 sub-notes appear in chronological order
3. [ ] Verify badge on home screen shows "+3 alt not"
4. [ ] Long-press on any sub-note card
5. [ ] Verify edit modal opens with existing data
6. [ ] Modify title and content
7. [ ] Tap "Kaydet"
8. [ ] Verify changes are saved and displayed

**Success Criteria:**
- ✅ Multiple sub-notes display correctly
- ✅ Badge count updates automatically
- ✅ Long-press editing works
- ✅ Edit modal pre-fills with existing data
- ✅ Changes persist after saving

---

### Test 4: Sub-Note Deletion
**Expected Behavior:** Users can delete sub-notes with confirmation

**Steps:**
1. [ ] Long-press on a sub-note to edit
2. [ ] Scroll down to see "Alt Notu Sil" button (red trash icon)
3. [ ] Tap delete button
4. [ ] Verify confirmation alert appears
5. [ ] Tap "İptal" - modal should stay open
6. [ ] Tap delete again, then "Sil"
7. [ ] Verify modal closes and sub-note is removed
8. [ ] Check home screen badge count decreased

**Success Criteria:**
- ✅ Delete button appears only in edit mode
- ✅ Confirmation dialog prevents accidental deletion
- ✅ Deletion works properly
- ✅ Badge count updates after deletion

---

### Test 5: Sub-Note Navigation and Detail View
**Expected Behavior:** Sub-notes have their own detail screens

**Steps:**
1. [ ] Tap (not long-press) on a sub-note card
2. [ ] Verify it opens the note detail screen
3. [ ] Verify it shows sub-note content, not parent content
4. [ ] Check that edit/delete buttons work for sub-note
5. [ ] Verify no "Alt Notlar" section appears (sub-notes can't have sub-notes yet)
6. [ ] Navigate back and verify parent note detail still shows sub-notes

**Success Criteria:**
- ✅ Sub-note detail screen opens correctly
- ✅ Content displayed is for sub-note, not parent
- ✅ Edit functionality works for sub-note
- ✅ No sub-notes section in sub-note detail

---

## 🔍 **Search and Filter Tests**

### Test 6: Search Screen Sub-Note Display
**Expected Behavior:** Search shows both parent and sub-notes with visual distinction

**Steps:**
1. [ ] Go to Search screen (🔍 icon in header)
2. [ ] Search for content that exists in both parent and sub-notes
3. [ ] Verify sub-notes appear with:
   - Left border indicator
   - Parent context ("↑ Parent Note Title")
   - Smaller card style
4. [ ] Verify parent notes appear with:
   - Normal card style
   - Sub-note badge if they have sub-notes
5. [ ] Tap on sub-note from search results
6. [ ] Verify it opens correct sub-note detail

**Success Criteria:**
- ✅ Search finds sub-note content
- ✅ Visual distinction between parent and sub-notes
- ✅ Parent context displayed for sub-notes
- ✅ Navigation works from search results

---

### Test 7: Calendar and Date-Based Views
**Expected Behavior:** Sub-notes appear in date-based views with proper indicators

**Steps:**
1. [ ] Go to Calendar screen (📅 icon)
2. [ ] Navigate to a date that has notes with sub-notes
3. [ ] Tap on that date
4. [ ] In DateNotes screen, verify:
   - Parent notes show with sub-note badges
   - Sub-notes show with visual indicators
   - Both are included in the total count
5. [ ] Test navigation from this screen

**Success Criteria:**
- ✅ Date-based filtering includes sub-notes
- ✅ Visual indicators work in date view
- ✅ Count includes both parent and sub-notes
- ✅ Navigation works correctly

---

## 🎨 **UI/UX Experience Tests**

### Test 8: Visual Hierarchy and Design
**Expected Behavior:** Clear visual distinction between parent and sub-notes

**Steps:**
1. [ ] Review all screens where notes appear:
   - Home screen (only parents with badges)
   - Note detail (sub-notes with left border)
   - Search results (mixed with indicators)
   - Date notes (mixed with indicators)
2. [ ] Verify visual consistency:
   - Sub-note cards have coral left border
   - Parent context always visible for sub-notes
   - Badge styling is consistent
   - Typography hierarchy is clear

**Success Criteria:**
- ✅ Visual hierarchy is clear and consistent
- ✅ Color coding helps distinguish note types
- ✅ Typography supports readability
- ✅ No visual bugs or layout issues

---

### Test 9: Performance and Responsiveness
**Expected Behavior:** System performs well with multiple sub-notes

**Steps:**
1. [ ] Create a parent note with 5+ sub-notes
2. [ ] Test scrolling performance in detail view
3. [ ] Test app responsiveness when:
   - Opening/closing sub-note modal
   - Navigating between screens
   - Refreshing home screen with pull-to-refresh
4. [ ] Test with notes containing images and tags

**Success Criteria:**
- ✅ Smooth scrolling with many sub-notes
- ✅ Modal animations are smooth
- ✅ No lag in navigation
- ✅ Pull-to-refresh works properly

---

## 🚨 **Edge Cases and Error Handling**

### Test 10: Form Validation
**Expected Behavior:** Proper validation for sub-note creation

**Steps:**
1. [ ] Try to create sub-note with empty content
2. [ ] Verify error message appears: "Alt not içeriği boş olamaz"
3. [ ] Try with only title, no content - should fail
4. [ ] Try with only content, no title - should succeed
5. [ ] Test with very long title (100+ characters)
6. [ ] Test with special characters in tags

**Success Criteria:**
- ✅ Empty content validation works
- ✅ Title is optional, content is required
- ✅ Error messages are user-friendly
- ✅ Special characters handled properly

---

### Test 11: Data Persistence
**Expected Behavior:** Sub-notes persist across app restarts

**Steps:**
1. [ ] Create several sub-notes
2. [ ] Close the app completely (force quit)
3. [ ] Restart the app
4. [ ] Verify all sub-notes are still there
5. [ ] Verify badge counts are correct
6. [ ] Test editing and deletion still work

**Success Criteria:**
- ✅ All data persists across restarts
- ✅ No data corruption or loss
- ✅ Functionality remains intact after restart

---

### Test 12: Memory and Storage
**Expected Behavior:** App handles storage efficiently

**Steps:**
1. [ ] Create 10+ parent notes
2. [ ] Add 3-5 sub-notes to each parent
3. [ ] Include images and tags in both parents and sub-notes
4. [ ] Monitor app responsiveness
5. [ ] Test search performance with large dataset

**Success Criteria:**
- ✅ App remains responsive with large dataset
- ✅ Search is still fast
- ✅ No memory warnings or crashes

---

## 📝 **Test Results Template**

### Overall System Rating: ⭐⭐⭐⭐⭐ (1-5 stars)

### Bugs Found:
1. **Bug Title:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [Steps]
   - **Expected vs Actual:** [Difference]

2. **Bug Title:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [Steps]
   - **Expected vs Actual:** [Difference]

### UI/UX Feedback:
- **What works well:** [List positive aspects]
- **Areas for improvement:** [List suggestions]
- **Confusing elements:** [List unclear features]

### Performance Notes:
- **Loading speed:** Fast/Medium/Slow
- **Animation smoothness:** Smooth/Choppy
- **Memory usage:** Normal/High
- **Battery impact:** Normal/High

### Suggestions for Enhancement:
1. [Suggestion 1]
2. [Suggestion 2]
3. [Suggestion 3]

---

## 🎯 **Priority Test Scenarios**

### Must Test (Critical):
- [x] Basic sub-note creation and display
- [x] Badge functionality on home screen
- [x] Sub-note editing and deletion
- [x] Visual hierarchy and indicators

### Should Test (Important):
- [x] Search functionality with sub-notes
- [x] Date-based views
- [x] Data persistence
- [x] Form validation

### Could Test (Nice to Have):
- [x] Performance with large datasets
- [x] Edge cases and error handling
- [x] UI polish and animations

---

**End of Testing Guide**

Please test in the order listed and document any issues found. Focus especially on the "Must Test" scenarios first!
