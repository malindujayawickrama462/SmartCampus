# Module C – Maintenance & Incident Ticketing
## Implementation Summary & Verification Guide

**Status**: ✅ **FULLY IMPLEMENTED**  
**Last Updated**: April 3, 2026  
**Backend**: Java/Spring Boot 3.4 | **Frontend**: React 19 | **Database**: MySQL

---

## 📋 Requirements Fulfillment

### ✅ 1. Incident Ticket Creation
Users can create incident tickets with all required information:

**Fields Supported:**
- **Location** (required) - Physical location or building identifier
- **Category** (required) - Type of incident (e.g., "Broken Projector", "Network Down")
- **Description** (required, up to 2000 chars) - Detailed issue description
- **Priority** (required) - LOW, MEDIUM, HIGH, or CRITICAL
- **Contact Details** (optional) - Phone or email for follow-up
- **Resource Link** (optional) - Link to specific resource
- **Evidence Images** (optional) - Up to 3 image attachments

**Implementation Locations:**
- Backend: `TicketController.create()` → `TicketService.create()`
- Frontend: `Tickets.jsx` - "Report Incident" form
- API Endpoint: `POST /api/tickets` (multipart/form-data)

---

### ✅ 2. Image Attachments (Up to 3 Per Ticket)

**Features:**
- ✅ Max 3 images enforced both frontend and backend
- ✅ Supports JPEG, PNG, GIF, WebP formats
- ✅ UUID-based file naming prevents collisions
- ✅ Images stored in `uploads/` directory
- ✅ Automatic cascade deletion when ticket deleted

**Implementation:**
- Entity: `TicketImage.java` - Stores filePath, originalName, contentType
- Service: `TicketService.storeFile()` - UUID naming + file storage
- Repository: `TicketImageRepository` - JPA auto-fetching
- Frontend: `Tickets.jsx`, `AdminTickets.jsx` - Image preview + gallery

**File Upload Configuration:**
- Max file size: 10MB per file
- Max request size: 30MB total
- Upload directory: `${app.upload.dir}` = `uploads/`

---

### ✅ 3. Ticket Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED

**Status Definitions:**
```
┌─────────────┐
│    OPEN     │  ← Initial state when ticket created
└──────┬──────┘
       │ (Admin assigns technician)
       ▼
┌─────────────────────┐
│   IN_PROGRESS       │  ← Active work
└──────┬──────────────┘
       │ (Technician resolves)
       ▼
┌─────────────┐
│  RESOLVED   │  ← Issue fixed, resolution notes added
└──────┬──────┘
       │ (Admin closes)
       ▼
┌─────────┐
│ CLOSED  │  ← Terminal state, archived
└─────────┘

Alternative path (Admin only):
OPEN ──────────► REJECTED  (with mandatory rejection reason)
```

**Workflow Transitions Enforced:**
- ❌ Cannot modify CLOSED tickets (terminal state)
- ❌ Cannot reject tickets unless ADMIN
- ❌ Only assigned technician or admin can update status
- ✅ Automatic IN_PROGRESS when technician assigned
- ✅ Resolution notes required for RESOLVED status
- ✅ Rejection reason required for REJECTED status

**Implementation:**
- Enum: `TicketStatus.java` - Legal states
- Service: `TicketService.updateStatus()` - Workflow validation + authorization
- Controller: `TicketController.updateStatus()` - HTTP endpoint

---

### ✅ 4. Technician Assignment & Resolution

**Admin Capabilities:**
- Assign ticket to technician (auto-moves to IN_PROGRESS)
- Update status with resolution notes
- Reject tickets with mandatory reason
- View all tickets system-wide
- Add comments and notes

**Technician Capabilities:**
- View assigned tickets (`/api/tickets/assigned`)
- Update status to RESOLVED with notes
- Add/edit/delete own comments
- Cannot reassign or reject tickets

**Implementation:**
- Method: `TicketService.assign()` - Assigns & updates status
- Endpoint: `PUT /api/tickets/{id}/assign` - Admin only
- Frontend: `AdminTickets.jsx` - Technician dropdown selector

---

### ✅ 5. Comment System with Ownership Rules

**Features:**
- Users, technicians, and admins can add comments
- Timestamps and author tracking included
- Edit/delete with proper authorization

