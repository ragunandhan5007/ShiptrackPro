package com.shipment.pod.service;

import com.shipment.pod.client.ShipmentClient;
import com.shipment.pod.dto.ProofOfDeliveryRequest;
import com.shipment.pod.dto.ProofOfDeliveryResponse;
import com.shipment.pod.entity.ProofOfDelivery;
import com.shipment.pod.repository.ProofOfDeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.shipment.pod.service.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import com.shipment.pod.client.ShipmentClient;
import com.shipment.pod.dto.ShipmentAnalyticsDataResponse;

import java.time.LocalDateTime;
import java.util.List;
import com.shipment.pod.client.AuthClient;
import com.shipment.pod.dto.UserProfileResponse;
@Service
@RequiredArgsConstructor
public class ProofOfDeliveryService {

    private final ProofOfDeliveryRepository repository;
    private final CloudinaryService cloudinaryService;
    private final ShipmentClient shipmentClient;
    private final AuthClient authClient;
//    public ProofOfDelivery create(
//            ProofOfDeliveryRequest request) {

public ProofOfDelivery create(
        ProofOfDeliveryRequest request,
        MultipartFile photo) throws IOException {
//    UserProfileResponse currentUser = authClient.getCurrentUser();
//
//    if (!"CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
//        throw new RuntimeException(
//                "Only customers can upload Proof of Delivery."
//        );
//    }

    UserProfileResponse currentUser = authClient.getCurrentUser();

    if (!"LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
        throw new RuntimeException(
                "Only logistics operators can upload Proof of Delivery."
        );
    }

    ShipmentAnalyticsDataResponse shipment =
            shipmentClient.getShipmentForVerification(
                    request.getShipmentId()
            );

// Shipment must belong to the logged-in customer
//    if (shipment.getCustomerId() == null ||
//            !shipment.getCustomerId().equals(currentUser.getId())) {
//
//        throw new RuntimeException(
//                "You are not allowed to upload Proof of Delivery for this shipment."
//        );
//    }

    if (shipment.getDriverId() == null) {
        throw new RuntimeException(
                "This shipment has not been assigned to an operator."
        );
    }

    if (!shipment.getDriverId().equals(currentUser.getId())) {
        throw new RuntimeException(
                "You are not assigned to this shipment."
        );
    }

    String photoUrl = cloudinaryService.uploadImage(photo);

    // If POD already exists, update it with new photo and signature
    var existingOpt = repository.findByShipmentId(request.getShipmentId());
    if (existingOpt.isPresent()) {
        ProofOfDelivery existing = existingOpt.get();
        existing.setRecipientName(request.getRecipientName());
        existing.setRecipientPhone(request.getRecipientPhone());
        existing.setDeliveryNotes(request.getDeliveryNotes());
        existing.setPhotoUrl(photoUrl);
        existing.setSignatureUrl(request.getSignatureUrl());
        existing.setCapturedAt(LocalDateTime.now());
        existing.setVerificationStatus("PENDING");
        return repository.save(existing);
    }

//    if (shipment.getDriverId() == null) {
//        throw new RuntimeException(
//                "This shipment has not been assigned to an operator."
//        );
//    }
//
//    if (!shipment.getDriverId().equals(currentUser.getId())) {
//        throw new RuntimeException(
//                "You are not assigned to this shipment."
//        );
//    }
        ProofOfDelivery pod = ProofOfDelivery.builder()
                .shipmentId(request.getShipmentId())
                .recipientName(request.getRecipientName())
                .signatureUrl(request.getSignatureUrl())
                .photoUrl(photoUrl)
                .deliveryNotes(request.getDeliveryNotes())
                .recipientPhone(request.getRecipientPhone())
                .verificationStatus("PENDING")
                .capturedAt(LocalDateTime.now())
                .build();

        return repository.save(pod);
    }

//    public List<ProofOfDelivery> getByShipment(Long shipmentId) {
//        return repository.findByShipmentId(shipmentId);
//    }
//public ProofOfDelivery getByShipment(Long shipmentId) {
//    return repository.findByShipmentId(shipmentId)
//            .orElseThrow();
//}

    public ProofOfDelivery getByShipment(Long shipmentId) {

        UserProfileResponse currentUser =
                authClient.getCurrentUser();

        ShipmentAnalyticsDataResponse shipment =
                shipmentClient.getShipmentForVerification(shipmentId);

        // ADMIN, SUPPORT_AGENT, and LOGISTICS_OPERATOR can view any POD
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())
                || "SUPPORT_AGENT".equalsIgnoreCase(currentUser.getRole())
                || "LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
            return repository.findByShipmentId(shipmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Proof of Delivery not found.")
                    );
        }

        // CUSTOMER can view only their own shipment's POD
        if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {

            if (shipment.getCustomerId() == null ||
                    !shipment.getCustomerId().equals(currentUser.getId())) {

                throw new RuntimeException(
                        "You are not allowed to view this Proof of Delivery."
                );
            }

            return repository.findByShipmentId(shipmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Proof of Delivery not found.")
                    );
        }

        // BUSINESS CLIENT can view POD only for shipment they created
        if ("BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {

            if (shipment.getBusinessClientId() == null ||
                    !shipment.getBusinessClientId().equals(currentUser.getId())) {

                throw new RuntimeException(
                        "You are not allowed to view this Proof of Delivery."
                );
            }

            return repository.findByShipmentId(shipmentId)
                    .orElseThrow(() ->
                            new RuntimeException("Proof of Delivery not found.")
                    );
        }

        // Assigned operator can view the POD too
