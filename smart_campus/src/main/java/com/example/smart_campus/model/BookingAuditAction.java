package com.example.smart_campus.model;

public enum BookingAuditAction {
    CREATE("Booking created"),
    UPDATE("Booking updated"),
    APPROVE("Booking approved"),
    REJECT("Booking rejected"),
    CANCEL("Booking cancelled"),
    VIEW("Booking viewed"),
    DOWNLOAD_REPORT("Report downloaded");

    private final String description;

    BookingAuditAction(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
