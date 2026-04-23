# Module C – Incident Ticketing & Maintenance

## Overview
The Incident Ticketing module enables users to report maintenance and operational issues on campus resources with evidence attachments. Administrators can manage, prioritize, and assign tickets to technicians for resolution. The system implements a comprehensive workflow for tracking incidents from creation to closure.

---

## Requirements Implementation

### ✅ 1. Incident Ticket Creation
Users can create incident tickets for a specific resource/location with:
- **Location**: Physical location or building identifier (required)
- **Category**: Type of incident (e.g., "Broken Projector", "Network Down")
- **Description**: Detailed description of the issue (required, up to 2000 characters)
- **Priority**: Urgency level - LOW, MEDIUM, HIGH, or CRITICAL
- **Contact Details**: Phone number or email for follow-up (optional)
- **Resource Link**: Optional link to a specific resource (optional)
- **Evidence Images**: Up to 3 image attachments showing the problem (optional)

**Implementation:**
- Frontend: `Tickets.jsx` - Create ticket form with image upload
- Backend: `TicketService.createTicket()` - Persists ticket with OPEN status
- Endpoint: `POST /api/tickets` (multipart/form-data)
- Image Storage: Files stored in `uploads/` directory configured via `app.upload.dir`

### ✅ 2. Image Attachments (Up to 3)
Users can attach evidence images during ticket creation or modification:

**Features:**
- Maximum 3 images per ticket (validation enforced)
- Supports common image formats (JPEG, PNG, GIF, WebP)
- File storage with UUID naming to prevent collisions
- Images retrievable and displayable in ticket details

**Implementation:**
- Entity: `TicketImage` - Stores file path, original name, content type
- Service: `TicketService.storeFile()` - Handles file storage with UUID naming
- Validation: `BadRequestException` thrown if > 3 images
- Cascade delete: Images auto-deleted when ticket is deleted

### ✅ 3. Ticket Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
The system enforces strict state transitions and authorization rules:

**Status Definitions:**
- `OPEN`: Initial state when ticket created; requires technician assignment
- `IN_PROGRESS`: Active work in progress; technician assigned and working
- `RESOLVED`: Issue fixed; resolution notes documented
- `CLOSED`: Final state; ticket archived
- `REJECTED`: Admin rejects ticket (alternative path); includes rejection reason

**Valid Transitions:**
```
OPEN ──(Assign Technician)──> IN_PROGRESS ──(Resolve)──> RESOLVED ──(Close)──> CLOSED
  ↓
REJECTED (Admin only)
```

**Workflow Enforcement:**
- Cannot transition from CLOSED state (terminal state)
- Only admins can set REJECTED status
- Status updates require appropriate authorization
- Technicians can only update when assigned
- Reporters can view status changes

**Implementation:**
- Enums: `TicketStatus.java` defines valid states
- Service: `TicketService.updateStatus()` enforces workflow
- Authorization: Role-based and ownership checks
- Errors: `BadRequestException` for invalid transitions

### ✅ 4. Technician Assignment & Resolution Notes
Administrators can assign technicians and manage ticket resolution:

**Admin Capabilities:**
- Assign ticket to specific technician (auto-moves to IN_PROGRESS)
- Update status with optional resolution notes
- Reject tickets with mandatory rejection reason
- View all tickets across the system

**Technician Capabilities:**
- View assigned tickets via `/api/tickets/assigned`
- Update status to RESOLVED with resolution notes
- Add comments and notes
- Cannot reassign or reject tickets

**Implementation:**
- Backend:
  - `TicketService.assign()` - Links technician and starts work
  - `TicketService.updateStatus()` - Records resolution notes
  - `TicketController` endpoints with @PreAuthorize annotations
  - `UserService.getTechnicians()` - Lists available technicians
- Frontend: 
  - `AdminTickets.jsx` - Technician assignment dropdown
  - Status update form with conditional fields for notes/reasons

### ✅ 5. User & Staff Comments with Ownership Rules
Comments system with granular access control:

**Comment Features:**
- Users, technicians, and admins can add comments
- Edit comments (owner only or admin)
- Delete comments (owner only or admin)
- Timestamps and author tracking

**Authorization Rules:**
```
Action    | Owner | Admin | Other
----------|-------|-------|--------
View      |  ✓   |   ✓   |  ✓
Edit      |  ✓   |   ✓   |  ✗
Delete    |  ✓   |   ✓   |  ✗
```

**Implementation:**
- Entity: `TicketComment` - Maps to ticket and author
- Repository: `TicketCommentRepository.findByTicketIdOrderByCreatedAtAsc()`
- Service Methods:
  - `addComment()` - Validates content, notifies reporter
  - `editComment()` - Checks ownership before updating
  - `deleteComment()` - Dual auth check (owner OR admin)
