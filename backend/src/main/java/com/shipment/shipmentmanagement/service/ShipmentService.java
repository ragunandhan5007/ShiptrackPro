
package com.shipment.shipmentmanagement.service;

import com.shipment.shipmentmanagement.dto.*;
import com.shipment.shipmentmanagement.entity.Shipment;
import com.shipment.shipmentmanagement.repository.ShipmentRepository;
import org.springframework.stereotype.Service;
import com.shipment.shipmentmanagement.entity.enums.ShipmentStatus;
import com.shipment.shipmentmanagement.dto.CustomerLookupResponse;
import com.shipment.shipmentmanagement.repository.HubRepository;

import java.time.LocalDateTime;
import java.util.UUID;
import com.shipment.shipmentmanagement.client.AuthClient;
import com.shipment.shipmentmanagement.client.NotificationClient;
import com.shipment.shipmentmanagement.entity.Hub;
import com.shipment.shipmentmanagement.dto.TrackingResponse;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.time.Duration;
@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final NotificationClient notificationClient;
    private final AuthClient authClient;
    private final RouteService routeService;
    private final HubRepository hubRepository;

    public ShipmentService(ShipmentRepository shipmentRepository, NotificationClient notificationClient, AuthClient authClient, RouteService routeService, HubRepository hubRepository) {
        this.shipmentRepository = shipmentRepository;
        this.notificationClient = notificationClient;
        this.authClient = authClient;
        this.routeService = routeService;
        this.hubRepository = hubRepository;
    }

    // Create Shipment
//    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//    public Shipment saveShipment(Shipment shipment) {
//        return shipmentRepository.save(shipment);
//    }
//    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//========================================================
//    public Shipment saveShipment(Shipment shipment) {
//
//        if (shipment.getStatus() == null) {
//            shipment.setStatus(ShipmentStatus.CREATED);
//        }
//
//        if (shipment.getTrackingNumber() == null || shipment.getTrackingNumber().isBlank()) {
//            shipment.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
//        }
//
//        return shipmentRepository.save(shipment);
//    }

    public Shipment saveShipment(Shipment shipment) {

        if (shipment.getStatus() == null) {
            shipment.setStatus(ShipmentStatus.CREATED);
        }

        if (shipment.getTrackingNumber() == null
                || shipment.getTrackingNumber().isBlank()) {
            shipment.setTrackingNumber(
                    "TRK-" + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase()
            );
        }

        // Get logged-in Business Client
        UserProfileResponse currentUser =
                authClient.getCurrentUser();

        if (!"BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException(
                    "Only business clients can create shipments."
            );
        }

        shipment.setBusinessClientId(
                currentUser.getId()
        );
        // Find registered customer by receiver phone and name
        CustomerLookupResponse customer =
                authClient.findCustomer(
                        shipment.getReceiverPhone(),
                        shipment.getReceiverName()
                );



        shipment.setCustomerId(customer.getId());

        Shipment savedShipment = shipmentRepository.save(shipment);

        List<Hub> route =
                routeService.generateRoute(
                        savedShipment.getSenderCity(),
                        savedShipment.getReceiverCity()
                );

        routeService.saveRoute(
                savedShipment.getId(),
                route
        );

//        NotificationRequest request = new NotificationRequest();
//        request.setUserId(1L); // Temporary operator user
//        request.setShipmentId(savedShipment.getId());
//        request.setChannel("IN_APP");
//        request.setTitle("New Shipment Created");
//        request.setMessage(
//                "Shipment " + savedShipment.getTrackingNumber()
//                        + " requires operator review."
//        );
//        request.setPriority("NORMAL");
        List<OperatorResponse> operators = authClient.getOperators();

        for (OperatorResponse operator : operators) {

            NotificationRequest request = new NotificationRequest();

            request.setUserId(operator.getId());
            request.setShipmentId(savedShipment.getId());
            request.setChannel("IN_APP");
            request.setTitle("New Shipment Created");
            request.setMessage(
                    "Shipment " + savedShipment.getTrackingNumber()
                            + " requires operator review."
            );
            request.setPriority("NORMAL");

            notificationClient.createNotification(request);
        }

