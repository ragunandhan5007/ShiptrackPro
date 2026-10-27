
import { useState } from "react";

import { useEffect } from "react";
import { shipmentsApi } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Package,
  ArrowRight,
  Clock,
  Map as MapIcon,
  Truck,
  Phone,
  MessageSquare,
} from "lucide-react";
import { relativeDay } from "@/lib/utils";

export function TrackPage() {
  const [trackingInput, setTrackingInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  // =================================================
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breakdownAlert, setBreakdownAlert] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shiptrack_highway_breakdown_alert");
      if (saved) setBreakdownAlert(JSON.parse(saved));
    } catch {}
  }, []);
  // const trackQuery = useTrackByNumber(submitted);
  // ==================================================
  useEffect(() => {
    if (!submitted) {
      setTracking(null);
      return;
    }

    async function loadTracking() {
      try {
        setLoading(true);

        const raw = await shipmentsApi.getTracking(submitted);

        if (!raw) {
          setTracking(null);
          return;
        }

        const normalized = {
          ...raw,
          id: raw.id || raw.shipmentId,
          trackingNumber: raw.trackingNumber || submitted,
          status: raw.shipmentStatus || raw.status || "IN_TRANSIT",
          progress: raw.progressPercentage ?? raw.progress ?? 50,
          origin: {
            name: raw.origin?.hubName || raw.origin?.name || raw.origin?.city || raw.senderCity || "Origin Hub",
            city: raw.origin?.city || raw.origin?.hubName || raw.senderCity || "Origin",
            ...raw.origin,
          },
          destination: {
            name: raw.destination?.hubName || raw.destination?.name || raw.destination?.city || raw.receiverCity || "Destination Hub",
            city: raw.destination?.city || raw.destination?.hubName || raw.receiverCity || "Destination",
            ...raw.destination,
          },
          currentLocation: {
            name: raw.currentLocation?.hubName || raw.currentLocation?.name || raw.currentLocation?.city || "Transit Hub",
            city: raw.currentLocation?.city || raw.currentLocation?.hubName || "Transit Hub",
            ...raw.currentLocation,
          },
          estimatedDelivery: raw.estimatedArrival || raw.estimatedDeliveryAt || raw.estimatedDelivery || new Date().toISOString(),
          events: (raw.trackingHistory && raw.trackingHistory.length > 0)
            ? raw.trackingHistory.map((h, i) => ({
                id: h.id || i,
                status: h.status || "IN_TRANSIT",
                location: h.location || h.hubName || "Transit Hub",
                timestamp: h.timestamp || h.eventTime || new Date().toISOString(),
                description: h.description || h.remarks || `Checkpoint recorded at ${h.hubName || "hub"}`,
              }))
            : raw.events || [],
        };

        setTracking(normalized);
      } catch (error) {
        console.error("Load tracking failed:", error);
        setTracking(null);
      } finally {
        setLoading(false);
      }
    }

    loadTracking();
  }, [submitted]);
  // ======================================================================
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(trackingInput.trim());
  };

  // const tracking = trackQuery.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Track a Package"
        description="Enter a tracking number for live status"
        icon={MapPin}
      />

      <Card className="overflow-hidden">
        <div className="relative grid-bg p-6 sm:p-8">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-primary/20">
                <Package className="h-7 w-7" />
              </div>
              <h2 className="mt-3 text-xl font-bold">Where's my package?</h2>
              <p className="text-sm text-muted-foreground">
                Enter your tracking number to see real-time updates
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={trackingInput}
                  onChange={(e) =>
                    setTrackingInput(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. STP-9F4K-8821"
                  className="h-11 pl-9 font-mono"
                />
              </div>
              <Button type="submit" size="lg" disabled={!trackingInput.trim()}>
                Track <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </form>
            {/* ===================================================================== */}
            {/* <p className="text-center text-xs text-muted-foreground">
              Try: STP-9F4K-8821 · STP-2H7M-4410 · STP-5C2P-7733
            </p> */}
            {/* ========================================================= */}
          </div>
        </div>
      </Card>

      {submitted && loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Searching for {submitted}…
          </CardContent>
        </Card>
      )}

      {submitted && !loading && !tracking && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              No shipment found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We couldn't find a shipment with tracking number "{submitted}".
              Please check and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {tracking && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg font-bold">
                      {tracking.trackingNumber}
                    </p>
                    <StatusBadge status={tracking.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tracking.origin.name} → {tracking.destination.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> ETA
                    </p>
                    <p className="text-sm font-semibold">
                      {relativeDay(tracking.estimatedDelivery)}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/app/shipments/${tracking.id}`)}
                  >
                    Full details <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-brand"
                  style={{ width: `${tracking.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {tracking.progress}% complete · currently at{" "}
                {tracking.currentLocation.name}
              </p>
            </CardContent>
          </Card>

          {/* Highway Breakdown Alert Reassurance Banner */}
          {breakdownAlert && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-sm animate-fade-in space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                  ⚠️
                </span>
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Highway Transit Delay Alert: Revised ETA Applied
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Carrier lorry ({breakdownAlert.lorryNumber}) reported technical hold near {breakdownAlert.location}. Relief truck deployed. Your parcel is 100% secure.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-200 pt-1 border-t border-amber-500/20">
                <span>Revised Expected Delivery: {breakdownAlert.delayTime}</span>
                <span className="text-emerald-600">✓ Package Protected & Insured</span>
              </div>
            </div>
          )}

          {/* Driver & Courier Transparency Card */}
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
                        {tracking.driverName || "Amrith Saravanan (Assigned Courier Partner)"}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Duty
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vehicle: <span className="font-mono font-medium text-foreground">{tracking.vehicleNumber || "TN 38 BL 7842"}</span> · Carrier: <span className="font-medium text-foreground">{tracking.carrier || "ShipTrack Express"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    asChild
                    size="sm"
                    variant="brand"
                    className="text-xs font-bold gap-1.5"
                  >
                    <Link to="/app/tickets">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat with Customer Care
                    </Link>
                  </Button>
                  <a
                    href="tel:18004197447"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Emergency Toll-Free
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => navigate(`/app/shipments/${tracking.id || tracking.trackingNumber}`)}
                  >
                    Full Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapIcon className="h-4 w-4 text-primary" />
                  Live Location & Road Route (OpenStreetMap)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[320px]">
                  <MapView
                    tracking={tracking}
                    className="!rounded-none h-[320px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <TrackingTimeline events={tracking.events} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}