- Endpoints:
  - `POST /api/tickets/{id}/comments` - Add comment
  - `PUT /api/tickets/comments/{commentId}` - Edit (owner/admin only)
  - `DELETE /api/tickets/comments/{commentId}` - Delete (owner/admin only)
- Error Handling: `ForbiddenException` for unauthorized actions

---

## API Endpoints

### User Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/tickets` | User | Create new ticket |
| GET | `/api/tickets/my` | User | Get user's tickets |
| GET | `/api/tickets/{id}` | User | Get ticket details |
| POST | `/api/tickets/{id}/comments` | User | Add comment |
| PUT | `/api/tickets/comments/{commentId}` | Owner/Admin | Edit comment |
| DELETE | `/api/tickets/comments/{commentId}` | Owner/Admin | Delete comment |

### Admin Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/tickets` | Admin | List all tickets (with filters) |
| GET | `/api/tickets?status=OPEN` | Admin | Filter by status |
| GET | `/api/tickets?priority=HIGH` | Admin | Filter by priority |
| PUT | `/api/tickets/{id}/status` | Admin/Tech | Update status |
| PUT | `/api/tickets/{id}/assign` | Admin | Assign technician |
| GET | `/api/tickets/technicians` | Admin | List available technicians |
| GET | `/api/tickets/assigned` | Tech | Get technician's tickets |

---

## Database Schema

### tickets table
```sql
CREATE TABLE tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  resource_id BIGINT,
  reporter_id BIGINT NOT NULL,
  assignee_id BIGINT,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED') NOT NULL,
  contact_details VARCHAR(255),
  resolution_notes VARCHAR(2000),
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);
```

### ticket_images table
```sql
CREATE TABLE ticket_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  content_type VARCHAR(100),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

### ticket_comments table
```sql
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

## Frontend Components

### Tickets.jsx (User View)
**Location:** `frontend/src/pages/Tickets.jsx`

**Features:**
- ✅ Create incident ticket form with image upload
- ✅ Filter tickets by status and priority
- ✅ Search tickets by category or location
- ✅ View ticket details in modal
- ✅ Add/edit/delete comments
- ✅ View evidence images
- ✅ Real-time status updates

**State Management:**
- `tickets` - User's reported tickets
- `showCreateModal` - Show/hide create form
- `selectedTicket` - Details for opened ticket
- `filterStatus`, `filterPriority` - Active filters
- `formData` - Create form state (includes image files)

### AdminTickets.jsx (Admin View)
**Location:** `frontend/src/pages/AdminTickets.jsx`

**Features:**
- ✅ View all tickets in system
- ✅ Advanced filtering (status, priority)
- ✅ Search by ID, category, location, reporter
- ✅ Tabular view with quick info
- ✅ Assign technician to tickets
- ✅ Update ticket status with notes/reasons
- ✅ Add admin comments
- ✅ View ticket details with evidence

**Admin Actions Panel:**
- Technician assignment dropdown
- Status update with conditional fields
- Resolution notes for RESOLVED status
- Rejection reason for REJECTED status

---

## Backend Services & Controllers

### TicketService.java
**Key Methods:**
- `getById(Long)` - Fetch ticket by ID
- `getMyTickets(Long userId)` - User's reported tickets
- `getAssignedTickets(Long userId)` - Technician's assigned tickets
- `getAll()` - All tickets (admin)
- `getFiltered(status, priority)` - Filtered ticket list
- `create(ticket, images)` - Create new ticket with files
- `updateStatus(id, newStatus, notes, reason, user)` - Status update with auth
- `assign(ticketId, technicianId)` - Assign to technician
- `addComment(ticketId, content, author)` - Add comment
- `editComment(commentId, content, user)` - Edit comment with ownership check
- `deleteComment(commentId, user)` - Delete comment with auth
- `storeFile(MultipartFile)` - Store image with UUID naming

**Authorization Checks:**
```java
// Status update authorization
if (!isAdmin && !isTechnician && !isReporter) {
    throw new ForbiddenException("No permission");
}

// Comment deletion
if (!isOwner && !isAdmin) {
    throw new ForbiddenException("Cannot delete comment");
}
```

### TicketController.java
**Endpoints:** See API Endpoints section above

**Features:**
- Multipart form data support for image uploads
- Query parameter filtering
- Auth validation with @PreAuthorize
- Proper HTTP status codes (201 for creation, etc.)

---

## Repositories

### TicketRepository
```java
interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReporterId(Long reporterId);
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByStatus(TicketStatus status);
    List<Ticket> findByPriority(TicketPriority priority);
    List<Ticket> findByStatusAndPriority(TicketStatus, TicketPriority);
}
```