//        notificationClient.createNotification(request);
        System.out.println("Shipment Type = " + savedShipment.getShipmentType());
        System.out.println("Priority = " + savedShipment.getPriority());
        return savedShipment;
    }


//==============================================================


//    public List<Shipment> getAllShipments() {
//        return shipmentRepository.findAllByOrderByCreatedAtDesc();
//    }
//    public List<Shipment> getShipmentsByCustomer(Long customerId) {
//        return shipmentRepository.findByCustomerId(customerId);
//    }
//    ========================================================================================
//public List<Shipment> getAllShipments() {
//
//    // Get the currently logged-in user from Auth Service
//    UserProfileResponse currentUser = authClient.getCurrentUser();
//
//    // Return only shipments created by this Business Client
//    return shipmentRepository.findByBusinessClientId(
//            currentUser.getId()
//    );
//}

    public List<Shipment> getAllShipments() {

        UserProfileResponse currentUser = authClient.getCurrentUser();

        System.out.println("CURRENT USER ID = " + currentUser.getId());
        // ADMIN and SUPPORT_AGENT can see every shipment
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())
                || "SUPPORT_AGENT".equalsIgnoreCase(currentUser.getRole())) {
            return shipmentRepository.findAllByOrderByCreatedAtDesc();
        }

        // BUSINESS CLIENT can see only their own shipments
        if ("BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {
            return shipmentRepository.findByBusinessClientId(
                    currentUser.getId()
            );
        }

        // OPERATOR can see:
// 1. All CREATED shipments not yet accepted
// 2. Shipments already assigned to this operator
        if ("LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
            return shipmentRepository.findShipmentsForOperator(
                    currentUser.getId(),
                    ShipmentStatus.CREATED
            );
        }

        throw new RuntimeException(
                "You are not authorized to access this shipment list."
        );
    }
//    ===================================================================================================
    public List<Shipment> getMyCustomerShipments() {

        UserProfileResponse currentUser = authClient.getCurrentUser();

        if (!"CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException(
                    "Only customers can access their shipments."
            );
        }

        return shipmentRepository.findByCustomerIdOrderByCreatedAtDesc(
                currentUser.getId()
        );
    }

    // Get Shipment By Id
