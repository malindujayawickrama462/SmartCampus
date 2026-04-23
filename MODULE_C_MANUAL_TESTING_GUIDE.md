# Module C – Incident Ticketing: Manual Testing Guide

## 📋 End-to-End Testing Workflow

This guide walks you through manually testing the complete incident ticketing system.

---

## ⏱️ Prerequisites (5 minutes)

### ✅ 1. Verify MySQL is Running
```bash
# Check if MySQL is running
# Windows: MySQL should be in Services or running via Docker
# Port: 3306
# Database: smartCampusDB (auto-created)
```

### ✅ 2. Build Backend
```bash
cd smart_campus
mvn clean compile
```
Expected: "BUILD SUCCESS"

### ✅ 3. Start Backend (Terminal 1)
```bash
cd smart_campus
mvn spring-boot:run
```

Wait for:
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_|_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.4.0)

[main] c.e.s.SmartCampusApplication : Started SmartCampusApplication
```

⏸️ **Takes ~30 seconds to start**

### ✅ 4. Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # if needed
npm run dev
```

Expected:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### ✅ 5. Open Browser
- Go to: **http://localhost:5173**
- You should see the Login page

---

## 🧪 Test Case 1: User Creates Incident Ticket (5 minutes)

### Step 1: Login as Regular User
1. Click "Login"
2. Enter credentials:
   - Email: `user@campus.edu`
   - Password: `password123`
3. Click "Sign In"

✅ **Expected**: Dashboard loads, navbar visible with "Incidents" link

### Step 2: Navigate to Incidents
1. Click **"Incidents"** in left sidebar (or navigate to `/tickets`)
2. Page should load showing "Incident Tickets"

✅ **Expected**: Section with "Report Incident" button, filters

### Step 3: Create New Ticket
1. Click **"Report Incident"** button (red button)
2. A modal form should appear with fields:
   - ✅ Location *
   - ✅ Category *
   - ✅ Description *
   - ✅ Priority *
   - ✅ Contact Details (optional)
   - ✅ Evidence Images (up to 3)

### Step 4: Fill Form
Fill in with test data:

**Location**: `Building A, Room 205`
**Category**: `Projector Not Working`
**Description**: `The ceiling mounted projector will not turn on. We've tried the remote and power button. It was working yesterday afternoon.`
**Priority**: `HIGH`
**Contact Details**: `ext. 5234 or room.205@campus.edu`

### Step 5: Upload Images
1. Click on the **dashed upload area** under "Evidence Images (up to 3)"
2. Select 1 image from your computer (JPG, PNG, etc.)
3. File name should appear with ✓ checkmark

✅ **Expected**: Image name displayed with remove (×) button

### Step 6: Submit Form
1. Click **"Create Ticket"** button
2. Modal closes
3. Green toast notification appears: **"Incident ticket created successfully!"**

✅ **Expected**: Ticket appears in list above with status badge

---

## 🧪 Test Case 2: Verify Ticket Data in List (2 minutes)

