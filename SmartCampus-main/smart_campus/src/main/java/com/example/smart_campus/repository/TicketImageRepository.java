package com.example.smart_campus.repository;

import com.example.smart_campus.model.TicketImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketImageRepository extends JpaRepository<TicketImage, Long> {
    List<TicketImage> findByTicketId(Long ticketId);
    long countByTicketId(Long ticketId);
}