//        if ("LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
//
//            if (shipment.getDriverId() == null ||
//                    !shipment.getDriverId().equals(currentUser.getId())) {
//
//                throw new RuntimeException(
//                        "You are not allowed to view this Proof of Delivery."
//                );
//            }
//
//            return repository.findByShipmentId(shipmentId)
//                    .orElseThrow(() ->
//                            new RuntimeException("Proof of Delivery not found.")
//                    );
//        }

        throw new RuntimeException(
                "You are not allowed to view this Proof of Delivery."
        );
    }

//    public List<ProofOfDelivery> getByDriver(Long driverId) {
//        return repository.findByDriverId(driverId);
//    }

//    public List<ProofOfDelivery> getPendingVerification() {
//        return repository.findByVerified(false);
//    }
//public List<ProofOfDelivery> getPendingVerification() {
//    return repository.findByVerificationStatus("PENDING");
//}

    public List<ProofOfDelivery> getPendingVerification() {

        UserProfileResponse currentUser =
                authClient.getCurrentUser();

        // Only Business Client can access pending PODs
//        if (!"BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {
//            throw new RuntimeException(
//                    "Only business clients can view pending Proofs of Delivery."
//            );
//        }

        if (!"CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException(
                    "Only customers can view pending Proofs of Delivery."
            );
        }

        return repository.findByVerificationStatus("PENDING")
                .stream()
                .filter(pod -> {

                    ShipmentAnalyticsDataResponse shipment =
                            shipmentClient.getShipmentForVerification(
                                    pod.getShipmentId()
                            );

                    // Return only PODs belonging to shipments

                    return shipment.getCustomerId() != null
                            && shipment.getCustomerId()
                            .equals(currentUser.getId());
                })
                .toList();
    }
//    public ProofOfDelivery verify(Long id) {
//
//        ProofOfDelivery pod =
//                repository.findById(id)
//                        .orElseThrow();
//
//        pod.setVerified(true);
//
//        return repository.save(pod);
//    }

//    public ProofOfDelivery verify(Long id)
//public ProofOfDelivery verify(Long id, Long businessClientId)
//    {
//
//
//        ProofOfDelivery pod = repository.findById(id)
//                .orElseThrow();
//
//
//        ShipmentAnalyticsDataResponse shipment =
//                shipmentClient.getShipmentForVerification(
//                        pod.getShipmentId()
//                );
//
//        if (!shipment.getBusinessClientId().equals(businessClientId)) {
//            throw new RuntimeException(
//                    "You are not allowed to verify this Proof of Delivery."
//            );
//        }
//
//
//        pod.setVerificationStatus("VERIFIED");
//        pod.setVerifiedAt(LocalDateTime.now());
//
////        extra feature ==========
////        pod.setVerifiedBy(businessClientId);
//        return repository.save(pod);
//    }

public ProofOfDelivery verify(Long id) {

    // Get the actual logged-in user from JWT
    UserProfileResponse currentUser =
            authClient.getCurrentUser();

    // Only customers can verify POD
//    if (!"BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {
//        throw new RuntimeException(
//                "Only business clients can verify Proof of Delivery."
//        );
//    }
    if (!"CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
        throw new RuntimeException(
                "Only customers can verify Proof of Delivery."
        );
    }

    ProofOfDelivery pod = repository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("Proof of Delivery not found.")
            );

    if ("VERIFIED".equalsIgnoreCase(pod.getVerificationStatus())) {
        throw new RuntimeException(
                "This Proof of Delivery has already been verified."
        );
    }
    // Get shipment ownership from Shipment Service
    ShipmentAnalyticsDataResponse shipment =
            shipmentClient.getShipmentForVerification(
                    pod.getShipmentId()
            );

    // The logged-in customers must own this shipment
