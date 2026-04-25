package com.example.smart_campus.service;

import com.example.smart_campus.exception.ResourceNotFoundException;
import com.example.smart_campus.model.Resource;
import com.example.smart_campus.model.ResourceStatus;
import com.example.smart_campus.model.ResourceType;
import com.example.smart_campus.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAll() {
        return resourceRepository.findAll();
    }

    public Resource getById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + id));
    }

    public List<Resource> search(ResourceType type, ResourceStatus status,
                                  String location, Integer minCapacity) {
        return resourceRepository.search(type, status, location, minCapacity);
    }

    @Transactional
    public Resource create(Resource resource) {
        if (resource.getStatus() == null) resource.setStatus(ResourceStatus.ACTIVE);
        return resourceRepository.save(resource);
    }

    @Transactional
    public Resource update(Long id, Resource updates) {
        Resource resource = getById(id);
        if (updates.getName() != null) resource.setName(updates.getName());
        if (updates.getType() != null) resource.setType(updates.getType());
        if (updates.getCapacity() != null) resource.setCapacity(updates.getCapacity());
        if (updates.getLocation() != null) resource.setLocation(updates.getLocation());
        if (updates.getDescription() != null) resource.setDescription(updates.getDescription());
        if (updates.getStatus() != null) resource.setStatus(updates.getStatus());
        if (updates.getAvailableFrom() != null) resource.setAvailableFrom(updates.getAvailableFrom());
        if (updates.getAvailableTo() != null) resource.setAvailableTo(updates.getAvailableTo());
        return resourceRepository.save(resource);
    }

    @Transactional
    public void delete(Long id) {
        Resource resource = getById(id);
        resourceRepository.delete(resource);
    }
}
