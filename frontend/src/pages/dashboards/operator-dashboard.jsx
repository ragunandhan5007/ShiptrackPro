import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useMemo, useState, useEffect } from "react";
import {
  useShipments,
  useNotifications,
  useAcceptShipment,
  useUpdateShipmentStatus,
  usePodRecords,
} from "@/lib/hooks";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, relativeDay } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  ArrowRight,
  Bell,
  Activity,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  Camera,
} from "lucide-react";

const STATUS_FLOW = [
  {
    key: "CREATED",
    label: "Created",
    icon: Clock,
    class: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    key: "PICKED_UP",
    label: "Picked Up",
    icon: Package,
    class: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit",
    icon: Truck,
    class: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: Navigation,
    class: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: CheckCircle2,
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "FAILED_DELIVERY",
    label: "Failed Delivery",
    icon: XCircle,
    class: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    class: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export default function OperatorDashboard() {
  const { user } = useAuth();
  const shipments = useShipments();
  const notifications = useNotifications();
  const acceptShipment = useAcceptShipment();
  const updateShipmentStatus = useUpdateShipmentStatus();
  const podQuery = usePodRecords();
  const [driverBreakdownReported, setDriverBreakdownReported] = useState(() => {
    try {
      return localStorage.getItem("shiptrack_driver_sos_reported") === "true";
    } catch {
      return false;
    }
  });

  const assigned = shipments.data ?? [];
  const pending = assigned.filter(
    (s) =>
      !s.cancelledByCustomer &&
      (s.status === "CREATED" || s.status === "PICKED_UP"),
  );

  const active = assigned.filter(
    (s) =>
      !s.cancelledByCustomer &&
      (s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY"),
  );

  // Highway SOS is strictly for long-haul highway corridor transit.
  // When deliveries are finished or in last-mile (OUT_FOR_DELIVERY), no highway breakdown banner is displayed.
  const activeHighwayShipment = active.find(
    (s) => s.status === "IN_TRANSIT" || s.status === "PICKED_UP",
  );

  useEffect(() => {
    if (!activeHighwayShipment && driverBreakdownReported) {
      setDriverBreakdownReported(false);
      try {
        localStorage.removeItem("shiptrack_driver_sos_reported");
      } catch {}
    }
  }, [activeHighwayShipment, driverBreakdownReported]);

  const handleToggleDriverSos = () => {
    if (!activeHighwayShipment) return;
    const isNowBroken = !driverBreakdownReported;
    setDriverBreakdownReported(isNowBroken);

    const vehicleNo = activeHighwayShipment.vehicleNumber || activeHighwayShipment.carrier || "Assigned Carrier Vehicle";
    const routeCorridor = `${activeHighwayShipment.senderCity || "Origin Hub"} → ${activeHighwayShipment.receiverCity || "Destination Hub"}`;
    const trkNo = activeHighwayShipment.trackingNumber;
    const driver = user?.name || user?.firstName || "Driver";

    try {
      localStorage.setItem("shiptrack_driver_sos_reported", isNowBroken ? "true" : "false");
      if (isNowBroken) {
        localStorage.removeItem("shiptrack_breakdown_resolved");
        localStorage.removeItem("shiptrack_resolved_alert_data");
        sessionStorage.removeItem("shiptrack_alert_dismissed");
      } else {
        localStorage.setItem("shiptrack_breakdown_resolved", "true");
        localStorage.setItem("shiptrack_resolved_alert_data", JSON.stringify({
          isResolved: true,
          status: "RESOLVED",
          title: "Highway Carrier Breakdown Resolved",
          message: `Carrier vehicle ${vehicleNo} (${routeCorridor}) breakdown cleared. Vehicle has resumed active highway transit towards destination on schedule.`,
          revisedEta: "Today 09:15 PM (On Schedule)",
          lorryNumber: vehicleNo,
          trackingNumber: trkNo,
          driverName: driver,
          resolvedAt: new Date().toISOString(),
        }));
        localStorage.removeItem("shiptrack_customer_ragu_notification");
        localStorage.removeItem("shiptrack_highway_breakdown_alert");
      }
      window.dispatchEvent(new Event("shiptrack_alert_update"));

      const fleetState = JSON.parse(localStorage.getItem("shiptrack_company_fleet_state") || "[]");
      const updatedFleet = fleetState.map((l) => {
        if (l.lorryNumber === vehicleNo || l.id === "lorry-1" || l.code === "Lorry #1") {
          return {
            ...l,
            status: isNowBroken ? "BREAKDOWN" : "ON_HIGHWAY",
            speed: isNowBroken ? 0 : 65,
            breakdownLocation: isNowBroken ? `${routeCorridor} Corridor` : null,
            breakdownReason: isNowBroken ? `Engine Overheating & Highway Stall (Reported by Driver ${driver})` : null,
          };
        }
        return l;
      });
      localStorage.setItem("shiptrack_company_fleet_state", JSON.stringify(updatedFleet));
    } catch {}

    if (isNowBroken) {
      toast.error("🚨 HIGHWAY BREAKDOWN SOS TRANSMITTED!", {
        description: `Company Fleet Hub notified. Lorry ${vehicleNo} set to BREAKDOWN status.`,
      });
    } else {
      toast.success("✅ Breakdown Status Cleared — Normal Highway Transit Resumed", {
        description: "Customer dashboards updated with Resolved notice & updated ETA."
      });
    }
  };

  const delivered = assigned.filter((s) => s.status === "DELIVERED");

  const failed = assigned.filter(
    (s) => s.status === "FAILED_DELIVERY" || s.status === "CANCELLED",
  );

  const customerCancelled = assigned.filter(
    (s) => s.cancelledByCustomer === true,
  );
  const recentNotifications = useMemo(() => {
    const raw = notifications.data ?? [];
    if (!assigned.length) {
      return raw.filter((n) => !n.shipmentId && !n.title?.includes("TRK-")).slice(0, 5);
    }
    const myTrackingSet = new Set(assigned.map((s) => s.trackingNumber?.toUpperCase()).filter(Boolean));
    const myIdSet = new Set(assigned.map((s) => String(s.id)));

    return raw.filter((n) => {
      if (n.shipmentId && (myTrackingSet.has(String(n.shipmentId).toUpperCase()) || myIdSet.has(String(n.shipmentId)))) {
        return true;
      }
      const match = n.title?.match(/TRK-[A-Z0-9]+/i) || n.message?.match(/TRK-[A-Z0-9]+/i);
      if (match) {
        return myTrackingSet.has(match[0].toUpperCase());
      }
      return !n.title?.includes("TRK-") && !n.message?.includes("TRK-");
    }).slice(0, 5);
  }, [notifications.data, assigned]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <OperatorHeader
          userName={user?.name ?? user?.firstName ?? "Operator"}
          activeCount={0}
        />
        <LoadingState label="Loading your delivery assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <OperatorHeader
        userName={user?.name ?? user?.firstName ?? "Operator"}
        activeCount={active.length}
      />

      {/* Driver Highway SOS Breakdown Card - strictly shown only when an active highway shipment is in transit */}
      {activeHighwayShipment && (
        <Card className={cn(
          "border shadow-sm animate-fade-in transition-all",
          driverBreakdownReported
            ? "border-rose-500/50 bg-rose-500/10"
            : "border-border bg-card"
        )}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm",
                driverBreakdownReported ? "bg-rose-600 animate-pulse shadow-rose-500/30" : "bg-primary"
              )}>
                {driverBreakdownReported ? <AlertTriangle className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Assigned Carrier: <strong className="font-mono">{activeHighwayShipment.vehicleNumber || activeHighwayShipment.carrier || "Assigned Fleet Carrier"}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Corridor: {activeHighwayShipment.senderCity || "Origin Hub"} → {activeHighwayShipment.receiverCity || "Destination Hub"} ({activeHighwayShipment.trackingNumber}) • Live Status:{" "}
                  <span className={cn("font-bold", driverBreakdownReported ? "text-rose-600" : "text-emerald-600")}>
                    {driverBreakdownReported ? "🚨 HIGHWAY BREAKDOWN SOS ACTIVE" : "🟢 ON HIGHWAY (Active Transit)"}
                  </span>
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={driverBreakdownReported ? "default" : "destructive"}
              onClick={handleToggleDriverSos}
              className={cn(
                "text-xs font-bold shrink-0 gap-1.5 shadow-sm",
                driverBreakdownReported ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
              )}
            >
              {driverBreakdownReported ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Resolve Breakdown & Resume Transit
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Report Highway Breakdown SOS to Company
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Deliveries"
          value={active.length}
          icon={Navigation}
          iconClass="bg-primary/10 text-primary border border-primary/20"
          trend={{ value: "LIVE", direction: "neutral" }}
        />
        <StatCard
          label="Pending Pickup"
          value={pending.length}
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-600 border border-amber-500/20"
        />
        <StatCard
          label="Delivered Today"
          value={delivered.length}
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
        />
        <StatCard
          label="Failed / Issues"
          value={failed.length}
          icon={XCircle}
          iconClass="bg-rose-500/10 text-rose-600 border border-rose-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 shadow-card border-border/80">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Package className="h-4.5 w-4.5 text-primary" />
                My Assignments & Dispatch Queue
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-semibold">
                {assigned.length} Total
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Shipments currently assigned to your driver profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[560px] overflow-y-auto scrollbar-thin p-5">
            {active.length === 0 &&
            pending.length === 0 &&
            customerCancelled.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground">All Clear!</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You currently have no pending active deliveries assigned.
                </p>
              </div>
            ) : (
              [...active, ...pending, ...customerCancelled].map((s) => (
                <AssignmentCard
                  key={s.id}
                  shipment={s}
                  acceptShipment={acceptShipment}
                  updateShipmentStatus={updateShipmentStatus}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/80">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Bell className="h-4.5 w-4.5 text-chart-6" />
                Recent Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 max-h-[560px] overflow-y-auto scrollbar-thin p-4">
            {recentNotifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No recent notifications
              </p>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-2xs transition hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                      n.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : n.type === "warning"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {n.title}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground/70">
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/80">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            Completed Today
          </CardTitle>
          <CardDescription className="text-xs">
            Recently delivered shipments in your shift
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {delivered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No deliveries completed yet today
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {delivered.slice(0, 6).map((s) => {
                const pod = podMap.get(s.id) || podMap.get(s.trackingNumber);
                const isVerified = pod && (pod.verificationStatus === "VERIFIED" || pod.verificationStatus === "verified");

                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/app/shipments/${s.id}`}
                          className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {s.trackingNumber}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                          {s.senderCity} → {s.receiverCity}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Delivered
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                      {pod ? (
                        <>
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border",
                            isVerified
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          )}>
                            <ClipboardCheck className="h-3 w-3" />
                            {isVerified ? "POD Verified" : "POD Submitted"}
                          </span>
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 px-2"
                          >
                            <Link to={`/app/pod`}>
                              View Proof →
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Clock className="h-3 w-3" />
                            POD Pending
                          </span>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 px-2.5"
                          >
                            <Link to={`/app/customer/pod/${s.id}`}>
                              <Camera className="mr-1 h-3 w-3" />
                              Submit POD
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OperatorHeader({ userName, activeCount }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-primary/25 border border-white/20">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
              Operator Console
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome, <span className="font-semibold text-foreground">{userName}</span> — manage your active route assignments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 font-bold shadow-2xs border-border/80">
            <Link to="/app/pod">
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              Proof of Delivery (POD)
            </Link>
          </Button>

          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-2xs",
              activeCount > 0
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
            )}
          >
            <span
              className={cn(
                "flex h-2 w-2 rounded-full",
                activeCount > 0 ? "bg-primary animate-ping" : "bg-emerald-500",
              )}
            />
            <span className="text-xs font-bold uppercase tracking-wider">
              {activeCount > 0 ? `${activeCount} Active Deliveries` : "Queue Clear"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ shipment, acceptShipment, updateShipmentStatus }) {
  const isActive =
    shipment.status === "PICKED_UP" ||
    shipment.status === "IN_TRANSIT" ||
    shipment.status === "OUT_FOR_DELIVERY";

  const statusMeta =
    STATUS_FLOW.find((s) => s.key === shipment.status) ?? STATUS_FLOW[0];

  const StatusIcon = statusMeta.icon;
  const canAccept = shipment.status === "CREATED";
  const isCustomerCancelled = shipment.cancelledByCustomer === true;

  function getProgress(status) {
    switch (status) {
      case "CREATED":
        return 10;
      case "PICKED_UP":
        return 30;
      case "IN_TRANSIT":
        return 60;
      case "OUT_FOR_DELIVERY":
        return 85;
      case "DELIVERED":
        return 100;
      case "FAILED_DELIVERY":
        return 100;
      case "CANCELLED":
        return 0;
      default:
        return 0;
    }
  }

  const progress = getProgress(shipment.status);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3 transition-all hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border shrink-0",
              statusMeta.class,
            )}
          >
            <StatusIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-foreground">
              {shipment.trackingNumber}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">
              {shipment.senderCity} → {shipment.receiverCity}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            statusMeta.class,
          )}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2.5">
        <span className="font-medium">
          ETA:{" "}
          <span className="font-bold text-foreground">
            {relativeDay(shipment.estimatedDeliveryAt)}
          </span>
        </span>
        <span className="font-semibold text-foreground">
          Progress: {progress}%
        </span>
      </div> */}

      {/* <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            shipment.status === "DELIVERED"
              ? "bg-emerald-500"
              : shipment.status === "FAILED_DELIVERY"
                ? "bg-rose-500"
                : shipment.status === "OUT_FOR_DELIVERY"
                  ? "bg-amber-500"
                  : "bg-primary",
          )}
          // style={{ width: `${progress}%` }}
        />
      </div> */}

      {canAccept && (
        <div className="pt-1">
          <Button
            size="sm"
            variant="brand"
            className="w-full text-xs font-bold"
            onClick={() => {
              acceptShipment.mutate({
                id: shipment.id,
              });
            }}
            disabled={acceptShipment.isPending}
          >
            Accept Shipment Assignment
          </Button>
        </div>
      )}

      {(isActive || isCustomerCancelled) && (
        <div className="pt-1 flex items-center gap-2">
          {isCustomerCancelled ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="w-full text-xs font-bold"
              disabled
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Cancelled by Customer
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 text-xs font-semibold"
              >
                <Link to={`/app/routes?id=${shipment.id}`}>
                  <Navigation className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Navigation
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
              >
                <Link to={`/app/customer/pod/${shipment.id}`}>
                  <Camera className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Upload POD
                </Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
