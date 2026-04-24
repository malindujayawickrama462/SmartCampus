package com.example.smart_campus.model;

public enum NotificationType {
    // Booking Notifications
    BOOKING_CREATED("Your booking request has been submitted", "info"),
    BOOKING_APPROVED("Your booking has been approved", "success"),
    BOOKING_REJECTED("Your booking has been rejected", "warning"),
    BOOKING_CANCELLED("Your booking has been cancelled", "info"),
    
    // Admin Notifications
    ADMIN_BOOKING_PENDING("New booking request pending approval", "info"),
    ADMIN_BOOKING_CANCELLED("A booking has been cancelled", "info"),
    
    // Ticket Notifications
    TICKET_CREATED("Your ticket has been created", "info"),
    TICKET_UPDATED("A ticket you're following has been updated", "info"),
    TICKET_COMMENT("New comment on a ticket", "info"),
    
    // General
    SYSTEM_MESSAGE("System message", "info");

    private final String defaultMessage;
    private final String severity; // info, success, warning, error

    NotificationType(String defaultMessage, String severity) {
        this.defaultMessage = defaultMessage;
        this.severity = severity;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public String getSeverity() {
        return severity;
    }
}
