package com.example.smart_campus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalTime;

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Resource name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Resource type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 200, message = "Location must be between 2 and 200 characters")
    @Column(nullable = false)
    private String location;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    // Availability window (daily)
    private LocalTime availableFrom;
    private LocalTime availableTo;

    @NotNull(message = "Resource status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status;

    private String imageUrl;

    public Resource() {}

    public Resource(Long id, String name, ResourceType type, Integer capacity, String location, String description, LocalTime availableFrom, LocalTime availableTo, ResourceStatus status, String imageUrl) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.capacity = capacity;
        this.location = location;
        this.description = description;
        this.availableFrom = availableFrom;
        this.availableTo = availableTo;
        this.status = status;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalTime getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; }
    public LocalTime getAvailableTo() { return availableTo; }
    public void setAvailableTo(LocalTime availableTo) { this.availableTo = availableTo; }
    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    // Simple Builder
    public static ResourceBuilder builder() {
        return new ResourceBuilder();
    }

    public static class ResourceBuilder {
        private Long id;
        private String name;
        private ResourceType type;
        private Integer capacity;
        private String location;
        private String description;
        private LocalTime availableFrom;
        private LocalTime availableTo;
        private ResourceStatus status;
        private String imageUrl;

        public ResourceBuilder id(Long id) { this.id = id; return this; }
        public ResourceBuilder name(String name) { this.name = name; return this; }
        public ResourceBuilder type(ResourceType type) { this.type = type; return this; }
        public ResourceBuilder capacity(Integer capacity) { this.capacity = capacity; return this; }
        public ResourceBuilder location(String location) { this.location = location; return this; }
        public ResourceBuilder description(String description) { this.description = description; return this; }
        public ResourceBuilder availableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; return this; }
        public ResourceBuilder availableTo(LocalTime availableTo) { this.availableTo = availableTo; return this; }
        public ResourceBuilder status(ResourceStatus status) { this.status = status; return this; }
        public ResourceBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }

        public Resource build() {
            return new Resource(id, name, type, capacity, location, description, availableFrom, availableTo, status, imageUrl);
        }
    }
}
