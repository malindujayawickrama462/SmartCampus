package com.example.smart_campus.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ticket_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String filePath;

    private String originalName;

    private String contentType;
}