### Step 1: View Ticket List
Your newly created ticket should appear in the list showing:
- ✅ Ticket ID (e.g., #123)
- ✅ Category name
- ✅ Location
- ✅ Description (truncated)
- ✅ Priority badge (HIGH)
- ✅ Status badge (OPEN, green)

### Step 2: Click Ticket to View Details
1. Click on the ticket card
2. Detail modal should open showing:
   - ✅ Ticket ID
   - ✅ Category, Location, Priority, Status
   - ✅ Full description
   - ✅ Contact details
   - ✅ Evidence Images section (clickable thumbnails)

✅ **Expected**: Images displayed in grid, clickable to open full size

### Step 3: Test Image Viewing
1. Click on any evidence image thumbnail
2. Image should open in new tab/window at full size

✅ **Expected**: Image loads and is viewable

---

## 🧪 Test Case 3: Add Comment (2 minutes)

### Step 1: In Detail Modal
1. Scroll to **"Comments"** section at bottom
2. Should show `No comments yet.`
3. Text input box: **"Add a comment..."**

### Step 2: Add First Comment
1. Type in comment box: `I'm on my way to check this out`
2. Press **Enter** OR click **"Send"** button
3. Blue toast: **"Comment added"**

✅ **Expected**: Comment appears in list with:
- Author name
- Current date/time
- Comment text
- Edit (pencil) and Delete (trash) buttons

### Step 3: Test Edit Comment
1. Click **edit (pencil) icon** on your comment
2. Comment should become editable textarea
3. Change text to: `Actually, it's working now. Never mind.`
4. Click **"Save"** button
5. Blue toast: **"Comment updated"**

✅ **Expected**: Comment text updated in display

### Step 4: Cancel Edit
1. Click another comment in the list
2. Click **edit icon**
3. Click **"Cancel"** button
4. Edit mode closes without saving

✅ **Expected**: Original text remains unchanged

### Step 5: Delete Comment
1. Click **delete (trash) icon** on your edited comment
2. Browser confirmation dialog appears
3. Click **OK** to confirm
4. Green toast: **"Comment deleted"**

✅ **Expected**: Comment removed from list

---

## 🧪 Test Case 4: Test Filters (2 minutes)

### Step 1: Close Detail Modal
1. Click X button or click outside modal

### Step 2: Test Status Filter
1. Find **Status** dropdown filter at top
2. Select **"In Progress"**
3. List updates to show only IN_PROGRESS tickets (probably none)

✅ **Expected**: Ticket disappears (status is OPEN)

### Step 3: Reset to All Statuses
1. Click Status dropdown again
2. Select **"All Statuses"**
3. Your ticket reappears

✅ **Expected**: Ticket visible again

### Step 4: Test Priority Filter
1. Select **Priority**: `Critical`
2. List should not show your HIGH priority ticket

✅ **Expected**: Ticket disappears

### Step 5: Reset Priority
1. Select **Priority**: `All Priorities`
2. Ticket appears again

✅ **Expected**: Ticket visible

---

## 🧪 Test Case 5: Admin Workflow (10 minutes)

### Step 1: Logout
1. Click **"Logout"** button at bottom of sidebar
2. Redirected to login page

### Step 2: Login as Admin
1. Enter admin credentials:
   - Email: `admin@campus.edu`
   - Password: `password123`
2. Click **"Sign In"**

✅ **Expected**: Admin sees additional navigation items

### Step 3: Go to Admin Dashboard
1. Click **"Manage Incidents"** in sidebar
2. Page loads with admin table view

✅ **Expected**: Table shows:
- ID, Category, Reporter, Priority, Status, Assigned, Action columns
- Your ticket in the list
- Status: OPEN, Assigned: Unassigned

### Step 4: Search Test
1. Find search box at top
2. Type ticket ID (e.g., `123`)
3. Table filters to show matching ticket only

✅ **Expected**: Only your ticket visible

### Step 5: Clear Search & View Ticket
1. Clear search box
2. Click **"View"** button on your ticket row
3. Detail modal opens

✅ **Expected**: All ticket details visible with Admin Actions section (blue box)

### Step 6: Assign Technician
1. In **"Assign Technician"** dropdown
2. Select any technician from list
3. Click **"Assign"** button
4. Green toast: **"Technician assigned"**

✅ **Expected**: 
- Assignee column updated with technician name
- Ticket status auto-changed to **IN_PROGRESS**
- "Assigned To" shows technician name

### Step 7: Update Status to RESOLVED
1. Find **"Update Status"** section
2. Select: `RESOLVED`
3. **"Resolution Notes"** field appears
4. Enter: `Replaced the projector bulb. Tested and working.`
5. Click **"Update Status"** button
6. Green toast: **"Ticket status updated"**

✅ **Expected**:
- Status badge changes to RESOLVED (slate color)
- Resolution notes shown in detail
- Notification sent to reporter

### Step 8: Update Status to CLOSED
1. Select: `CLOSED`
2. Click **"Update Status"**
3. Green toast: **"Ticket status updated"**

✅ **Expected**: Status badge changes to CLOSED (gray)

### Step 9: Verify Cannot Modify Closed Ticket
1. Try to select another status from dropdown
2. Select: `IN_PROGRESS`
3. Click **"Update Status"**

⚠️ **Expected**: Red error toast: **"Cannot update a closed ticket"**

### Step 10: Test Rejection Workflow
1. Close current modal
2. View another ticket (or scroll list)
3. Open a different OPEN ticket
4. Select **"REJECTED"** status
5. **"Rejection Reason"** field appears
6. Enter reason: `Ticket lacks sufficient detail. Please resubmit with more information.`
7. Click **"Update Status"**

✅ **Expected**:
- Status changes to REJECTED (red)
- Rejection reason shown in detail

---

## 🧪 Test Case 6: Image Upload Validation (3 minutes)

### Step 1: Back to User and Create New Ticket
1. Logout
2. Login as regular user
3. Go to Incidents
4. Click "Report Incident"

### Step 2: Try Upload 4 Images (Validation Test)
1. Hold down Ctrl and select **4 image files** at once
2. Try to upload all 4
3. Red toast appears: **"Maximum 3 images allowed"**

✅ **Expected**: Upload fails, displays max 3 error

### Step 3: Upload Exactly 3 Images
1. Select exactly 3 image files one by one
2. Each adds to the list with remove button
3. All 3 appear with checkmarks
4. Fill other form fields
5. Click "Create Ticket"

✅ **Expected**: Ticket created with 3 images

### Step 4: Verify All Images Display
1. Click ticket to view details
2. Scroll to "Evidence Images" section
3. All 3 image thumbnails should be visible in grid

✅ **Expected**: 3×3 or 2×3 grid layout with clickable images

---

## 🧪 Test Case 7: Authorization Test (5 minutes)

### Step 1: Create Ticket with Different User
1. Logout
2. Switch to **different user account** (or create new account)
3. Create incident ticket
4. Add a comment: `I'll help with this.`
5. Note comment ID

### Step 2: Switch Back to First User
1. Logout
2. Login as original user who created first ticket
3. Go to Incidents
4. Click on the **OTHER USER'S TICKET**

✅ **Expected**: Can view details (read permission granted)

### Step 3: Try to Edit Other User's Comment
1. In detail view, find comment by other user
2. **Edit (pencil) icon should be VISIBLE** (you're not the owner)
3. Click the edit icon
4. Try to modify the text
5. Click "Save"

⚠️ **Expected**: Red error toast: **"You can only edit your own comments"**

### Step 4: Try to Delete Other User's Comment
1. Click **delete (trash) icon** on other user's comment
2. Confirm deletion
3. Red error toast appears: **"You cannot delete this comment"**

✅ **Expected**: Deletion fails with permission error

### Step 5: Only Owner Can Edit/Delete Own Comments
1. Go back to **YOUR OWN TICKET** (created in earlier steps)
2. Add a comment: `This is my comment.`
3. **Edit and Delete buttons should both be visible and clickable**
4. Edit the comment - should succeed ✅
5. Add a new comment
6. Delete it - should succeed ✅

✅ **Expected**: Full control as comment owner

---

## 🧪 Test Case 8: Database Verification (2 minutes)

### Step 1: Check MySQL Tables Exist
Open MySQL client:
```bash
mysql -u root -p
# Enter password: 5631#$%Ap
```

### Step 2: Query Database
```sql
USE smartCampusDB;

-- Check tickets table
SELECT COUNT(*) as total_tickets FROM tickets;
SELECT id, location, category, priority, status FROM tickets ORDER BY id DESC LIMIT 5;

-- Check images
SELECT COUNT(*) as total_images FROM ticket_images;

-- Check comments
SELECT COUNT(*) as total_comments FROM ticket_comments;

-- Verify relationships
SELECT t.id, t.location, t.status, u.email as reporter 
FROM tickets t 
JOIN users u ON t.reporter_id = u.id 
ORDER BY t.id DESC 
LIMIT 3;
```

✅ **Expected**:
- Tickets table populated with created tickets
- ticket_images has entries for uploaded images
- ticket_comments has your test comments
- Foreign key relationships intact
- Timestamps auto-populated

---

## ✅ Test Case 9: Complete Success Scenarios

### Scenario A: Happy Path (User → Admin → Resolution)
- [x] User creates ticket with images
- [x] User adds comment
- [x] Admin views in dashboard
- [x] Admin assigns technician
- [x] Status auto-changes to IN_PROGRESS
- [x] Technician adds comment
- [x] Admin updates to RESOLVED with notes
- [x] Admin closes ticket
- [x] User cannot modify closed ticket

### Scenario B: Rejection Path
- [x] Admin opens OPEN ticket
- [x] Admin selects REJECTED status
- [x] Admin provides rejection reason
- [x] Status updates to REJECTED
- [x] Reporter notified

### Scenario C: Authorization
- [x] User can only see own tickets
- [x] Admin can see all tickets
- [x] Comment owner can edit/delete own comments
- [x] Admin can edit/delete any comments
- [x] Non-owner cannot modify comments

---

## 🔍 Troubleshooting

### Issue: Backend won't start
```bash
# Check MySQL running
# Check port 8080 free
# Check no other Spring app running
```

### Issue: Frontend can't connect to API
```bash
# Verify backend on localhost:8080
# Check API interceptor in src/lib/api.js
# Check CORS allowed in SecurityConfig
```

### Issue: Images not uploading
```bash
# Check uploads/ directory exists
# Check file size < 10MB
# Check form sent as multipart/form-data
```

### Issue: Comments not appearing
```bash
# Refresh page
# Check ticket was saved with comments
# Check no browser cache issues (open DevTools → Network)
```

---

## 📊 Expected Results Summary

| Test | Expected Result | Status |
|------|-----------------|--------|
| Create ticket | Ticket appears in list | ✅ |
| Upload images | Max 3 enforced | ✅ |
| View images | Click opens full size | ✅ |
| Add comment | Appears immediately | ✅ |
| Edit comment | Owner can modify | ✅ |
| Delete comment | Owner can remove | ✅ |
| Assign tech | Status → IN_PROGRESS | ✅ |
| Update status | Status changes | ✅ |
| Closed ticket | Cannot modify | ✅ |
| Rejection | Reason stored | ✅ |
| Authorization | Ownership enforced | ✅ |
| Filters | List updates | ✅ |
| Search | Results filtered | ✅ |
| DB records | All data persisted | ✅ |

---

## ⏱️ Total Manual Testing Time

- Prerequisites: 2-3 min
- Test Cases 1-2: 7 min
- Test Cases 3-4: 4 min
- Test Cases 5-7: 15 min
- Test Case 8: 2 min
- Test Case 9: 3 min

**Total: ~35-40 minutes**

---

## ✅ Completion Checklist

After completing all test cases, verify:
- [x] All CRUD operations work (Create, Read, Update, Delete)
- [x] File upload works and images display
- [x] Workflow transitions as expected
- [x] Authorization rules enforced
- [x] Comments system functional
- [x] Filtering and search work
- [x] Database populated correctly
- [x] No error messages in browser console
- [x] No error messages in server logs
- [x] Toast notifications appear appropriately

---

**Manual Testing Complete** ✅

All test cases passed = Module C is ready for production use.
