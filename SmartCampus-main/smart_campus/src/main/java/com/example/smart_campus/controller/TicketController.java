package com.example.smart_campus.controller;

import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.ResourceRepository;
import com.example.smart_campus.service.TicketService;
import com.example.smart_campus.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;
    private final ResourceRepository resourceRepository;

    public TicketController(TicketService ticketService, UserService userService, ResourceRepository resourceRepository) {
        this.ticketService = ticketService;
        this.userService = userService;
        this.resourceRepository = resourceRepository;
    }

    // GET /api/tickets/my - Get current user's tickets
    @GetMapping("/my")
    public ResponseEntity<List<Ticket>> getMyTickets(@AuthenticationPrincipal User user) {
        System.out.println("🔍 GET /api/tickets/my - Fetching tickets for user: " + user.getEmail());
        List<Ticket> tickets = ticketService.getMyTickets(user.getId());
        System.out.println("✅ Found " + tickets.size() + " tickets for user");
        return ResponseEntity.ok(tickets);
    }

    // GET /api/tickets/assigned - Get tickets assigned to current technician
    @GetMapping("/assigned")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<Ticket>> getAssignedTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(user.getId()));
    }

    // GET /api/tickets/technicians - Get all available technicians (ADMIN only)
    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getTechnicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    // GET /api/tickets - Get all tickets (ADMIN/TECHNICIAN)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<Ticket>> getAll(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority) {
        System.out.println("🔍 GET /api/tickets - Fetching tickets with status: " + status + ", priority: " + priority);
        List<Ticket> tickets = ticketService.getFiltered(status, priority);
        System.out.println("✅ Found " + tickets.size() + " tickets");
        return ResponseEntity.ok(tickets);
    }

    // GET /api/tickets/{id} - Get ticket detail
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getById(id));
    }

    // POST /api/tickets - Create ticket with optional images (multipart)
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Ticket> create(
            @RequestParam String location,
            @RequestParam String category,
            @RequestParam String description,
            @RequestParam TicketPriority priority,
            @RequestParam(required = false) String contactDetails,
            @RequestParam(required = false) Long resourceId,
            @RequestPart(required = false) List<MultipartFile> images,
            @AuthenticationPrincipal User user) throws IOException {

        System.out.println("📝 POST /api/tickets - Creating ticket: " + category + " at " + location + " by user: " + user.getEmail());

        Resource resource = resourceId != null
                ? resourceRepository.findById(resourceId).orElse(null)
                : null;

        Ticket ticket = Ticket.builder()
                .location(location)
                .category(category)
                .description(description)
                .priority(priority)
                .contactDetails(contactDetails)
                .resource(resource)
                .reporter(user)
                .build();

        Ticket saved = ticketService.create(ticket, images);
        System.out.println("🚀 Ticket created successfully with ID: " + saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/tickets/{id}/status - Update ticket status (ADMIN/TECHNICIAN)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id,
                                                @RequestBody Map<String, String> body,
                                                @AuthenticationPrincipal User user) {
        TicketStatus status = TicketStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ticketService.updateStatus(id, status,
                body.get("resolutionNotes"), body.get("rejectionReason"), user));
    }

    // PUT /api/tickets/{id}/assign - Assign technician (ADMIN)
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Ticket> assign(@PathVariable Long id,
                                          @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ticketService.assign(id, body.get("technicianId")));
    }

    // POST /api/tickets/{id}/comments - Add comment
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, body.get("content"), user));
    }

    // PUT /api/tickets/comments/{commentId} - Edit comment (owner only)
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<TicketComment> editComment(@PathVariable Long commentId,
                                                      @RequestBody Map<String, String> body,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.editComment(commentId, body.get("content"), user));
    }

    // DELETE /api/tickets/comments/{commentId} - Delete comment (owner or ADMIN)
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId,
                                               @AuthenticationPrincipal User user) {
        ticketService.deleteComment(commentId, user);
        return ResponseEntity.noContent().build();
    }
}
