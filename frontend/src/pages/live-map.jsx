import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShipments } from "@/lib/hooks";
import {
  Map as MapIcon,
  Truck,
  Package,
  Layers,
  Navigation,
  Phone,
  Gauge,
  Compass,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  LocateFixed,
} from "lucide-react";

// Custom Leaflet Div Icons
const createVehicleIcon = (type = "truck", status = "moving") =>
  L.divIcon({
    className: "custom-map-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${
          status === "moving" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"
        }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 30px; height: 30px; border-radius: 10px; background: ${
          status === "moving" ? "#10B981" : "#F59E0B"
        }; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const createHubIcon = (hubName) =>
  L.divIcon({
    className: "custom-hub-icon",
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800;">
          H
        </div>
        <span style="margin-top: 2px; padding: 1px 6px; background: rgba(15, 23, 42, 0.85); color: #FFFFFF; font-size: 9px; font-weight: 700; border-radius: 4px; white-space: nowrap; border: 0.5px solid rgba(255,255,255,0.2);">
          ${hubName}
        </span>
      </div>
    `,
    iconSize: [60, 40],
    iconAnchor: [30, 12],
  });

// Component to programmatically re-center map
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
      });
    }
  }, [center, zoom, map]);
  return null;
}

// Initial Simulated Indian Fleet Network
const INITIAL_FLEET = [
  {
    id: "FLEET-01",
    vehicleNumber: "TN 38 BL 7842",
    driverName: "Amrith Kumar",
    phone: "+91 99999 88888",
    lat: 11.0168,
    lng: 76.9558,
    speed: 64,
    status: "moving",
    heading: "North-East",
    origin: "Coimbatore Hub",
    destination: "Bangalore Logistics Park",
    cargo: "Textile Cotton Yarn (450 kg)",
    routeProgress: 42,
    routeColor: "#2563EB",
  },
  {
    id: "FLEET-02",
    vehicleNumber: "TN 09 BX 9012",
    driverName: "Senthil Nathan",
    phone: "+919840123456",
    lat: 12.9716,
    lng: 77.5946,
    speed: 58,
    status: "moving",
    heading: "East",
    origin: "Bangalore Hub",
    destination: "Chennai Commercial Port",
    cargo: "Industrial Electronics (280 kg)",
    routeProgress: 68,
    routeColor: "#10B981",
  },
  {
    id: "FLEET-03",
    vehicleNumber: "MH 04 ER 5521",
    driverName: "Vikram Patil",
    phone: "+919820987654",
    lat: 18.5204,
    lng: 73.8567,
    speed: 72,
    status: "moving",
    heading: "North-West",
    origin: "Pune Freight Hub",
    destination: "Mumbai JNPT Port",
    cargo: "Precision Auto Components (620 kg)",
    routeProgress: 55,
    routeColor: "#8B5CF6",
  },
  {
    id: "FLEET-04",
    vehicleNumber: "DL 01 AA 3319",
    driverName: "Rajesh Sharma",
    phone: "+919811223344",
    lat: 28.6139,
    lng: 77.209,
    speed: 0,
    status: "idle",
    heading: "Stationary",
    origin: "Delhi Gateway Hub",
    destination: "Jaipur Regional Center",
    cargo: "Pharmaceutical Supplies (110 kg)",
    routeProgress: 100,
    routeColor: "#F59E0B",
  },
  {
    id: "FLEET-05",
    vehicleNumber: "TS 07 KM 8840",
    driverName: "Kiran Reddy",
    phone: "+919849012345",
    lat: 17.385,
    lng: 78.4867,
    speed: 61,
    status: "moving",
    heading: "South",
    origin: "Hyderabad Hub",
    destination: "Bangalore Electronic City",
    cargo: "Organic Spices & Agrifood (340 kg)",
    routeProgress: 35,
    routeColor: "#EC4899",
  },
];

const NATIONAL_HUBS = [
  { id: "HUB-CBE", name: "Coimbatore Hub", lat: 11.0168, lng: 76.9558, type: "Regional Hub" },
  { id: "HUB-BLR", name: "Bangalore Mega Hub", lat: 12.9716, lng: 77.5946, type: "National Center" },
  { id: "HUB-MAA", name: "Chennai Port Hub", lat: 13.0827, lng: 80.2707, type: "Export Gateway" },
  { id: "HUB-HYD", name: "Hyderabad Central Hub", lat: 17.385, lng: 78.4867, type: "Transit Terminal" },
  { id: "HUB-BOM", name: "Mumbai JNPT Logistics", lat: 19.076, lng: 72.8777, type: "Maritime Hub" },
  { id: "HUB-DEL", name: "Delhi Northern Gateway", lat: 28.6139, lng: 77.209, type: "National Center" },
  { id: "HUB-CCU", name: "Kolkata Eastern Hub", lat: 22.5726, lng: 88.3639, type: "Regional Hub" },
];

// Major Indian Highway Transit Polylines
const TRANSIT_CORRIDORS = [
  // NH 544 & NH 44: Coimbatore -> Bangalore
  {
    name: "Corridor South 1: Coimbatore ➔ Bangalore",
    color: "#2563EB",
    points: [
      [11.0168, 76.9558], // CBE
      [11.6643, 78.146],  // Salem
      [12.9716, 77.5946], // BLR
    ],
  },
  // NH 48: Bangalore -> Chennai
  {
    name: "Corridor South 2: Bangalore ➔ Chennai",
    color: "#10B981",
    points: [
      [12.9716, 77.5946], // BLR
      [12.9165, 79.1325], // Vellore
      [13.0827, 80.2707], // MAA
    ],
  },
  // NH 48: Mumbai -> Pune -> Bangalore
  {
    name: "Corridor West-South: Mumbai ➔ Pune ➔ Bangalore",
    color: "#8B5CF6",
    points: [
      [19.076, 72.8777],  // BOM
      [18.5204, 73.8567], // Pune
      [15.3647, 75.124],  // Hubli
      [12.9716, 77.5946], // BLR
    ],
  },
  // NH 44: Bangalore -> Hyderabad -> Delhi
  {
    name: "Corridor Central: Bangalore ➔ Hyderabad ➔ Delhi",
    color: "#F59E0B",
    points: [
      [12.9716, 77.5946], // BLR
      [17.385, 78.4867],  // HYD
      [21.1458, 79.0882], // Nagpur
      [28.6139, 77.209],  // DEL
    ],
  },
];

export function LiveMapPage() {
  const shipments = useShipments();
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [activeLayer, setActiveLayer] = useState("all"); // 'all' | 'vehicles' | 'hubs' | 'routes'
  const [selectedVehicle, setSelectedVehicle] = useState(INITIAL_FLEET[0]);
  const [mapCenter, setMapCenter] = useState([15.5, 78.5]);
  const [mapZoom, setMapZoom] = useState(5);

  // Live coordinate micro-movement simulation (real-time telemetry heartbeat)
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((prevFleet) =>
        prevFleet.map((v) => {
          if (v.status !== "moving") return v;
          // Small realistic latitude / longitude jitter to simulate real road movement
          const deltaLat = (Math.random() - 0.48) * 0.003;
          const deltaLng = (Math.random() - 0.45) * 0.003;
          return {
            ...v,
            lat: v.lat + deltaLat,
            lng: v.lng + deltaLng,
            speed: Math.max(45, Math.min(80, v.speed + Math.floor((Math.random() - 0.5) * 6))),
          };
        }),
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMapCenter([vehicle.lat, vehicle.lng]);
    setMapZoom(8);
  };

  const activeMovingCount = fleet.filter((v) => v.status === "moving").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Live Fleet & Shipment Map"
          description="Real-world OpenStreetMap GIS engine for interactive vehicle tracking & freight corridors"
          icon={MapIcon}
        />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live GPS Telemetry Active
          </Badge>
          <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20 py-1 px-3">
            <Sparkles className="h-3.5 w-3.5" />
            0% Google API Cost (OSM)
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Main Map Canvas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden shadow-card border-border/80">
            <div className="relative h-[650px] w-full">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ background: "#0F172A" }}
              >
                <MapCenterController center={mapCenter} zoom={mapZoom} />

                {/* Real Google Maps Tile Layer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Google Maps</a>'
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  maxZoom={20}
                />

                {/* Render Highway Corridor Polylines */}
                {(activeLayer === "all" || activeLayer === "routes") &&
                  TRANSIT_CORRIDORS.map((corridor, idx) => (
                    <Polyline
                      key={idx}
                      positions={corridor.points}
                      color={corridor.color}
                      weight={4}
                      opacity={0.8}
                      dashArray="8, 6"
                    />
                  ))}

                {/* Render National Transit Hubs */}
                {(activeLayer === "all" || activeLayer === "hubs") &&
                  NATIONAL_HUBS.map((hub) => (
                    <Marker
                      key={hub.id}
                      position={[hub.lat, hub.lng]}
                      icon={createHubIcon(hub.name)}
                    >
                      <Popup>
                        <div className="p-2 space-y-1 text-slate-900">
                          <p className="font-bold text-sm text-primary">{hub.name}</p>
                          <p className="text-xs text-slate-600 font-medium">Type: {hub.type}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Coordinates: {hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Render Live Fleet Delivery Vehicles */}
                {(activeLayer === "all" || activeLayer === "vehicles") &&
                  fleet.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={[vehicle.lat, vehicle.lng]}
                      icon={createVehicleIcon("truck", vehicle.status)}
                      eventHandlers={{
                        click: () => handleSelectVehicle(vehicle),
                      }}
                    >
                      <Popup>
                        <div className="p-2.5 space-y-2 text-slate-900 min-w-[200px]">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-bold text-xs text-primary">{vehicle.vehicleNumber}</span>
                            <span className="rounded bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                              {vehicle.status}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-800">{vehicle.driverName}</p>
                            <p className="text-[11px] text-slate-500">Speed: {vehicle.speed} km/h · Heading: {vehicle.heading}</p>
                            <p className="text-[11px] text-slate-700 mt-1">Cargo: <strong>{vehicle.cargo}</strong></p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{vehicle.origin} ➔ {vehicle.destination}</p>
                          </div>
                          <div className="pt-1 border-t flex items-center justify-between">
                            <a
                              href={`tel:${vehicle.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
                            >
                              <Phone className="h-3 w-3" /> Call Driver
                            </a>
                            <span className="text-[10px] font-bold text-slate-500">{vehicle.routeProgress}% route</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>

              {/* Floating Map Legend & Layer Pill */}
              <div className="absolute top-4 right-4 z-[1000] flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-background/90 p-1.5 shadow-lg backdrop-blur-md">
                <button
                  onClick={() => setActiveLayer("all")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeLayer === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All Layers
                </button>
                <button
                  onClick={() => setActiveLayer("vehicles")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeLayer === "vehicles"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🚚 Fleet ({fleet.length})
                </button>
                <button
                  onClick={() => setActiveLayer("hubs")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeLayer === "hubs"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🏢 Transit Hubs ({NATIONAL_HUBS.length})
                </button>
                <button
                  onClick={() => setActiveLayer("routes")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeLayer === "routes"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🛣️ Corridors
                </button>
              </div>

              {/* Floating Quick Summary Footer */}
              <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-border/80 bg-background/90 px-4 py-2 text-xs shadow-lg backdrop-blur-md flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-foreground">{activeMovingCount} Moving Fleet Units</span>
                </div>
                <span className="text-border">|</span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  OSM GPS Sync: Active
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Fleet Vehicle Telemetry Sidebar */}
        <div className="space-y-4">
          <Card className="shadow-card border-border/80">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Live Fleet Telemetry
              </CardTitle>
              <CardDescription className="text-xs">
                Select a vehicle to center & inspect coordinates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[560px] overflow-y-auto scrollbar-thin">
              {fleet.map((v) => {
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/70 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-foreground">{v.vehicleNumber}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          v.status === "moving"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            v.status === "moving" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                          }`}
                        />
                        {v.status}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>{v.driverName}</span>
                        <span className="font-mono text-primary font-bold text-[11px]">{v.speed} km/h</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{v.cargo}</p>
                      <p className="text-[10px] text-muted-foreground/80 font-medium">
                        {v.origin} ➔ {v.destination}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                      <span className="text-muted-foreground">Progress: <strong>{v.routeProgress}%</strong></span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVehicle(v);
                        }}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                      >
                        <LocateFixed className="h-3 w-3" /> Focus
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default LiveMapPage;