package com.shipment.auth.service.impl;

import com.shipment.auth.dto.request.RegisterRequest;
import com.shipment.auth.dto.request.VerifyEmailOtpRequest;
import com.shipment.auth.dto.request.VerifyPhoneOtpRequest;
import com.shipment.auth.dto.response.ApiResponse;
import com.shipment.auth.entity.User;
import com.shipment.auth.entity.VerificationToken;
import com.shipment.auth.enums.UserRole;
import com.shipment.auth.enums.VerificationType;
import com.shipment.auth.exception.UserAlreadyExistsException;
import com.shipment.auth.repository.UserRepository;
import com.shipment.auth.repository.VerificationTokenRepository;
import com.shipment.auth.service.AuthService;
import com.shipment.auth.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.shipment.auth.dto.request.LoginRequest;
import com.shipment.auth.dto.response.LoginResponse;
import com.shipment.auth.service.JwtService;
import com.shipment.auth.service.EmailService;
import com.shipment.auth.repository.RefreshTokenRepository;
import com.shipment.auth.entity.RefreshToken;
import com.shipment.auth.dto.request.RefreshTokenRequest;
import com.shipment.auth.dto.response.RefreshTokenResponse;
import com.shipment.auth.dto.request.LogoutRequest;
import com.shipment.auth.dto.request.ChangeRoleRequest;
import com.shipment.auth.dto.request.UserAnalyticsDto;
import com.shipment.auth.service.OtpStore;
import com.shipment.auth.util.OtpData;

import java.util.UUID;
import java.time.LocalDateTime;

import com.shipment.notification.sms.SmsService;
import com.shipment.auth.dto.request.SendLoginOtpRequest;
import com.shipment.auth.dto.response.LoginOtpResponse;
import com.shipment.auth.dto.request.VerifyLoginOtpRequest;
import com.shipment.auth.dto.response.UserProfileResponse;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository verificationTokenRepository;
    private final OtpGenerator otpGenerator;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpStore otpStore;
    private final SmsService smsService;
    @Override
    public ApiResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(
                    "Email already registered"
            );
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new UserAlreadyExistsException(
                    "Phone number already registered"
            );
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException(
                    "Passwords do not match"
            );
        }

        UserRole role;

        try {
            role = UserRole.valueOf(
                    request.getRole().toUpperCase()
            );
        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "Invalid role selected"
            );
        }

        // ADMIN cannot self-register
        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Administrator accounts can only be created by existing administrators"
            );
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim().toUpperCase())
                .lastName(request.getLastName().trim().toUpperCase())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone())
                .address(request.getAddress())
                .companyName(request.getCompanyName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();

        userRepository.save(user);

//        // Generate OTPs
//        String emailOtp = otpGenerator.generateOtp();
//        String phoneOtp = otpGenerator.generateOtp();
//
//        // Save Email OTP
//        verificationTokenRepository.save(
//                VerificationToken.builder()
//                        .userId(user.getId())
//                        .otp(emailOtp)
//                        .type(VerificationType.EMAIL)
//                        .expiryTime(LocalDateTime.now().plusMinutes(10))
//                        .used(false)
//                        .build()
//        );
//
//        // Save Phone OTP
//        verificationTokenRepository.save(
//                VerificationToken.builder()
//                        .userId(user.getId())
//                        .otp(phoneOtp)
//                        .type(VerificationType.PHONE)
//                        .expiryTime(LocalDateTime.now().plusMinutes(10))
//                        .used(false)
//                        .build()
//        );

//        // Temporary for testing
//        System.out.println("EMAIL OTP = " + emailOtp);
//        System.out.println("PHONE OTP = " + phoneOtp);

//        emailService.sendEmail(
//                user.getEmail(),
//                "Email Verification OTP",
//                "Your verification OTP is: "
//                        + emailOtp
//                        + "\n\nThis OTP will expire in 10 minutes."
//        );
//
//        System.out.println("PHONE OTP = " + phoneOtp);

        return ApiResponse.builder()
                .success(true)
                .message(
                        "Registration successful. Please login to continue."
                )
                .build();
    }