//    if (shipment.getBusinessClientId() == null ||
//            !shipment.getBusinessClientId().equals(currentUser.getId())) {
//
//        throw new RuntimeException(
//                "You are not allowed to verify this Proof of Delivery."
//        );
//    }
    if (shipment.getCustomerId() == null ||
            !shipment.getCustomerId().equals(currentUser.getId())) {

        throw new RuntimeException(
                "You are not allowed to verify this Proof of Delivery."
        );
    }

    pod.setVerificationStatus("VERIFIED");
    pod.setVerifiedAt(LocalDateTime.now());

    // Record who actually verified it
    pod.setVerifiedBy(currentUser.getId());

    return repository.save(pod);
}
//public ProofOfDelivery verify(Long podId, Long businessClientId) {
//
//    ProofOfDelivery pod = repository.findById(podId)
//            .orElseThrow();
//
//    pod.setVerificationStatus("VERIFIED");
//    pod.setVerifiedAt(LocalDateTime.now());
//    pod.setVerifiedBy(businessClientId);
//
//    return repository.save(pod);
//}
//    public PodAnalyticsDto getAnalytics() {
//
//        long totalProofs =
//                repository.count();
//
////        long verifiedProofs =
////                repository.findByVerified(true)
////                        .size();
////
////        long pendingProofs =
////                repository.findByVerified(false)
////                        .size();
////        long verifiedProofs =
////                repository.countByVerified(true);
////
////        long pendingProofs =
////                repository.countByVerified(false);
//        long verifiedProofs =
//                repository.findByVerificationStatus("VERIFIED").size();
//
//        long pendingProofs =
//                repository.findByVerificationStatus("PENDING").size();
//
//        double verificationRate = 0.0;
//
//        if (totalProofs > 0) {
//            verificationRate =
//                    ((double) verifiedProofs / totalProofs) * 100;
//        }
//
//        return PodAnalyticsDto.builder()
//                .totalProofs(totalProofs)
//                .verifiedProofs(verifiedProofs)
//                .pendingProofs(pendingProofs)
//                .verificationRate(verificationRate)
//                .build();
//    }
//public List<ProofOfDelivery> getAll() {
//    return repository.findAll();
//}
//public List<ProofOfDeliveryResponse> getAll() {
//
//
//    UserProfileResponse currentUser =
//            authClient.getCurrentUser();
//
//    if (!"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
//        throw new RuntimeException(
//                "Only admin can view all Proofs of Delivery."
//        );
//    }
//
//
//    return repository.findAll()
//            .stream()
//            .map(pod -> {
//
//                ShipmentAnalyticsDataResponse shipment =
//                        shipmentClient.getShipmentForVerification(
//                                pod.getShipmentId()
//                        );
//
//                return ProofOfDeliveryResponse.builder()
//                        .id(pod.getId())
//                        .shipmentId(pod.getShipmentId())
//                        .trackingNumber(shipment.getTrackingNumber())
//                        .recipientName(pod.getRecipientName())
//                        .recipientPhone(pod.getRecipientPhone())
//                        .signatureUrl(pod.getSignatureUrl())
//                        .photoUrl(pod.getPhotoUrl())
//                        .deliveryNotes(pod.getDeliveryNotes())
//                        .verificationStatus(pod.getVerificationStatus())
//                        .verifiedBy(pod.getVerifiedBy())
//                        .verifiedAt(pod.getVerifiedAt())
//                        .capturedAt(pod.getCapturedAt())
//                        .build();
//            })
//            .toList();
//}



public List<ProofOfDeliveryResponse> getAll() {

    UserProfileResponse currentUser =
            authClient.getCurrentUser();

    return repository.findAll()
            .stream()
            .map(pod -> {

                ShipmentAnalyticsDataResponse shipment =
                        shipmentClient.getShipmentForVerification(
                                pod.getShipmentId()
                        );

                boolean allowed = false;

                // Admin, Support Agent, and Logistics Operator see all PODs
                if ("ADMIN".equalsIgnoreCase(currentUser.getRole())
                        || "SUPPORT_AGENT".equalsIgnoreCase(currentUser.getRole())
                        || "LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
                    allowed = true;
                }

                // Business Client sees PODs only for shipments they created
                else if ("BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {
                    allowed =
                            shipment.getBusinessClientId() != null
                                    && shipment.getBusinessClientId()
                                    .equals(currentUser.getId());
                }

                // Customer sees PODs only for their shipments
                else if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
                    allowed =
                            shipment.getCustomerId() != null
                                    && shipment.getCustomerId()
                                    .equals(currentUser.getId());
                }

                if (!allowed) {
                    return null;
                }

                return ProofOfDeliveryResponse.builder()
                        .id(pod.getId())
                        .shipmentId(pod.getShipmentId())
                        .trackingNumber(shipment.getTrackingNumber())
                        .recipientName(pod.getRecipientName())
                        .recipientPhone(pod.getRecipientPhone())
                        .signatureUrl(pod.getSignatureUrl())
                        .photoUrl(pod.getPhotoUrl())
                        .deliveryNotes(pod.getDeliveryNotes())
                        .verificationStatus(pod.getVerificationStatus())
                        .verifiedBy(pod.getVerifiedBy())
                        .verifiedAt(pod.getVerifiedAt())
                        .capturedAt(pod.getCapturedAt())
                        .build();
            })
            .filter(response -> response != null)
            .toList();
}
}