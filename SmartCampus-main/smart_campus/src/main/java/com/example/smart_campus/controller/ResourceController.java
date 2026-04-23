package com.example.smart_campus.controller;

import com.example.smart_campus.model.Resource;
import com.example.smart_campus.model.ResourceStatus;
import com.example.smart_campus.model.ResourceType;
import com.example.smart_campus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    // GET /api/resources - Get all or filtered resources (public)
    @GetMapping
    public ResponseEntity<List<Resource>> getAll(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {

        if (type != null || status != null || location != null || minCapacity != null) {
            return ResponseEntity.ok(resourceService.search(type, status, location, minCapacity));
        }
        return ResponseEntity.ok(resourceService.getAll());
    }

    // GET /api/resources/{id} - Get single resource (public)
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    // POST /api/resources - Create resource (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> create(@Valid @RequestBody Resource resource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.create(resource));
    }

    // PUT /api/resources/{id} - Update resource (ADMIN only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> update(@PathVariable Long id,
                                            @RequestBody Resource updates) {
        return ResponseEntity.ok(resourceService.update(id, updates));
    }

    // DELETE /api/resources/{id} - Delete resource (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
