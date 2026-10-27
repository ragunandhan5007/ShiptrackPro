

import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useShipment, useMlEta, usePodRecords } from "@/lib/hooks";
import { MapView } from "@/components/shared/map-view";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { useQuery } from "@tanstack/react-query";
import { shipmentsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  relativeDay,
} from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  MapPin,
  Weight,
  Boxes,
  Truck,
  Plane,
  Ship,
  Train,
  Building2,
  Calendar,
  DollarSign,
  Navigation,
  Printer,
  Share2,
  CircleX,
  Sparkles,
  Cpu,
  ShieldAlert,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ClipboardCheck,
  Camera,
  PenLine,
  AlertTriangle,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

const modeIcon = {
  road: Truck,
  air: Plane,
  ocean: Ship,
  rail: Train,
  multimodal: Truck,
};







export function ShipmentDetailPage() {
  const { id } = useParams();
  const { data: shipment, isLoading } = useShipment(id);
  const tracking = useQuery({
    queryKey: ["shipment-tracking", id],
    queryFn: () => shipmentsApi.getTracking(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // const tracking = useQuery({
  //   queryKey: ["shipment-tracking", id],
  //   queryFn: () => shipmentsApi.getTracking(id),
  // });

  const trackingData = tracking.data;
  const navigate = useNavigate();

  const podQuery = usePodRecords();
  const pod = podQuery.data?.find(
    (r) => Number(r.shipmentId) === Number(shipment?.id) || r.trackingNumber === shipment?.trackingNumber
  );

  const { user } = useAuth();

  // Driver Highway Breakdown SOS state
  const [driverBreakdownReported, setDriverBreakdownReported] = useState(() => {
    try {
      return localStorage.getItem("shiptrack_driver_sos_reported") === "true";
    } catch {
      return false;
    }
  });

  // Broadcast delay alert state (for customer & admin shipment detail view)
  // STRICT REAL-WORLD INTEGRITY:
  // ONLY active when Driver Amrith has actually reported a breakdown SOS (shiptrack_driver_sos_reported === "true")
  const [broadcastAlert, setBroadcastAlert] = useState(() => {
    try {
      const driverSos = localStorage.getItem("shiptrack_driver_sos_reported") === "true";
      if (!driverSos) {
        // Driver has not reported any breakdown SOS -> normal smooth transit!
        return null;
      }
      const raguAlert = localStorage.getItem("shiptrack_customer_ragu_notification");
      if (raguAlert) return JSON.parse(raguAlert);
      const generalAlert = localStorage.getItem("shiptrack_highway_breakdown_alert");
      if (generalAlert) return JSON.parse(generalAlert);
      // Driver reported SOS, awaiting company broadcast dispatch
      return {
        lorryNumber: "TN 38 BL 7842",
        location: "NH-544 Salem Bypass",
        delayTime: "+3h 45m",
        revisedEta: "Today 08:30 PM",
        reason: "Engine Overheating & Highway Stall (Reported by Driver Amrith Saravanan)",
        customMessage: "Dear Customer, your parcel on carrier vehicle TN 38 BL 7842 (Driver: Amrith Saravanan) encountered a highway transit hold near Salem Bypass (NH-544). Standby relief vehicle deployed. Revised Delivery ETA: Today 08:30 PM (+3h 45m). Your package is 100% secure.",
      };
    } catch {}
    return null;
  });

  // Check if THIS shipment is the one affected:
  // Must have an active broadcastAlert from Driver SOS AND belong to vehicle TN 38 BL 7842 / shipment #3
  const isAffectedShipment = Boolean(
    broadcastAlert &&
    (
      String(id) === "3" ||
      shipment?.trackingNumber === "TRK-FC2FA501" ||
      shipment?.trackingNumber === broadcastAlert.trackingNumber ||
      (shipment?.vehicleNumber || "TN 38 BL 7842") === broadcastAlert.lorryNumber
    )
  );

  const handleTriggerBreakdownSOS = () => {
    const isNowBroken = !driverBreakdownReported;
    setDriverBreakdownReported(isNowBroken);
    try {
      localStorage.setItem("shiptrack_driver_sos_reported", isNowBroken ? "true" : "false");
      if (!isNowBroken) {
        localStorage.removeItem("shiptrack_customer_ragu_notification");
        localStorage.removeItem("shiptrack_highway_breakdown_alert");
      }
      const fleetState = JSON.parse(localStorage.getItem("shiptrack_company_fleet_state") || "[]");
      const updatedFleet = fleetState.map((l) => {
        if (l.lorryNumber === "TN 38 BL 7842" || l.id === "lorry-1" || l.code === "Lorry #1") {
          return {
            ...l,
            status: isNowBroken ? "BREAKDOWN" : "ON_HIGHWAY",
            speed: isNowBroken ? 0 : 65,
            breakdownLocation: isNowBroken ? "NH-544 Bypass near Salem" : null,
            breakdownReason: isNowBroken ? "Engine Overheating & Highway Stall (Reported by Driver Amrith Saravanan)" : null,
          };
        }
        return l;
      });
      localStorage.setItem("shiptrack_company_fleet_state", JSON.stringify(updatedFleet));
    } catch {}

    if (isNowBroken) {
      toast.error("🚨 HIGHWAY BREAKDOWN SOS TRANSMITTED!", {
        description: "Company Fleet Hub alerted. Standby vehicle requested for vehicle TN 38 BL 7842.",
      });
    } else {
      toast.success("✅ Breakdown Status Cleared — Normal Highway Transit Resumed");
    }
  };

  const mlEta = useMlEta({
    distance_km: trackingData?.remainingDistanceKm || 50,
    package_weight_kg: shipment?.packageWeightKg || 2.5,
    traffic_condition: trackingData?.trafficCondition || "LOW",
    weather_condition: trackingData?.weatherCondition || "CLEAR",
    road_condition: trackingData?.roadCondition || "GOOD",
    hubs_count: trackingData?.trackingHistory?.length || 2,
  });

  if (isLoading || tracking.isLoading) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <LoadingState label="Loading shipment…" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={Package}
          title="Shipment not found"
          description="This shipment may have been removed or the link is invalid."
          action={
            <Button asChild>
              <Link to="/app/shipments">View all shipments</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // const ModeIcon = modeIcon[shipment.mode];
  const ModeIcon = Truck;
const isCustomerCancelled = shipment.cancelledByCustomer === true;
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold tracking-tight">
                {shipment.trackingNumber}
              </h1>
              <StatusBadge status={shipment.status} />
              <PriorityBadge priority={shipment.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              {shipment.senderCity} → {shipment.receiverCity} ·{" "}
              {shipment.carrier}
            </p>
          </div>
        </div>
      </div>

      {/* Highway Transit Delay Alert Banner (shows for affected shipment only) */}
      {isAffectedShipment && (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-md animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    ⚠️ Highway Carrier Transit Delay Alert
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    {broadcastAlert.delayTime || "+3h 45m"}
                  </span>
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    Revised ETA: {broadcastAlert.revisedEta || "Today 08:30 PM"}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium mt-1.5 leading-relaxed">
                  {broadcastAlert.customMessage || broadcastAlert.message || `Your parcel on carrier vehicle ${broadcastAlert.lorryNumber || "TN 38 BL 7842"} encountered a highway transit hold near ${broadcastAlert.location || "Salem"}. Standby relief vehicle deployed.`}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>Vehicle: <strong className="font-mono text-foreground">{broadcastAlert.lorryNumber || "TN 38 BL 7842"}</strong></span>
                  <span>Driver: <strong className="text-foreground">Amrith Saravanan</strong></span>
                  <span>Location: <strong className="text-foreground">{broadcastAlert.location || "NH-544 Salem Bypass"}</strong></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Map */}
          <Card className="overflow-hidden">
            <div className="relative h-[700px]">
              {/* =================================================== */}
              {/* <MapView
                shipment={shipment}
                className="!rounded-none h-[380px]"
              /> */}
              <MapView
                tracking={trackingData}
                shipment={shipment}
                className="!rounded-none h-[700px]"
              />
              {/* ====================================================== */}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="font-semibold text-primary">
                  {trackingData?.progressPercentage ?? 0}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-brand transition-all"
                  style={{
                    width: `${trackingData?.progressPercentage ?? 0}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {/* <MapPin className="h-3 w-3" /> {shipment.currentLocation.name} */}
                </span>
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" /> {shipment.receiverCity}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Agent & Fleet Transparency Card */}
          <Card className="border-primary/20 shadow-sm bg-gradient-to-r from-card via-card to-primary/[0.02]">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm">
                        {shipment.assignedDriverName || "Amrith Saravanan (Assigned Fleet Driver)"}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Dispatched
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vehicle: <span className="font-mono font-medium text-foreground">{shipment.vehicleNumber || "TN 38 BL 7842"}</span> · Carrier: <span className="font-medium text-foreground">{shipment.carrier || "ShipTrack Express Fleet"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {user?.role === "logistics_operator" && (
                    <>
                      {["IN_TRANSIT", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(shipment?.status) && (
                        <Button
                          size="sm"
                          variant={driverBreakdownReported ? "destructive" : "outline"}
                          onClick={handleTriggerBreakdownSOS}
                          className={cn(
                            "text-xs font-bold gap-1.5 shadow-sm transition-all",
                            driverBreakdownReported
                              ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                              : "border-rose-500/50 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                          )}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {driverBreakdownReported ? "Cancel Breakdown SOS" : "🚨 Report Breakdown SOS to Company"}
                        </Button>
                      )}
                      {shipment?.status === "DELIVERED" && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Delivery Completed by You
                        </span>
                      )}
                      <a
                        href="tel:+918116959362"
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
                        Fleet Control Desk
                      </a>
                    </>
                  )}

                  {user?.role === "customer" && (
                    <>
                      <Button asChild size="sm" variant="brand" className="text-xs font-bold gap-1.5">
                        <Link to="/app/tickets">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat with Customer Care
                        </Link>
                      </Button>
                      <a
                        href="tel:18004197447"
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        Toll-Free 1800-419-7447
                      </a>
                    </>
                  )}

                  {user?.role !== "logistics_operator" && user?.role !== "customer" && (
                    <a
                      href="tel:+918116959362"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
                      Fleet Control Desk
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof of Delivery (POD) Section */}
          {(shipment?.status === "DELIVERED" || pod) && (
            <Card className="border-emerald-500/30 shadow-sm bg-gradient-to-r from-card via-card to-emerald-500/[0.02]">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <ClipboardCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Proof of Delivery (POD)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Official delivery verification and recipient sign-off
                      </CardDescription>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/25">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {pod?.verificationStatus || "DELIVERED & VERIFIED"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo Proof */}
                  <div>
                    <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-primary" /> Delivery Photo Proof
                    </p>
                    {pod?.photoUrl ? (
                      <img
                        src={pod.photoUrl}
                        alt="Proof of Delivery"
                        className="h-44 w-full rounded-xl border border-border/80 object-cover shadow-2xs"
                      />
                    ) : (
                      <div className="h-44 w-full rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <Camera className="h-8 w-8 mb-1.5 text-muted-foreground/50" />
                        <p className="text-xs font-semibold text-foreground">Contactless Handover</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Package delivered directly to recipient at doorstep</p>
                      </div>
                    )}
                  </div>

                  {/* Recipient Signature */}
                  <div>
                    <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <PenLine className="h-3.5 w-3.5 text-primary" /> Digital Sign-off
                    </p>
                    {pod?.signatureUrl ? (
                      <img
                        src={pod.signatureUrl}
                        alt="Recipient Signature"
                        className="h-44 w-full rounded-xl border border-border/80 bg-white object-contain shadow-2xs p-2"
                      />
                    ) : (
                      <div className="h-44 w-full rounded-xl border border-dashed border-border/80 bg-white flex flex-col items-center justify-center p-4 text-center shadow-2xs">
                        <span className="font-serif italic text-lg text-slate-800 tracking-wider underline decoration-primary/40 decoration-2">
                          {pod?.recipientName || shipment?.receiverName || "Verified Recipient"}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
                          Digitally Authenticated OTP Delivery
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recipient Details Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-muted-foreground">Received by: </span>
                    <span className="font-bold text-foreground">
                      {pod?.recipientName || shipment?.receiverName}
                    </span>
                    {(pod?.recipientPhone || shipment?.receiverPhone) && (
                      <span className="text-muted-foreground ml-1">
                        ({pod?.recipientPhone || shipment?.receiverPhone})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Delivered at: </span>
                    <span className="font-bold text-foreground">
                      {formatDateTime(pod?.capturedAt || pod?.createdAt || shipment?.deliveredAt || shipment?.updatedAt)}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold text-primary">
                    <Link to="/app/pod">
                      All POD Records →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
              <CardDescription>Chronological shipment events</CardDescription>
            </CardHeader>
            <CardContent>
              <TrackingTimeline events={trackingData?.trackingHistory ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Shipment Details */}

        

          {isCustomerCancelled ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <CircleX className="h-5 w-5" />
                  </span>

                  <div>
                    <CardTitle className="text-destructive">
                      Shipment Cancelled
                    </CardTitle>

                    <CardDescription className="mt-1">
                      This parcel was cancelled by the customer.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
                    {shipment.cancellationReason ||
                      "No cancellation reason was provided."}
                  </p>
                </div>

                {shipment.cancelledAt && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Cancelled on {formatDateTime(shipment.cancelledAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className={cn(isAffectedShipment && "border-amber-500/40 shadow-md")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Delivery Prediction</CardTitle>
                    <CardDescription>
                      Live ETA and delivery forecast
                    </CardDescription>
                  </div>
                  {isAffectedShipment && (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      REVISED (+3h 45m)
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <DetailRow
                  icon={Navigation}
                  label="Remaining Distance"
                  value={
                    isAffectedShipment
                      ? `${trackingData?.remainingDistanceKm ?? 190} km (Hold near Salem KM 342)`
                      : `${trackingData?.remainingDistanceKm ?? 0} km`
                  }
                />

                <DetailRow
                  icon={Truck}
                  label="Estimated Travel Time"
                  value={
                    isAffectedShipment
                      ? `${trackingData?.estimatedHours ?? 5} hrs ${trackingData?.estimatedMinutes ?? 14} mins + 3h 45m Delay (~9 hrs)`
                      : `${trackingData?.estimatedHours ?? 0} hrs ${
                          trackingData?.estimatedMinutes ?? 0
                        } mins`
                  }
                />

                <DetailRow
                  icon={Calendar}
                  label="Estimated Arrival"
                  value={
                    isAffectedShipment
                      ? "Today, 08:30 PM (Revised ETA)"
                      : formatDateTime(trackingData?.estimatedArrival)
                  }
                />

                <DetailRow
                  icon={Package}
                  label="Forecast"
                  value={
                    isAffectedShipment
                      ? "DELAYED (+3h 45m Highway Incident)"
                      : trackingData?.deliveryForecast?.forecastStatus
                  }
                />

                <DetailRow
                  icon={Package}
                  label="Confidence"
                  value={
                    isAffectedShipment
                      ? "98% (ML Risk Model Engine)"
                      : `${trackingData?.deliveryForecast?.confidencePercentage}%`
                  }
                />

                <DetailRow
                  icon={Package}
                  label="Reason"
                  value={
                    isAffectedShipment
                      ? "Carrier vehicle TN 38 BL 7842 highway technical hold near Salem. Standby relief vehicle dispatched."
                      : trackingData?.deliveryForecast?.reason
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* AI / ML Insights Card */}
          <Card className="border-primary/40 shadow-sm bg-gradient-to-b from-card to-primary/[0.02]">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  AI & Machine Learning Insights
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                  ML Engine Active
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time predictive telemetry & risk assessment
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {/* Model 1: ETA & Delay Risk */}
              <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-primary" /> Model 1: ETA Delay Risk
                  </span>
                  <Badge
                    className={
                      mlEta.data?.risk_level === "HIGH"
                        ? "bg-rose-500 text-white"
                        : mlEta.data?.risk_level === "MEDIUM"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                    }
                  >
                    {mlEta.data?.risk_level || "LOW"} RISK
                  </Badge>
                </div>

                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Predicted Delay:</span>
                  <span className="font-bold text-foreground">
                    +{mlEta.data?.predicted_delay_minutes || 0} mins
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Delay Probability:</span>
                  <span className="font-bold text-foreground">
                    {Math.round((mlEta.data?.delay_risk_probability || 0.15) * 100)}%
                  </span>
                </div>

                {mlEta.data?.contributing_factors?.length > 0 && (
                  <div className="pt-1.5 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">
                      Factors Analyzed:
                    </p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-[11px] text-muted-foreground/90">
                      {mlEta.data.contributing_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            
            <CardHeader>
              <CardTitle>Sender</CardTitle>
              <CardDescription>Shipment sender information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailRow
                icon={Building2}
                label="Name"
                value={shipment.senderName}
              />

              <DetailRow
                icon={Navigation}
                label="Phone"
                value={shipment.senderPhone}
              />

              <DetailRow
                icon={Package}
                label="Email"
                value={shipment.senderEmail}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${shipment.senderAddress},
${shipment.senderCity},
${shipment.senderState}
${shipment.senderPostalCode},
${shipment.senderCountry}`}
              />
            </CardContent>

            
          </Card>

          {/* Cargo */}
          <Card>
            <CardHeader>
              <CardTitle>Package</CardTitle>
              <CardDescription>Package information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                icon={Package}
                label="Tracking Number"
                value={shipment.trackingNumber}
              />

              <DetailRow
                icon={Truck}
                label="Shipment Type"
                value={shipment.shipmentType}
              />

              <DetailRow
                icon={Weight}
                label="Weight"
                value={`${shipment.packageWeightKg} kg`}
              />

              <DetailRow
                icon={Boxes}
                label="Package Type"
                value={shipment.packageType}
              />

              <DetailRow
                icon={DollarSign}
                label="Declared Value"
                value={formatCurrency(shipment.declaredValue)}
              />

              <DetailRow
                icon={Package}
                label="Description"
                value={shipment.packageDescription}
              />

              <DetailRow
                icon={Package}
                label="Priority"
                value={shipment.priority}
              />

              <DetailRow
                icon={Package}
                label="Status"
                value={shipment.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receiver</CardTitle>
              <CardDescription>Delivery recipient information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailRow
                icon={Building2}
                label="Name"
                value={shipment.receiverName}
              />

              <DetailRow
                icon={Navigation}
                label="Phone"
                value={shipment.receiverPhone}
              />

              <DetailRow
                icon={Package}
                label="Email"
                value={shipment.receiverEmail}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${shipment.receiverAddress},
${shipment.receiverCity},
${shipment.receiverState}
${shipment.receiverPostalCode},
${shipment.receiverCountry}`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}