//    public Shipment getShipmentById(Long id) {
//        return shipmentRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Shipment not found with id: " ));
//    }
    public Shipment getShipmentById(Long id) {

        UserProfileResponse currentUser = authClient.getCurrentUser();

        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Shipment not found with id: " + id));

        // ADMIN and SUPPORT_AGENT can access every shipment
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())
                || "SUPPORT_AGENT".equalsIgnoreCase(currentUser.getRole())) {
            return shipment;
        }

        // BUSINESS CLIENT can access only shipments created by them
        if ("BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())) {

            if (shipment.getBusinessClientId() != null
                    && shipment.getBusinessClientId().equals(currentUser.getId())) {
                return shipment;
            }

            throw new RuntimeException(
                    "You are not authorized to access this shipment."
            );
        }

        // CUSTOMER can access only their own shipment
        if ("CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {

            if (shipment.getCustomerId() != null
                    && shipment.getCustomerId().equals(currentUser.getId())) {
                return shipment;
            }

            throw new RuntimeException(
                    "You are not authorized to access this shipment."
            );
        }

        // OPERATOR:
        // unaccepted CREATED shipment → all operators can view it
        // accepted shipment → only assigned operator can view it
        if ("LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {

            if (shipment.getStatus() == ShipmentStatus.CREATED
                    && shipment.getDriverId() == null) {
                return shipment;
            }

            if (shipment.getDriverId() != null
                    && shipment.getDriverId().equals(currentUser.getId())) {
                return shipment;
            }

            throw new RuntimeException(
                    "This shipment is assigned to another operator."
            );
        }

        throw new RuntimeException(
                "You are not authorized to access this shipment."
        );
    }

    // Update Shipment
    public Shipment updateShipment(Long id, Shipment shipmentDetails) {

        UserProfileResponse currentUser = authClient.getCurrentUser();

        if (!"BUSINESS_CLIENT".equalsIgnoreCase(currentUser.getRole())
                && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {

            throw new RuntimeException(
                    "Only business clients or admin can update shipment details."
            );
        }


        Shipment shipment = getShipmentById(id);

        shipment.setTrackingNumber(shipmentDetails.getTrackingNumber());
        shipment.setSenderName(shipmentDetails.getSenderName().toUpperCase().trim());
        shipment.setSenderPhone(shipmentDetails.getSenderPhone());

        shipment.setReceiverName(shipmentDetails.getReceiverName().toUpperCase().trim());
        shipment.setReceiverPhone(shipmentDetails.getReceiverPhone());

//        shipment.setDeliveryAddress(shipmentDetails.getDeliveryAddress());
//        shipment.setDeliveryCity(shipmentDetails.getDeliveryCity());
//        shipment.setDeliveryState(shipmentDetails.getDeliveryState());
//        shipment.setDeliveryZip(shipmentDetails.getDeliveryZip());
//        shipment.setDeliveryCountry(shipmentDetails.getDeliveryCountry());
        shipment.setReceiverAddress(shipmentDetails.getReceiverAddress());
        shipment.setReceiverCity(shipmentDetails.getReceiverCity());
        shipment.setReceiverState(shipmentDetails.getReceiverState());
        shipment.setReceiverPostalCode(shipmentDetails.getReceiverPostalCode());
        shipment.setReceiverCountry(shipmentDetails.getReceiverCountry());

        shipment.setPackageWeightKg(shipmentDetails.getPackageWeightKg());
        shipment.setPackageDescription(shipmentDetails.getPackageDescription());
        shipment.setPackageType(shipmentDetails.getPackageType());

        shipment.setStatus(shipmentDetails.getStatus());

        return shipmentRepository.save(shipment);
    }

    // Delete Shipment
    public void deleteShipment(Long id) {

        Shipment shipment = getShipmentById(id);
        shipmentRepository.delete(shipment);
    }


public ShipmentAnalyticsDto getShipmentAnalytics() {

    long totalShipments = shipmentRepository.count();

    long deliveredShipments =
            shipmentRepository.countByStatus(
                    ShipmentStatus.DELIVERED
            );

    double deliverySuccessRate = 0.0;

    if (totalShipments > 0) {
        deliverySuccessRate =
                ((double) deliveredShipments / totalShipments) * 100;
    }

    List<Shipment> deliveredShipmentList =
            shipmentRepository.findByStatus(
                    ShipmentStatus.DELIVERED
            );

    List<Shipment> validDeliveredShipments =
            deliveredShipmentList.stream()
                    .filter(s ->
                            s.getCreatedAt() != null
                                    && s.getDeliveredAt() != null
                    )
                    .toList();

    double averageDeliveryTimeDays = 0.0;

    if (!validDeliveredShipments.isEmpty()) {

        double totalDays =
                validDeliveredShipments.stream()
                        .mapToLong(s ->
                                Duration.between(
                                        s.getCreatedAt(),
                                        s.getDeliveredAt()
                                ).toDays()
                        )
                        .sum();

        averageDeliveryTimeDays =
                totalDays / validDeliveredShipments.size();
    }

    return ShipmentAnalyticsDto.builder()
            .totalShipments(totalShipments)

            .createdShipments(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.CREATED
                    )
            )

            .pickedUpShipments(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.PICKED_UP
                    )
            )

            .inTransitShipments(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.IN_TRANSIT
                    )
            )

            .outForDeliveryShipments(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.OUT_FOR_DELIVERY
                    )
            )

            .deliveredShipments(deliveredShipments)

            .failedDeliveries(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.FAILED_DELIVERY
                    )
            )

            .cancelledShipments(
                    shipmentRepository.countByStatus(
                            ShipmentStatus.CANCELLED
                    )
            )

            .deliverySuccessRate(
                    deliverySuccessRate
            )

            .averageDeliveryTimeDays(
                    averageDeliveryTimeDays
            )

            .build();
}

    public CustomerShipmentAnalyticsDto getCustomerAnalytics(
            Long customerId
    ) {

        long totalShipments =
                shipmentRepository.countByCustomerId(customerId);

        long deliveredShipments =
                shipmentRepository.countByCustomerIdAndStatus(
                        customerId,
                        ShipmentStatus.DELIVERED
                );

        long inTransitShipments =
                shipmentRepository.countByCustomerIdAndStatus(
                        customerId,
                        ShipmentStatus.IN_TRANSIT
                );

        long activeShipments =
                totalShipments - deliveredShipments;

        long pendingShipments =
                shipmentRepository.countByCustomerIdAndStatus(
                        customerId,
                        ShipmentStatus.CREATED
                );

//        return CustomerShipmentAnalyticsDto.builder()
//                .totalShipments(totalShipments)
//                .deliveredShipments(deliveredShipments)
//                .inTransitShipments(inTransitShipments)
//                .activeShipments(activeShipments)
//                .build();
        return CustomerShipmentAnalyticsDto.builder()
                .totalShipments(totalShipments)
                .deliveredShipments(deliveredShipments)
                .inTransitShipments(inTransitShipments)
                .activeShipments(activeShipments)
                .pendingShipments(pendingShipments)
                .build();
    }

    public BusinessShipmentAnalyticsDto getBusinessAnalytics(
            Long businessClientId
    ) {

        long totalShipments =
                shipmentRepository.countByBusinessClientId(
                        businessClientId
                );

        long deliveredShipments =
                shipmentRepository.countByBusinessClientIdAndStatus(
                        businessClientId,
                        ShipmentStatus.DELIVERED
                );

        long inTransitShipments =
                shipmentRepository.countByBusinessClientIdAndStatus(
                        businessClientId,
                        ShipmentStatus.IN_TRANSIT
                );

        long pendingShipments =
                shipmentRepository.countByBusinessClientIdAndStatus(
                        businessClientId,
                        ShipmentStatus.CREATED
                );

        long failedDeliveries =
                shipmentRepository.countByBusinessClientIdAndStatus(
                        businessClientId,
                        ShipmentStatus.FAILED_DELIVERY
                );

        double deliverySuccessRate =
                totalShipments > 0
                        ? ((double) deliveredShipments / totalShipments) * 100
                        : 0.0;

        return BusinessShipmentAnalyticsDto.builder()
                .totalShipments(totalShipments)
                .deliveredShipments(deliveredShipments)
                .inTransitShipments(inTransitShipments)
                .pendingShipments(pendingShipments)
                .failedDeliveries(failedDeliveries)
                .deliverySuccessRate(deliverySuccessRate)
                .build();
    }