**Authorization Rules:**
```
┌────────────┬───────┬───────┬───────┐
│   Action   │ Owner │ Admin │ Other │
├────────────┼───────┼───────┼───────┤
│ View       │   ✓   │   ✓   │  ✓    │
│ Add        │   ✓   │   ✓   │  ✓    │
│ Edit       │   ✓   │   ✓   │  ✗    │
│ Delete     │   ✓   │   ✓   │  ✗    │
└────────────┴───────┴───────┴───────┘
```

**Implementation:**
- Entity: `TicketComment.java` - ticket, author, content, timestamps
- Service: `TicketService.addComment()` - Adds & notifies reporter
- Service: `TicketService.editComment()` - Owner authorization
- Service: `TicketService.deleteComment()` - Owner OR Admin authorization
- Endpoints:
  - `POST /api/tickets/{id}/comments` - Add comment
  - `PUT /api/tickets/comments/{commentId}` - Edit (owner/admin)
  - `DELETE /api/tickets/comments/{commentId}` - Delete (owner/admin)

**Frontend:**
- `Tickets.jsx` - User comment interface
- `AdminTickets.jsx` - Admin comment management
- Edit/delete buttons shown only to owner or admin

---

## 🏗️ Architecture & Components

### Backend Structure

```
smart_campus/src/main/java/com/example/smart_campus/
├── model/
│   ├── Ticket.java                 # Main entity
│   ├── TicketStatus.java           # ENUM: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
│   ├── TicketPriority.java         # ENUM: LOW, MEDIUM, HIGH, CRITICAL
│   ├── TicketComment.java          # Comment entity
│   └── TicketImage.java            # Image attachment entity
├── repository/
│   ├── TicketRepository.java       # with filtering queries
│   ├── TicketCommentRepository.java
│   └── TicketImageRepository.java
├── service/
│   └── TicketService.java          # Business logic & file handling
└── controller/
    └── TicketController.java        # REST API endpoints
```

### API Endpoints

**User Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/tickets` | Create new ticket |
| GET | `/api/tickets/my` | Get user's tickets |
| GET | `/api/tickets/{id}` | Get ticket details |
| POST | `/api/tickets/{id}/comments` | Add comment |
| PUT | `/api/tickets/comments/{commentId}` | Edit comment |
| DELETE | `/api/tickets/comments/{commentId}` | Delete comment |

**Admin/Technician Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tickets` | List all tickets (with filters) |
| GET | `/api/tickets?status=OPEN` | Filter by status |
| GET | `/api/tickets?priority=HIGH` | Filter by priority |
| PUT | `/api/tickets/{id}/status` | Update ticket status |
| PUT | `/api/tickets/{id}/assign` | Assign technician |
| GET | `/api/tickets/technicians` | List technicians |
| GET | `/api/tickets/assigned` | Get assigned tickets (tech) |

### Frontend Pages

**User Pages:**
- **`Tickets.jsx`** (`/tickets`) - User incident reporting
  - Create new incident form
  - View own tickets with filtering
  - Upload evidence images (up to 3)
  - View ticket details with comments
  - Add/edit/delete own comments

**Admin Pages:**
- **`AdminTickets.jsx`** (`/admin/tickets`) - Incident management dashboard
  - Search and filter all tickets
  - Assign technicians
  - Update ticket status
  - Add rejection reasons
  - Comments management
  - View evidence images

### Database Schema

