package com.example.smart_campus.service;

import com.example.smart_campus.exception.*;
import com.example.smart_campus.model.*;
import com.example.smart_campus.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketImageRepository ticketImageRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, 
                         TicketImageRepository ticketImageRepository,
                         TicketCommentRepository ticketCommentRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.ticketImageRepository = ticketImageRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Value("${app.upload.dir}")
    private String uploadDir;

    public Ticket getById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + id));
    }

    public List<Ticket> getAll() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getMyTickets(Long userId) {
        return ticketRepository.findByReporterId(userId);
    }

    public List<Ticket> getAssignedTickets(Long userId) {
        return ticketRepository.findByAssigneeId(userId);
    }

    public List<Ticket> getFiltered(TicketStatus status, TicketPriority priority) {
        if (status != null && priority != null) return ticketRepository.findByStatusAndPriority(status, priority);
        if (status != null) return ticketRepository.findByStatus(status);
        if (priority != null) return ticketRepository.findByPriority(priority);
        return ticketRepository.findAll();
    }

    @Transactional
    public Ticket create(Ticket ticket, List<MultipartFile> images) throws IOException {
        Ticket saved = ticketRepository.save(ticket);

        if (images != null && !images.isEmpty()) {
            if (images.size() > 3) throw new BadRequestException("Maximum 3 images allowed per ticket");
            for (MultipartFile file : images) {
                String filePath = storeFile(file);
                TicketImage img = TicketImage.builder()
                        .ticket(saved)
                        .filePath(filePath)
                        .originalName(file.getOriginalFilename())
                        .contentType(file.getContentType())
                        .build();
                ticketImageRepository.save(img);
            }
        }
        return saved;
    }

    @Transactional
    public Ticket updateStatus(Long id, TicketStatus newStatus, String notes,
                                String rejectionReason, User currentUser) {
        Ticket ticket = getById(id);
        
        // Authorization: Only ADMIN, TECHNICIAN assigned to ticket, or reporter can update
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isTechnician = ticket.getAssignee() != null && ticket.getAssignee().getId().equals(currentUser.getId());
        boolean isReporter = ticket.getReporter().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isTechnician && !isReporter) {
            throw new ForbiddenException("You don't have permission to update this ticket");
        }
        
        // Only ADMIN can reject or change status arbitrarily
        if (newStatus == TicketStatus.REJECTED && !isAdmin) {
            throw new ForbiddenException("Only admins can reject tickets");
        }
        
        // Workflow validation
        TicketStatus currentStatus = ticket.getStatus();
        if (currentStatus == TicketStatus.CLOSED) {
            throw new BadRequestException("Cannot update a closed ticket");
        }
        
        ticket.setStatus(newStatus);
        if (notes != null) ticket.setResolutionNotes(notes);
        if (rejectionReason != null && newStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(rejectionReason);
        }
        Ticket saved = ticketRepository.save(ticket);

        notificationService.notify(ticket.getReporter(), "TICKET_STATUS_CHANGED",
                "Your ticket #" + id + " status updated to " + newStatus.name(), id);
        return saved;
    }

    @Transactional
    public Ticket assign(Long ticketId, Long technicianId) {
        Ticket ticket = getById(ticketId);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        ticket.setAssignee(technician);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        return ticketRepository.save(ticket);
    }

    @Transactional
    public TicketComment addComment(Long ticketId, String content, User author) {
        Ticket ticket = getById(ticketId);
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .content(content)
                .build();
        TicketComment saved = ticketCommentRepository.save(comment);

        // Notify reporter if commenter is not the reporter
        if (!author.getId().equals(ticket.getReporter().getId())) {
            notificationService.notify(ticket.getReporter(), "NEW_COMMENT",
                    "New comment on your ticket #" + ticketId, ticketId);
        }
        return saved;
    }

    @Transactional
    public TicketComment editComment(Long commentId, String content, User currentUser) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        comment.setContent(content);
        return ticketCommentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        boolean isOwner = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You cannot delete this comment");
        }
        ticketCommentRepository.delete(comment);
    }

    private String storeFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), uploadPath.resolve(filename),
                StandardCopyOption.REPLACE_EXISTING);
        return uploadDir + "/" + filename;
    }
}
