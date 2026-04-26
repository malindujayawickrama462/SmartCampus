package com.example.smart_campus.service;

import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.NotificationRepository;
import com.example.smart_campus.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, 
                               UserRepository userRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<Notification> getMyNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    @Transactional
    public void notify(User user, String type, String message, Long referenceId) {
        try {
            NotificationType notificationType = NotificationType.valueOf(type);
            Notification notification = Notification.builder()
                    .user(user)
                    .type(notificationType)
                    .message(message)
                    .referenceId(referenceId)
                    .isRead(false)
                    .actionUrl(generateActionUrl(notificationType, referenceId))
                    .build();
            notificationRepository.save(notification);
            
            sendWebSocketNotification(user, type, message, referenceId, notification.getId());
        } catch (IllegalArgumentException e) {
            // Fallback for legacy string types
            Notification notification = Notification.builder()
                    .user(user)
                    .type(NotificationType.SYSTEM_MESSAGE)
                    .message(message)
                    .referenceId(referenceId)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
            
            sendWebSocketNotification(user, "SYSTEM_MESSAGE", message, referenceId, notification.getId());
        }
    }

    private void sendWebSocketNotification(User user, String type, String message, Long referenceId, Long notificationId) {
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend(
                "/topic/notifications/" + user.getId(),
                Map.of(
                    "id", notificationId != null ? notificationId : 0L,
                    "type", type,
                    "message", message,
                    "referenceId", referenceId != null ? referenceId : 0L
                )
            );
        }
    }

    @Transactional
    public void notifyBookingCreated(Booking booking) {
        Notification notification = Notification.builder()
                .user(booking.getUser())
                .type(NotificationType.BOOKING_CREATED)
                .message("Your booking for " + booking.getResource().getName() + " has been submitted for approval")
                .details("Booking Date: " + booking.getBookingDate() + ", Time: " + booking.getStartTime() + " - " + booking.getEndTime())
                .referenceId(booking.getId())
                .isRead(false)
                .actionUrl("/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notification);

        sendWebSocketNotification(booking.getUser(), "BOOKING_CREATED", notification.getMessage(), booking.getId(), notification.getId());
    }

    @Transactional
    public void notifyBookingApproved(Booking booking, String adminNote) {
        Notification notification = Notification.builder()
                .user(booking.getUser())
                .type(NotificationType.BOOKING_APPROVED)
                .message("Your booking for " + booking.getResource().getName() + " has been approved")
                .details(adminNote != null ? "Admin Note: " + adminNote : "")
                .referenceId(booking.getId())
                .isRead(false)
                .actionUrl("/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notification);
        
        sendWebSocketNotification(booking.getUser(), "BOOKING_APPROVED", notification.getMessage(), booking.getId(), notification.getId());
    }

    @Transactional
    public void notifyBookingRejected(Booking booking, String reason) {
        Notification notification = Notification.builder()
                .user(booking.getUser())
                .type(NotificationType.BOOKING_REJECTED)
                .message("Your booking for " + booking.getResource().getName() + " has been rejected")
                .details("Reason: " + (reason != null ? reason : "No reason provided"))
                .referenceId(booking.getId())
                .isRead(false)
                .actionUrl("/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notification);
        
        sendWebSocketNotification(booking.getUser(), "BOOKING_REJECTED", notification.getMessage(), booking.getId(), notification.getId());
    }

    @Transactional
    public void notifyBookingCancelled(Booking booking) {
        Notification notification = Notification.builder()
                .user(booking.getUser())
                .type(NotificationType.BOOKING_CANCELLED)
                .message("Your booking for " + booking.getResource().getName() + " has been cancelled")
                .details("Booking Date: " + booking.getBookingDate())
                .referenceId(booking.getId())
                .isRead(false)
                .actionUrl("/bookings/" + booking.getId())
                .build();
        notificationRepository.save(notification);
        
        sendWebSocketNotification(booking.getUser(), "BOOKING_CANCELLED", notification.getMessage(), booking.getId(), notification.getId());
    }

    @Transactional
    public void notifyAdminPendingBooking(Booking booking) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        
        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.ADMIN_BOOKING_PENDING)
                    .message("New booking request from " + booking.getUser().getName() + " for " + booking.getResource().getName())
                    .details("Request Time: " + booking.getCreatedAt() + ", Booking Date: " + booking.getBookingDate())
                    .referenceId(booking.getId())
                    .isRead(false)
                    .actionUrl("/admin/bookings/" + booking.getId())
                    .build();
            notificationRepository.save(notification);
            
            sendWebSocketNotification(admin, "ADMIN_BOOKING_PENDING", notification.getMessage(), booking.getId(), notification.getId());
        }
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUser_IdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private String generateActionUrl(NotificationType type, Long referenceId) {
        if (referenceId == null) return "/notifications";
        
        return switch (type) {
            case BOOKING_CREATED, BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED -> 
                "/bookings/" + referenceId;
            case ADMIN_BOOKING_PENDING, ADMIN_BOOKING_CANCELLED -> 
                "/admin/bookings/" + referenceId;
            case TICKET_CREATED, TICKET_UPDATED, TICKET_COMMENT -> 
                "/tickets/" + referenceId;
            default -> "/notifications";
        };
    }
}
