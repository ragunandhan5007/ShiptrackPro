import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  shipmentsApi,
  notificationsApi,
  ticketsApi,
  teamApi,
  analyticsApi,
  mlApi,
} from "./api";
import { queryKeys } from "./query-client";
import { useAuth } from "@/context/auth-context";
export function useShipments() {
  return useQuery({
    queryKey: queryKeys.shipments,
    queryFn: shipmentsApi.list,
    // Refresh shipment state every 3 seconds
    refetchInterval: 3000,

    refetchIntervalInBackground: true,
  });
}
export function useShipment(id) {
  return useQuery({
    queryKey: id ? queryKeys.shipment(id) : ["shipments", "none"],
    queryFn: () => shipmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useCancelShipmentByCustomer() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, reason }) => shipmentsApi.cancelByCustomer(id, reason),

    onSuccess: async (_, variables) => {
      // Refresh customer's shipment list
      if (user?.id) {
        await qc.invalidateQueries({
          queryKey: queryKeys.myShipments(user.id),
        });
      }

      // Refresh general shipment data
      await qc.invalidateQueries({
        queryKey: queryKeys.shipments,
      });

      // Refresh this specific shipment
      await qc.invalidateQueries({
        queryKey: queryKeys.shipment(variables.id),
      });

      // Business-client notification data can refresh as well
      await qc.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}
// ===============================================================
export function useNavigation(shipmentId) {
  return useQuery({
    queryKey: ["shipments", shipmentId, "navigation"],
    queryFn: () => shipmentsApi.getNavigation(shipmentId),
    enabled: !!shipmentId,
  });
}
// ===================================================================
export function useMyShipments(customerId) {
  return useQuery({
    queryKey: customerId
      ? queryKeys.myShipments(customerId)
      : ["shipments", "mine", "none"],
    queryFn: () => shipmentsApi.getByCustomer(customerId),
    enabled: !!customerId,
  });
}
export function useTrackByNumber(trackingNumber) {
  return useQuery({
    queryKey: ["shipments", "track", trackingNumber],
    queryFn: () => shipmentsApi.getByTracking(trackingNumber),
    enabled: trackingNumber.trim().length > 0,
  });
}
export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentsApi.create,
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.shipments,
      }),
  });
}


export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsApi.list,

    // Check for notification updates every 3 seconds
    refetchInterval: 3000,

    // Continue checking even when the browser tab is in background
    refetchIntervalInBackground: true,
  });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.notifications,
      }),
  });
}
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.notifications,
      }),
  });
}
export function useTickets() {
  return useQuery({
    queryKey: queryKeys.tickets,
    queryFn: ticketsApi.list,
  });
}
export function useTicket(id) {
  return useQuery({
    queryKey: id ? queryKeys.ticket(id) : ["tickets", "none"],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });
}
export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, author }) => ticketsApi.reply(id, body, author),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.tickets,
      });
    },
  });
}
export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ticketsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.tickets,
      });
    },
  });
}
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketData) => ticketsApi.create(ticketData),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.tickets,
      });
    },
  });
}
export function useTeam() {
  return useQuery({
    queryKey: queryKeys.team,
    queryFn: teamApi.list,
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => teamApi.updateStatus(id, status),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.team,
      }),
  });
}
export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: invoicesApi.list,
  });
}


export function useAnalytics(startDate, endDate) {
  return useQuery({
    queryKey: ["analytics", startDate, endDate],

    queryFn: () => analyticsApi.get(startDate, endDate),

    enabled: !!startDate && !!endDate,
  });
}

export function useActivity() {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: analyticsApi.activity,
  });
}


export function useBusinessAnalytics(businessClientId, startDate, endDate) {
  return useQuery({
    queryKey: ["business-analytics", businessClientId, startDate, endDate],

    queryFn: () =>
      analyticsApi.getBusinessDashboard(businessClientId, startDate, endDate),

    enabled: !!businessClientId && !!startDate && !!endDate,
  });
}

// --- Admin hooks ---
import {
  
  podApi,
  
} from "./api";


export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: routesApi.list,
  });
}
// ==================================
export function useFindRoute(originHubId, destinationHubId) {
  return useQuery({
    queryKey: ["route-finder", originHubId, destinationHubId],
    queryFn: () => shipmentsApi.findRoute(originHubId, destinationHubId),
    enabled: !!originHubId && !!destinationHubId,
  });
}


export function useHubs() {
  return useQuery({
    queryKey: ["route-hubs"],
    queryFn: () => shipmentsApi.getRouteHubs(),
  });
}
// =============================================================
export function usePodRecords() {
  return useQuery({
    queryKey: queryKeys.podRecords,
    queryFn: podApi.list,
    refetchInterval: 5000,
  });
}
export function useVerifyPod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => podApi.verify(id),

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.podRecords,
      }),
  });
}
export function useSystemMetrics() {
  return useQuery({
    queryKey: queryKeys.systemMetrics,
    queryFn: systemMetricsApi.list,
    refetchInterval: 5000,
  });
}
export function useNotificationMetrics() {
  return useQuery({
    queryKey: queryKeys.notificationMetrics,
    queryFn: notificationMetricsApi.list,
  });
}
export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: reportsApi.list,
  });
}

// --- Operator hooks ---





export function useAcceptShipment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => shipmentsApi.accept(id),

    onSuccess: async () => {
      // Refresh shipment data
      await qc.invalidateQueries({
        queryKey: queryKeys.shipments,
      });

      await qc.refetchQueries({
        queryKey: queryKeys.shipments,
      });

      // Refresh operator notifications
      await qc.invalidateQueries({
        queryKey: queryKeys.notifications,
      });

      await qc.refetchQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}
export function useUpdateShipmentStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => shipmentsApi.updateStatus(id, status),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.shipments,
      });

      qc.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
    },
  });
}
export function useReachNextHub() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (shipmentId) => shipmentsApi.reachNextHub(shipmentId),

    onSuccess: (_, shipmentId) => {
      qc.invalidateQueries({
        queryKey: ["shipments", shipmentId, "navigation"],
      });

      qc.invalidateQueries({
        queryKey: ["shipments", shipmentId, "tracking"],
      });

      qc.invalidateQueries({
        queryKey: queryKeys.shipments,
      });
    },
  });
}

// ==================== ML MODEL HOOKS ====================

// 1. Dynamic ETA & Delay Prediction
export function useMlEta(params, options = {}) {
  return useQuery({
    queryKey: ["ml-eta", params],
    queryFn: () => mlApi.predictEta(params),
    enabled: !!params?.distance_km,
    staleTime: 60000,
    ...options,
  });
}

// 3. Support Ticket NLP Classification
export function useClassifyTicket() {
  return useMutation({
    mutationFn: (payload) => mlApi.classifyTicket(payload),
  });
}

// 4. Smart Route Optimization
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (payload) => mlApi.optimizeRoute(payload),
  });
}