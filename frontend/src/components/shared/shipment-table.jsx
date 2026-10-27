import { Link } from "react-router-dom";
import { cn, formatDateTime, relativeDay, formatCurrency } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "./status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plane, Train, Truck, Anchor, ArrowRight, PackageX } from "lucide-react";
import { useMemo, useState } from "react";

const modeIconMap = {
  road: Truck,
  rail: Train,
  air: Plane,
  sea: Anchor,
  ocean: Anchor,
};

export function ShipmentTable({
  shipments = [],
  emptyLabel = "No shipments found",
  showCustomer = true,
}) {
  const [search, setSearch] = useState("");

 const filteredShipments = useMemo(() => {
   const keyword = search.trim().toLowerCase();

   const filtered = keyword
     ? shipments.filter(
         (s) =>
           s.trackingNumber?.toLowerCase().includes(keyword) ||
           s.senderCity?.toLowerCase().includes(keyword) ||
           s.receiverCity?.toLowerCase().includes(keyword) ||
           s.senderName?.toLowerCase().includes(keyword),
       )
     : shipments;

   return [...filtered].sort(
     (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
   );
 }, [shipments, search]);

  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
          <PackageX className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">{emptyLabel}</p>
        <p className="text-xs text-muted-foreground mt-1">There are no active shipments to display right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
       
      </div>

      {filteredShipments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No shipments match "<span className="font-semibold text-foreground">{search}</span>"
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-card scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[180px]">Tracking #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Route</TableHead>
                {showCustomer && (
                  <TableHead className="hidden lg:table-cell">Sender / Customer</TableHead>
                )}
                <TableHead className="hidden md:table-cell">ETA</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((s) => {
                const ModeIcon = modeIconMap[s.mode?.toLowerCase()] || Truck;
                return (
                  <TableRow key={s.id} className="group transition-colors hover:bg-muted/40">
                    <TableCell>
                      <Link
                        to={`/app/shipments/${s.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105 border border-primary/20">
                          <ModeIcon className="h-4.5 w-4.5" />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {s.trackingNumber}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground/80 flex items-center gap-1.5">
                            <span className="uppercase">{s.carrierName || "ShipTrack"}</span>
                            {s.declaredValue ? (
                              <span className="text-emerald-600 font-bold">· Val: {formatCurrency(s.declaredValue)}</span>
                            ) : null}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} size="sm" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="max-w-[110px] truncate text-foreground">
                          {s.senderCity || "Origin"}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        <span className="max-w-[110px] truncate text-foreground">
                          {s.receiverCity || "Destination"}
                        </span>
                      </div>
                    </TableCell>
                    {showCustomer && (
                      <TableCell className="hidden lg:table-cell text-xs font-medium text-muted-foreground">
                        {s.senderName || "—"}
                      </TableCell>
                    )}
                    <TableCell className="hidden md:table-cell text-xs font-medium text-muted-foreground">
                      {relativeDay(s.estimatedDeliveryAt)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PriorityBadge priority={s.priority || "standard"} />
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/shipments/${s.id}`}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function ShipmentListItem({ shipment }) {
  const ModeIcon = modeIconMap[shipment.mode?.toLowerCase()] || Truck;
  return (
    <Link
      to={`/app/shipments/${shipment.id}`}
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-150 hover:border-primary/40 hover:shadow-card hover:-translate-y-0.5 group",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105">
        <ModeIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            {shipment.trackingNumber}
          </span>
          <StatusBadge status={shipment.status} size="sm" />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground font-medium">
          {shipment.senderCity || "Origin"} → {shipment.receiverCity || "Destination"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-foreground">
          {relativeDay(shipment.estimatedDeliveryAt)}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground/80">
          {formatDateTime(shipment.estimatedDeliveryAt)}
        </p>
      </div>
    </Link>
  );
}

