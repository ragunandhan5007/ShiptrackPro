import { useEffect, useRef, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Truck, Navigation, Check, MapPin, Layers } from "lucide-react";

// 35+ Major Indian Logistics Hub Coordinates
export const INDIAN_CITY_COORDINATES = {
  srinagar: [34.0837, 74.7973],
  jammu: [32.7266, 74.8570],
  pathankot: [32.2689, 75.6499],
  jalandhar: [31.3260, 75.5762],
  ludhiana: [30.9010, 75.8573],
  chandigarh: [30.7333, 76.7794],
  ambala: [30.3782, 76.7767],
  dehradun: [30.3165, 78.0322],
  shimla: [31.1048, 77.1734],
  delhi: [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  kanpur: [26.4499, 80.3319],
  patna: [25.5941, 85.1376],
  ranchi: [23.3441, 85.3096],
  kolkata: [22.5726, 88.3639],
  siliguri: [26.7271, 88.3953],
  guwahati: [26.1445, 91.7362],
  bhubaneswar: [20.2961, 85.8245],
  raipur: [21.2514, 81.6296],
  bhopal: [23.2599, 77.4126],
  indore: [22.7196, 75.8577],
  nagpur: [21.1458, 79.0882],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  vadodara: [22.3072, 73.1812],
  mumbai: [19.0760, 72.8777],
  pune: [18.5204, 73.8567],
  nashik: [19.9975, 73.7898],
  hyderabad: [17.3850, 78.4867],
  vijayawada: [16.5062, 80.6480],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  mysuru: [12.2958, 76.6394],
  chennai: [13.0827, 80.2707],
  vellore: [12.9165, 79.1325],
  salem: [11.6643, 78.1460],
  erode: [11.3410, 77.7172],
  tirupur: [11.1085, 77.3411],
  coimbatore: [11.0168, 76.9558],
  cbe: [11.0168, 76.9558],
  cmb: [11.0168, 76.9558],
  cjb: [11.0168, 76.9558],
  che: [13.0827, 80.2707],
  mas: [13.0827, 80.2707],
  maa: [13.0827, 80.2707],
  blr: [12.9716, 77.5946],
  bom: [19.0760, 72.8777],
  pnq: [18.5204, 73.8567],
  madurai: [9.9252, 78.1198],
  trichy: [10.7905, 78.7047],
  tiruchirappalli: [10.7905, 78.7047],
  kochi: [9.9312, 76.2673],
};

export function lookupCoords(cityName) {
  if (!cityName) return null;
  const clean = String(cityName).trim().toLowerCase();
  for (const [key, coords] of Object.entries(INDIAN_CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  return null;
}

// Custom Marker Icons
const originIcon = (cityName = "Origin") =>
  L.divIcon({
    className: "custom-origin-icon",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <span style="background:#2563eb;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:12px;box-shadow:0 2px 6px rgba(37,99,235,0.4);letter-spacing:0.5px;">ORIGIN</span>
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#2563eb;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);margin-top:2px;"></div>
      <span style="font-size:10px;font-weight:700;background:rgba(15,23,42,0.85);color:white;padding:1px 6px;border-radius:4px;margin-top:2px;white-space:nowrap;">${cityName}</span>
    </div>`,
    iconSize: [80, 56],
    iconAnchor: [40, 48],
  });

const destinationIcon = (cityName = "Destination") =>
  L.divIcon({
    className: "custom-dest-icon",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <span style="background:#059669;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:12px;box-shadow:0 2px 6px rgba(5,150,105,0.4);letter-spacing:0.5px;">DESTINATION</span>
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#059669;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);margin-top:2px;"></div>
      <span style="font-size:10px;font-weight:700;background:rgba(15,23,42,0.85);color:white;padding:1px 6px;border-radius:4px;margin-top:2px;white-space:nowrap;">${cityName}</span>
    </div>`,
    iconSize: [80, 56],
    iconAnchor: [40, 48],
  });

const intermediateWaypointIcon = (stopNum, name, isPassed, isCurrent) =>
  L.divIcon({
    className: "custom-intermediate-hub",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${isCurrent ? '#f59e0b' : isPassed ? '#10b981' : '#475569'};color:${isCurrent ? '#0f172a' : '#ffffff'};font-size:9px;font-weight:800;padding:1.5px 6px;border-radius:999px;box-shadow:0 2px 5px rgba(0,0,0,0.25);border:1px solid ${isCurrent ? '#d97706' : isPassed ? '#059669' : '#334155'};">
        ${isCurrent ? '★ ACTIVE HUB' : isPassed ? '✔ PASSED' : `HUB #${stopNum}`}
      </div>
      <div style="width:24px;height:24px;border-radius:50%;background:${isCurrent ? '#f59e0b' : isPassed ? '#10b981' : '#64748b'};border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:900;font-size:10px;margin-top:1px;">
        ${isPassed ? '✓' : stopNum}
      </div>
      <span style="font-size:9px;font-weight:700;background:rgba(15,23,42,0.85);color:#fde68a;padding:1px 5px;border-radius:4px;margin-top:1px;white-space:nowrap;">${name}</span>
    </div>`,
    iconSize: [80, 54],
    iconAnchor: [40, 27],
  });

const liveTruckIcon = (speed = 68, isDocked = false, label = "Moving") =>
  L.divIcon({
    className: "custom-truck-marker",
    html: `<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(16,185,129,0.35);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;width:36px;height:36px;border-radius:50%;background:#059669;border:2.5px solid white;box-shadow:0 4px 12px rgba(5,150,105,0.4);display:flex;align-items:center;justify-content:center;color:white;z-index:10;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
      <span style="position:absolute;bottom:-6px;font-size:8px;font-weight:800;background:#0f172a;color:#38bdf8;padding:1px 5px;border-radius:4px;border:1px solid #0284c7;white-space:nowrap;z-index:11;">
        ${isDocked ? "TRUCK AT HUB" : `${speed} km/h`}
      </span>
    </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 7);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 10,
      });
    }
  }, [map, points]);
  return null;
}