//    @Override
//    public ApiResponse verifyEmailOtp(
//            VerifyEmailOtpRequest request
//    ) {
//
//        return ApiResponse.builder()
//                .success(true)
//                .message("Email OTP verification not implemented yet")
//                .build();
//    }




    @Override
    public LoginOtpResponse sendLoginOtp(
            SendLoginOtpRequest request
    ) {

        User user = userRepository
                .findByEmail(
                        request.getEmail()
                                .trim()
                                .toLowerCase()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {

            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }
        String otp = otpGenerator.generateOtp();

        otpStore.save(
                user.getEmail(),
                otp,
                LocalDateTime.now().plusMinutes(10)
        );

        userRepository.save(user);

        System.out.println("==========================================");
        System.out.println(">>> LOGIN OTP FOR " + user.getEmail() + " : " + otp + " <<<");
        System.out.println("==========================================");

        try {
            emailService.sendEmail(
                    user.getEmail(),
                    "Login OTP",
                    "Your login OTP is: "
                            + otp
                            + "\n\nThis OTP will expire in 10 minutes."
            );
        } catch (Exception e) {
            System.err.println("Note: Email sending skipped/failed: " + e.getMessage());
        }

        // Dispatch SMS via Fast2SMS
        boolean smsSent = false;
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
            smsSent = smsService.sendOtpSms(user.getPhone(), otp);
        }

        String phoneSuffix = "";
        if (user.getPhone() != null && user.getPhone().trim().length() >= 4) {
            String p = user.getPhone().trim();
            phoneSuffix = " ending in ****" + p.substring(p.length() - 4);
        }

        String displayMessage = smsSent
                ? "OTP sent successfully via SMS to your mobile phone" + phoneSuffix
                : "OTP sent! Your verification code is: " + otp;

        return LoginOtpResponse.builder()
                .success(true)
                .message(displayMessage)
                .build();
    }

    @Override
    public LoginResponse verifyLoginOtp(
            VerifyLoginOtpRequest request
    ) {

        User user = userRepository
                .findByEmail(
                        request.getEmail()
                                .trim()
                                .toLowerCase()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

//        if (user.getLoginOtp() == null) {
//            throw new IllegalArgumentException(
//                    "Please request OTP first"
//            );
//        }
//
//        if (!user.getLoginOtp().equals(
//                request.getOtp().trim()
//        )) {
//            throw new IllegalArgumentException(
//                    "Invalid OTP"
//            );
//        }
//
//        if (user.getLoginOtpExpiry()
//                .isBefore(LocalDateTime.now())) {
//
//            throw new IllegalArgumentException(
//                    "OTP has expired"
//            );
//        }
//
//        user.setLoginOtp(null);
//        user.setLoginOtpExpiry(null);
//
//        user.setActive(true);
//
//        userRepository.save(user);

        OtpData otpData = otpStore.get(user.getEmail());

        if (otpData == null) {
            throw new IllegalArgumentException(
                    "Please request OTP first"
            );
        }

        if (otpData.getExpiry().isBefore(LocalDateTime.now())) {
            otpStore.remove(user.getEmail());

            throw new IllegalArgumentException(
                    "OTP has expired"
            );
        }

        if (!otpData.getOtp().equals(request.getOtp().trim())) {
            throw new IllegalArgumentException(
                    "Invalid OTP"
            );
        }

        otpStore.remove(user.getEmail());

        user.setActive(true);

        userRepository.save(user);

        String accessToken =
                jwtService.generateToken(user);

        String refreshTokenValue =
                UUID.randomUUID().toString();

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByUser(user)
                        .orElse(
                                RefreshToken.builder()
                                        .user(user)
                                        .build()
                        );

        refreshToken.setToken(
                refreshTokenValue
        );

        refreshToken.setExpiryTime(
                LocalDateTime.now()
                        .plusDays(7)
        );

        refreshTokenRepository.save(
                refreshToken
        );

        return LoginResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .token(accessToken)
                .refreshToken(
                        refreshTokenValue
                )
                .message(
                        "Login successful"
                )
                .build();
    }


//   here some changes done
//@Override
//public ApiResponse verifyEmailOtp(
//        VerifyEmailOtpRequest request
//) {
//
//    User user = userRepository.findByEmail(
//            request.getEmail().trim().toLowerCase()
//    ).orElseThrow(() ->
//            new IllegalArgumentException("User not found")
//    );
//
//    VerificationToken token =
//            verificationTokenRepository
//                    .findByUserIdAndOtpAndType(
//                            user.getId(),
//                            request.getOtp(),
//                            VerificationType.EMAIL
//                    )
//                    .orElseThrow(() ->
//                            new IllegalArgumentException("Invalid OTP")
//                    );
//
//    if (Boolean.TRUE.equals(token.getUsed())) {
//        throw new IllegalArgumentException(
//                "OTP already used"
//        );
//    }
//
//
//    if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
//        throw new IllegalArgumentException(
//                "OTP has expired"
//        );
//    }
//
//    user.setEmailVerified(true);
//
//    if (Boolean.TRUE.equals(user.getPhoneVerified())) {
//        user.setActive(true);
//    }
//
//    userRepository.save(user);
//
//    token.setUsed(true);
//    verificationTokenRepository.save(token);
//
//    return ApiResponse.builder()
//            .success(true)
//            .message("Email verified successfully")
//            .build();
//}

//    @Override
//    public ApiResponse verifyPhoneOtp(
//            VerifyPhoneOtpRequest request
//    ) {
//
//        return ApiResponse.builder()
//                .success(true)
//                .message("Phone OTP verification not implemented yet")
//                .build();
//    }
//    phone otp varification
//@Override
//public ApiResponse verifyPhoneOtp(
//        VerifyPhoneOtpRequest request
//) {
//
//    User user = userRepository.findByPhone(
//            request.getPhone().trim()
//    ).orElseThrow(() ->
//            new IllegalArgumentException("User not found")
//    );
//
//    VerificationToken token =
//            verificationTokenRepository
//                    .findByUserIdAndOtpAndType(
//                            user.getId(),
//                            request.getOtp().trim(),
//                            VerificationType.PHONE
//                    )
//                    .orElseThrow(() ->
//                            new IllegalArgumentException("Invalid OTP")
//                    );
//
//    if (Boolean.TRUE.equals(token.getUsed())) {
//        throw new IllegalArgumentException(
//                "OTP already used"
//        );
//    }
//
//
//
////    boolean expired =
////            token.getExpiryTime().isBefore(LocalDateTime.now());
////
////    System.out.println("Expired = " + expired);
//
//    if (token.getExpiryTime().isBefore(LocalDateTime.now())) {
//        throw new IllegalArgumentException(
//                "OTP has expired"
//        );
//    }
//
//    user.setPhoneVerified(true);
//
//    if (Boolean.TRUE.equals(user.getEmailVerified())) {
//        user.setActive(true);
//    }
//
//    userRepository.save(user);
//
//    token.setUsed(true);
//    verificationTokenRepository.save(token);
//
//    return ApiResponse.builder()
//            .success(true)
//            .message("Phone verified successfully")
//            .build();
//
//
//
//
//  }

    @Override
    public LoginResponse login(
            LoginRequest request
    ) {

        User user = userRepository
                .findByEmail(
                        request.getEmail()
                                .trim()
                                .toLowerCase()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password"
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {

            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        if (!Boolean.TRUE.equals(user.getActive())) {

            throw new IllegalArgumentException(
                    "Please verify your account first"
            );
        }
//        String token = jwtService.generateToken(user);
//        return LoginResponse.builder()
//                .email(user.getEmail())
//                .role(user.getRole().name())
//                .token(token)
//                .message("Login successful")
//                .build();
        String accessToken =
                jwtService.generateToken(user);

        String refreshTokenValue =
                UUID.randomUUID().toString();

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByUser(user)
                        .orElse(
                                RefreshToken.builder()
                                        .user(user)
                                        .build()
                        );

        refreshToken.setToken(
                refreshTokenValue
        );

        refreshToken.setExpiryTime(
                LocalDateTime.now()
                        .plusDays(7)
        );

        refreshTokenRepository.save(
                refreshToken
        );

        return LoginResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .token(accessToken)
                .refreshToken(
                        refreshTokenValue
                )
                .message("Login successful")
                .build();
    }


//    @Override
//    public RefreshTokenResponse refreshToken(
//            RefreshTokenRequest request
//    ) {
//        return null;
//    }

    @Override
    public RefreshTokenResponse refreshToken(
            RefreshTokenRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(
                                request.getRefreshToken()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid refresh token"
                                )
                        );

        if (refreshToken.getExpiryTime()
                .isBefore(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Refresh token expired"
            );
        }

        User user = refreshToken.getUser();

        String newAccessToken =
                jwtService.generateToken(user);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(
                        refreshToken.getToken()
                )
                .build();
    }

    @Override
    public ApiResponse logout(
            LogoutRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(
                                request.getRefreshToken()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid refresh token"
                                )
                        );

        refreshTokenRepository.delete(
                refreshToken
        );

        return ApiResponse.builder()
                .success(true)
                .message(
                        "Logged out successfully"
                )
                .build();
    }

    @Override
    public ApiResponse changeUserRole(
            Long userId,
            ChangeRoleRequest request
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        UserRole role;

        try {
            role = UserRole.valueOf(
                    request.getRole()
                            .trim()
                            .toUpperCase()
            );
        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "Invalid role selected"
            );
        }

        user.setRole(role);

        userRepository.save(user);

        return ApiResponse.builder()
                .success(true)
                .message(
                        "User role updated successfully"
                )
                .build();
    }

    @Override
    public UserAnalyticsDto getUserAnalytics() {
        long totalCustomers =
                userRepository.countByRole(
                        UserRole.CUSTOMER
                );

        long totalBusinessClients =
                userRepository.countByRole(
                        UserRole.BUSINESS_CLIENT
                );

        long totalLogisticsOperators =
                userRepository.countByRole(
                        UserRole.LOGISTICS_OPERATOR
                );

        long totalSupportAgents =
                userRepository.countByRole(
                        UserRole.SUPPORT_AGENT
                );

        long totalAdmins =
                userRepository.countByRole(
                        UserRole.ADMIN
                );

        long totalUsers = userRepository.count();

        long activeUsers =
                userRepository.countByActive(true);

        long inactiveUsers =
                userRepository.countByActive(false);

        return UserAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .totalCustomers(totalCustomers)
                .totalBusinessClients(totalBusinessClients)
                .totalLogisticsOperators(totalLogisticsOperators)
                .totalSupportAgents(totalSupportAgents)
                .totalAdmins(totalAdmins)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .build();
    }


    @Override
    public UserProfileResponse getCurrentUser(String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
//                .companyName(user.getCompanyName())
                .build();
    }

    @Override
    public UserProfileResponse getUserById(Long id) {

        User user = userRepository
                .findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .build();
    }
}