//    public Shipment acceptShipment(
//            Long shipmentId,
//            Long operatorId
//    ) {
//
//        Shipment shipment = shipmentRepository.findById(shipmentId)
//                .orElseThrow(() ->
//                        new RuntimeException("Shipment not found"));
//
//        if (shipment.getDriverId() != null) {
//            throw new RuntimeException(
//                    "Shipment has already been accepted by another operator."
//            );
//        }
//
//        shipment.setDriverId(operatorId);
//
//        shipment.setStatus(ShipmentStatus.PICKED_UP);
//
//
//        // Notify Business Client
//        NotificationRequest businessNotification = new NotificationRequest();
//
//        businessNotification.setUserId(shipment.getBusinessClientId());
//        businessNotification.setShipmentId(shipment.getId());
//        businessNotification.setChannel("IN_APP");
//        businessNotification.setTitle("Shipment Accepted");
//        businessNotification.setMessage(
//                "Your shipment " + shipment.getTrackingNumber()
//                        + " has been accepted by an operator."
//        );
//        businessNotification.setPriority("NORMAL");
//
//        notificationClient.createNotification(businessNotification);
//
//// Notify Customer
//        NotificationRequest customerNotification = new NotificationRequest();
//
//        customerNotification.setUserId(shipment.getCustomerId());
//        customerNotification.setShipmentId(shipment.getId());
//        customerNotification.setChannel("IN_APP");
//        customerNotification.setTitle("Package Picked Up");
//        customerNotification.setMessage(
//                "Your package " + shipment.getTrackingNumber()
//                        + " has been picked up and is now being processed."
//        );
//        customerNotification.setPriority("NORMAL");
//
//        notificationClient.createNotification(customerNotification);
//        return shipment;
//    }
@Transactional
public Shipment acceptShipment(Long shipmentId) {

    UserProfileResponse currentUser = authClient.getCurrentUser();

    if (!"LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
        throw new RuntimeException(
                "Only operators can accept shipments."
        );
    }

    Long operatorId = currentUser.getId();

//    Shipment shipment = shipmentRepository.findById(shipmentId)
//            .orElseThrow(() ->
//                    new RuntimeException("Shipment not found"));
    Shipment shipment = shipmentRepository.findWithLockById(shipmentId)
            .orElseThrow(() ->
                    new RuntimeException("Shipment not found"));

    if (shipment.getDriverId() != null) {
        throw new RuntimeException(
                "Shipment has already been accepted by another operator."
        );
    }

    shipment.setDriverId(operatorId);
    shipment.setStatus(ShipmentStatus.PICKED_UP);
    shipment.setPickedUpAt(LocalDateTime.now());
    shipment.setEstimatedDeliveryAt(
            shipment.getPickedUpAt().plusDays(3)
    );
    shipment = shipmentRepository.save(shipment);
    System.out.println("Business Client ID = " + shipment.getBusinessClientId());
    System.out.println("Customer ID = " + shipment.getCustomerId());
//    sendNotification(
//            shipment.getBusinessClientId(),
//            shipment,
//            "Shipment Accepted",
//            "Your shipment " + shipment.getTrackingNumber()
//                    + " has been accepted by an operator."
//    );
    System.out.println("Sending BUSINESS notification...");
//=====================================================================
//    sendNotification(
//            shipment.getBusinessClientId(),
//            shipment,
//            "Shipment Accepted",
//            "Your shipment " + shipment.getTrackingNumber()
//                    + " has been accepted by an operator."
//    );

    sendNotification(
            shipment.getBusinessClientId(),
            shipment,
            "Shipment Accepted",
            "Your shipment " + shipment.getTrackingNumber()
                    + " has been accepted by an operator.",
            "PICKED_UP"
    );
//    =================================================================

    System.out.println("BUSINESS notification sent.");

//    sendNotification(
//            shipment.getCustomerId(),
//            shipment,
//            "Package Picked Up",
//            "Your package " + shipment.getTrackingNumber()
//                    + " has been picked up and is now being processed."
//    );
    System.out.println("Sending CUSTOMER notification...");

//    sendNotification(
//            shipment.getCustomerId(),
//            shipment,
//            "Package Picked Up",
//            "Your package " + shipment.getTrackingNumber()
//                    + " has been picked up and is now being processed."
//    );
    sendNotification(
            shipment.getCustomerId(),
            shipment,
            "Package Picked Up",
            "Your package " + shipment.getTrackingNumber()
                    + " has been picked up and is now being processed.",
            "PICKED_UP"
    );



//    notificationClient.markShipmentAccepted(
//            shipment.getId(),
//            operatorId
//    );


    notificationClient.markShipmentAccepted(
            shipment.getId(),
            operatorId
    );



    return shipment;
}

    private void sendNotification(
            Long userId,
            Shipment shipment,
            String title,
            String message,
             String eventType
    ) {

        NotificationRequest request = new NotificationRequest();

        request.setUserId(userId);
        request.setShipmentId(shipment.getId());
        request.setChannel("IN_APP");
        request.setTitle(title);
        request.setMessage(message);
        request.setPriority("NORMAL");
        request.setEventType(eventType);
//        request.setEventType("CREATED");

        notificationClient.createNotification(request);
    }

