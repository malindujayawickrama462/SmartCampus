package com.example.smart_campus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 200, message = "Location must be between 2 and 200 characters")
    @Column(nullable = false)
    private String location;

    @NotBlank(message = "Category is required")
    @Size(min = 2, max = 100, message = "Category must be between 2 and 100 characters")
    @Column(nullable = false)
    private String category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    @Column(nullable = false, length = 2000)
    private String description;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    private String contactDetails;

    @Column(length = 2000)
    private String resolutionNotes;

    private String rejectionReason;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketComment> comments = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Ticket() {}

    public Ticket(Long id, Resource resource, User reporter, User assignee, String location, String category, String description, TicketPriority priority, TicketStatus status, String contactDetails, String resolutionNotes, String rejectionReason, List<TicketImage> images, List<TicketComment> comments, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.resource = resource;
        this.reporter = reporter;
        this.assignee = assignee;
        this.location = location;
        this.category = category;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.contactDetails = contactDetails;
        this.resolutionNotes = resolutionNotes;
        this.rejectionReason = rejectionReason;
        if (images != null) this.images = images;
        if (comments != null) this.comments = comments;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        status = TicketStatus.OPEN;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Resource getResource() { return resource; }
    public void setResource(Resource resource) { this.resource = resource; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }
    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }
    public String getContactDetails() { return contactDetails; }
    public void setContactDetails(String contactDetails) { this.contactDetails = contactDetails; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public List<TicketImage> getImages() { return images; }
    public void setImages(List<TicketImage> images) { this.images = images; }
    public List<TicketComment> getComments() { return comments; }
    public void setComments(List<TicketComment> comments) { this.comments = comments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Simple Builder
    public static TicketBuilder builder() {
        return new TicketBuilder();
    }

    public static class TicketBuilder {
        private Long id;
        private Resource resource;
        private User reporter;
        private User assignee;
        private String location;
        private String category;
        private String description;
        private TicketPriority priority;
        private TicketStatus status;
        private String contactDetails;
        private String resolutionNotes;
        private String rejectionReason;
        private List<TicketImage> images = new ArrayList<>();
        private List<TicketComment> comments = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public TicketBuilder id(Long id) { this.id = id; return this; }
        public TicketBuilder resource(Resource resource) { this.resource = resource; return this; }
        public TicketBuilder reporter(User reporter) { this.reporter = reporter; return this; }
        public TicketBuilder assignee(User assignee) { this.assignee = assignee; return this; }
        public TicketBuilder location(String location) { this.location = location; return this; }
        public TicketBuilder category(String category) { this.category = category; return this; }
        public TicketBuilder description(String description) { this.description = description; return this; }
        public TicketBuilder priority(TicketPriority priority) { this.priority = priority; return this; }
        public TicketBuilder status(TicketStatus status) { this.status = status; return this; }
        public TicketBuilder contactDetails(String contactDetails) { this.contactDetails = contactDetails; return this; }
        public TicketBuilder resolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; return this; }
        public TicketBuilder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public TicketBuilder images(List<TicketImage> images) { if (images != null) this.images = images; return this; }
        public TicketBuilder comments(List<TicketComment> comments) { if (comments != null) this.comments = comments; return this; }
        public TicketBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public TicketBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Ticket build() {
            return new Ticket(id, resource, reporter, assignee, location, category, description, priority, status, contactDetails, resolutionNotes, rejectionReason, images, comments, createdAt, updatedAt);
        }
    }
}
