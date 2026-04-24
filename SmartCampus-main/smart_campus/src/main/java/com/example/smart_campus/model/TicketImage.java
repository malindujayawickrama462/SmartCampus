package com.example.smart_campus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ticket_images")
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

    public TicketImage() {
    }

    public TicketImage(Long id, Ticket ticket, String filePath, String originalName, String contentType) {
        this.id = id;
        this.ticket = ticket;
        this.filePath = filePath;
        this.originalName = originalName;
        this.contentType = contentType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Ticket getTicket() {
        return ticket;
    }

    public void setTicket(Ticket ticket) {
        this.ticket = ticket;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    // Builder pattern
    public static TicketImageBuilder builder() {
        return new TicketImageBuilder();
    }

    public static class TicketImageBuilder {
        private Long id;
        private Ticket ticket;
        private String filePath;
        private String originalName;
        private String contentType;

        public TicketImageBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TicketImageBuilder ticket(Ticket ticket) {
            this.ticket = ticket;
            return this;
        }

        public TicketImageBuilder filePath(String filePath) {
            this.filePath = filePath;
            return this;
        }

        public TicketImageBuilder originalName(String originalName) {
            this.originalName = originalName;
            return this;
        }

        public TicketImageBuilder contentType(String contentType) {
            this.contentType = contentType;
            return this;
        }

        public TicketImage build() {
            return new TicketImage(id, ticket, filePath, originalName, contentType);
        }
    }
}
