package com.example.smart_campus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_comments")
public class TicketComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User author;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public TicketComment() {
    }

    public TicketComment(Long id, Ticket ticket, User author, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.ticket = ticket;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Builder pattern
    public static TicketCommentBuilder builder() {
        return new TicketCommentBuilder();
    }

    public static class TicketCommentBuilder {
        private Long id;
        private Ticket ticket;
        private User author;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public TicketCommentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TicketCommentBuilder ticket(Ticket ticket) {
            this.ticket = ticket;
            return this;
        }

        public TicketCommentBuilder author(User author) {
            this.author = author;
            return this;
        }

        public TicketCommentBuilder content(String content) {
            this.content = content;
            return this;
        }

        public TicketCommentBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TicketCommentBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public TicketComment build() {
            return new TicketComment(id, ticket, author, content, createdAt, updatedAt);
        }
    }
}
