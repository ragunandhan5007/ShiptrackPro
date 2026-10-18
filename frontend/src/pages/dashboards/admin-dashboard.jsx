import { useAuth } from "@/context/auth-context";
import {
  useShipments,
  // useVehicles,
  useTeam,
  useAnalytics,
  usePodRecords,
  useUpdateMemberStatus,
} from "@/lib/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ShipmentTable } from "@/components/shared/shipment-table";
import { MapView } from "@/components/shared/map-view";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatDateTime, timeAgo, initials } from "@/lib/utils";
import {
  Package,
  Truck,
  Users,
  ArrowRight,
  Radar,
  ClipboardCheck,
  Server,
  Activity as ActivityIcon,
  ShieldCheck,
  Zap,
  Clock,
  UserCheck,
  Circle,
  Lock,
  Unlock,
  Ban,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const shipments = useShipments();
  // const vehicles = useVehicles();
  // const drivers = useDrivers();
  const team = useTeam();
  const podRecords = usePodRecords();
  const updateStatus = useUpdateMemberStatus();

  const handleToggleStatus = async (memberId, currentStatus, memberRole, memberName) => {
    const roleUpper = (memberRole || "").toUpperCase();
    if (
      roleUpper === "CUSTOMER" ||
      roleUpper === "ADMIN" ||
      memberId === user?.id
    ) {
      toast.error("Action Prohibited", {
        description: "Customer and Administrator accounts cannot be suspended.",
      });
      return;
    }

    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await updateStatus.mutateAsync({ id: memberId, status: nextStatus });
      toast.success(
        nextStatus === "suspended"
          ? `Profile Locked: ${memberName}`
          : `Profile Restored: ${memberName}`,
        {
          description:
            nextStatus === "suspended"
              ? "User profile has been temporarily locked. Access is completely revoked."
              : "User account access successfully restored.",
        },
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update account status");
    }
  };

  const isLoading = shipments.isLoading || team.isLoading;

  const activeShipments =
    shipments.data?.filter((s) =>
      ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"].includes(s.status),
    ) ?? [];
  // const activeVehicles =
  //   vehicles.data?.filter((v) => v.status === "active") ?? [];
  const pendingPod =
    podRecords.data?.filter(
      (p) => p.status === "pending" || p.status === "missing",
    ) ?? [];
  const totalUsers = team.data?.length ?? 0;
  const onlineCount =
    team.data?.filter(
      (m) =>
        m.status !== "suspended" &&
        m.lastActive &&
        m.lastActive !== "—" &&
        m.lastActive !== "-" &&
        Date.now() - new Date(m.lastActive).getTime() < 30 * 60 * 1000,
    ).length ?? 0;

  // const operationalMs =
  //   microservices.data?.filter((m) => m.status === "operational").length ?? 0;
  // const totalMs = microservices.data?.length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Command Center"
          description="Platform-wide operations & system health"
          icon={Radar}
        />
        <LoadingState label="Loading Command Center metrics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Command Center Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-primary/25 border border-white/20">
              <Radar className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
                  Command Center
                </h1>
               
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Welcome back, <span className="font-semibold text-foreground">{user?.firstName ?? user?.name ?? "Admin"}</span> — real-time logistics operations & fleet telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/app/pod">
                <ClipboardCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Proof of Delivery (POD)
              </Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link to="/app/shipments">
                View All Shipments
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={formatNumber(totalUsers)}
          icon={Users}
          iconClass="bg-primary/10 text-primary border border-primary/20"
          footer={`${totalUsers} Registered · ${onlineCount} Online Now`}
        />
        <StatCard
          label="Total Shipments"
          value={formatNumber(shipments.data?.length ?? 0)}
          icon={Package}
          iconClass="bg-chart-6/10 text-chart-6 border border-chart-6/20"
          footer="All-time platform shipments"
        />
        <StatCard
          label="Active Deliveries"
          value={formatNumber(activeShipments.length)}
          icon={Truck}
          iconClass="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          trend={{ value: "LIVE", direction: "up", positive: true }}
          footer="In transit right now"
        />
        <StatCard
          label="Pending POD"
          value={formatNumber(pendingPod.length)}
          icon={ClipboardCheck}
          iconClass="bg-amber-500/10 text-amber-600 border border-amber-500/20"
          footer="Awaiting verification"
        />
      </div>

      {/* Live Real-World Map Command Center Card */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="shadow-card border-border/80 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-3 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-primary" />
                  Live Freight Corridors & Real-World GIS Fleet Map
                </CardTitle>
                <CardDescription className="text-xs">
                  Live satellite-assisted road tracking of moving vehicles along NH-544 (Chennai-Coimbatore) & NH-48 (Bangalore)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Fleet Moving
                </span>
                <Button asChild size="sm" variant="brand" className="text-xs font-bold">
                  <Link to="/app/shipments">
                    View Fleet Shipments <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[380px] w-full">
              <MapView
                route={[
                  { lat: 13.0827, lng: 80.2707 },
                  { lat: 12.9165, lng: 79.1325 },
                  { lat: 11.6643, lng: 78.1460 },
                  { lat: 11.3410, lng: 77.7172 },
                  { lat: 11.0168, lng: 76.9558 },
                ]}
                points={[
                  { lat: 13.0827, lng: 80.2707, name: "Chennai Port Central Hub", status: "active" },
                  { lat: 12.9716, lng: 77.5946, name: "Bangalore Logistics Gateway", status: "active" },
                  { lat: 11.6643, lng: 78.1460, name: "Salem Transit Hub", status: "active" },
                  { lat: 11.0168, lng: 76.9558, name: "Coimbatore Industrial Node", status: "active" },
                ]}
                vehicles={[
                  { id: "TRK-8821 (TN 38 BL 7842)", lat: 12.35, lng: 78.65, speed: "68 km/h", driver: "Amrith Kumar" },
                  { id: "TRK-4410 (KA 01 EK 9022)", lat: 12.82, lng: 78.85, speed: "72 km/h", driver: "Senthil Nathan" },
                ]}
                zoom={7}
                className="!rounded-none h-[380px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Shipments Section */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="shadow-card border-border/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ActivityIcon className="h-4.5 w-4.5 text-primary" />
                  Active In-Transit Shipments
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time monitor of packages currently dispatched across carrier networks
                </CardDescription>
              </div>
              {/* <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                <Link to="/app/shipments">
                  View All ({shipments.data?.length ?? 0})
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button> */}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <ShipmentTable
              shipments={activeShipments}
              emptyLabel="No active shipments in transit"
            />
          </CardContent>
        </Card>
      </div>

      {/* User Accounts & Active Session Telemetry Section */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="shadow-card border-border/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-4.5 w-4.5 text-primary" />
                  User Presence & Session Telemetry
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time presence, role permissions & last active timestamps across all accounts
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                <Link to="/app/team">
                  Manage All Users ({team.data?.length ?? 0})
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {!team.data || team.data.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No user sessions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                      <TableHead>User Account</TableHead>
                      <TableHead>System Role</TableHead>
                      <TableHead>Live Presence</TableHead>
                      <TableHead>Last Active Date & Time</TableHead>
                      <TableHead className="text-right">Admin Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.data.map((m) => {
                      const roleUpper = (m.role || "").toUpperCase();
                      const isSuspended = m.status === "suspended";
                      const isRecentlyActive =
                        m.lastActive &&
                        m.lastActive !== "—" &&
                        Date.now() - new Date(m.lastActive).getTime() < 30 * 60 * 1000;
                      const isOnline = !isSuspended && isRecentlyActive;

                      const roleColors = {
                        ADMIN: "bg-purple-500/10 text-purple-600 border-purple-500/20",
                        LOGISTICS_OPERATOR: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                        BUSINESS_CLIENT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        CUSTOMER: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        SUPPORT_AGENT: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
                      };

                      return (
                        <TableRow key={m.id} className="text-xs">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                  {initials(m.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground text-xs">{m.name}</p>
                                <p className="text-[11px] text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold uppercase ${
                                roleColors[roleUpper] || "bg-muted text-muted-foreground"
                              }`}
                            >
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              {roleUpper.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 border border-rose-500/20">
                                <Lock className="h-3 w-3 text-rose-500" />
                                Suspended / Locked
                              </span>
                            ) : isOnline ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online (Active)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Offline
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-medium">
                            {m.lastActive && m.lastActive !== "—" ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-primary" />
                                <span>{formatDateTime(m.lastActive)}</span>
                                <span className="text-[10px] text-muted-foreground/80">
                                  ({timeAgo(m.lastActive)})
                                </span>
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {roleUpper === "CUSTOMER" ? (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Protected
                              </Badge>
                            ) : roleUpper === "ADMIN" || m.id === user?.id || m.email === user?.email ? (
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                {m.id === user?.id || m.email === user?.email ? "System Root (You)" : "System Root"}
                              </Badge>
                            ) : isSuspended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] font-bold border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() => handleToggleStatus(m.id, m.status, m.role, m.name)}
                              >
                                <Unlock className="mr-1 h-3 w-3" /> Unlock & Restore
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-[11px] font-bold"
                                onClick={() => handleToggleStatus(m.id, m.status, m.role, m.name)}
                              >
                                <Lock className="mr-1 h-3 w-3" /> Suspend & Lock
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

