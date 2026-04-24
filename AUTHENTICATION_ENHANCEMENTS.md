# User Authentication Enhancement for Booking Management

## Overview
Comprehensive authentication enhancements have been implemented for the Smart Campus booking management system to provide robust user authentication, session management, and audit logging capabilities.

## Implemented Features

### 1. **Token Refresh Mechanism** ✅
- **Goal**: Keep users logged in during long booking sessions without forcing re-authentication
- **Implementation**:
  - Created `RefreshToken` entity for secure token refresh
  - Enhanced `JwtUtils` with refresh token generation and validation
  - Updated `AuthController` with `/auth/refresh` endpoint
  - Frontend automatically refreshes tokens every 50 minutes (before 1-hour expiration)
  - Implemented token refresh interceptor in API client

**Components**:
- Backend: `RefreshTokenRepository`, enhanced `JwtUtils`, updated `AuthController`
- Frontend: Enhanced `AuthContext` with automatic token refresh, API interceptor

### 2. **Booking Operation Audit Logging** ✅
- **Goal**: Track all booking-related operations with user authentication details
- **Implementation**:
  - Created `BookingAudit` entity to log all booking changes
  - Created `BookingAuditAction` enum for audit actions (CREATE, UPDATE, APPROVE, REJECT, CANCEL, VIEW, DOWNLOAD_REPORT)
  - Enhanced `BookingService` to automatically log all booking modifications
  - Added `/api/bookings/{id}/audit` endpoint to retrieve booking history
  - Added `/api/bookings/audit/user/{userId}` endpoint (admin only) to view user activity

**Data Tracked**:
- Action performed (CREATE, APPROVE, REJECT, CANCEL)
- User who performed the action
- Timestamp of the action
- Detailed description of changes
- User IP address and User-Agent (for security analysis)

### 3. **Booking History with Authentication Trail** ✅
- **Goal**: Maintain complete history of booking modifications with authentication details
- **Implementation**:
  - Booking audit automatically records who did what and when
  - Users can view audit history for their own bookings
  - Admins can view complete audit trails for all bookings
  - Audit entries include user identity and action details

**Endpoints**:
- `GET /api/bookings/{id}/audit` - Get booking audit history (User or Admin)
- `GET /api/bookings/audit/user/{userId}` - Get user's all activities (Admin only)

### 4. **User Session Management & Concurrent Booking Limits** ✅
- **Goal**: Prevent users from creating excessive concurrent bookings and track active sessions
- **Implementation**:
  - Created `UserSession` entity to track user login sessions
  - Enhanced `AuthController` to create session records on login
  - Session tracking includes IP address, user agent, device fingerprint
  - Implemented concurrent booking limit (max 5 active concurrent bookings)
  - Added `/api/bookings/my/concurrent-count` endpoint to check current count
  - Session invalidation on logout with automatic token revocation

**Session Data Tracked**:
- Session token
- Login/logout timestamps
- IP address
- User agent (browser/device info)
- Device fingerprint for additional security

### 5. **Secure Admin Authentication for Booking Approvals** ✅
- **Goal**: Add extra security layer for sensitive admin operations
- **Implementation**:
  - Admin approval/rejection endpoints require `@PreAuthorize("hasRole('ADMIN')")` annotation
  - Admin user identity is logged in audit trail
  - Admin note/reason is recorded for all admin actions
  - Access control prevents non-admins from accessing these endpoints

**Secure Endpoints**:
- `PUT /api/bookings/{id}/approve` - Approve booking (Admin only)
- `PUT /api/bookings/{id}/reject` - Reject booking (Admin only)
- `GET /api/bookings` - View all bookings (Admin only)
- `GET /api/bookings/audit/user/{userId}` - View user activity (Admin only)

## Database Schema Changes

### New Entities
```
RefreshToken
- id (Long)
- user_id (Foreign Key)
- token (String, unique)
- expiry_date (LocalDateTime)
- revoked (Boolean)
- created_at (LocalDateTime)
- revoked_at (LocalDateTime)

BookingAudit
- id (Long)
- booking_id (Foreign Key)
- user_id (Foreign Key)
- action (Enum: CREATE, UPDATE, APPROVE, REJECT, CANCEL, VIEW, DOWNLOAD_REPORT)
- details (String)
- timestamp (LocalDateTime)
- user_ip_address (String)
- user_agent (String)

UserSession
- id (Long)
- user_id (Foreign Key)
- session_token (String)
- login_time (LocalDateTime)
- logout_time (LocalDateTime)
- active (Boolean)
- active_booking_count (Integer)
- ip_address (String)
- user_agent (String)
- device_fingerprint (String)
```

## API Endpoints Changes

### Authentication Endpoints (Enhanced)
```
POST /api/auth/register
- New Response: { accessToken, refreshToken, sessionId, expiresIn }

POST /api/auth/login
- New Request: { email, password, deviceFingerprint }
- New Response: { accessToken, refreshToken, sessionId, expiresIn }

POST /api/auth/refresh (NEW)
- Request: { refreshToken }
- Response: { accessToken, expiresIn }

POST /api/auth/logout (NEW)
- Request: { sessionId }
- Response: { message }
```

