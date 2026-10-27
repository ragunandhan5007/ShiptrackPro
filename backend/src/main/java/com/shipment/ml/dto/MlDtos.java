package com.shipment.ml.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class MlDtos {

    // 1. ETA Request & Response
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EtaRequest {
        private Double distance_km;
        private Double package_weight_kg;
        private String traffic_condition;
        private String weather_condition;
        private String road_condition;
        private Integer hubs_count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EtaResponse {
        private Double predicted_delay_minutes;
        private Integer total_estimated_transit_minutes;
        private Double delay_risk_probability;
        private String risk_level;
        private List<String> contributing_factors;
    }

    // 3. Ticket NLP Request & Response
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketClassifyRequest {
        private String subject;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketClassifyResponse {
        private String predicted_category;
        private Double confidence;
        private Map<String, Double> category_probabilities;
        private String suggested_priority;
        private Double urgency_score;
        private String detected_sentiment;
        private String auto_assigned_department;
    }

    // 4. Route Optimization Request & Response
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Waypoint {
        private Long id;
        private String name;
        private Double lat;
        private Double lng;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteOptimizeRequest {
        private Waypoint origin;
        private Waypoint destination;
        private List<Waypoint> intermediate_stops;
        private Double traffic_penalty_factor;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteOptimizeResponse {
        private List<Waypoint> optimized_waypoints;
        private Double original_distance_km;
        private Double optimized_distance_km;
        private Double distance_saved_km;
        private Double fuel_saved_liters;
        private Integer time_saved_minutes;
        private Double optimization_gain_pct;
    }
}
