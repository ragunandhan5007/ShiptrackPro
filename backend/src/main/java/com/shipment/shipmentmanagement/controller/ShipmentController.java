

package com.shipment.shipmentmanagement.controller;

import com.shipment.shipmentmanagement.dto.*;
import com.shipment.shipmentmanagement.entity.Shipment;
import com.shipment.shipmentmanagement.service.DeliveryForecastService;
import com.shipment.shipmentmanagement.service.EtaService;
import com.shipment.shipmentmanagement.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.shipment.shipmentmanagement.entity.enums.ShipmentStatus;
import com.shipment.shipmentmanagement.service.RouteService;
import com.shipment.shipmentmanagement.dto.HubDropdownResponse;

import java.util.List;
import com.shipment.shipmentmanagement.dto.EtaResponse;
import com.shipment.shipmentmanagement.dto.DeliveryForecastResponse;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final RouteService routeService;
    private final EtaService etaService;

    private final DeliveryForecastService deliveryForecastService;

    @PostMapping
    public Shipment saveShipment(@RequestBody Shipment shipment) {
        return shipmentService.saveShipment(shipment);
    }

    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentService.getAllShipments();
    }

    @GetMapping("/{id}")
    public Shipment getShipmentById(@PathVariable Long id) {
        return shipmentService.getShipmentById(id);
    }

    @PutMapping("/{id}")
    public Shipment updateShipment(
            @PathVariable Long id,
            @RequestBody Shipment shipment
    ) {
        return shipmentService.updateShipment(id, shipment);
    }

    @DeleteMapping("/{id}")
    public String deleteShipment(@PathVariable Long id) {
        shipmentService.deleteShipment(id);
        return "Shipment deleted successfully";
    }

//    @GetMapping("/analytics/summary")
//    public ShipmentAnalyticsDto getShipmentAnalytics() {
//        return shipmentService.getShipmentAnalytics();
//    }
//
//    @GetMapping("/analytics/customer/{customerId}")
//    public CustomerShipmentAnalyticsDto getCustomerAnalytics(
//            @PathVariable Long customerId
//    ) {
//        return shipmentService.getCustomerAnalytics(customerId);
//    }
//
//    @GetMapping("/analytics/business/{businessClientId}")
//    public BusinessShipmentAnalyticsDto getBusinessAnalytics(
//            @PathVariable Long businessClientId
//    ) {
//        return shipmentService.getBusinessAnalytics(businessClientId);
//    }
@GetMapping("/customer/me")
public List<Shipment> getMyCustomerShipments() {
    return shipmentService.getMyCustomerShipments();
}

//    @PostMapping("/{id}/accept")
//    public Shipment acceptShipment(
//            @PathVariable Long id,
//            @RequestBody AcceptShipmentRequest request
//    ) {
//        return shipmentService.acceptShipment(
//                id,
//                request.getOperatorId()
//        );
//    }

    @PostMapping("/{id}/accept")
    public Shipment acceptShipment(
            @PathVariable Long id
    ) {
        return shipmentService.acceptShipment(id);
    }

    @PutMapping("/{id}/status")
    public Shipment updateShipmentStatus(
            @PathVariable Long id,
            @RequestParam ShipmentStatus status
    ) {

        return shipmentService.updateShipmentStatus(
                id,
                status
        );
    }

    @PutMapping("/{shipmentId}/reach-next-hub")
    public String reachNextHub(
            @PathVariable Long shipmentId
    ) {

        routeService.markCurrentHubReached(shipmentId);

        return "Current hub updated successfully.";
    }
    @GetMapping("/{identifier}/tracking")
    public TrackingResponse getTrackingDetails(
            @PathVariable String identifier
    ) {

        return shipmentService.getTrackingDetails(
                identifier
        );
    }

    @GetMapping("/{shipmentId}/navigation")
    public NavigationResponse getNavigation(
            @PathVariable Long shipmentId
    ) {

        return routeService.getNavigation(
                shipmentId
        );
    }

    @GetMapping("/analytics")
    public List<ShipmentAnalyticsDataResponse> getAllShipmentsForAnalytics() {
        return shipmentService.getAllShipmentsForAnalytics();
    }

    @GetMapping("/analytics/business/{businessClientId}/shipments")
    public List<ShipmentAnalyticsDataResponse> getBusinessShipmentsForAnalytics(
            @PathVariable Long businessClientId
    ) {
        return shipmentService.getBusinessShipmentsForAnalytics(businessClientId);
    }

    @GetMapping("/analytics/{shipmentId}")
    public ShipmentAnalyticsDataResponse getShipmentForVerification(
            @PathVariable Long shipmentId
    ) {
        return shipmentService.getShipmentForVerification(shipmentId);
    }
    @GetMapping("/hubs")
    public List<HubDropdownResponse> getAllHubs() {
        return shipmentService.getAllHubs();
    }

    @GetMapping("/{shipmentId}/eta")
    public EtaResponse getEta(
            @PathVariable Long shipmentId
    ) {

        return etaService.calculateEta(
                shipmentId
        );
    }

    @GetMapping("/{shipmentId}/forecast")
    public DeliveryForecastResponse getForecast(
            @PathVariable Long shipmentId
    ) {

        return deliveryForecastService.generateForecast(
                shipmentId
        );
    }

    @GetMapping("/analytics/range")
    public List<ShipmentAnalyticsDataResponse> getAllShipmentsForAnalyticsByDateRange(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate
    ) {
        return shipmentService.getAllShipmentsForAnalyticsByDateRange(
                startDate,
                endDate
        );
    }

    @GetMapping("/analytics/business/{businessClientId}/shipments/range")
    public List<ShipmentAnalyticsDataResponse> getBusinessShipmentsForAnalyticsByDateRange(
            @PathVariable Long businessClientId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate
    ) {
        return shipmentService.getBusinessShipmentsForAnalyticsByDateRange(
                businessClientId,
                startDate,
                endDate
        );
    }

    @GetMapping("/analytics/customer/{customerId}/shipments/range")
    public List<ShipmentAnalyticsDataResponse> getCustomerShipmentsForAnalyticsByDateRange(
            @PathVariable Long customerId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate
    ) {
        return shipmentService.getCustomerShipmentsForAnalyticsByDateRange(
                customerId,
                startDate,
                endDate
        );
    }

    @GetMapping("/analytics/driver/{driverId}/shipments/range")
    public List<ShipmentAnalyticsDataResponse> getDriverShipmentsForAnalyticsByDateRange(
            @PathVariable Long driverId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate
    ) {
        return shipmentService.getDriverShipmentsForAnalyticsByDateRange(
                driverId,
                startDate,
                endDate
        );
    }

    @PostMapping("/{id}/customer-cancel")
    public Shipment cancelShipmentByCustomer(
            @PathVariable Long id,
            @jakarta.validation.Valid
            @RequestBody CustomerCancellationRequest request
    ) {

        return shipmentService.cancelShipmentByCustomer(
                id,
                request
        );
    }

    @GetMapping("/internal/{id}")
    public Shipment getShipmentByIdInternal(
            @PathVariable Long id
    ) {
        return shipmentService.getShipmentByIdInternal(id);
    }
}
