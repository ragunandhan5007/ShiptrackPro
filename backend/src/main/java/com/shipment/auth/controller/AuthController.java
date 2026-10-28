package com.shipment.auth.controller;

import com.shipment.auth.dto.request.RegisterRequest;
import com.shipment.auth.dto.response.ApiResponse;
import com.shipment.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.shipment.auth.dto.request.VerifyEmailOtpRequest;
import com.shipment.auth.dto.request.VerifyPhoneOtpRequest;
import com.shipment.auth.dto.request.LoginRequest;
import com.shipment.auth.dto.response.LoginResponse;
import com.shipment.auth.dto.request.RefreshTokenRequest;
import com.shipment.auth.dto.response.RefreshTokenResponse;
import com.shipment.auth.dto.request.LogoutRequest;
import com.shipment.auth.dto.request.UserAnalyticsDto;


import com.shipment.auth.dto.request.SendLoginOtpRequest;
import com.shipment.auth.dto.request.VerifyLoginOtpRequest;
import com.shipment.auth.dto.response.LoginOtpResponse;

import com.shipment.auth.dto.response.UserProfileResponse;
import org.springframework.security.core.Authentication;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.shipment.auth.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        ApiResponse response = authService.register(request);

        return ResponseEntity.ok(response);
    }

//    @PostMapping("/verify-email")
//    public ResponseEntity<ApiResponse> verifyEmailOtp(
//            @Valid @RequestBody VerifyEmailOtpRequest request
//    ) {
//        return ResponseEntity.ok(
//                authService.verifyEmailOtp(request)
//        );
//    }
//
//    @PostMapping("/verify-phone")
//    public ResponseEntity<ApiResponse> verifyPhoneOtp(
//            @Valid @RequestBody VerifyPhoneOtpRequest request
//    ) {
//        return ResponseEntity.ok(
//                authService.verifyPhoneOtp(request)
//        );
//    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<RefreshTokenResponse> refreshToken(
            @Valid
            @RequestBody
            RefreshTokenRequest request
    ) {

        return ResponseEntity.ok(
                authService.refreshToken(request)
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(
            @Valid
            @RequestBody
            LogoutRequest request
    ) {

        return ResponseEntity.ok(
                authService.logout(request)
        );
    }
    @GetMapping("/analytics")
    public ResponseEntity<UserAnalyticsDto> getUserAnalytics() {

        return ResponseEntity.ok(
                authService.getUserAnalytics()
        );
    }

    @PostMapping("/login/send-otp")
    public ResponseEntity<LoginOtpResponse> sendLoginOtp(
            @Valid @RequestBody
            SendLoginOtpRequest request
    ) {

        return ResponseEntity.ok(
                authService.sendLoginOtp(request)
        );
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<LoginResponse> verifyLoginOtp(
            @Valid @RequestBody
            VerifyLoginOtpRequest request
    ) {

        return ResponseEntity.ok(
                authService.verifyLoginOtp(request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                authService.getCurrentUser(email)
        );
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                authService.getUserById(id)
        );
    }

    @GetMapping("/users-list")
    public ResponseEntity<?> getUsersList() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> java.util.Map.of(
                "id", u.getId(),
                "email", u.getEmail() != null ? u.getEmail() : "",
                "role", u.getRole() != null ? u.getRole().name() : "",
                "firstName", u.getFirstName() != null ? u.getFirstName() : "",
                "lastName", u.getLastName() != null ? u.getLastName() : "",
                "phone", u.getPhone() != null ? u.getPhone() : ""
        )).toList());
    }

    
}
