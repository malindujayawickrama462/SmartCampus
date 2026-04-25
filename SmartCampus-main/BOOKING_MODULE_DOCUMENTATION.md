# Module B – Booking Management

## Overview
The Booking Management module enables users to request bookings for campus resources and provides administrators with tools to review and manage these requests. The system implements a complete workflow with conflict detection to prevent scheduling overlaps.

---

## Requirements Implementation

### ✅ 1. Booking Request Creation
Users can request a booking for a resource by providing:
- **Resource**: Selected from available resources
- **Date**: Future date (cannot book in past)
- **Time Range**: Start time and end time (validation: end time > start time)
- **Purpose**: Description of booking purpose
- **Expected Attendees**: Number of participants (optional but recommended)

**Implementation:**
- Frontend: `Bookings.jsx` - Request form with real-time validation
- Backend: `BookingService.createBooking()` - Creates booking with PENDING status
- Endpoint: `POST /api/bookings`

### ✅ 2. Booking Workflow: PENDING → APPROVED/REJECTED → CANCELLED
The system enforces strict state transitions:

```
PENDING ──(Admin Approve)──> APPROVED ──(Cancel)──> CANCELLED
   ↓
REJECTED
```

**Status Definitions:**
- `PENDING`: Initial state when user submits request
- `APPROVED`: Admin has approved the booking (can now be cancelled)
- `REJECTED`: Admin has rejected with reason (cannot be cancelled)
- `CANCELLED`: Booking has been cancelled (final state)

**Implementation:**
- Enum: `BookingStatus.java`
- Service: `BookingService` enforces transitions with validation
- Workflow enforcement prevents invalid state changes

### ✅ 3. Scheduling Conflict Prevention
The system prevents overlapping bookings for the same resource:

**Conflict Detection Logic:**
- Checks for overlapping time ranges on the same resource and date
- Only considers PENDING and APPROVED bookings (REJECTED/CANCELLED ignored)
- Uses database query: `BookingRepository.findConflicting()`
- Validation runs both client-side and server-side

**Server-side Query:**
```java
@Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
       "AND b.bookingDate = :date " +
       "AND b.status IN ('PENDING', 'APPROVED') " +
       "AND b.id <> :excludeId " +
       "AND b.startTime < :endTime AND b.endTime > :startTime")
List<Booking> findConflicting(...)
```

**Error Handling:**
- Throws `ConflictException` (HTTP 409) when conflicts detected
- Client shows toast notification with friendly message

### ✅ 4. Admin Approval/Rejection Workflow
Administrators can review, approve, or reject booking requests:

**Admin Capabilities:**
- View all bookings across the system (filterable by status, resource, search)
- Approve bookings with optional notes
- Reject bookings with mandatory reason
- Cancel any booking if needed

**Components:**
- Frontend: `AdminBookings.jsx` - Dedicated admin management page
- Endpoints:
  - `GET /api/bookings` - List all bookings (admin-only)
  - `GET /api/bookings?status=PENDING` - Filter by status
  - `PUT /api/bookings/{id}/approve` - Approve with note
  - `PUT /api/bookings/{id}/reject` - Reject with reason

**Notifications:**
- `NotificationService` notifies users when booking is approved/rejected
- Rejection reason is included in notification

### ✅ 5. Booking Visibility & Filters
Different views for users and admins:

**User View** (`Bookings.jsx`):
- See only their own bookings
- Filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
- Search by resource name or purpose
- Cancel own bookings (except REJECTED)

**Admin View** (`AdminBookings.jsx`):
- See all bookings in the system
- Filter by status, resource, or search query
- Approve/reject pending bookings
- Add notes during approval/rejection

---

## API Endpoints

### User Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings/my` | List user's bookings | USER |
| GET | `/api/bookings/my/status/{status}` | User's bookings by status | USER |
| GET | `/api/bookings/{id}` | Get booking details | USER/ADMIN |
| POST | `/api/bookings` | Create booking request | USER |
| PUT | `/api/bookings/{id}/cancel` | Cancel own/any booking | USER/ADMIN |

### Admin Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | List all bookings | ADMIN |
| GET | `/api/bookings?status=PENDING` | Filter by status | ADMIN |
| PUT | `/api/bookings/{id}/approve` | Approve booking | ADMIN |
| PUT | `/api/bookings/{id}/reject` | Reject booking | ADMIN |

---

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    resource_id BIGINT NOT NULL FOREIGN KEY,
    user_id BIGINT NOT NULL FOREIGN KEY,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    attendees INT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    UNIQUE KEY unique_active_booking (resource_id, booking_date, start_time, end_time, status)
);
```

---

## File Structure

### Backend
```
smart_campus/src/main/java/com/example/smart_campus/
├── model/
│   ├── Booking.java                 # JPA Entity
│   └── BookingStatus.java           # Status Enum
├── controller/
│   └── BookingController.java       # REST Endpoints
├── service/
│   └── BookingService.java          # Business Logic
├── repository/
│   └── BookingRepository.java       # Data Access
└── exception/
    ├── ConflictException.java       # Conflict errors
    └── GlobalExceptionHandler.java  # Error handling

