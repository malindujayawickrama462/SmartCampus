package com.example.smart_campus.service;

import com.example.smart_campus.exception.*;
import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final BookingAuditRepository bookingAuditRepository;
    private final UserSessionRepository userSessionRepository;

    public BookingService(BookingRepository bookingRepository, 
                          ResourceRepository resourceRepository, 
                          NotificationService notificationService,
                          BookingAuditRepository bookingAuditRepository,
                          UserSessionRepository userSessionRepository) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
        this.bookingAuditRepository = bookingAuditRepository;
        this.userSessionRepository = userSessionRepository;
    }

    public Booking getById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));
    }

    public List<Booking> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getAllByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    @Transactional
    public Booking createBooking(Booking booking) {
        Resource resource = resourceRepository.findById(booking.getResource().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Resource is currently out of service");
        }

        // Check for scheduling conflicts
        List<Booking> conflicts = bookingRepository.findConflicting(
                resource.getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                -1L // no booking to exclude (new booking)
        );
        if (!conflicts.isEmpty()) {
            throw new ConflictException("The resource is already booked during the requested time slot");
        }

        booking.setResource(resource);
        booking.setStatus(BookingStatus.PENDING);
        Booking saved = bookingRepository.save(booking);
        
        // Log audit trail
        logBookingAudit(saved, booking.getUser(), BookingAuditAction.CREATE,
                "Booking created for " + resource.getName() + " on " + booking.getBookingDate());
        
        // Send notification to user that booking was created
        notificationService.notifyBookingCreated(saved);
        
        // Notify admins about pending booking
        notificationService.notifyAdminPendingBooking(saved);
        
        return saved;
    }

    @Transactional
    public Booking approve(Long id, String adminNote, User admin) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminNote(adminNote);
        Booking saved = bookingRepository.save(booking);
        
        // Log audit trail
        logBookingAudit(saved, admin, BookingAuditAction.APPROVE,
                "Booking approved by admin. Note: " + (adminNote != null ? adminNote : "None"));
        
        // Send notification to user
        notificationService.notifyBookingApproved(saved, adminNote);
        
        return saved;
    }

    @Transactional
    public Booking reject(Long id, String reason, User admin) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only PENDING bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminNote(reason);
        Booking saved = bookingRepository.save(booking);
        
        // Log audit trail
        logBookingAudit(saved, admin, BookingAuditAction.REJECT,
                "Booking rejected. Reason: " + (reason != null ? reason : "No reason provided"));
        
        // Send notification to user
        notificationService.notifyBookingRejected(saved, reason);
        
        return saved;
    }

    @Transactional
    public Booking cancel(Long id, User currentUser) {
        Booking booking = getById(id);
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not authorised to cancel this booking");
        }
        
        // Validate workflow: Can only cancel PENDING or APPROVED bookings
        if (booking.getStatus() == BookingStatus.REJECTED) {
            throw new BadRequestException("Cannot cancel a REJECTED booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        
        // Log audit trail
        String cancelledBy = isOwner ? "User" : "Admin";
        logBookingAudit(saved, currentUser, BookingAuditAction.CANCEL,
                "Booking cancelled by " + cancelledBy);
        
        // Send notification to user
        notificationService.notifyBookingCancelled(saved);
        
        return saved;
    }
    
    @Transactional
    public List<Booking> getUserBookingsByStatus(Long userId, BookingStatus status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }

    @Transactional
    private void logBookingAudit(Booking booking, User user, BookingAuditAction action, String details) {
        BookingAudit audit = new BookingAudit(booking, user, action, details);
        bookingAuditRepository.save(audit);
    }

    // Get booking audit history
    @Transactional(readOnly = true)
    public List<BookingAudit> getBookingAuditHistory(Long bookingId) {
        return bookingAuditRepository.findByBookingIdOrderByTimestampDesc(bookingId);
    }

    // Get user's booking audit activity (for admins)
    @Transactional(readOnly = true)
    public List<BookingAudit> getUserAuditActivity(Long userId) {
        return bookingAuditRepository.findByUserId(userId);
    }

    // Check concurrent booking limits
    @Transactional(readOnly = true)
    public Integer getActiveConcurrentBookings(Long userId) {
        List<Booking> activeBookings = bookingRepository.findByUserId(userId).stream()
                .filter(b -> b.getStatus() == BookingStatus.APPROVED || b.getStatus() == BookingStatus.PENDING)
                .toList();
        return activeBookings.size();
    }

    // Get active sessions for user
    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(Long userId, User user) {
        if (!user.getId().equals(userId) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Not authorized to view sessions");
        }
        return userSessionRepository.findByUserAndActiveTrue(new User(userId, null, null, null, null, null, null, null, null));
    }
}

