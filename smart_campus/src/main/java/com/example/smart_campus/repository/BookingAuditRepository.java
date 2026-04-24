package com.example.smart_campus.repository;

import com.example.smart_campus.model.BookingAudit;
import com.example.smart_campus.model.BookingAuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingAuditRepository extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByTimestampDesc(Long bookingId);
    List<BookingAudit> findByUserId(Long userId);
    List<BookingAudit> findByAction(BookingAuditAction action);
    List<BookingAudit> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    List<BookingAudit> findByBookingIdAndActionOrderByTimestampDesc(Long bookingId, BookingAuditAction action);
}