test/java/com/example/smart_campus/
└── BookingServiceTests.java         # Comprehensive test suite (20+ tests)
```

### Frontend
```
frontend/src/
├── pages/
│   ├── Bookings.jsx                 # User booking page
│   └── AdminBookings.jsx            # Admin management page
├── lib/
│   └── api.js                       # API client
├── context/
│   └── AuthContext.jsx              # User auth context
└── index.css                        # Styling
```

---

## Features

### 1. Real-time Conflict Detection
- Client-side: Shows conflicts as user selects date/time
- Server-side: Validates before saving to prevent race conditions
- Visual indicators in schedule overview

### 2. Form Validation
- **Client-side:**
  - All required fields
  - Date must be in future
  - End time > start time
  - Attendees ≥ 1
  - Purpose cannot be empty

- **Server-side:**
  - Resource status check (must be AVAILABLE)
  - Conflict detection
  - Resource existence validation

### 3. Authorization & Security
- Users can only view own bookings
- Users can only cancel own bookings (unless admin)
- Only admins can approve/reject
- All sensitive operations use `@PreAuthorize` annotation
- Access control enforced at multiple levels

### 4. Comprehensive Workflow Enforcement
- Strict state machine transitions
- Cannot approve non-PENDING bookings
- Cannot cancel REJECTED bookings
- Admin notes captured for approval/rejection

### 5. Error Handling
- Centralized exception handling via `@RestControllerAdvice`
- Standard error response format with timestamps
- Specific HTTP status codes:
  - 409 Conflict: Scheduling conflicts
  - 400 Bad Request: Invalid state transitions
  - 403 Forbidden: Unauthorized access
  - 404 Not Found: Resource not found

---

## Usage Examples

### Creating a Booking (User)
```javascript
// POST /api/bookings
{
  "resource": { "id": 1 },
  "bookingDate": "2026-04-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "purpose": "Team Meeting",
  "attendees": 8
}
```

### Approving a Booking (Admin)
```javascript
// PUT /api/bookings/1/approve
{
  "note": "Approved - room is available"
}
```

### Rejecting a Booking (Admin)
```javascript
// PUT /api/bookings/1/reject
{
  "reason": "Conflict with another approved event"
}
```

### Cancelling a Booking (User/Admin)
```javascript
// PUT /api/bookings/1/cancel
{}
```

---

## Testing

### Test Coverage
The `BookingServiceTests` class includes 20+ test cases covering:

1. **Happy Path Tests:**
   - Create valid booking
   - Admin approval workflow
   - Admin rejection workflow
   - User cancellation

2. **Conflict Detection Tests:**
   - Overlapping bookings prevented
   - Back-to-back bookings allowed
   - Non-existent resource handling

3. **Authorization Tests:**
   - User cannot cancel others' bookings
   - Admin can cancel any booking
   - Only admins can approve/reject

4. **State Machine Tests:**
   - Cannot approve non-PENDING bookings
   - Cannot reject approved bookings
   - Cannot cancel rejected bookings
   - Cannot cancel already cancelled bookings

5. **Business Logic Tests:**
   - Out-of-service resource validation
   - Status filtering
   - User booking retrieval

### Running Tests
```bash
# Run all booking tests
mvn test -Dtest=BookingServiceTests

# Run specific test
mvn test -Dtest=BookingServiceTests#testDetectSchedulingConflict
```

---

## Admin Dashboard Navigation

To integrate AdminBookings page into navigation:

### Update App.jsx routing:
```javascript
import AdminBookings from './pages/AdminBookings.jsx';

// In route config for admin users:
<Route path="/admin/bookings" element={<AdminBookings />} />
```

### Add navbar link for admins:
```javascript
{user?.role === 'ADMIN' && (
  <a href="/admin/bookings" className="nav-link">
    Manage Bookings
  </a>
)}
```

---

## Performance Considerations

1. **Database Queries:**
   - Indexed on: `resource_id`, `booking_date`, `status`, `user_id`
   - Conflict query uses time range comparison efficiently

2. **Client-side Conflict Check:**
   - Debounced 500ms to avoid excessive API calls
   - Only checks when form fields change

3. **Pagination:**
   - Can be added to GET endpoints for large datasets
   - Currently returns all results (suitable for SME scope)

---

## Future Enhancements

1. **Calendar View:** Visual calendar with bookings displayed
2. **Recurring Bookings:** Support for repeating bookings
3. **Bulk Operations:** Approve/reject multiple bookings at once
4. **Advanced Filtering:** By date range, resource type, user department
5. **Booking Reminders:** Email notifications before scheduled bookings
6. **Analytics:** Booking statistics and resource utilization reports
7. **Waitlist:** Queue when all slots are booked
8. **Resource Availability:** Show available slots for resources

---

## Troubleshooting

### Conflict Detection Not Working
- Check server-side query in `BookingRepository.findConflicting()`
- Ensure `BookingStatus.PENDING` and `BookingStatus.APPROVED` are included
- Verify database has proper indexes

### Notifications Not Sent
- Check `NotificationService` configuration
- Verify user has valid contact information
- Check application logs for notification service errors

### Authorization Issues
- Verify user has correct role in database
- Check `@PreAuthorize` annotations on controllers
- Ensure session/token is valid

### Past Date Selection
- Client-side validation prevents past dates
- Use `today` variable: `LocalDate.now().toString()`
- Ensure system clock is synchronized on server

---

## Support & Maintenance

For issues or questions:
1. Check test cases for expected behavior
2. Review error handling in GlobalExceptionHandler
3. Verify user permissions and roles
4. Check resource availability status
5. Review database for data consistency

---

**Last Updated:** April 3, 2026
**Version:** 1.0.0
**Module Status:** ✅ Complete & Production Ready
