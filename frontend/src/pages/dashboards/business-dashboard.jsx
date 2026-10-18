import { useAuth } from "@/context/auth-context";
import { useShipments, useBusinessAnalytics } from "@/lib/hooks";
import { StatCard } from "@/components/shared/stat-card";
import { ShipmentTable } from "@/components/shared/shipment-table";
import { LoadingState } from "@/components/shared/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Truck,
} from "lucide-react";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const myShipments = useShipments();

  const isLoading = myShipments.isLoading;

  const allShipments = myShipments.data ?? [];
  const delivered = allShipments.filter((s) => s.status === "DELIVERED" || s.status === "delivered");
  const inTransit = allShipments.filter((s) =>
    ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP", "in_transit", "out_for_delivery", "picked_up"].includes(s.status),
  );
  const delayed = allShipments.filter((s) =>
    ["delayed", "exception", "FAILED_DELIVERY"].includes(s.status),
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <ExecutiveHeader
          userName={user?.name ?? user?.firstName ?? "Business Client"}
          company={user?.company ?? user?.companyName ?? "Enterprise"}
        />
        <LoadingState label="Loading business dashboard metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ExecutiveHeader
        userName={user?.name ?? user?.firstName ?? "Business Client"}
        company={user?.company ?? user?.companyName ?? "Enterprise"}
        delayedCount={delayed.length}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Shipments"
          value={formatNumber(allShipments.length)}
          icon={Package}
          iconClass="bg-primary/10 text-primary border border-primary/20"
          footer="All client shipments"
        />
        <StatCard
          label="Delivered"
          value={formatNumber(delivered.length)}
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          trend={{
            value: `${Math.round((delivered.length / Math.max(allShipments.length, 1)) * 100)}%`,
            direction: "up",
            positive: true,
          }}
          footer="Success rate"
        />
        <StatCard
          label="In Transit"
          value={formatNumber(inTransit.length)}
          icon={Truck}
          iconClass="bg-chart-6/10 text-chart-6 border border-chart-6/20"
          trend={{ value: "LIVE", direction: "neutral" }}
          footer="Active dispatched"
        />
        <StatCard
          label="Exceptions / Delayed"
          value={formatNumber(delayed.length)}
          icon={AlertTriangle}
          iconClass={
            delayed.length > 0
              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
              : "bg-muted text-muted-foreground"
          }
          trend={{
            value: delayed.length > 0 ? "Action needed" : "All clear",
            direction: "neutral",
          }}
          footer="Dispute / delay count"
        />
      </div>

      <Card className="shadow-card border-border/80">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Client Shipments</CardTitle>
              <CardDescription className="text-xs">All outbound & inbound shipments linked to your business account</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                <Link to="/app/shipments">
                  View All ({allShipments.length}) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <ShipmentTable
            shipments={allShipments}
            showCustomer={false}
            emptyLabel="No shipments created yet"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutiveHeader({ userName, company, delayedCount }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-primary/25 border border-white/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
              Business Portal
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome, <span className="font-semibold text-foreground">{userName || "Client"}</span> — {company ?? "ShipTrackPro Business Account"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {delayedCount !== undefined && delayedCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 shadow-2xs">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {delayedCount} shipment(s) need attention
              </span>
            </div>
          )}
          <Button asChild variant="brand" size="sm" className="font-bold text-xs">
            <Link to="/app/create-shipment">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Shipment
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
;
