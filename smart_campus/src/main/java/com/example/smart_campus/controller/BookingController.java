package com.example.smart_campus.controller;

import com.example.smart_campus.model.*;
import com.example.smart_campus.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // GET /api/bookings/my - Get current user's bookings
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getId()));
    }

    // GET /api/bookings/my/status/{status} - Get user's bookings by status
    @GetMapping("/my/status/{status}")
    public ResponseEntity<List<Booking>> getMyBookingsByStatus(
            @PathVariable BookingStatus status,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getUserBookingsByStatus(user.getId(), status));
    }

    // GET /api/bookings - Get all bookings (ADMIN only, optional status filter)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAll(
            @RequestParam(required = false) BookingStatus status) {
        if (status != null) return ResponseEntity.ok(bookingService.getAllByStatus(status));
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // GET /api/bookings/{id} - Get specific booking
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getById(@PathVariable Long id,
                                            @AuthenticationPrincipal User user) {
        Booking booking = bookingService.getById(id);
        // Users can only view their own bookings unless they are admins
        if (!booking.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(booking);
    }

    // POST /api/bookings - Create a booking request
    @PostMapping
    public ResponseEntity<Booking> create(@RequestBody Booking booking,
                                          @AuthenticationPrincipal User user) {
        booking.setUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(booking));
    }

    // PUT /api/bookings/{id}/approve - Approve booking (ADMIN)
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> approve(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, String> body,
                                            @AuthenticationPrincipal User admin) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(bookingService.approve(id, note, admin));
    }

    // PUT /api/bookings/{id}/reject - Reject booking (ADMIN)
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Booking> reject(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal User admin) {
        String reason = body != null ? body.get("reason") : "No reason provided";
        return ResponseEntity.ok(bookingService.reject(id, reason, admin));
    }

    // PUT /api/bookings/{id}/cancel - Cancel booking (owner or ADMIN)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancel(@PathVariable Long id,
                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancel(id, user));
    }
}
