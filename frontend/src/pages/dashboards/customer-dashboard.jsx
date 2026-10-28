import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import {
  useMyShipments,
  useCancelShipmentByCustomer,
 
} from "@/lib/hooks";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, relativeDay, formatDateTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ChevronRight,
  PackageX,
  AlertTriangle,
  Navigation,
} from "lucide-react";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const myShipments = useMyShipments(user?.id);

  // Broadcast & Breakdown Delay Alert for Customer Dashboard
  // STRICT REAL-WORLD INTEGRITY:
  // ONLY displays when:
  // 1. Driver Amrith has actually reported a breakdown SOS (shiptrack_driver_sos_reported === "true")
  // 2. AND Company has dispatched the delay broadcast message!
  const [customerBroadcastAlert, setCustomerBroadcastAlert] = useState(() => {
    try {
      const isDismissed = sessionStorage.getItem("shiptrack_alert_dismissed") === "true";
      if (isDismissed) return null;

      const isResolved = localStorage.getItem("shiptrack_breakdown_resolved") === "true";
      if (isResolved) {
        const resolvedData = localStorage.getItem("shiptrack_resolved_alert_data");
        if (resolvedData) return JSON.parse(resolvedData);
        return {
          isResolved: true,
          status: "RESOLVED",
          title: "Highway Carrier Breakdown Resolved",
          message: "Carrier vehicle TN 38 BL 7842 breakdown cleared near Salem bypass. Vehicle is back on the highway in active transit.",
          revisedEta: "Today 09:15 PM (On Schedule)",
          lorryNumber: "TN 38 BL 7842",
          trackingNumber: "TRK-FC2FA501",
          driverName: "Amrith Saravanan"
        };
      }

      const driverSos = localStorage.getItem("shiptrack_driver_sos_reported") === "true";
      if (!driverSos) return null;

      const raguAlert = localStorage.getItem("shiptrack_customer_ragu_notification");
      if (raguAlert) return JSON.parse(raguAlert);
      const generalAlert = localStorage.getItem("shiptrack_highway_breakdown_alert");
      if (generalAlert) return JSON.parse(generalAlert);
    } catch {}
    return null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const isDismissed = sessionStorage.getItem("shiptrack_alert_dismissed") === "true";
        if (isDismissed) {
          setCustomerBroadcastAlert(null);
          return;
        }

        const isResolved = localStorage.getItem("shiptrack_breakdown_resolved") === "true";
        if (isResolved) {
          const resolvedData = localStorage.getItem("shiptrack_resolved_alert_data");
          if (resolvedData) {
            setCustomerBroadcastAlert(JSON.parse(resolvedData));
            return;
          }
          setCustomerBroadcastAlert({
            isResolved: true,
            status: "RESOLVED",
            title: "Highway Carrier Breakdown Resolved",
            message: "Carrier vehicle TN 38 BL 7842 breakdown cleared near Salem bypass. Vehicle is back on the highway in active transit.",
            revisedEta: "Today 09:15 PM (On Schedule)",
            lorryNumber: "TN 38 BL 7842",
            trackingNumber: "TRK-FC2FA501",
            driverName: "Amrith Saravanan"
          });
          return;
        }

        const driverSos = localStorage.getItem("shiptrack_driver_sos_reported") === "true";
        if (!driverSos) {
          setCustomerBroadcastAlert(null);
          return;
        }
        const raguAlert = localStorage.getItem("shiptrack_customer_ragu_notification");
        if (raguAlert) {
          setCustomerBroadcastAlert(JSON.parse(raguAlert));
          return;
        }
        const generalAlert = localStorage.getItem("shiptrack_highway_breakdown_alert");
        if (generalAlert) {
          setCustomerBroadcastAlert(JSON.parse(generalAlert));
          return;
        }
        setCustomerBroadcastAlert(null);
      } catch {}
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("shiptrack_alert_update", handleUpdate);
    const interval = setInterval(handleUpdate, 1500);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("shiptrack_alert_update", handleUpdate);
      clearInterval(interval);
    };
  }, []);
  

  
  const isLoading = myShipments.isLoading;
  
  

  const all = myShipments.data ?? [];
  const active = all.filter((s) =>
    ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP", "CREATED", "in_transit", "out_for_delivery", "picked_up", "pending"].includes(
      s.status,
    ),
  );
  const delivered = all.filter((s) => s.status === "DELIVERED" || s.status === "delivered");
  const outForDelivery = all.filter((s) => s.status === "OUT_FOR_DELIVERY" || s.status === "out_for_delivery");
  const featured =
    active.find((s) => s.status === "OUT_FOR_DELIVERY" || s.status === "out_for_delivery") ?? active[0] ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CustomerHeader
          userName={user?.firstName ?? user?.name ?? "Customer"}
        />
        <LoadingState label="Loading your packages & deliveries..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CustomerHeader userName={user?.firstName ?? user?.name ?? "Customer"} />

      {/* Prominent Highway Breakdown & Resolved Broadcast Notice on Customer Dashboard */}
      {customerBroadcastAlert && (
        <Card className={cn(
          "shadow-md animate-fade-in transition-all",
          customerBroadcastAlert.isResolved
            ? "border-emerald-500/50 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/5"
            : "border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5"
        )}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                customerBroadcastAlert.isResolved
                  ? "bg-emerald-600 shadow-emerald-500/30"
                  : "bg-amber-500 shadow-amber-500/30"
              )}>
                {customerBroadcastAlert.isResolved ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "text-xs font-extrabold uppercase tracking-wide",
                    customerBroadcastAlert.isResolved
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-amber-800 dark:text-amber-300"
                  )}>
                    {customerBroadcastAlert.isResolved
                      ? "✅ Highway Carrier Breakdown Resolved — Transit Resumed"
                      : "⚠️ Highway Carrier Transit Delay Notice"}
                  </span>
                  {customerBroadcastAlert.isResolved ? (
                    <span className="rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200 border border-emerald-500/30">
                      Resolved
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/25 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 border border-amber-500/30">
                      {customerBroadcastAlert.delayTime || "+3h 45m"}
                    </span>
                  )}
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border",
                    customerBroadcastAlert.isResolved
                      ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      : "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  )}>
                    {customerBroadcastAlert.isResolved
                      ? `Updated ETA: ${customerBroadcastAlert.revisedEta || "Today 09:15 PM"}`
                      : `Revised ETA: ${customerBroadcastAlert.revisedEta || "Today 08:30 PM"}`}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {customerBroadcastAlert.customMessage || customerBroadcastAlert.message || (
                    customerBroadcastAlert.isResolved
                      ? "Carrier vehicle TN 38 BL 7842 breakdown cleared near Salem bypass. Vehicle has resumed active highway transit towards destination on schedule."
                      : "Your parcel on carrier TN 38 BL 7842 encountered a highway transit hold near Salem. Standby relief vehicle deployed. Revised Delivery ETA: Today 08:30 PM (+3h 45m)."
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-muted-foreground font-medium">
                  <span>Tracking #: <strong className="font-mono text-foreground font-bold">{customerBroadcastAlert.trackingNumber || "TRK-FC2FA501"}</strong></span>
                  <span>Vehicle: <strong className="font-mono text-foreground">{customerBroadcastAlert.lorryNumber || "TN 38 BL 7842"}</strong></span>
                  <span>Driver: <strong className="text-foreground font-bold">{customerBroadcastAlert.driverName || "Amrith Saravanan"}</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="sm" variant={customerBroadcastAlert.isResolved ? "default" : "brand"} className="text-xs font-bold shrink-0 shadow-sm gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/app/routes?id=3">
                  <Navigation className="h-3.5 w-3.5" />
                  Live Track Item <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {customerBroadcastAlert.isResolved && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                  onClick={() => {
                    sessionStorage.setItem("shiptrack_alert_dismissed", "true");
                    setCustomerBroadcastAlert(null);
                  }}
                  title="Dismiss notification"
                >
                  ✕
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat
          label="Active Deliveries"
          value={active.length}
          icon={Truck}
          class="bg-primary/10 text-primary border border-primary/20"
        />
        <MiniStat
          label="Out for Delivery"
          value={outForDelivery.length}
          icon={Package}
          class="bg-amber-500/10 text-amber-600 border border-amber-500/20"
        />
        <MiniStat
          label="Completed Deliveries"
          value={delivered.length}
          icon={CheckCircle2}
          class="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
        />
      </div>

      {featured ? (
        <FeaturedTrackingCard shipment={featured} />
      ) : (
        <Card className="shadow-card border-border/80 bg-gradient-to-br from-emerald-500/5 via-background to-background">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  All Shipments Delivered Safely
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You currently have no packages in active transit. Your past deliveries are archived in the package history below.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-semibold shrink-0 gap-1.5"
            >
              <Link to="/app/deliveries">
                View Delivery History ({delivered.length}) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border/80">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                Your Packages
              </CardTitle>
              <CardDescription className="text-xs">
                History of all incoming and completed deliveries
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
            >
              <Link to="/app/deliveries">
                All Deliveries ({all.length}){" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {all.length > 0 ? (
            <div className="space-y-3">
              {all.map((s) => (
                <DeliveryRow key={s.id} shipment={s} />
              ))}
              
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No deliveries found"
              description="When you have active shipments, they will appear here for easy tracking."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerHeader({ userName }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between z-10">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
            Hi, {userName} 
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your incoming packages and check real-time ETA updates
          </p>
        </div>
        
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, class: cls }) {
  return (
    <Card className="p-4 shadow-card border-border/80">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", cls)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xl font-extrabold leading-none text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function FeaturedTrackingCard({ shipment }) {
  // =================================================================
  const cancelMutation = useCancelShipmentByCustomer();

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const shipmentStatus = shipment.status?.toUpperCase();

  const canCancel =
    !shipment.cancelledByCustomer &&
    (shipmentStatus === "CREATED" || shipmentStatus === "PICKED_UP");
  // =======================================================================
  const etaLabel = relativeDay(shipment.estimatedDeliveryAt ?? shipment.estimatedDelivery);
  const isOutForDelivery = shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "out_for_delivery";
const isDelivered =
  shipment.status === "DELIVERED" || shipment.status === "delivered";
  

  // const progress = isDelivered ? 100 : (shipment.progress ?? 60);
  
  const handleCancelShipment = async () => {
    const reason = cancelReason.trim();

    setCancelError("");

    if (reason.length < 5) {
      setCancelError(
        "Please provide a cancellation reason of at least 5 characters.",
      );
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: shipment.id,
        reason,
      });

      setCancelReason("");
      setShowCancelForm(false);
    } catch (error) {
      console.error("Customer cancellation error:", error);

      setCancelError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to cancel this parcel.",
      );
    }
  };

  // ===================================================================
  return (
    <Card className="overflow-hidden shadow-card border-border/80">
      <div
        className={cn(
          "relative p-6 sm:p-8",
          isOutForDelivery
            ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent"
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg border border-white/20",
                isOutForDelivery
                  ? "bg-amber-500 text-white shadow-amber-500/20"
                  : "gradient-brand text-white shadow-primary/20",
              )}
            >
              <Truck className="h-7 w-7 animate-bounce-subtle" />
            </span>
            <div>
              {/* <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isOutForDelivery ? "Arriving Today" : "Package In Transit"}
              </p> */}
              <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">
                {etaLabel}
              </p>
            </div>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-start text-xs font-semibold text-muted-foreground">
            <span>
              From:{" "}
              <strong className="text-foreground">{shipment.senderCity}</strong>
            </span>
            {/* <span className="font-bold text-primary">  -------------------  </span> */}
            <span className="mx-6 text-2xl text-gray-500">---------→</span>
            <span>
              To:{" "}
              <strong className="text-foreground">
                {shipment.receiverCity}
              </strong>
            </span>
          </div>
          {/* <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOutForDelivery ? "bg-amber-500" : "gradient-brand",
              )}
              style={{ width: `${progress}%` }}
            />
          </div> */}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            ETA {formatDateTime(shipment.estimatedDeliveryAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Tracking Number
          </p>
          <p className="font-mono text-sm font-extrabold text-foreground">
            {shipment.trackingNumber}
          </p>
        </div>
        {/* <Button asChild variant="brand" size="sm" className="font-bold text-xs">
          <Link to={`/app/shipments/${shipment.id}`}>
            Live Track <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button> */}

        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="font-bold text-xs"
              onClick={() => {
                setCancelError("");
                setShowCancelForm(true);
              }}
            >
              <PackageX className="mr-1.5 h-4 w-4" />
              Cancel Parcel
            </Button>
          )}
          <Button
            asChild
            variant="brand"
            size="sm"
            className="font-bold text-xs"
          >
            <Link to={`/app/shipments/${shipment.id}`}>
              Live Track
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}

      {showCancelForm && canCancel && (
        <div className="border-t border-border/60 bg-muted/10 px-6 py-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                Why do you want to cancel this parcel?
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Please provide a reason before confirming the cancellation.
              </p>
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                setCancelError("");
              }}
              placeholder="Enter cancellation reason..."
              maxLength={1000}
              rows={3}
              disabled={cancelMutation.isPending}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            {cancelError && (
              <p className="text-xs font-medium text-destructive">
                {cancelError}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {cancelReason.length}/1000
              </span>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelReason("");
                    setCancelError("");
                  }}
                >
                  Keep Parcel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={
                    cancelMutation.isPending || cancelReason.trim().length < 5
                  }
                  onClick={handleCancelShipment}
                >
                  {cancelMutation.isPending
                    ? "Cancelling..."
                    : "Confirm Cancellation"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
    </Card>
  );
}

// function DeliveryRow({ shipment,pod }) {
//   const isDelivered = shipment.status === "DELIVERED" || shipment.status === "delivered";
//   const isOutForDelivery = shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "out_for_delivery";

//   return (
//     <Link
//       to={`/app/shipments/${shipment.id}`}
//       className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-2xs"
//     >
//       <span
//         className={cn(
//           "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
//           isDelivered
//             ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
//             : isOutForDelivery
//               ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
//               : "bg-primary/10 text-primary border-primary/20",
//         )}
//       >
//         {isDelivered ? (
//           <CheckCircle2 className="h-5 w-5" />
//         ) : (
//           <Truck className="h-5 w-5" />
//         )}
//       </span>
//       <div className="min-w-0 flex-1">
//         <div className="flex items-center gap-2">
//           <span className="font-mono text-xs font-bold text-foreground">
//             {shipment.trackingNumber}
//           </span>
//           <StatusBadge status={shipment.status} size="sm" />
//         </div>
//         <p className="mt-1 truncate text-xs text-muted-foreground font-medium">
//           {shipment.senderCity} → {shipment.receiverCity}
//         </p>
//       </div>
//       <div className="text-right">
//         <p
//           className={cn(
//             "text-xs font-bold",
//             isOutForDelivery && "text-amber-600 dark:text-amber-400",
//           )}
//         >
//           {isDelivered ? "Delivered" : relativeDay(shipment.estimatedDeliveryAt ?? shipment.estimatedDelivery)}
//         </p>
//         <p className="text-[10px] text-muted-foreground mt-0.5">{shipment.carrier || "Carrier Express"}</p>
//       </div>
//       <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
//     </Link>
//   );
// }

function DeliveryRow({ shipment }) {
  const isDelivered =
    shipment.status === "DELIVERED" || shipment.status === "delivered";

  const isOutForDelivery =
    shipment.status === "OUT_FOR_DELIVERY" ||
    shipment.status === "out_for_delivery";

  // const podStatus = pod?.verificationStatus?.toUpperCase();

  return (
    <div className="rounded-xl border border-border/70 bg-card transition-all hover:border-primary/40 hover:shadow-2xs">
      {/* Shipment details */}
      <Link
        to={`/app/shipments/${shipment.id}`}
        className="flex items-center gap-4 p-4"
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isDelivered
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : isOutForDelivery
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-primary/10 text-primary border-primary/20",
          )}
        >
          {isDelivered ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Truck className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">
              {shipment.trackingNumber}
            </span>

            <StatusBadge status={shipment.status} size="sm" />
          </div>

          <p className="mt-1 truncate text-xs text-muted-foreground font-medium">
            {shipment.senderCity} → {shipment.receiverCity}
          </p>
        </div>

        <div className="text-right">
          <p
            className={cn(
              "text-xs font-bold",
              isOutForDelivery && "text-amber-600 dark:text-amber-400",
            )}
          >
            {isDelivered
              ? "Delivered"
              : relativeDay(
                  shipment.estimatedDeliveryAt ?? shipment.estimatedDelivery,
                )}
          </p>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {shipment.carrier || "Carrier Express"}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      
    </div>
  );
}