export function MapView({
  points,
  route,
  className,
  tracking,
  shipment,
  vehicles,
  zoom = 6,
}) {
  const mapRef = useRef(null);
  const [selectedHubIndex, setSelectedHubIndex] = useState(null);

  // Compute Origin, Destination, and Intermediate Hubs
  const corridorData = useMemo(() => {
    const originCity =
      tracking?.origin?.city ||
      tracking?.origin?.name ||
      tracking?.origin?.hubName ||
      shipment?.senderCity ||
      shipment?.originHub ||
      "Coimbatore";

    const destCity =
      tracking?.destination?.city ||
      tracking?.destination?.name ||
      tracking?.destination?.hubName ||
      shipment?.receiverCity ||
      shipment?.destinationHub ||
      "Chennai";

    let originCoords =
      (tracking?.origin?.latitude && tracking?.origin?.longitude ? [tracking.origin.latitude, tracking.origin.longitude] : null) ||
      lookupCoords(originCity) || [11.0168, 76.9558];

    let destCoords =
      (tracking?.destination?.latitude && tracking?.destination?.longitude ? [tracking.destination.latitude, tracking.destination.longitude] : null) ||
      lookupCoords(destCity) || [13.0827, 80.2707];

    const originLow = originCity.toLowerCase();
    const destLow = destCity.toLowerCase();

    const isOriginCbe = originLow.includes("coimbatore") || originLow.includes("cbe") || originLow.includes("cmb") || originLow.includes("cjb");
    const isDestCbe = destLow.includes("coimbatore") || destLow.includes("cbe") || destLow.includes("cmb") || destLow.includes("cjb");
    const isOriginChe = originLow.includes("chennai") || originLow.includes("che") || originLow.includes("mas") || originLow.includes("maa") || originLow.includes("madras");
    const isDestChe = destLow.includes("chennai") || destLow.includes("che") || destLow.includes("mas") || destLow.includes("maa") || destLow.includes("madras");

    const isOriginBlr = originLow.includes("bangalore") || originLow.includes("bengaluru") || originLow.includes("blr");
    const isDestBlr = destLow.includes("bangalore") || destLow.includes("bengaluru") || destLow.includes("blr");

    const isOriginMum = originLow.includes("mumbai") || originLow.includes("bom") || originLow.includes("bombay");
    const isDestMum = destLow.includes("mumbai") || destLow.includes("bom") || destLow.includes("bombay");
    const isOriginPune = originLow.includes("pune") || originLow.includes("pnq") || originLow.includes("poona");
    const isDestPune = destLow.includes("pune") || destLow.includes("pnq") || destLow.includes("poona");

    const isOriginSri = originLow.includes("srinagar");
    const isDestSri = destLow.includes("srinagar");
    const isOriginDeh = originLow.includes("dehradun");
    const isDestDeh = destLow.includes("dehradun");

    // Case 1A: Coimbatore ➔ Chennai
    if (isOriginCbe && isDestChe) {
      return {
        origin: { name: "Coimbatore Industrial Node", city: "Coimbatore", coords: [11.0168, 76.9558] },
        destination: { name: "Chennai Port Central Hub", city: "Chennai", coords: [13.0827, 80.2707] },
        intermediateHubs: [
          { stopNum: 1, name: "Erode Logistics Node", city: "Erode", coords: [11.3410, 77.7172], toll: "₹105", eta: "1h 30m" },
          { stopNum: 2, name: "Salem Central Junction", city: "Salem", coords: [11.6643, 78.1460], toll: "₹140", eta: "3h 45m" },
          { stopNum: 3, name: "Vellore Gate Transit Hub", city: "Vellore", coords: [12.9165, 79.1325], toll: "₹95", eta: "6h 15m" },
        ],
        activeStep: 2, // At Intermediate Hub #2 (Salem)
      };
    }

    // Case 1B: Chennai ➔ Coimbatore
    if (isOriginChe && isDestCbe) {
      return {
        origin: { name: "Chennai Port Central Hub", city: "Chennai", coords: [13.0827, 80.2707] },
        destination: { name: "Coimbatore Industrial Node", city: "Coimbatore", coords: [11.0168, 76.9558] },
        intermediateHubs: [
          { stopNum: 1, name: "Vellore Gate Transit Hub", city: "Vellore", coords: [12.9165, 79.1325], toll: "₹95", eta: "1h 45m" },
          { stopNum: 2, name: "Salem Central Junction", city: "Salem", coords: [11.6643, 78.1460], toll: "₹140", eta: "4h 10m" },
          { stopNum: 3, name: "Erode Logistics Node", city: "Erode", coords: [11.3410, 77.7172], toll: "₹105", eta: "6h 05m" },
        ],
        activeStep: 2, // At Intermediate Hub #2 (Salem)
      };
    }

    // Case 2A: Bangalore ➔ Chennai
    if (isOriginBlr && isDestChe) {
      return {
        origin: { name: "Bangalore Electronic City Hub", city: "Bengaluru", coords: [12.9716, 77.5946] },
        destination: { name: "Chennai Port Central Hub", city: "Chennai", coords: [13.0827, 80.2707] },
        intermediateHubs: [
          { stopNum: 1, name: "Hosur Border Cargo Hub", city: "Hosur", coords: [12.7409, 77.8253], toll: "₹70", eta: "45m" },
          { stopNum: 2, name: "Krishnagiri Junction", city: "Krishnagiri", coords: [12.5250, 78.2140], toll: "₹85", eta: "1h 45m" },
          { stopNum: 3, name: "Vellore Freight Station", city: "Vellore", coords: [12.9165, 79.1325], toll: "₹65", eta: "3h 15m" },
        ],
        activeStep: 2,
      };
    }

    // Case 2B: Chennai ➔ Bangalore
    if (isOriginChe && isDestBlr) {
      return {
        origin: { name: "Chennai Port Central Hub", city: "Chennai", coords: [13.0827, 80.2707] },
        destination: { name: "Bangalore Electronic City Hub", city: "Bengaluru", coords: [12.9716, 77.5946] },
        intermediateHubs: [
          { stopNum: 1, name: "Vellore Freight Station", city: "Vellore", coords: [12.9165, 79.1325], toll: "₹65", eta: "1h 45m" },
          { stopNum: 2, name: "Krishnagiri Junction", city: "Krishnagiri", coords: [12.5250, 78.2140], toll: "₹85", eta: "3h 15m" },
          { stopNum: 3, name: "Hosur Border Cargo Hub", city: "Hosur", coords: [12.7409, 77.8253], toll: "₹70", eta: "4h 15m" },
        ],
        activeStep: 2,
      };
    }

    // Case 3A: Mumbai ➔ Pune
    if (isOriginMum && isDestPune) {
      return {
        origin: { name: "Mumbai JNPT Freight Terminal", city: "Mumbai", coords: [19.0760, 72.8777] },
        destination: { name: "Pune Auto Corridor Hub", city: "Pune", coords: [18.5204, 73.8567] },
        intermediateHubs: [
          { stopNum: 1, name: "Navi Mumbai Express Terminal", city: "Navi Mumbai", coords: [19.0330, 73.0297], toll: "₹100", eta: "40m" },
          { stopNum: 2, name: "Lonavala Ghat Transit Point", city: "Lonavala", coords: [18.7557, 73.4091], toll: "₹220", eta: "1h 35m" },
        ],
        activeStep: 2,
      };
    }

    // Case 3B: Pune ➔ Mumbai
    if (isOriginPune && isDestMum) {
      return {
        origin: { name: "Pune Auto Corridor Hub", city: "Pune", coords: [18.5204, 73.8567] },
        destination: { name: "Mumbai JNPT Freight Terminal", city: "Mumbai", coords: [19.0760, 72.8777] },
        intermediateHubs: [
          { stopNum: 1, name: "Lonavala Ghat Transit Point", city: "Lonavala", coords: [18.7557, 73.4091], toll: "₹220", eta: "55m" },
          { stopNum: 2, name: "Navi Mumbai Express Terminal", city: "Navi Mumbai", coords: [19.0330, 73.0297], toll: "₹100", eta: "1h 50m" },
        ],
        activeStep: 1,
      };
    }

    // Case 4A: Srinagar ➔ Dehradun
    if (isOriginSri && isDestDeh) {
      return {
        origin: { name: "Srinagar Freight Gateway", city: "Srinagar", coords: [34.0837, 74.7973] },
        destination: { name: "Dehradun Doon Valley Hub", city: "Dehradun", coords: [30.3165, 78.0322] },
        intermediateHubs: [
          { stopNum: 1, name: "Jammu Tawi Freight Terminal", city: "Jammu", coords: [32.7266, 74.8570], toll: "₹110", eta: "4h 30m" },
          { stopNum: 2, name: "Jalandhar Central Logistics Depot", city: "Jalandhar", coords: [31.3260, 75.5762], toll: "₹140", eta: "8h 15m" },
          { stopNum: 3, name: "Chandigarh Tri-City Gateway", city: "Chandigarh", coords: [30.7333, 76.7794], toll: "₹85", eta: "11h 45m" },
        ],
        activeStep: 2, // At Intermediate Hub #2 (Jalandhar)
      };
    }

    // Case 4B: Dehradun ➔ Srinagar
    if (isOriginDeh && isDestSri) {
      return {
        origin: { name: "Dehradun Doon Valley Hub", city: "Dehradun", coords: [30.3165, 78.0322] },
        destination: { name: "Srinagar Freight Gateway", city: "Srinagar", coords: [34.0837, 74.7973] },
        intermediateHubs: [
          { stopNum: 1, name: "Chandigarh Tri-City Gateway", city: "Chandigarh", coords: [30.7333, 76.7794], toll: "₹85", eta: "2h 30m" },
          { stopNum: 2, name: "Jalandhar Central Logistics Depot", city: "Jalandhar", coords: [31.3260, 75.5762], toll: "₹140", eta: "5h 45m" },
          { stopNum: 3, name: "Jammu Tawi Freight Terminal", city: "Jammu", coords: [32.7266, 74.8570], toll: "₹110", eta: "9h 30m" },
        ],
        activeStep: 2,
      };
    }

    // Case 4: If backend database provided 3+ hubs in tracking.route
    if (tracking?.route && tracking.route.length >= 3) {
      const orig = tracking.route[0];
      const dest = tracking.route[tracking.route.length - 1];
      const intermediates = tracking.route.slice(1, -1).map((h, i) => ({
        stopNum: i + 1,
        name: h.hubName || `${h.city} Transit Node`,
        city: h.city || h.hubName || `Hub #${i + 1}`,
        coords: [h.latitude || 20.0, h.longitude || 78.0],
        toll: "₹90",
        eta: `${(i + 1) * 2}h`,
      }));

      return {
        origin: { name: orig.hubName || originCity, city: orig.city || originCity, coords: [orig.latitude || originCoords[0], orig.longitude || originCoords[1]] },
        destination: { name: dest.hubName || destCity, city: dest.city || destCity, coords: [dest.latitude || destCoords[0], dest.longitude || destCoords[1]] },
        intermediateHubs: intermediates,
        activeStep: 2,
      };
    }

    // Default Case: Generate 3 realistic intermediate highway hubs along the route vector
    const hubNames = [
      { name: "Highway Transit Junction", city: "Transit Gate", toll: "₹95", eta: "2h 30m" },
      { name: "Central Commercial Node", city: "Midway Junction", toll: "₹140", eta: "5h 15m" },
      { name: "Regional Distribution Depot", city: "Expressway Post", toll: "₹110", eta: "8h 00m" },
    ];

    const intermediates = [0.25, 0.5, 0.75].map((ratio, idx) => {
      const lat = originCoords[0] + (destCoords[0] - originCoords[0]) * ratio + (idx % 2 === 0 ? 0.08 : -0.08);
      const lng = originCoords[1] + (destCoords[1] - originCoords[1]) * ratio;
      return {
        stopNum: idx + 1,
        name: `${destCity} Transit Hub #${idx + 1}`,
        city: hubNames[idx].city,
        coords: [Number(lat.toFixed(4)), Number(lng.toFixed(4))],
        toll: hubNames[idx].toll,
        eta: hubNames[idx].eta,
      };
    });

    return {
      origin: { name: `${originCity} Freight Gateway`, city: originCity, coords: originCoords },
      destination: { name: `${destCity} Logistics Terminal`, city: destCity, coords: destCoords },
      intermediateHubs: intermediates,
      activeStep: 2, // Position truck at intermediate Hub #2
    };
  }, [tracking, shipment]);

  // Full polyline connecting Origin ➔ Intermediate Hubs ➔ Destination
  const fullPolyline = useMemo(() => {
    return [
      corridorData.origin.coords,
      ...corridorData.intermediateHubs.map((h) => h.coords),
      corridorData.destination.coords,
    ];
  }, [corridorData]);

  // Active Truck Coordinates (Positioned at intermediate Hub #2 by default)
  const truckCoords = useMemo(() => {
    const activeStep = selectedHubIndex !== null ? selectedHubIndex : corridorData.activeStep;
    if (activeStep === 0) return corridorData.origin.coords;
    if (activeStep <= corridorData.intermediateHubs.length) {
      return corridorData.intermediateHubs[activeStep - 1].coords;
    }
    return corridorData.destination.coords;
  }, [selectedHubIndex, corridorData]);

  // All points for fitBounds
  const allFitPoints = useMemo(() => {
    return fullPolyline;
  }, [fullPolyline]);

  const activeStep = selectedHubIndex !== null ? selectedHubIndex : corridorData.activeStep;
  const currentHubName =
    activeStep === 0
      ? corridorData.origin.name
      : activeStep <= corridorData.intermediateHubs.length
      ? corridorData.intermediateHubs[activeStep - 1].name
      : corridorData.destination.name;

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Top Map Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/40 px-4 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground">
            {corridorData.origin.city} ➔ {corridorData.destination.city} National Freight Lane
          </span>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold">
            {corridorData.intermediateHubs.length} In-Between Hubs
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] text-muted-foreground">Active Checkpoint:</span>
          <span className="font-bold text-primary">{currentHubName}</span>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            🚚 Truck Docked Here
          </span>
        </div>
      </div>

      {/* Real-World Leaflet Map */}
      <div className="relative flex-1 w-full min-h-[460px]">
        <MapContainer
          center={truckCoords}
          zoom={zoom}
          scrollWheelZoom={false}
          className={cn("relative z-0 isolate h-full w-full rounded-none overflow-hidden", className)}
          ref={(m) => {
            if (m) mapRef.current = m;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
          <FitBounds points={allFitPoints} />

          {/* Underlay Highway Glow Polyline */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              lineCap: "round",
              opacity: 0.85,
            }}
          />

          {/* Inner Dashed Highway Centerline */}
          <Polyline
            positions={fullPolyline}
            pathOptions={{
              color: "#60a5fa",
              weight: 2,
              dashArray: "8, 10",
              lineCap: "round",
            }}
          />

          {/* 1. Origin Marker */}
          <Marker position={corridorData.origin.coords} icon={originIcon(corridorData.origin.city)}>
            <Popup className="custom-popup">
              <div className="p-1 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Origin Distribution Gateway</span>
                <p className="font-bold text-foreground">{corridorData.origin.name}</p>
                <p className="text-[11px] text-muted-foreground">{corridorData.origin.city}</p>
              </div>
            </Popup>
          </Marker>

          {/* 2. Intermediate Transit Hubs ("nadavula iruka hubs") */}
          {corridorData.intermediateHubs.map((ihub) => {
            const isPassed = activeStep > ihub.stopNum;
            const isCurrent = activeStep === ihub.stopNum;

            return (
              <Marker
                key={`ihub-${ihub.stopNum}`}
                position={ihub.coords}
                icon={intermediateWaypointIcon(ihub.stopNum, ihub.city, isPassed, isCurrent)}
                eventHandlers={{
                  click: () => setSelectedHubIndex(ihub.stopNum),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1.5 text-xs space-y-1 min-w-[170px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Hub #{ihub.stopNum}: {ihub.city}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          isCurrent
                            ? "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold"
                            : isPassed
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                            : "bg-slate-500/10 text-slate-700",
                        )}
                      >
                        {isCurrent ? "Truck Here" : isPassed ? "Cleared" : "Upcoming"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{ihub.name}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-border text-[11px]">
                      <span className="text-muted-foreground">Toll Fee:</span>
                      <span className="font-bold text-foreground">{ihub.toll}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Scheduled ETA:</span>
                      <span className="font-bold text-primary">{ihub.eta}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 3. Destination Marker */}
          <Marker position={corridorData.destination.coords} icon={destinationIcon(corridorData.destination.city)}>
            <Popup className="custom-popup">
              <div className="p-1 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Final Destination Hub</span>
                <p className="font-bold text-foreground">{corridorData.destination.name}</p>
                <p className="text-[11px] text-muted-foreground">{corridorData.destination.city}</p>
              </div>
            </Popup>
          </Marker>

          {/* 4. Live Delivery Truck Marker at In-Between Hub */}
          <Marker
            position={truckCoords}
            icon={liveTruckIcon(68, activeStep <= corridorData.intermediateHubs.length)}
          >
            <Popup className="custom-popup">
              <div className="p-1.5 text-xs space-y-1.5 min-w-[200px]">
                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
                    {shipment?.vehicleNumber || "TN 38 BL 7842"}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                    68 km/h
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Driver: <b className="text-foreground">{shipment?.driverName || "Amrith Kumar"}</b>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Active Checkpoint: <b className="text-primary">{currentHubName}</b>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Destination: <b className="text-foreground">{corridorData.destination.city}</b>
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom Checkpoint Stepper Pipeline */}
      <div className="border-t border-border/80 bg-card p-3 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Corridor Waypoint Sequence & Intermediate Hubs:
          </span>
          <span className="text-emerald-600 font-bold text-[11px]">
            🚚 Truck At Checkpoint: {currentHubName}
          </span>
        </p>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* Origin */}
          <div
            onClick={() => setSelectedHubIndex(0)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold border shrink-0 cursor-pointer transition",
              activeStep === 0
                ? "bg-primary/15 text-primary border-primary/40 ring-1 ring-primary/40"
                : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
            )}
          >
            Origin: {corridorData.origin.city} {activeStep > 0 && "✔"}
          </div>

          {/* Intermediate Hubs */}
          {corridorData.intermediateHubs.map((ihub) => {
            const isPassed = activeStep > ihub.stopNum;
            const isCurrent = activeStep === ihub.stopNum;

            return (
              <div key={ihub.stopNum} className="flex items-center shrink-0">
                <span className="text-muted-foreground/60 mx-1">➔</span>
                <div
                  onClick={() => setSelectedHubIndex(ihub.stopNum)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold border cursor-pointer transition",
                    isCurrent
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 ring-2 ring-amber-500/40 font-bold flex items-center gap-1"
                      : isPassed
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-muted/40 text-muted-foreground border-border",
                  )}
                >
                  {isCurrent && "🚚"} Hub #{ihub.stopNum}: {ihub.city} {isPassed && "✔"} ({ihub.toll})
                </div>
              </div>
            );
          })}

          {/* Destination */}
          <span className="text-muted-foreground/60 mx-1">➔</span>
          <div
            onClick={() => setSelectedHubIndex(corridorData.intermediateHubs.length + 1)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold border shrink-0 cursor-pointer transition",
              activeStep >= corridorData.intermediateHubs.length + 1
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
            )}
          >
            Destination: {corridorData.destination.city}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;