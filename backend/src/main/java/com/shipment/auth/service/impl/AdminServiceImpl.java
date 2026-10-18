package com.shipment.auth.service.impl;

import com.shipment.auth.dto.request.CreateAdminRequest;
import com.shipment.auth.dto.response.AdminUserResponse;
import com.shipment.auth.entity.User;
import com.shipment.auth.enums.UserRole;
import com.shipment.auth.repository.UserRepository;
import com.shipment.auth.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AdminUserResponse createAdmin(
            CreateAdminRequest request
    ) {

        if (userRepository.existsByEmail(
                request.getEmail()
        )) {
            throw new IllegalArgumentException(
                    "Email already exists"
            );
        }

        if (userRepository.existsByPhone(
                request.getPhone()
        )) {
            throw new IllegalArgumentException(
                    "Phone already exists"
            );
        }

        User admin = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone())
                .passwordHash(
                        passwordEncoder.encode(
                                request.getPassword()
                        )
                )
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        userRepository.save(admin);

        return mapToResponse(admin);
    }

    @Override
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AdminUserResponse getUserById(
            Long userId
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        return mapToResponse(user);
    }

    @Override
    public void activateUser(
            Long userId
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        user.setActive(true);

        userRepository.save(user);
    }

    @Override
    public void deactivateUser(
            Long userId
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        if (user.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Administrator accounts cannot be suspended."
            );
        }

        user.setActive(false);

        userRepository.save(user);
    }

    private AdminUserResponse mapToResponse(
            User user
    ) {

        return AdminUserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .build();
    }
}