### Booking Endpoints (Enhanced)
```
GET /api/bookings/my/concurrent-count (NEW)
- Response: { activeConcurrentBookings: Integer }

GET /api/bookings/{id}/audit (NEW)
- Response: [BookingAudit] - Only accessible by booking owner or admin

GET /api/bookings/audit/user/{userId} (NEW)
- Response: [BookingAudit] - Admin only

POST /api/bookings (Enhanced)
- Now checks concurrent booking limit (max 5)
- Returns 409 Conflict if limit exceeded

PUT /api/bookings/{id}/approve (Enhanced Security)
- Logs admin action with admin name and timestamp

PUT /api/bookings/{id}/reject (Enhanced Security)
- Logs admin action with rejection reason
```

## Frontend Changes

### AuthContext.jsx (Enhanced)
```javascript
// New features:
- Automatic token refresh every 50 minutes
- Session ID and refresh token management
- Device fingerprint generation and storage
- Improved logout with server-side token invalidation
- Token refresh timer management
```

### Login.jsx (Updated)
```javascript
// New features:
- Device fingerprint generation on login
- Sends fingerprint to backend for session tracking
- Handles new response format (accessToken, refreshToken, sessionId)
- Enhanced error handling
```

### Register.jsx (Updated)
```javascript
// New features:
- Handles new response format from registration endpoint
- Creates authenticated session immediately after registration
```

### API Client (api.js) (Enhanced)
```javascript
// New features:
- Response interceptor for 401 (Unauthorized) errors
- Automatic token refresh on 401
- Request queue for concurrent requests during token refresh
- Automatic logout and redirect to login on token refresh failure
```

## Security Features Added

1. **Token Expiration Management**
   - Access tokens expire in 1 hour
   - Refresh tokens expire in 7 days
   - Automatic cleanup of expired tokens

2. **Session Tracking**
   - Device fingerprinting for session validation
   - IP address logging for suspicious activity detection
   - User-Agent tracking for device identification
   - Session invalidation on logout

3. **Audit Logging**
   - Complete audit trail of all booking modifications
   - User identity tied to each action
   - Timestamp for forensic analysis
   - Admin-only access to sensitive audit data

4. **Access Control**
   - Role-based access control for admin operations
   - Booking ownership validation
   - Concurrent booking limits to prevent abuse

5. **Token Security**
   - Refresh tokens can be revoked
   - Tokens stored securely in localStorage (can be upgraded to secure cookies)
   - Automatic token refresh without user intervention

## Configuration Required

### Backend (application.properties)
```properties
app.jwt.secret=your-secret-key-here
app.jwt.expiration=3600000
app.jwt.refresh.expiration=604800000
```

### Database Migration
Run the following to create new tables:
```sql
CREATE TABLE refresh_tokens (...);
CREATE TABLE booking_audits (...);
CREATE TABLE user_sessions (...);
```

## Usage Examples

### Frontend - Automatic Token Refresh
```javascript
// No manual refresh needed - automatic handling
const { user, loginWithToken, logout } = useAuth();

// Token automatically refreshes every 50 minutes
// Failed requests with 401 automatically refresh and retry
```

### Frontend - Check Concurrent Bookings
```javascript
const response = await api.get('/bookings/my/concurrent-count');
console.log(response.data.activeConcurrentBookings); // e.g., 3
```

### Frontend - View Booking Audit History
```javascript
const auditHistory = await api.get(`/bookings/${bookingId}/audit`);
// Returns array of BookingAudit objects with timestamps and user info
```

### Backend - Admin Views User Activity
```java
// GET /api/bookings/audit/user/{userId}
// Returns all booking operations performed by that user
// Only accessible by ADMIN role
```

## Testing Recommendations

1. **Token Refresh Test**
   - Login and wait ~50 minutes
   - Verify token is automatically refreshed
   - Check that session continues without interruption

2. **Concurrent Booking Test**
   - Create 5 bookings (should succeed)
   - Attempt to create 6th booking (should fail with 409 Conflict)
   - Cancel one booking
   - Create new booking (should succeed)

3. **Audit Trail Test**
   - Create booking
   - Approve/reject as admin
   - Cancel booking
   - View audit history to verify all actions are logged

4. **Session Management Test**
   - Login on one device
   - Check active sessions
   - Logout from one session
   - Verify session is invalidated

5. **Security Test**
   - Attempt to access admin endpoints with regular user (should fail)
   - Attempt to modify other user's bookings (should fail)
   - Check that refresh tokens are invalidated on logout

## Future Enhancements

1. **Multi-factor Authentication (MFA)**
   - Add TOTP/SMS verification for enhanced security

2. **Session Device Trust**
   - Remember trusted devices to skip MFA on known devices

3. **Passwordless Authentication**
   - Implement magic links or biometric authentication

4. **Rate Limiting**
   - Add rate limiting on authentication endpoints

5. **Booking Restrictions by Time**
   - Implement time-based booking windows

6. **Advanced Audit Analytics**
   - Dashboard for admin to view booking trends
   - Anomaly detection for suspicious booking patterns

## Troubleshooting

### Token Refresh Not Working
- Verify `app.jwt.refresh.expiration` is set correctly
- Check that `RefreshTokenRepository` is properly injected
- Ensure `RefreshToken` table exists in database

### Concurrent Booking Limit Not Enforced
- Verify the limit check in `BookingController.create()` method
- Check that `BookingService.getActiveConcurrentBookings()` is called

### Audit Log Not Recording
- Verify `BookingAuditRepository` is properly injected
- Check that `BookingAudit` table exists in database
- Ensure `@Transactional` annotation is present on service methods

### Session Not Tracking
- Verify `UserSessionRepository` is properly injected
- Check device fingerprint generation in frontend
- Ensure `UserSession` table exists in database

---

**Last Updated**: April 24, 2026
**Status**: ✅ All Features Implemented
