package com.example.smart_campus;

import com.example.smart_campus.exception.*;
import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.*;
import com.example.smart_campus.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Booking Management Tests")
class BookingServiceTests {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User testUser;
    private User adminUser;
    private Resource testResource;
    private LocalDate bookingDate;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        bookingRepository.deleteAll();
        userRepository.deleteAll();
        resourceRepository.deleteAll();

        // Create test user
        testUser = User.builder()
                .name("Test User")
                .email("user@test.com")
                .password("encoded_password")
                .role(Role.USER)
                .provider("local")
                .build();
        userRepository.save(testUser);

        // Create admin user
        adminUser = User.builder()
                .name("Admin User")
                .email("admin@test.com")
                .password("encoded_password")
                .role(Role.ADMIN)
                .provider("local")
                .build();
        userRepository.save(adminUser);

        // Create test resource
        testResource = Resource.builder()
                .name("Conference Room A")
                .description("Large conference room")
                .capacity(50)
                .location("Building A")
                .type(ResourceType.MEETING_ROOM)
                .status(ResourceStatus.AVAILABLE)
                .build();
        resourceRepository.save(testResource);

        bookingDate = LocalDate.now().plusDays(1);
    }

    @Test
    @DisplayName("User can create a booking request")
    void testCreateBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();

        Booking created = bookingService.createBooking(booking);

        assertNotNull(created.getId());
        assertEquals(BookingStatus.PENDING, created.getStatus());
        assertEquals(testUser.getId(), created.getUser().getId());
        assertEquals(testResource.getId(), created.getResource().getId());
    }

    @Test
    @DisplayName("Cannot create booking for out-of-service resource")
    void testCreateBookingForOutOfServiceResource() {
        testResource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        resourceRepository.save(testResource);

        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(booking));
    }

    @Test
    @DisplayName("Cannot create overlapping bookings for same resource")
    void testDetectSchedulingConflict() {
        // Create first booking
        Booking booking1 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Meeting 1")
                .attendees(5)
                .build();
        bookingService.createBooking(booking1);

        // Try to create overlapping booking
        Booking booking2 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(11, 30))
                .purpose("Meeting 2")
                .attendees(5)
                .build();

        assertThrows(ConflictException.class, () -> bookingService.createBooking(booking2));
    }

    @Test
    @DisplayName("Can create back-to-back bookings")
    void testBackToBackBookings() {
        // First booking: 10:00 - 11:00
        Booking booking1 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Meeting 1")
                .attendees(5)
                .build();
        bookingService.createBooking(booking1);

        // Second booking: 11:00 - 12:00 (no overlap)
        Booking booking2 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(12, 0))
                .purpose("Meeting 2")
                .attendees(5)
                .build();

        Booking created = bookingService.createBooking(booking2);
        assertNotNull(created.getId());
    }

    @Test
    @DisplayName("Admin can approve pending booking")
    void testApprovalWorkflow() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        Booking approved = bookingService.approve(created.getId(), "Approved for use", adminUser);

        assertEquals(BookingStatus.APPROVED, approved.getStatus());
        assertEquals("Approved for use", approved.getAdminNote());
    }

    @Test
    @DisplayName("Cannot approve non-PENDING booking")
    void testCannotApproveNonPendingBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        // Approve first
        bookingService.approve(created.getId(), "Approved", adminUser);

        // Try to approve again
        assertThrows(BadRequestException.class, 
                () -> bookingService.approve(created.getId(), "Approved again", adminUser));
    }

    @Test
    @DisplayName("Admin can reject pending booking")
    void testRejectionWorkflow() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        Booking rejected = bookingService.reject(created.getId(), "Conflict with other event", adminUser);

        assertEquals(BookingStatus.REJECTED, rejected.getStatus());
        assertEquals("Conflict with other event", rejected.getAdminNote());
    }

    @Test
    @DisplayName("Cannot reject non-PENDING booking")
    void testCannotRejectApprovedBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        // Approve first
        bookingService.approve(created.getId(), "Approved", adminUser);

        // Try to reject approved booking
        assertThrows(BadRequestException.class, 
                () -> bookingService.reject(created.getId(), "Cannot reject now", adminUser));
    }

    @Test
    @DisplayName("User can cancel own booking")
    void testCancelOwnBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        Booking cancelled = bookingService.cancel(created.getId(), testUser);

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
    }

    @Test
    @DisplayName("User cannot cancel other user's booking")
    void testCannotCancelOthersBooking() {
        User otherUser = User.builder()
                .name("Other User")
                .email("other@test.com")
                .password("encoded_password")
                .role(Role.USER)
                .build();
        userRepository.save(otherUser);

        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        assertThrows(ForbiddenException.class, () -> bookingService.cancel(created.getId(), otherUser));
    }

    @Test
    @DisplayName("Admin can cancel any booking")
    void testAdminCanCancelAnyBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        Booking cancelled = bookingService.cancel(created.getId(), adminUser);

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
    }

    @Test
    @DisplayName("Cannot cancel rejected booking")
    void testCannotCancelRejectedBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        bookingService.reject(created.getId(), "Rejected", adminUser);

        assertThrows(BadRequestException.class, () -> bookingService.cancel(created.getId(), testUser));
    }

    @Test
    @DisplayName("Cannot cancel already cancelled booking")
    void testCannotCancelAlreadyCancelledBooking() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Team Meeting")
                .attendees(10)
                .build();
        Booking created = bookingService.createBooking(booking);

        bookingService.cancel(created.getId(), testUser);

        assertThrows(BadRequestException.class, () -> bookingService.cancel(created.getId(), testUser));
    }

    @Test
    @DisplayName("User can view own bookings")
    void testGetUserBookings() {
        Booking booking1 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Meeting 1")
                .attendees(5)
                .build();
        bookingService.createBooking(booking1);

        Booking booking2 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate.plusDays(1))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .purpose("Meeting 2")
                .attendees(5)
                .build();
        bookingService.createBooking(booking2);

        List<Booking> userBookings = bookingService.getMyBookings(testUser.getId());

        assertEquals(2, userBookings.size());
    }

    @Test
    @DisplayName("Admin can view all bookings")
    void testGetAllBookings() {
        Booking booking = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Meeting")
                .attendees(5)
                .build();
        bookingService.createBooking(booking);

        List<Booking> allBookings = bookingService.getAllBookings();

        assertEquals(1, allBookings.size());
    }

    @Test
    @DisplayName("Can filter bookings by status")
    void testFilterByStatus() {
        Booking booking1 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .purpose("Meeting 1")
                .attendees(5)
                .build();
        Booking created1 = bookingService.createBooking(booking1);

        Booking booking2 = Booking.builder()
                .resource(testResource)
                .user(testUser)
                .bookingDate(bookingDate.plusDays(1))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .purpose("Meeting 2")
                .attendees(5)
                .build();
        Booking created2 = bookingService.createBooking(booking2);
        assertNotNull(created2.getId());

        bookingService.approve(created1.getId(), "Approved", adminUser);

        List<Booking> approvedBookings = bookingService.getAllByStatus(BookingStatus.APPROVED);
        List<Booking> pendingBookings = bookingService.getAllByStatus(BookingStatus.PENDING);

        assertEquals(1, approvedBookings.size());
        assertEquals(1, pendingBookings.size());
    }
}
