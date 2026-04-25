package com.example.smart_campus.dto;

import com.example.smart_campus.model.Notification;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String type;
    private String message;
    private boolean isRead;
    private Long referenceId;
    private LocalDateTime createdAt;

    public NotificationDto() {
    }

    public NotificationDto(Long id, String type, String message, boolean isRead, Long referenceId, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.isRead = isRead;
        this.referenceId = referenceId;
        this.createdAt = createdAt;
    }

    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getReferenceId(),
                notification.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
