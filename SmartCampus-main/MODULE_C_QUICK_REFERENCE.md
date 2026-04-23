# Module C – Incident Ticketing: Quick Reference

## 🎯 Implementation Status: ✅ COMPLETE

All requirements for Module C have been fully implemented in the Smart Campus application.

---

## 📦 What's Included

### Backend (Java/Spring Boot)
- ✅ **Models**: Ticket, TicketComment, TicketImage, TicketStatus, TicketPriority
- ✅ **Repositories**: Query methods for filtering and searching
- ✅ **Service Layer**: Complete business logic with authorization
- ✅ **REST API**: 11 endpoints for ticket management
- ✅ **File Handling**: UUID-based image storage (max 3 per ticket)
- ✅ **Database**: Auto-created tables via Hibernate

### Frontend (React)
- ✅ **User Page** (`/tickets`): Report incidents, view own tickets, comment system
- ✅ **Admin Page** (`/admin/tickets`): Manage all tickets, assign technicians, update status
- ✅ **Components**: Form validation, image preview, comment management
- ✅ **Authorization**: Role-based visibility and edit/delete permissions

### Features
1. **Create Incident Tickets** with location, category, description, priority, contact details
2. **Upload Evidence** - Up to 3 images per ticket
3. **Workflow Management** - OPEN → IN_PROGRESS → RESOLVED → CLOSED (or REJECTED)
4. **Technician Assignment** - Admin assigns technicians, status auto-updates
5. **Comment System** - Add/edit/delete with ownership rules
6. **Filtering & Search** - By status, priority, ID, category, location, reporter
7. **Mobile Responsive** - Works on desktop and mobile devices

---

## 🚀 Quick Start

### Prerequisites
- Java 21+
- MySQL running on localhost:3306
- Node.js 18+

### 1. Build Backend
```bash
cd smart_campus
mvn clean compile
```

### 2. Start Backend
```bash
mvn spring-boot:run
```
✓ Runs on `http://localhost:8080`

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
✓ Runs on `http://localhost:5173`

### 4. Login & Test
- Go to `http://localhost:5173`
- Log in with valid credentials
- Navigate to "Incidents" to create a ticket
- (Admin) Navigate to "Manage Incidents" to view all & assign

---

## 🔑 Key Files

### Backend
- `src/main/java/com/example/smart_campus/`
  - `model/Ticket.java` - Main entity
  - `service/TicketService.java` - Business logic
  - `controller/TicketController.java` - REST endpoints
  - `repository/TicketRepository.java` - Data access

### Frontend
- `src/pages/`
  - `Tickets.jsx` - User incident page
  - `AdminTickets.jsx` - Admin management page
- `src/lib/api.js` - API client
- `src/App.jsx` - Routes configuration

### Documentation
- `INCIDENT_TICKETING_DOCUMENTATION.md` - Detailed specs
- `MODULE_C_IMPLEMENTATION_SUMMARY.md` - Complete guide (this directory)

---

## 📝 User Workflow

### For Regular Users
1. Click "Incidents" in sidebar
2. Click "Report Incident"
3. Fill in location, category, description, priority
4. Upload up to 3 evidence images
5. Add optional contact details
6. Click "Create Ticket"
7. View ticket status and add comments

