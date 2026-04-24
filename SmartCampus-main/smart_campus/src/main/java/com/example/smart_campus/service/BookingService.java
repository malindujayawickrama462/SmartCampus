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

    public BookingService(BookingRepository bookingRepository, ResourceRepository resourceRepository, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
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
        return bookingRepository.save(booking);
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
        notificationService.notify(booking.getUser(), "BOOKING_APPROVED",
                "Your booking for " + booking.getResource().getName() + " has been approved.", id);
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
        notificationService.notify(booking.getUser(), "BOOKING_REJECTED",
                "Your booking for " + booking.getResource().getName() + " was rejected: " + reason, id);
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
        
        // Notify the user about cancellation
        notificationService.notify(booking.getUser(), "BOOKING_CANCELLED",
                "Your booking for " + booking.getResource().getName() + " has been cancelled.", id);
        
        return saved;
    }
    
    @Transactional
    public List<Booking> getUserBookingsByStatus(Long userId, BookingStatus status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }
}