//    public Shipment updateShipmentStatus(
//            Long shipmentId,
//            ShipmentStatus status
//    ) {
//
//        Shipment shipment = shipmentRepository.findById(shipmentId)
//                .orElseThrow(() ->
//                        new RuntimeException("Shipment not found"));
//
//        shipment.setStatus(status);

    public Shipment updateShipmentStatus(
            Long shipmentId,
            ShipmentStatus status
    ) {

        UserProfileResponse currentUser = authClient.getCurrentUser();

        if (!"LOGISTICS_OPERATOR".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException(
                    "Only operators can update shipment status."
            );
        }

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Shipment not found"));

        if (shipment.getDriverId() == null) {
            throw new RuntimeException(
                    "This shipment has not been accepted by an operator."
            );
        }

//======================================================================================

//  ==================================================================================

        if (!shipment.getDriverId().equals(currentUser.getId())) {
            throw new RuntimeException(
                    "This shipment is assigned to another operator."
            );
        }

        if (Boolean.TRUE.equals(shipment.getCancelledByCustomer())) {
            throw new RuntimeException(
                    "This parcel was cancelled by the customer. No further operations are allowed."
            );
        }

        shipment.setStatus(status);
//        if (status == ShipmentStatus.DELIVERED) {
//            shipment.setDeliveredAt(shipment.getEstimatedDeliveryAt());
//        }
        if (status == ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(LocalDateTime.now());
        }
        Shipment updatedShipment =
                shipmentRepository.save(shipment);
        if (status == ShipmentStatus.IN_TRANSIT) {

            routeService.markCurrentHubReached(
                    shipmentId
            );
        }

        // Notify Business Client
//        sendNotification(
//                updatedShipment.getBusinessClientId(),
//                updatedShipment,
//                "Shipment Status Updated",
//                "Shipment " + updatedShipment.getTrackingNumber()
//                        + " is now " + status
//        );
        sendNotification(
                updatedShipment.getBusinessClientId(),
                updatedShipment,
                "Shipment Status Updated",
                "Shipment " + updatedShipment.getTrackingNumber()
                        + " is now " + status,
                status.name()
        );

        // Notify Customer
//        sendNotification(
//                updatedShipment.getCustomerId(),
//                updatedShipment,
//                "Shipment Status Updated",
//                "Your package " + updatedShipment.getTrackingNumber()
//                        + " is now " + status
//        );
        String title;
        String message;

        switch (status) {

            case PICKED_UP -> {
                title = "Package Picked Up";
                message = "Your package "
                        + updatedShipment.getTrackingNumber()
                        + " has been picked up.";
            }

            case IN_TRANSIT -> {
                title = "Shipment In Transit";
                message = "Your shipment "
                        + updatedShipment.getTrackingNumber()
                        + " is currently in transit.";
            }

            case OUT_FOR_DELIVERY -> {
                title = "Out For Delivery";
                message = "Your shipment "
                        + updatedShipment.getTrackingNumber()
                        + " is out for delivery.";
            }

            case DELIVERED -> {
                title = "Shipment Delivered";
                message = "Your shipment "
                        + updatedShipment.getTrackingNumber()
                        + " has been delivered successfully.";
            }

            case FAILED_DELIVERY -> {
                title = "Delivery Failed";
                message = "Delivery attempt failed for shipment "
                        + updatedShipment.getTrackingNumber()
                        + ".";
            }

            default -> {
                title = "Shipment Status Updated";
                message = "Your shipment status has changed.";
            }
        }

//        sendNotification(
//                updatedShipment.getCustomerId(),
//                updatedShipment,
//                title,
//                message
//        );
        sendNotification(
                updatedShipment.getCustomerId(),
                updatedShipment,
                title,
                message,
                status.name()
        );

        return updatedShipment;
    }

    @Transactional
    public Shipment cancelShipmentByCustomer(
            Long shipmentId,
            CustomerCancellationRequest request
    ) {

        // 1. Get currently logged-in user
        UserProfileResponse currentUser =
                authClient.getCurrentUser();

        // 2. Only CUSTOMER can use this operation
        if (!"CUSTOMER".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException(
                    "Only customers can cancel their parcel."
            );
        }

        // 3. Find shipment
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Shipment not found")
                );

        // 4. Make sure this parcel belongs to this customer
        if (shipment.getCustomerId() == null ||
                !shipment.getCustomerId().equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You are not authorized to cancel this parcel."
            );
        }

        // 5. Prevent duplicate cancellation
        if (Boolean.TRUE.equals(
                shipment.getCancelledByCustomer()
        )) {
            throw new RuntimeException(
                    "This parcel has already been cancelled."
            );
        }

        // 6. Customer can cancel ONLY before IN_TRANSIT
        // According to our lifecycle this means CREATED or PICKED_UP.
        if (shipment.getStatus() != ShipmentStatus.CREATED &&
                shipment.getStatus() != ShipmentStatus.PICKED_UP) {

            throw new RuntimeException(
                    "This parcel can no longer be cancelled."
            );
        }

        // 7. Store cancellation information.
        // IMPORTANT:
        // We are NOT changing ShipmentStatus here.
        shipment.setCancelledByCustomer(true);
        shipment.setCancellationReason(
                request.getReason().trim()
        );
        shipment.setCancelledAt(LocalDateTime.now());

        // Customer cancellation is a dedicated business operation.