### For Admins
1. Click "Manage Incidents" in sidebar
2. View all tickets in searchable table
3. Click "View" to open ticket details
4. Assign technician from dropdown
5. Update status (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
6. For rejection: Select "REJECTED" and provide reason
7. Add notes and collaborate via comments

### For Technicians
1. Click "Incidents" to see assigned tickets (if any)
2. View ticket details including evidence images
3. Update status from IN_PROGRESS to RESOLVED
4. Add resolution notes
5. Participate in comment thread

---

## 🔐 Authorization Matrix

| Role | Create | View Own | View All | Assign | Reject | Edit Comment | Delete Comment |
|------|--------|----------|----------|--------|--------|--------------|----------------|
| user | ✓ | ✓ | ✗ | ✗ | ✗ | own only | own only |
| technician | ✓ | ✓ | ✓(assigned) | ✗ | ✗ | ✓ | own+admin |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check MySQL is running on localhost:3306
- Check database credentials in `application.properties`
- Check port 8080 is not in use

### Frontend API Errors
- Check backend is running on port 8080
- Check JWT token is stored in localStorage
- Check CORS is enabled (should be in SecurityConfig)

### File Upload Not Working
- Check `uploads/` directory exists (auto-created)
- Check file permissions on uploads directory
- Max 10MB per file, 30MB total request

### Images Not Loading
- Check image file paths in database
- Verify static file serving configured
- Check browser console for errors

---

## 📊 Ticket Statuses

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| OPEN | ⚠️ | Green | Newly created, needs technician |
| IN_PROGRESS | ⏱️ | Blue | Technician assigned and working |
| RESOLVED | ✓ | Slate | Issue fixed, waiting admin close |
| CLOSED | ✓✓ | Gray | Ticket archived, no changes |
| REJECTED | ✗ | Red | Admin rejected with reason |

---

## 💬 Comments

- Anyone can add comments to a ticket
- Only comment author or admin can edit
- Only comment author or admin can delete
- Reporter notified when non-reporter adds comment
- Comments display in chronological order

---

## 📸 Image Attachments

- **Max 3 images** per ticket (enforced on both client & server)
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Max file size**: 10MB per file
- **Storage**: UUID-named files in `uploads/` directory
- **Display**: Clickable thumbnails in ticket details (opens full size)
- **Auto-delete**: Deleted when ticket is deleted

---

## 🔄 Workflow Example

```
User creates ticket with CRITICAL priority
                    ↓
Admin sees new ticket in management dashboard
                    ↓
Admin clicks "View" → sees details + evidence images
                    ↓
Admin assigns to technician "John"
                    ↓
Status auto-changes to IN_PROGRESS
                    ↓
Technician "John" sees it in "Incidents" page
                    ↓
Technician adds comment: "Working on replacing projector bulb"
                    ↓
User gets notification of comment
                    ↓
Technician updates status to RESOLVED
                    ↓
Adds resolution notes: "Replaced bulb, tested working"
                    ↓
Admin sees RESOLVED status
                    ↓
Admin clicks "Update Status" → Selects "CLOSED"
                    ↓
Ticket moved to CLOSED (terminal state)
                    ↓
No further changes allowed
```

---

## 🎯 API Endpoints Cheat Sheet

### Create Ticket
```bash
POST /api/tickets
Form Data:
  - location (required)
  - category (required)
  - description (required)
  - priority (required): LOW|MEDIUM|HIGH|CRITICAL
  - contactDetails (optional)
  - resourceId (optional)
  - images (optional, max 3)
```

### List Tickets
```bash
# User's tickets
GET /api/tickets/my

# All tickets (admin/tech)
GET /api/tickets?status=OPEN&priority=HIGH

# Technician's assigned
GET /api/tickets/assigned
```

### Update Status
```bash
PUT /api/tickets/{id}/status
JSON:
  {
    "status": "RESOLVED",
    "resolutionNotes": "Fixed",
    "rejectionReason": null
  }
```

### Assign Technician
```bash
PUT /api/tickets/{id}/assign
JSON: { "technicianId": 5 }
```

### Comments
```bash
POST /api/tickets/{id}/comments
JSON: { "content": "Comment text" }

PUT /api/tickets/comments/{commentId}
JSON: { "content": "Updated text" }

DELETE /api/tickets/comments/{commentId}
```

---

## 📋 Validation Rules

**Ticket Creation:**
- Location: required, non-empty
- Category: required, non-empty
- Description: required, non-empty, max 2000 chars
- Priority: required, must be valid enum
- Images: max 3, max 10MB each

**Status Update:**
- Cannot modify CLOSED tickets
- REJECTED requires rejection reason
- RESOLVED should have resolution notes
- Only ADMIN can set REJECTED

**Comments:**
- Content: required, non-empty, max 1000 chars
- Only owner or admin can edit/delete

---

## 🆘 Support

**Documentation:**
- Full API spec: `INCIDENT_TICKETING_DOCUMENTATION.md`
- Implementation details: `MODULE_C_IMPLEMENTATION_SUMMARY.md`
- Architecture: Check comments in `TicketService.java`

**Common Issues:**
- Check browser console for errors
- Check network tab in DevTools (F12)
- Check backend logs for server-side errors
- Verify authentication/JWT token

---

**Made with ❤️ for Smart Campus Operations Hub**
*Module C – Incident Ticketing & Maintenance Management System*
