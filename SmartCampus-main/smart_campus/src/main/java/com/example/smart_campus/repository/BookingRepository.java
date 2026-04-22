package com.example.smart_campus.repository;

import com.example.smart_campus.model.Booking;
import com.example.smart_campus.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByResourceId(Long resourceId);

    // Conflict detection: check overlapping bookings for same resource on same date
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.bookingDate = :date " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND b.id <> :excludeId " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflicting(@Param("resourceId") Long resourceId,
                                  @Param("date") LocalDate date,
                                  @Param("startTime") LocalTime startTime,
                                  @Param("endTime") LocalTime endTime,
                                  @Param("excludeId") Long excludeId);

    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);
}