### TicketImageRepository
```java
interface TicketImageRepository extends JpaRepository<TicketImage, Long> {
    List<TicketImage> findByTicketId(Long ticketId);
    long countByTicketId(Long ticketId);
}
```

### TicketCommentRepository
```java
interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
```

---

## Validation & Error Handling

### Client-Side Validation
- Required fields: location, category, description
- Priority: Dropdown selection (no invalid values)
- Images: Max 3, must be image files
- Comment content: Non-empty validation

### Server-Side Validation
- Resource existence check
- Image limit enforcement (max 3)
- File type validation
- Workflow state validation
- Authorization checks for all sensitive operations

### Error Responses
- `400 Bad Request` - Invalid input or workflow violation
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Ticket or resource not found
- `409 Conflict` - Business rule violation (e.g., closed ticket update)

**Example Error Response:**
```json
{
  "timestamp": "2026-04-03T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You can only edit your own comments",
  "path": "/api/tickets/comments/42"
}
```

---

## Notifications

When ticket status changes, the system notifies the reporter:
- **Event:** `TICKET_STATUS_CHANGED`
- **Message:** "Your ticket #{id} status updated to {NEW_STATUS}"
- **Recipient:** Original ticket reporter

When a comment is added (except by reporter):
- **Event:** `NEW_COMMENT`
- **Message:** "New comment on your ticket #{id}"
- **Recipient:** Ticket reporter

---

## File Upload Configuration

**Location:** `application.properties`
```properties
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=30MB
app.upload.dir=uploads
```

**Image Storage:**
- Files stored in: `{project-root}/uploads/`
- Naming: `{UUID}_{original-filename}` (e.g., `550e8400-e29b-41d4-a716-446655440000_broken_projector.jpg`)
- Access: Direct file serving or through API

---

## Testing

### Test Coverage

Located in: `smart_campus/src/test/java/com/example/smart_campus/`

**Test Classes:**
- `TicketServiceTests.java` - Service layer tests
  - ✅ Ticket creation and persistence
  - ✅ Image upload and storage
  - ✅ Workflow state transitions
  - ✅ Authorization checks
  - ✅ Comment operations
  - ✅ Technician assignment
  - ✅ Status updates with notes

**Example Test Cases:**
```java
@Test
void testCreateTicket() { /* Valid ticket creation */ }

@Test
void testMaxImageValidation() { /* Reject >3 images */ }

@Test
void testUpdateStatusAuthCheck() { /* None access denied */ }

@Test
void testRejectTicketWithoutReason() { /* Fail without reason */ }

@Test
void testCommentDeletePermission() { /* Owner/Admin only */ }
```

---

## Security Considerations

1. **File Upload Security:**
   - Validate file types (images only)
   - Store outside web root (not directly accessible)
   - Use random filenames to prevent enumeration
   - Set max file size limits

2. **Authorization:**
   - Ticket access limited to reporter, assigned tech, and admins
   - Status updates require specific roles
   - Comments editable only by owner/admin
   - Rejection only allowed for admins

3. **Data Validation:**
   - SQL injection prevention via JpaRepository
   - XSRF protection via Spring Security
   - Input validation on all endpoints

---

## Usage Examples

### Create a Ticket (User)
```bash
curl -X POST http://localhost:8080/api/tickets \
  -F "location=Building A, Room 201" \
  -F "category=Broken Projector" \
  -F "description=Projector in Room 201 won't power on" \
  -F "priority=HIGH" \
  -F "contactDetails=555-0123" \
  -F "images=@evidence1.jpg" \
  -F "images=@evidence2.jpg" \
  -H "Authorization: Bearer {token}"
```

### Assign Technician (Admin)
```bash
curl -X PUT http://localhost:8080/api/tickets/42/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"technicianId": 5}'
```

### Update Ticket Status (Admin/Technician)
```bash
curl -X PUT http://localhost:8080/api/tickets/42/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "RESOLVED",
    "resolutionNotes": "Replaced lamp bulb. Tested and working."
  }'
```

### Add Comment
```bash
curl -X POST http://localhost:8080/api/tickets/42/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"content": "Thanks for the quick fix!"}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Image upload fails | Check `app.upload.dir` exists and is writable; verify file size < 10MB |
| Cannot update ticket | Verify ticket status is not CLOSED; check user has permission |
| Comment edit fails | Confirm you are the comment author or admin |
| Technician assignment not working | Ensure user exists and has TECHNICIAN role |
| Status transition rejected | Verify workflow rules; closed tickets cannot be edited |

---

## Future Enhancements

- SLA tracking (response and resolution times)
- Ticket priority auto-escalation
- Recurring/recurring incident templates
- Report generation (PDF export)
- Real-time notifications (WebSocket)
- Mobile app integration
- Integration with asset management system