```sql
-- tickets table
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  resource_id BIGINT,
  reporter_id BIGINT NOT NULL,           /* User who created */
  assignee_id BIGINT,                    /* Assigned technician */
  location VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED') NOT NULL,
  contact_details VARCHAR(255),
  resolution_notes VARCHAR(2000),        /* When RESOLVED */
  rejection_reason VARCHAR(255),         /* When REJECTED */
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- ticket_images table
CREATE TABLE ticket_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  content_type VARCHAR(100),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ticket_comments table
CREATE TABLE ticket_comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

---

## 🔒 Security & Authorization

**Role-Based Access Control:**
- **USER** - Create tickets, add comments, view own tickets
- **TECHNICIAN** - View assigned tickets, update status, add comments
- **ADMIN** - Full control: create, assign, reject, manage all tickets

**Authorization Checks:**
- ✅ JWT token validation on all endpoints
- ✅ Comment ownership enforcement (view line 175-182 in Tickets.jsx)
- ✅ Ticket status update permissions (owner/tech/admin only)
- ✅ Rejection restricted to ADMIN role
- ✅ Closed tickets cannot be modified

---

## 🧪 Testing

**Backend Tests:**
- Location: `src/test/java/com/example/smart_campus/TicketServiceTests.java`
- Covers: Create, update, assign, comments, authorization

**Testing Workflow:**
1. Build backend: `mvn clean compile`
2. Run tests: `mvn test`
3. Start server: `mvn spring-boot:run` (port 8080)
4. Start frontend: `npm run dev` (port 5173)

---

## 📝 Usage Examples

### Create Incident Ticket
```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Authorization: Bearer <token>" \
  -F "location=Building A, Room 201" \
  -F "category=Broken Projector" \
  -F "description=Projector not turning on" \
  -F "priority=HIGH" \
  -F "contactDetails=ext. 1234" \
  -F "images=@evidence1.jpg" \
  -F "images=@evidence2.jpg"
```

### Assign Technician & Update Status
```bash
# Assign technician
curl -X PUT http://localhost:8080/api/tickets/5/assign \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"technicianId": 3}'

# Update status to RESOLVED
curl -X PUT http://localhost:8080/api/tickets/5/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "RESOLVED", "resolutionNotes": "Replaced bulb"}'
```

### Add Comment
```bash
curl -X POST http://localhost:8080/api/tickets/5/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Working on this now"}'
```

---

## ✅ Verification Checklist

### Backend Verification
- [x] Backend compiles successfully
- [x] All entities created (Ticket, TicketComment, TicketImage)
- [x] All enums defined (TicketStatus, TicketPriority)
- [x] Repositories with filtering queries
- [x] Service methods implemented (create, assign, comment management)
- [x] Controller endpoints defined with auth
- [x] File upload configured
- [x] Workflow validation in place

### Frontend Verification
- [x] Tickets.jsx page complete
- [x] AdminTickets.jsx page complete
- [x] Image upload interface
- [x] Comment system UI
- [x] Status filtering
- [x] Search functionality
- [x] Technician assignment dropdown
- [x] Authorization checks for edit/delete

### Integration Verification
- [x] Routes configured in App.jsx
- [x] Navigation links in Navbar.jsx
- [x] API endpoints integrated
- [x] JWT token injection working
- [x] Error handling implemented
- [x] Success notifications working

### Database Verification
- [x] Tables auto-created via Hibernate
- [x] Relationships configured
- [x] Cascade delete for images
- [x] Timestamps auto-populated

---

## 🚀 Running the Application

### Start Backend
```bash
cd smart_campus
mvn spring-boot:run
```
Server runs on: `http://localhost:8080`

### Start Frontend
```bash
cd frontend
npm install      # if needed
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Accessing Ticket Management
- **User Incidents**: Navigate to "Incidents" in sidebar or `/tickets`
- **Admin Management**: Navigate to "Manage Incidents" or `/admin/tickets` (admin only)

---

## 📊 Module Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Create tickets | ✅ | TicketController, Tickets.jsx |
| Image attachments (up to 3) | ✅ | TicketImage entity, TicketService.storeFile() |
| Workflow (OPEN→IN_PROGRESS→RESOLVED→CLOSED) | ✅ | TicketService.updateStatus() |
| Reject with reason | ✅ | AdminTickets.jsx status form |
| Technician assignment | ✅ | TicketService.assign(), AdminTickets.jsx |
| Comments with ownership rules | ✅ | TicketComment entity, authorization checks |
| Filtering by status/priority | ✅ | TicketRepository queries, UI dropdowns |
| Search by ID/category/location | ✅ | AdminTickets.jsx client-side search |
| Notifications on status change | ✅ | NotificationService |
| Notifications on new comment | ✅ | TicketService.addComment() |

---

## 🎯 Next Steps (Optional Enhancements)

- [ ] Export tickets to PDF
- [ ] Email notifications for status changes
- [ ] Ticket analytics dashboard
- [ ] SLA tracking and escalation
- [ ] Priority-based ticket sorting
- [ ] Mobile app version
- [ ] Real-time updates via WebSocket
- [ ] Ticket template categories

---

**Implementation Complete** ✅  
*All requirements for Module C have been fully implemented and integrated into the Smart Campus system.*
