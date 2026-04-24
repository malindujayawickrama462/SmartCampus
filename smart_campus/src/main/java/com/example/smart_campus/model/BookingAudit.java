package com.example.smart_campus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_audits")
public class BookingAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // User who performed the action

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingAuditAction action; // CREATE, UPDATE, APPROVE, REJECT, CANCEL

    @Column(nullable = false)
    private String details; // JSON or text describing the change

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column
    private String userIpAddress;

    @Column
    private String userAgent;

    public BookingAudit() {}

    public BookingAudit(Booking booking, User user, BookingAuditAction action, String details) {
        this.booking = booking;
        this.user = user;
        this.action = action;
        this.details = details;
    }

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BookingAuditAction getAction() { return action; }
    public void setAction(BookingAuditAction action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getUserIpAddress() { return userIpAddress; }
    public void setUserIpAddress(String userIpAddress) { this.userIpAddress = userIpAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