// Customer still cannot use the general status-update endpoint.
        shipment.setStatus(ShipmentStatus.CANCELLED);

        Shipment updatedShipment =
                shipmentRepository.save(shipment);

        // 8. Notify ONLY the Business Client
        if (updatedShipment.getBusinessClientId() != null) {

            sendNotification(
                    updatedShipment.getBusinessClientId(),
                    updatedShipment,
                    "Shipment Cancelled by Customer",
                    "Customer cancelled shipment "
                            + updatedShipment.getTrackingNumber()
                            + ".",

                    "CUSTOMER_CANCELLED"
            );
        }

        return updatedShipment;
    }

    public TrackingResponse getTrackingDetails(
            String identifier
    ) {
        Shipment shipment = null;
        try {
            Long shipmentId = Long.parseLong(identifier.trim());
            shipment = shipmentRepository.findById(shipmentId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (shipment == null) {
            shipment = shipmentRepository.findByTrackingNumber(identifier.trim()).orElse(null);
        }

        if (shipment == null) {
            shipment = shipmentRepository.findAll().stream()
                    .filter(s -> s.getTrackingNumber() != null && s.getTrackingNumber().equalsIgnoreCase(identifier.trim()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Shipment not found with identifier: " + identifier));
        }

        return routeService.getTrackingDetails(
                shipment
        );
    }

    public TrackingResponse getTrackingDetails(
            Long shipmentId
    ) {
        return getTrackingDetails(String.valueOf(shipmentId));
    }


    public List<ShipmentAnalyticsDataResponse> getAllShipmentsForAnalytics() {

        return shipmentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .businessClientId(shipment.getBusinessClientId())
                        .status(shipment.getStatus().name())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }

    public List<ShipmentAnalyticsDataResponse> getBusinessShipmentsForAnalytics(
            Long businessClientId
    ) {

        return shipmentRepository.findByBusinessClientId(businessClientId)
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .businessClientId(shipment.getBusinessClientId())
                        .status(shipment.getStatus().name())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }


    public ShipmentAnalyticsDataResponse getShipmentForVerification(
            Long shipmentId
    ) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Shipment not found"));

        return ShipmentAnalyticsDataResponse.builder()
                .shipmentId(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .businessClientId(shipment.getBusinessClientId())
                .status(shipment.getStatus().name())
                .customerId(shipment.getCustomerId())
                .driverId(shipment.getDriverId())
//                ==============================
                .originCity(shipment.getSenderCity())
                .destinationCity(shipment.getReceiverCity())
//                ===========================================
                .createdAt(shipment.getCreatedAt())
                .pickedUpAt(shipment.getPickedUpAt())
                .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                .deliveredAt(shipment.getDeliveredAt())
                .build();
    }

    public List<HubDropdownResponse> getAllHubs() {

        return hubRepository.findByActiveTrueOrderByCityAsc()
                .stream()
                .map(hub -> HubDropdownResponse.builder()
                        .id(hub.getId())
                        .city(hub.getCity())
                        .state(hub.getState())
                        .pincode(hub.getPincode())
                        .build())
                .toList();
    }

    public List<ShipmentAnalyticsDataResponse> getAllShipmentsForAnalyticsByDateRange(
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {

        return shipmentRepository
                .findByCreatedAtBetweenOrderByCreatedAtDesc(
                        startDate,
                        endDate
                )
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .trackingNumber(shipment.getTrackingNumber())
                        .businessClientId(shipment.getBusinessClientId())
                        .customerId(shipment.getCustomerId())
                        .driverId(shipment.getDriverId())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .status(shipment.getStatus().name())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }


    public List<ShipmentAnalyticsDataResponse> getBusinessShipmentsForAnalyticsByDateRange(
            Long businessClientId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {

        return shipmentRepository
                .findByBusinessClientIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        businessClientId,
                        startDate,
                        endDate
                )
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .trackingNumber(shipment.getTrackingNumber())
                        .businessClientId(shipment.getBusinessClientId())
                        .customerId(shipment.getCustomerId())
                        .driverId(shipment.getDriverId())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .status(shipment.getStatus().name())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }

    public List<ShipmentAnalyticsDataResponse> getCustomerShipmentsForAnalyticsByDateRange(
            Long customerId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {

        return shipmentRepository
                .findByCustomerIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        customerId,
                        startDate,
                        endDate
                )
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .trackingNumber(shipment.getTrackingNumber())
                        .businessClientId(shipment.getBusinessClientId())
                        .customerId(shipment.getCustomerId())
                        .driverId(shipment.getDriverId())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .status(shipment.getStatus().name())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }

    public List<ShipmentAnalyticsDataResponse> getDriverShipmentsForAnalyticsByDateRange(
            Long driverId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {

        return shipmentRepository
                .findByDriverIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        driverId,
                        startDate,
                        endDate
                )
                .stream()
                .map(shipment -> ShipmentAnalyticsDataResponse.builder()
                        .shipmentId(shipment.getId())
                        .trackingNumber(shipment.getTrackingNumber())
                        .businessClientId(shipment.getBusinessClientId())
                        .customerId(shipment.getCustomerId())
                        .driverId(shipment.getDriverId())
                        .originCity(shipment.getSenderCity())
                        .destinationCity(shipment.getReceiverCity())
                        .status(shipment.getStatus().name())
                        .createdAt(shipment.getCreatedAt())
                        .pickedUpAt(shipment.getPickedUpAt())
                        .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                        .deliveredAt(shipment.getDeliveredAt())
                        .build())
                .toList();
    }

    public Shipment getShipmentByIdInternal(Long id) {

        return shipmentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Shipment not found with id: " + id
                        )
                );
    }
}

