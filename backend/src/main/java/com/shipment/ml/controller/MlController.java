package com.shipment.ml.controller;

import com.shipment.ml.dto.MlDtos.*;
import com.shipment.ml.service.MlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
@CrossOrigin
public class MlController {

    private final MlService mlService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "ACTIVE");
        status.put("models", new String[]{
                "1. Dynamic ETA & Delay Prediction (Neural MLP)",
                "2. Support Ticket NLP & Priority Classification (TF-IDF)",
                "3. Smart Route & Dispatch Optimization (TSP 2-Opt)"
        });
        return ResponseEntity.ok(status);
    }

    @PostMapping("/predict-eta")
    public ResponseEntity<EtaResponse> predictEta(@RequestBody EtaRequest request) {
        return ResponseEntity.ok(mlService.predictEta(request));
    }

    @PostMapping("/classify-ticket")
    public ResponseEntity<TicketClassifyResponse> classifyTicket(@RequestBody TicketClassifyRequest request) {
        return ResponseEntity.ok(mlService.classifyTicket(request));
    }

    @PostMapping("/optimize-route")
    public ResponseEntity<RouteOptimizeResponse> optimizeRoute(@RequestBody RouteOptimizeRequest request) {
        return ResponseEntity.ok(mlService.optimizeRoute(request));
    }
}
