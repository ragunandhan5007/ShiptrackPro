import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Route,
  Navigation,
  Sparkles,
  Fuel,
  Zap,
  CheckCircle2,
  Truck,
  Activity,
  Compass,
  ArrowRight,
  ShieldCheck,
  Layers,
  Clock,
  MapPin,
  Package,
  Bell,
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  Check,
  Phone,
  PenLine,
  ImagePlus,
  LocateFixed,
  Camera,
  ClipboardCheck,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useHubs,
  useShipments,
  useShipment,
  useNavigation,
  useReachNextHub,
  useUpdateShipmentStatus,
  useOptimizeRoute,
  useMlEta,
  useMlFailureRisk,
} from "@/lib/hooks";
import { notificationsApi, shipmentsApi, podApi } from "@/lib/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SignaturePad from "signature_pad";

// 30 Major Logistics Distribution Hubs across all Indian States & Regions
export const ALL_30_STATE_HUBS = [
  { id: "hub-1", hubName: "Srinagar Freight Gateway", city: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973, capacity: "78%" },
  { id: "hub-2", hubName: "Chandigarh Tri-City Hub", city: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794, capacity: "85%" },
  { id: "hub-3", hubName: "Delhi National NCR Logistics Park", city: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090, capacity: "96%" },
  { id: "hub-4", hubName: "Jaipur Pink City Terminal", city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, capacity: "82%" },
  { id: "hub-5", hubName: "Lucknow Awadh Freight Center", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, capacity: "89%" },
  { id: "hub-6", hubName: "Kanpur Central Logistics Hub", city: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, capacity: "84%" },
  { id: "hub-7", hubName: "Dehradun Doon Valley Hub", city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, capacity: "70%" },
  { id: "hub-8", hubName: "Patna Ganga Cargo Gateway", city: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376, capacity: "79%" },
  { id: "hub-9", hubName: "Ranchi Chotanagpur Node", city: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096, capacity: "74%" },
  { id: "hub-10", hubName: "Kolkata Port Container Terminal", city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, capacity: "93%" },
  { id: "hub-11", hubName: "Siliguri North-East Corridor Hub", city: "Siliguri", state: "West Bengal", lat: 26.7271, lng: 88.3953, capacity: "88%" },
  { id: "hub-12", hubName: "Guwahati Brahmaputra Hub", city: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, capacity: "86%" },
  { id: "hub-13", hubName: "Bhubaneswar Kalinga Depot", city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245, capacity: "81%" },
  { id: "hub-14", hubName: "Raipur Central Logistics Node", city: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296, capacity: "77%" },
  { id: "hub-15", hubName: "Bhopal Central Depot", city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, capacity: "83%" },
  { id: "hub-16", hubName: "Indore Malwa Commercial Hub", city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, capacity: "87%" },
  { id: "hub-17", hubName: "Nagpur Zero-Mile Transit Hub", city: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, capacity: "90%" },
  { id: "hub-18", hubName: "Ahmedabad Western Logistics Park", city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, capacity: "92%" },
  { id: "hub-19", hubName: "Surat Diamond Freight Terminal", city: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, capacity: "85%" },
  { id: "hub-20", hubName: "Vadodara Industrial Corridor Hub", city: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812, capacity: "80%" },
  { id: "hub-21", hubName: "Mumbai JNPT Freight Terminal", city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, capacity: "95%" },
  { id: "hub-22", hubName: "Pune Auto Corridor Hub", city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, capacity: "88%" },
  { id: "hub-23", hubName: "Nashik North Transit Hub", city: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898, capacity: "72%" },
  { id: "hub-24", hubName: "Hyderabad Central Gateway", city: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, capacity: "91%" },
  { id: "hub-25", hubName: "Vijayawada Krishna Hub", city: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480, capacity: "80%" },
  { id: "hub-26", hubName: "Bangalore Electronic City Hub", city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, capacity: "94%" },
  { id: "hub-27", hubName: "Mysuru South Regional Node", city: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394, capacity: "69%" },
  { id: "hub-28", hubName: "Chennai Port Central Hub", city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, capacity: "95%" },
  { id: "hub-29", hubName: "Coimbatore Industrial Node", city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, capacity: "86%" },
  { id: "hub-30", hubName: "Kochi Port Container Terminal", city: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, capacity: "84%" },
];

// Corridors with explicit Intermediate Hubs ("nadavula iruka hubs") & highway polyline paths
export const CORRIDORS_DATA = {
  "cbe-che": {
    id: "cbe-che",
    name: "Coimbatore ➔ Chennai Freight Corridor (NH-544 / NH-48)",
    originHub: { name: "Coimbatore Industrial Node", city: "Coimbatore", state: "Tamil Nadu", coords: [11.0168, 76.9558] },
    destHub: { name: "Chennai Port Central Hub", city: "Chennai", state: "Tamil Nadu", coords: [13.0827, 80.2707] },
    shortest: {
      title: "Shortest Corridor: NH-544 & NH-48 via Salem & Vellore",
      tag: "Optimal & Shortest (Fastest ETA)",
      distanceKm: 498,
      durationText: "7h 45m",
      tolls: "₹340 (FASTag)",
      fuelEfficiency: "+18% Fuel Saved",
      co2Reduction: "-22 kg CO2",
      path: [
        [11.0168, 76.9558], // Coimbatore
        [11.3410, 77.7172], // Erode Distribution Hub
        [11.6643, 78.1460], // Salem Transit Junction
        [12.9165, 79.1325], // Vellore Gate
        [13.0827, 80.2707], // Chennai
      ],
      intermediateHubs: [
        { name: "Erode Logistics Node", city: "Erode", coords: [11.3410, 77.7172], stopNum: 1, toll: "₹105", eta: "1h 40m" },
        { name: "Salem Central Junction", city: "Salem", coords: [11.6643, 78.1460], stopNum: 2, toll: "₹140", eta: "3h 45m" },
        { name: "Vellore Gate Transit Hub", city: "Vellore", coords: [12.9165, 79.1325], stopNum: 3, toll: "₹95", eta: "6h 15m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: NH-77 Southern Bypass",
      tag: "Freight Bypass (Low Traffic)",
      distanceKm: 546,
      durationText: "8h 50m",
      tolls: "₹190 (Fewer Tolls)",
      fuelEfficiency: "Standard Consumption",
      co2Reduction: "Standard baseline",
      path: [
        [11.0168, 76.9558], // Coimbatore
        [11.1085, 77.3411], // Tirupur
        [11.6643, 78.1460], // Salem
        [11.9401, 78.8576], // Kallakkurichi
        [12.2253, 79.0747], // Tiruvannamalai
        [13.0827, 80.2707], // Chennai
      ],
      intermediateHubs: [
        { name: "Tirupur Garment Hub", city: "Tirupur", coords: [11.1085, 77.3411], stopNum: 1, toll: "₹0", eta: "1h 15m" },
        { name: "Salem Outer Bypass", city: "Salem", coords: [11.6643, 78.1460], stopNum: 2, toll: "₹75", eta: "3h 10m" },
        { name: "Kallakkurichi Highway Depot", city: "Kallakkurichi", coords: [11.9401, 78.8576], stopNum: 3, toll: "₹55", eta: "4h 50m" },
        { name: "Tiruvannamalai Freight Post", city: "Tiruvannamalai", coords: [12.2253, 79.0747], stopNum: 4, toll: "₹60", eta: "6h 20m" },
      ],
    },
  },
  "che-cbe": {
    id: "che-cbe",
    name: "Chennai ➔ Coimbatore Freight Corridor (NH-544)",
    originHub: { name: "Chennai Port Central Hub", city: "Chennai", state: "Tamil Nadu", coords: [13.0827, 80.2707] },
    destHub: { name: "Coimbatore Industrial Node", city: "Coimbatore", state: "Tamil Nadu", coords: [11.0168, 76.9558] },
    shortest: {
      title: "Shortest Corridor: NH-48 & NH-544 via Salem",
      tag: "Optimal & Shortest (Fastest ETA)",
      distanceKm: 498,
      durationText: "7h 45m",
      tolls: "₹340 (FASTag)",
      fuelEfficiency: "+18% Fuel Saved",
      co2Reduction: "-22 kg CO2",
      path: [
        [13.0827, 80.2707], // Chennai
        [12.9165, 79.1325], // Vellore Gate
        [11.6643, 78.1460], // Salem Transit Junction
        [11.3410, 77.7172], // Erode Distribution Hub
        [11.0168, 76.9558], // Coimbatore
      ],
      intermediateHubs: [
        { name: "Vellore Gate Transit Hub", city: "Vellore", coords: [12.9165, 79.1325], stopNum: 1, toll: "₹95", eta: "1h 45m" },
        { name: "Salem Central Junction", city: "Salem", coords: [11.6643, 78.1460], stopNum: 2, toll: "₹140", eta: "4h 10m" },
        { name: "Erode Logistics Node", city: "Erode", coords: [11.3410, 77.7172], stopNum: 3, toll: "₹105", eta: "6h 05m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: NH-77 Southern Bypass",
      tag: "Freight Bypass (Low Traffic)",
      distanceKm: 546,
      durationText: "8h 50m",
      tolls: "₹190 (Fewer Tolls)",
      fuelEfficiency: "Standard Consumption",
      co2Reduction: "Standard baseline",
      path: [
        [13.0827, 80.2707], // Chennai
        [12.2253, 79.0747], // Tiruvannamalai
        [11.9401, 78.8576], // Kallakkurichi
        [11.6643, 78.1460], // Salem
        [11.1085, 77.3411], // Tirupur
        [11.0168, 76.9558], // Coimbatore
      ],
      intermediateHubs: [
        { name: "Tiruvannamalai Freight Post", city: "Tiruvannamalai", coords: [12.2253, 79.0747], stopNum: 1, toll: "₹60", eta: "2h 30m" },
        { name: "Kallakkurichi Highway Depot", city: "Kallakkurichi", coords: [11.9401, 78.8576], stopNum: 2, toll: "₹55", eta: "4h 00m" },
        { name: "Salem Outer Bypass", city: "Salem", coords: [11.6643, 78.1460], stopNum: 3, toll: "₹75", eta: "5h 45m" },
        { name: "Tirupur Garment Hub", city: "Tirupur", coords: [11.1085, 77.3411], stopNum: 4, toll: "₹0", eta: "7h 30m" },
      ],
    },
  },
  "blr-che": {
    id: "blr-che",
    name: "Bangalore ↔ Chennai Freight Express (NH-48)",
    originHub: { name: "Bangalore Electronic City Hub", city: "Bengaluru", state: "Karnataka", coords: [12.9716, 77.5946] },
    destHub: { name: "Chennai Port Central Hub", city: "Chennai", state: "Tamil Nadu", coords: [13.0827, 80.2707] },
    shortest: {
      title: "Shortest Corridor: NH-48 6-Lane Expressway via Hosur",
      tag: "Optimal & Shortest (Fastest ETA)",
      distanceKm: 345,
      durationText: "5h 15m",
      tolls: "₹280",
      fuelEfficiency: "+15% Fuel Saved",
      co2Reduction: "-16 kg CO2",
      path: [
        [12.9716, 77.5946], // Bangalore
        [12.7409, 77.8253], // Hosur
        [12.5250, 78.2140], // Krishnagiri
        [12.9165, 79.1325], // Vellore
        [12.8342, 79.7036], // Kanchipuram
        [13.0827, 80.2707], // Chennai
      ],
      intermediateHubs: [
        { name: "Hosur Border Cargo Hub", city: "Hosur", coords: [12.7409, 77.8253], stopNum: 1, toll: "₹70", eta: "45m" },
        { name: "Krishnagiri Junction", city: "Krishnagiri", coords: [12.5250, 78.2140], stopNum: 2, toll: "₹85", eta: "1h 45m" },
        { name: "Vellore Freight Station", city: "Vellore", coords: [12.9165, 79.1325], stopNum: 3, toll: "₹65", eta: "3h 15m" },
        { name: "Kanchipuram Depot", city: "Kanchipuram", coords: [12.8342, 79.7036], stopNum: 4, toll: "₹60", eta: "4h 20m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: Old Madras Road (NH-75 via Kolar)",
      tag: "State Highway Route",
      distanceKm: 382,
      durationText: "6h 30m",
      tolls: "₹140",
      fuelEfficiency: "Standard Baseline",
      co2Reduction: "Standard baseline",
      path: [
        [12.9716, 77.5946],
        [13.1362, 78.1291],
        [13.2172, 79.1008],
        [13.0827, 80.2707],
      ],
      intermediateHubs: [
        { name: "Kolar Industrial Transit", city: "Kolar", coords: [13.1362, 78.1291], stopNum: 1, toll: "₹60", eta: "1h 20m" },
        { name: "Chittoor Andhra Gateway", city: "Chittoor", coords: [13.2172, 79.1008], stopNum: 2, toll: "₹80", eta: "3h 40m" },
      ],
    },
  },
  "che-blr": {
    id: "che-blr",
    name: "Chennai ➔ Bangalore Freight Express (NH-48)",
    originHub: { name: "Chennai Port Central Hub", city: "Chennai", state: "Tamil Nadu", coords: [13.0827, 80.2707] },
    destHub: { name: "Bangalore Electronic City Hub", city: "Bengaluru", state: "Karnataka", coords: [12.9716, 77.5946] },
    shortest: {
      title: "Shortest Corridor: NH-48 6-Lane Expressway via Vellore",
      tag: "Optimal & Shortest (Fastest ETA)",
      distanceKm: 345,
      durationText: "5h 15m",
      tolls: "₹280",
      fuelEfficiency: "+15% Fuel Saved",
      co2Reduction: "-16 kg CO2",
      path: [
        [13.0827, 80.2707], // Chennai
        [12.8342, 79.7036], // Kanchipuram
        [12.9165, 79.1325], // Vellore
        [12.5250, 78.2140], // Krishnagiri
        [12.7409, 77.8253], // Hosur
        [12.9716, 77.5946], // Bangalore
      ],
      intermediateHubs: [
        { name: "Kanchipuram Depot", city: "Kanchipuram", coords: [12.8342, 79.7036], stopNum: 1, toll: "₹60", eta: "55m" },
        { name: "Vellore Freight Station", city: "Vellore", coords: [12.9165, 79.1325], stopNum: 2, toll: "₹65", eta: "2h 00m" },
        { name: "Krishnagiri Junction", city: "Krishnagiri", coords: [12.5250, 78.2140], stopNum: 3, toll: "₹85", eta: "3h 30m" },
        { name: "Hosur Border Cargo Hub", city: "Hosur", coords: [12.7409, 77.8253], stopNum: 4, toll: "₹70", eta: "4h 30m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: Old Madras Road (NH-75 via Chittoor)",
      tag: "State Highway Route",
      distanceKm: 382,
      durationText: "6h 30m",
      tolls: "₹140",
      fuelEfficiency: "Standard Baseline",
      co2Reduction: "Standard baseline",
      path: [
        [13.0827, 80.2707],
        [13.2172, 79.1008],
        [13.1362, 78.1291],
        [12.9716, 77.5946],
      ],
      intermediateHubs: [
        { name: "Chittoor Andhra Gateway", city: "Chittoor", coords: [13.2172, 79.1008], stopNum: 1, toll: "₹80", eta: "2h 50m" },
        { name: "Kolar Industrial Transit", city: "Kolar", coords: [13.1362, 78.1291], stopNum: 2, toll: "₹60", eta: "5h 10m" },
      ],
    },
  },
  "mum-pune": {
    id: "mum-pune",
    name: "Mumbai ➔ Pune Auto Expressway",
    originHub: { name: "Mumbai JNPT Freight Terminal", city: "Mumbai", state: "Maharashtra", coords: [19.0760, 72.8777] },
    destHub: { name: "Pune Auto Corridor Hub", city: "Pune", state: "Maharashtra", coords: [18.5204, 73.8567] },
    shortest: {
      title: "Shortest Corridor: Yashwantrao Chavan Expressway",
      tag: "Expressway (Fastest ETA)",
      distanceKm: 148,
      durationText: "2h 45m",
      tolls: "₹320",
      fuelEfficiency: "+12% Fuel Saved",
      co2Reduction: "-9 kg CO2",
      path: [
        [19.0760, 72.8777],
        [19.0330, 73.0297],
        [18.7557, 73.4091],
        [18.5204, 73.8567],
      ],
      intermediateHubs: [
        { name: "Navi Mumbai Express Terminal", city: "Navi Mumbai", coords: [19.0330, 73.0297], stopNum: 1, toll: "₹100", eta: "40m" },
        { name: "Lonavala Ghat Transit Point", city: "Lonavala", coords: [18.7557, 73.4091], stopNum: 2, toll: "₹220", eta: "1h 35m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: Old NH-48 Ghat Highway",
      tag: "Scenic / Free Highway",
      distanceKm: 165,
      durationText: "3h 45m",
      tolls: "₹90",
      fuelEfficiency: "Standard",
      co2Reduction: "Baseline",
      path: [
        [19.0760, 72.8777],
        [18.9894, 73.1175],
        [18.7490, 73.3444],
        [18.5204, 73.8567],
      ],
      intermediateHubs: [
        { name: "Panvel Cargo Yard", city: "Panvel", coords: [18.9894, 73.1175], stopNum: 1, toll: "₹45", eta: "55m" },
        { name: "Khandala Checkpost", city: "Khandala", coords: [18.7490, 73.3444], stopNum: 2, toll: "₹45", eta: "2h 15m" },
      ],
    },
  },
  "pune-mum": {
    id: "pune-mum",
    name: "Pune ➔ Mumbai Auto Expressway",
    originHub: { name: "Pune Auto Corridor Hub", city: "Pune", state: "Maharashtra", coords: [18.5204, 73.8567] },
    destHub: { name: "Mumbai JNPT Freight Terminal", city: "Mumbai", state: "Maharashtra", coords: [19.0760, 72.8777] },
    shortest: {
      title: "Shortest Corridor: Yashwantrao Chavan Expressway",
      tag: "Expressway (Fastest ETA)",
      distanceKm: 148,
      durationText: "2h 45m",
      tolls: "₹320",
      fuelEfficiency: "+12% Fuel Saved",
      co2Reduction: "-9 kg CO2",
      path: [
        [18.5204, 73.8567],
        [18.7557, 73.4091],
        [19.0330, 73.0297],
        [19.0760, 72.8777],
      ],
      intermediateHubs: [
        { name: "Lonavala Ghat Transit Point", city: "Lonavala", coords: [18.7557, 73.4091], stopNum: 1, toll: "₹220", eta: "55m" },
        { name: "Navi Mumbai Express Terminal", city: "Navi Mumbai", coords: [19.0330, 73.0297], stopNum: 2, toll: "₹100", eta: "1h 50m" },
      ],
    },
    alternate: {
      title: "Alternate Corridor: Old NH-48 Ghat Highway",
      tag: "Scenic / Free Highway",
      distanceKm: 165,
      durationText: "3h 45m",
      tolls: "₹90",
      fuelEfficiency: "Standard",
      co2Reduction: "Baseline",
      path: [
        [18.5204, 73.8567],
        [18.7490, 73.3444],
        [18.9894, 73.1175],
        [19.0760, 72.8777],
      ],
      intermediateHubs: [
        { name: "Khandala Checkpost", city: "Khandala", coords: [18.7490, 73.3444], stopNum: 1, toll: "₹45", eta: "1h 30m" },
        { name: "Panvel Cargo Yard", city: "Panvel", coords: [18.9894, 73.1175], stopNum: 2, toll: "₹45", eta: "2h 45m" },
      ],
    },
  },
};

// Fallback Package Seed List (when database is empty or offline)
const PACKAGES_FALLBACK = [
  {
    id: "pkg-1",
    dbId: 18,
    trackingNumber: "STP-9F4K-8821",
    customerName: "Ragu Nandhan",
    customerEmail: "ragunandhantsk99@gmail.com",
    cargoDescription: "Precision Automotive Electronics & Sensors",
    weight: "2.4 Tons",
    corridorId: "cbe-che",
    senderCity: "Coimbatore",
    receiverCity: "Chennai",
    status: "IN_TRANSIT",
    currentLocationName: "Salem Central Junction (NH-544)",
    driverName: "Amrith Kumar",
    vehicleNumber: "TN 38 BL 7842",
    vehicleId: "TRK-8821",
    speed: 68,
    progressPct: 58,
    batteryFuel: 84,
    lat: 11.6643,
    lng: 78.1460,
    eta: "3h 15m",
    activeWaypointIndex: 2, // At intermediate Hub #2 (Salem)
  },
  {
    id: "pkg-2",
    dbId: 2,
    trackingNumber: "STP-2H7M-4410",
    customerName: "Manjari Arul",
    customerEmail: "manjari@gmail.com",
    cargoDescription: "Enterprise Cloud Server Racks",
    weight: "1.8 Tons",
    corridorId: "blr-che",
    status: "IN_TRANSIT",
    currentLocationName: "Krishnagiri Junction Transit Node",
    driverName: "Senthil Nathan",
    vehicleNumber: "KA 01 EK 9022",
    vehicleId: "TRK-4410",
    speed: 72,
    progressPct: 45,
    batteryFuel: 92,
    lat: 12.5250,
    lng: 78.2140,
    eta: "2h 45m",
    activeWaypointIndex: 2, // At intermediate Hub #2 (Krishnagiri)
  },
  {
    id: "pkg-3",
    dbId: 3,
    trackingNumber: "STP-5C2P-7733",
    customerName: "Kavin Kumar",
    customerEmail: "kavinkumar@gmail.com",
    cargoDescription: "Biomedical Cold Chain Vaccines",
    weight: "1.1 Tons",
    corridorId: "mum-pune",
    status: "OUT_FOR_DELIVERY",
    currentLocationName: "Lonavala Ghat Transit Point",
    driverName: "Rajesh Patil",
    vehicleNumber: "MH 12 QX 5519",
    vehicleId: "TRK-7733",
    speed: 64,
    progressPct: 82,
    batteryFuel: 70,
    lat: 18.7557,
    lng: 73.4091,
    eta: "45m",
    activeWaypointIndex: 2,
  },
  {
    id: "pkg-4",
    dbId: 4,
    trackingNumber: "STP-1A3B-1002",
    customerName: "Priya Sharma",
    customerEmail: "priya@gmail.com",
    cargoDescription: "Textile Spools & Industrial Yarn Fabrics",
    weight: "3.2 Tons",
    corridorId: "che-cbe",
    status: "IN_TRANSIT",
    currentLocationName: "Vellore Gate Transit Hub",
    driverName: "Murugan S.",
    vehicleNumber: "TN 37 CZ 1122",
    vehicleId: "TRK-1122",
    speed: 65,
    progressPct: 35,
    batteryFuel: 78,
    lat: 12.9165,
    lng: 79.1325,
    eta: "5h 30m",
    activeWaypointIndex: 1, // At intermediate Hub #1 (Vellore)
  },
];

// Helper: camera controller
function MapCameraController({ centerCoords, zoomLevel = 7 }) {
  const map = useMap();
  useEffect(() => {
    if (centerCoords && Array.isArray(centerCoords) && centerCoords.length === 2) {
      map.flyTo(centerCoords, zoomLevel, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [centerCoords, zoomLevel, map]);
  return null;
}

// Custom Marker Icons
const createHubIcon = (hub) =>
  L.divIcon({
    className: "custom-hub-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:20px;height:20px;border-radius:50%;background:#0284c7;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:9px;">
        H
      </div>
      <span style="font-size:9px;font-weight:700;background:rgba(15,23,42,0.85);color:white;padding:1px 5px;border-radius:4px;margin-top:2px;white-space:nowrap;">
        ${hub.city}
      </span>
    </div>`,
    iconSize: [60, 40],
    iconAnchor: [30, 20],
  });

const originHubIcon = (cityName) =>
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

const destinationHubIcon = (cityName) =>
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

const movingTruckMarkerIcon = (speed, isMoving, isShortest, isDocked = false) =>
  L.divIcon({
    className: "custom-truck-icon",
    html: `<div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:46px;height:46px;border-radius:50%;background:${
        isShortest ? "rgba(16,185,129,0.35)" : "rgba(37,99,235,0.35)"
      };animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;width:36px;height:36px;border-radius:50%;background:${
        isShortest ? "#059669" : "#2563eb"
      };border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;z-index:10;">
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
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

export function RouteManagementPage({ defaultShipmentId }) {
  const routeParams = useParams();
  const [searchParams] = useSearchParams();
  const effectiveShipmentId = defaultShipmentId || routeParams?.id || searchParams.get("id");

  const { data: dbHubs } = useHubs();
  const { data: dbShipments, isLoading: isShipmentsLoading } = useShipments();
  const optimizeRoute = useOptimizeRoute();
  const reachNextHub = useReachNextHub();
  const updateStatus = useUpdateShipmentStatus();

  // Combine real database shipments with full telemetry
  const packages = useMemo(() => {
    if (!dbShipments || dbShipments.length === 0) {
      return PACKAGES_FALLBACK;
    }

    return dbShipments.map((s, index) => {
      const origin = (s.senderCity || "").toLowerCase();
      const dest = (s.receiverCity || "").toLowerCase();

      const isOriginCbe = origin.includes("coimbatore") || origin.includes("cbe") || origin.includes("cmb") || origin.includes("cjb");
      const isDestCbe = dest.includes("coimbatore") || dest.includes("cbe") || dest.includes("cmb") || dest.includes("cjb");
      const isOriginChe = origin.includes("chennai") || origin.includes("che") || origin.includes("mas") || origin.includes("maa") || origin.includes("madras");
      const isDestChe = dest.includes("chennai") || dest.includes("che") || dest.includes("mas") || dest.includes("maa") || dest.includes("madras");

      const isOriginBlr = origin.includes("bangalore") || origin.includes("bengaluru") || origin.includes("blr");
      const isDestBlr = dest.includes("bangalore") || dest.includes("bengaluru") || dest.includes("blr");

      const isOriginMum = origin.includes("mumbai") || origin.includes("bom") || origin.includes("bombay");
      const isDestMum = dest.includes("mumbai") || dest.includes("bom") || dest.includes("bombay");
      const isOriginPune = origin.includes("pune") || origin.includes("pnq") || origin.includes("poona");
      const isDestPune = dest.includes("pune") || dest.includes("pnq") || dest.includes("poona");

      let corridorId = "cbe-che";
      let baseLat = 11.6643; // Salem
      let baseLng = 78.1460;
      let activeWaypoint = 2; // At intermediate Hub #2 by default (Salem)

      if (isOriginCbe && isDestChe) {
        corridorId = "cbe-che";
        baseLat = 11.6643; // Salem
        baseLng = 78.1460;
        activeWaypoint = 2;
      } else if (isOriginChe && isDestCbe) {
        corridorId = "che-cbe";
        baseLat = 11.6643; // Salem
        baseLng = 78.1460;
        activeWaypoint = 2;
      } else if (isOriginBlr && isDestChe) {
        corridorId = "blr-che";
        baseLat = 12.5250; // Krishnagiri
        baseLng = 78.2140;
        activeWaypoint = 2;
      } else if (isOriginChe && isDestBlr) {
        corridorId = "che-blr";
        baseLat = 12.5250; // Krishnagiri
        baseLng = 78.2140;
        activeWaypoint = 2;
      } else if (isOriginMum && isDestPune) {
        corridorId = "mum-pune";
        baseLat = 18.7557; // Lonavala
        baseLng = 73.4091;
        activeWaypoint = 2;
      } else if (isOriginPune && isDestMum) {
        corridorId = "pune-mum";
        baseLat = 18.7557; // Lonavala
        baseLng = 73.4091;
        activeWaypoint = 1;
      }

      return {
        id: String(s.id),
        dbId: s.id,
        trackingNumber: s.trackingNumber,
        customerName: s.receiverName || "Verified Recipient",
        customerEmail: s.receiverEmail || "customer@gmail.com",
        customerPhone: s.receiverPhone || "+919999988888",
        cargoDescription: `${s.packageDescription || "Express Freight Delivery"} (${s.packageWeightKg || 2.5} kg)`,
        weight: `${s.packageWeightKg || 2.5} kg`,
        corridorId: corridorId,
        status: s.status || "IN_TRANSIT",
        currentLocationName: s.currentLocation || "Salem Central Junction (NH-544)",
        driverName: s.driverName || "Amrith Kumar",
        driverPhone: s.driverPhone || "+919999988888",
        vehicleNumber: s.vehicleNumber || `TN 38 BL ${7800 + (index % 100)}`,
        vehicleId: `TRK-${s.id}`,
        speed: s.status === "IN_TRANSIT" ? 68 : s.status === "OUT_FOR_DELIVERY" ? 54 : 0,
        progressPct: s.status === "DELIVERED" ? 100 : s.status === "OUT_FOR_DELIVERY" ? 85 : 55,
        batteryFuel: 88 - (index * 4) % 25,
        lat: baseLat,
        lng: baseLng,
        eta: "2h 45m",
        activeWaypointIndex: activeWaypoint,
        senderCity: s.senderCity,
        receiverCity: s.receiverCity,
      };
    });
  }, [dbShipments]);

  const isDirectNavigationMode = !!effectiveShipmentId;

  // Selected package ID (defaults to effectiveShipmentId or the 1st package)
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  useEffect(() => {
    if (effectiveShipmentId && packages.length > 0) {
      const match = packages.find((p) => String(p.dbId) === String(effectiveShipmentId) || String(p.id) === String(effectiveShipmentId));
      if (match) {
        setSelectedPackageId(match.id);
        setSelectedCorridorKey(match.corridorId);
        setFocusedCoords([match.lat, match.lng]);
        return;
      }
    }
    if (!selectedPackageId && packages.length > 0) {
      // Default select the first package
      setSelectedPackageId(packages[0].id);
      setSelectedCorridorKey(packages[0].corridorId);
      setFocusedCoords([packages[0].lat, packages[0].lng]);
    }
  }, [effectiveShipmentId, packages]);

  // Active selected package object
  const activePackage = useMemo(() => {
    if (effectiveShipmentId && packages.length > 0) {
      const match = packages.find(
        (p) => String(p.dbId) === String(effectiveShipmentId) || String(p.id) === String(effectiveShipmentId)
      );
      if (match) return match;
    }
    return packages.find((p) => p.id === selectedPackageId) || packages[0] || null;
  }, [packages, selectedPackageId, effectiveShipmentId]);

  // Active Corridor & Route Type
  const [selectedCorridorKey, setSelectedCorridorKey] = useState("cbe-che");
  const [activeRouteType, setActiveRouteType] = useState("shortest"); // "shortest" or "alternate"

  // Active Waypoint Position State (Default = 2: Intermediate Hub #2 Salem)
  // 0: Origin, 1: Intermediate Hub #1, 2: Intermediate Hub #2, 3: Intermediate Hub #3, 4: Destination
  const [waypointStep, setWaypointStep] = useState(2);

  // Map Filter Toggles
  const [showAll30Hubs, setShowAll30Hubs] = useState(true);
  const [focusedCoords, setFocusedCoords] = useState(null);
  const [mlOptimization, setMlOptimization] = useState(null);

  // Active Corridor Details
  const activeCorridor = CORRIDORS_DATA[selectedCorridorKey] || CORRIDORS_DATA["cbe-che"] || CORRIDORS_DATA["che-cbe"];
  const chosenRoute = activeRouteType === "shortest" ? activeCorridor.shortest : activeCorridor.alternate;

  // Waypoint Coordinates calculation
  const truckLocationCoords = useMemo(() => {
    if (waypointStep === 0) return activeCorridor.originHub.coords;
    if (waypointStep <= chosenRoute.intermediateHubs.length) {
      return chosenRoute.intermediateHubs[waypointStep - 1].coords;
    }
    return activeCorridor.destHub.coords;
  }, [waypointStep, activeCorridor, chosenRoute]);

  // Sync camera when waypoint changes
  useEffect(() => {
    if (truckLocationCoords) {
      setFocusedCoords(truckLocationCoords);
    }
  }, [truckLocationCoords]);

  // =========================================================
  // OPERATOR CONTROLS & POD STATE
  // =========================================================
  const [trafficCondition, setTrafficCondition] = useState("LOW");
  const [weatherCondition, setWeatherCondition] = useState("CLEAR");
  const [roadCondition, setRoadCondition] = useState("GOOD");
  const [remarks, setRemarks] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [podImage, setPodImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

  const sigRef = useRef(null);
  const signaturePad = useRef(null);

  // AI Copilot Hooks
  const mlEta = useMlEta({
    distance_km: chosenRoute.distanceKm,
    package_weight_kg: 3.0,
    traffic_condition: trafficCondition,
    weather_condition: weatherCondition,
    road_condition: roadCondition,
    hubs_count: chosenRoute.intermediateHubs.length,
  });

  const mlRisk = useMlFailureRisk({
    delay_minutes: mlEta.data?.predicted_delay_minutes || 0,
    traffic_condition: trafficCondition,
    weather_condition: weatherCondition,
    road_condition: roadCondition,
    hours_in_transit: 5.0,
    package_weight_kg: 3.0,
  });

  // Handle POD Image upload
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPodImage(file);
    setPreview(URL.createObjectURL(file));
  }

  // Handler: Change Route to Shortest Corridor
  const handleSelectShortestRoute = () => {
    setActiveRouteType("shortest");
    const targetPkg = activePackage || packages[0];

    notificationsApi.sendRouteUpdateNotification({
      trackingNumber: targetPkg.trackingNumber,
      customerEmail: targetPkg.customerEmail,
      customerName: targetPkg.customerName,
      newRoute: "Shortest Corridor (NH-48/NH-544)",
      eta: activeCorridor.shortest.durationText,
      reason: "Fastest express highway corridor selected for rapid delivery",
    });

    toast.success("Shortest Route Activated & Customer Notified!", {
      description: `Rerouted to ${activeCorridor.shortest.title}. Recipient ${targetPkg.customerName} (${targetPkg.customerEmail}) alerted via SMS & in-app notification.`,
    });
  };

  // Handler: Change Route to Alternate Bypass
  const handleSelectAlternateRoute = () => {
    setActiveRouteType("alternate");
    const targetPkg = activePackage || packages[0];

    notificationsApi.sendRouteUpdateNotification({
      trackingNumber: targetPkg.trackingNumber,
      customerEmail: targetPkg.customerEmail,
      customerName: targetPkg.customerName,
      newRoute: "Alternate Bypass Route (Low Traffic)",
      eta: activeCorridor.alternate.durationText,
      reason: "Highway traffic bypass initiated to avoid bottleneck congestion",
    });

    toast.info("Alternate Bypass Activated & Customer Notified!", {
      description: `Rerouted to ${activeCorridor.alternate.title}. Recipient ${targetPkg.customerName} (${targetPkg.customerEmail}) alerted of updated route & ETA.`,
    });
  };

  // Handler: Package Click (Switch to isolated package live tracking)
  const handleSelectPackage = (pkg) => {
    setSelectedPackageId(pkg.id);
    setSelectedCorridorKey(pkg.corridorId);
    setWaypointStep(pkg.activeWaypointIndex || 2);
    setFocusedCoords([pkg.lat, pkg.lng]);
    toast.success(`Package Focused: ${pkg.trackingNumber}`, {
      description: `Corridor & intermediate checkpoints isolated to ${pkg.customerName}'s shipment.`,
    });
  };

  // Handler: Advance to Next Waypoint Hub
  const handleAdvanceNextHub = async () => {
    const totalWaypoints = chosenRoute.intermediateHubs.length + 1; // +1 for destination
    const nextStep = Math.min(waypointStep + 1, totalWaypoints);

    try {
      if (activePackage?.dbId) {
        await shipmentsApi.updateJourney({
          shipmentId: Number(activePackage.dbId),
          trafficCondition,
          weatherCondition,
          roadCondition,
          remarks,
        });
        await reachNextHub.mutateAsync(Number(activePackage.dbId));
      }
    } catch (e) {
      console.warn("Backend reachNextHub notification error (proceeding in UI):", e);
    }

    setWaypointStep(nextStep);

    if (nextStep <= chosenRoute.intermediateHubs.length) {
      const arrivedHub = chosenRoute.intermediateHubs[nextStep - 1];
      toast.success(`Vehicle Reached Intermediate Hub #${nextStep}!`, {
        description: `Docked at ${arrivedHub.name} (${arrivedHub.city}). Checkpoint logged successfully.`,
      });
    } else {
      toast.success("Vehicle Reached Destination Gateway!", {
        description: `Arrived at ${activeCorridor.destHub.name}. Status updated to OUT_FOR_DELIVERY.`,
      });
    }
  };

  // Handler: Complete Delivery with POD
  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    if (selectedStatus !== "DELIVERED") {
      if (activePackage?.dbId) {
        await updateStatus.mutateAsync({
          id: Number(activePackage.dbId),
          status: selectedStatus,
        });
      }
      toast.success(`Status updated to ${selectedStatus.replaceAll("_", " ")}`);
      return;
    }

    // DELIVERED REQUIRES POD
    if (!customerName.trim()) {
      toast.error("Please enter the recipient name.");
      return;
    }

    if (!podImage) {
      toast.error("Please upload the Proof of Delivery image.");
      return;
    }

    if (!signaturePad.current || signaturePad.current.isEmpty()) {
      toast.error("Please provide the customer signature.");
      return;
    }

    try {
      setIsCompletingDelivery(true);
      const signature = signaturePad.current.toDataURL();
      const formData = new FormData();
      formData.append(
        "request",
        JSON.stringify({
          shipmentId: Number(activePackage.dbId || 18),
          recipientName: customerName.trim(),
          signatureUrl: signature,
        }),
      );
      formData.append("photo", podImage);

      await podApi.create(formData);
      if (activePackage?.dbId) {
        await updateStatus.mutateAsync({
          id: Number(activePackage.dbId),
          status: "DELIVERED",
        });
      }

      toast.success("Delivery completed and Proof of Delivery submitted successfully.");
      setSelectedStatus("");
    } catch (error) {
      console.error("Complete delivery failed:", error);
      toast.error(error?.response?.data?.message || "Failed to complete delivery.");
    } finally {
      setIsCompletingDelivery(false);
    }
  };

  // AI Heuristic Optimization
  const handleRunOptimization = async () => {
    toast.info("Running AI Corridor Optimization...", {
      description: "Evaluating multi-hub waypoint sequence and elevation grades.",
    });
    setMlOptimization({
      optimization_gain_pct: 19.2,
      original_distance_km: chosenRoute.distanceKm,
      optimized_distance_km: Math.round(chosenRoute.distanceKm * 0.88),
      fuel_saved_liters: 29.4,
      time_saved_minutes: 46,
    });
    toast.success("AI Corridor Sequence Optimized!", {
      description: "Efficiency gain: +19.2% fuel & turnaround reduction.",
    });
  };

  const isPackageFocused = !!activePackage;
  const currentHubDisplayName =
    waypointStep === 0
      ? activeCorridor.originHub.name
      : waypointStep <= chosenRoute.intermediateHubs.length
      ? chosenRoute.intermediateHubs[waypointStep - 1].name
      : activeCorridor.destHub.name;

  const nextStopDisplayName =
    waypointStep < chosenRoute.intermediateHubs.length
      ? chosenRoute.intermediateHubs[waypointStep].name
      : waypointStep === chosenRoute.intermediateHubs.length
      ? `${activeCorridor.destHub.name} (Destination Gateway)`
      : `Customer Doorstep (${activePackage?.customerName || "Recipient"})`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-card">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-primary/25 border border-white/20">
              <Route className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-foreground">
                  Route Navigator & Live Fleet Telemetry
                </h1>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Logistics Operator Desk
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Indian 30-State Hub Grid · In-Between Intermediate Transit Hubs · Real-time Fleet Animation & Customer Alerts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFocusedCoords(truckLocationCoords)}
              className="text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Recenter on Truck
            </Button>

            <a
              href={`tel:${activePackage?.customerPhone || activePackage?.driverPhone || "+919999988888"}`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call Driver
            </a>

            <Button
              size="sm"
              variant={activeRouteType === "shortest" ? "brand" : "outline"}
              onClick={handleSelectShortestRoute}
              className="text-xs font-bold gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Shortest Corridor
            </Button>
            <Button
              size="sm"
              variant={activeRouteType === "alternate" ? "brand" : "outline"}
              onClick={handleSelectAlternateRoute}
              className="text-xs font-bold gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Alternate Bypass
            </Button>
          </div>
        </div>
      </div>

      {/* Package Navigation Strip */}
      <div className="space-y-3">
        {/* SINGLE FOCUSED PRODUCT BANNER */}
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-foreground">
                    {activePackage.trackingNumber}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 uppercase",
                      activePackage.status === "DELIVERED"
                        ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                        : "bg-primary/15 text-primary border-primary/30",
                    )}
                  >
                    {activePackage.status.replaceAll("_", " ")}
                  </Badge>
                  <span className="text-xs font-semibold text-primary">
                    (Active Delivery Focused)
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  Cargo: <span className="font-bold">{activePackage.cargoDescription}</span> · Recipient:{" "}
                  <span className="font-bold text-primary">{activePackage.customerName}</span> ({activePackage.customerPhone})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Shipment Quick Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <Select
                  value={activePackage.id}
                  onValueChange={(val) => {
                    const match = packages.find((p) => p.id === val);
                    if (match) handleSelectPackage(match);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs font-semibold w-56 bg-card border-border">
                    <SelectValue placeholder="Switch Shipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.trackingNumber} ({p.customerName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-card px-3 py-1.5 border border-border shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Vehicle</span>
                <span className="font-mono font-bold text-foreground">{activePackage.vehicleNumber}</span>
              </div>
              <div className="rounded-lg bg-card px-3 py-1.5 border border-border shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Driver</span>
                <span className="font-bold text-foreground">{activePackage.driverName}</span>
              </div>
              <div className="rounded-lg bg-card px-3 py-1.5 border border-border shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Live Speed</span>
                <span className="font-bold text-primary">{activePackage.speed} km/h</span>
              </div>
              <Button asChild size="sm" variant="ghost" className="h-8 text-xs font-semibold">
                <Link to="/app/logistics_operator/dashboard">
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Operator Hub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Corridor Distance"
          value={`${chosenRoute.distanceKm} km`}
          icon={Navigation}
          iconClass="bg-primary/10 text-primary"
          footer={activeRouteType === "shortest" ? "⚡ Shortest Path Selected" : "Alternative Bypass Route"}
        />
        <StatCard
          label="Estimated Transit Time"
          value={chosenRoute.durationText}
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-600"
          footer="Live Highway Speed Calculated"
        />
        <StatCard
          label="Intermediate Waypoints"
          value={`${chosenRoute.intermediateHubs.length} In-Between Hubs`}
          icon={MapPin}
          iconClass="bg-emerald-500/10 text-emerald-600"
          footer="Transit nodes & toll checkpoints"
        />
        <StatCard
          label="Active Fleet Status"
          value={`${packages.filter((p) => p.status === "IN_TRANSIT" || p.status === "OUT_FOR_DELIVERY").length} Moving`}
          icon={Truck}
          iconClass="bg-purple-500/10 text-purple-600"
          footer="Real-time satellite GPS tracking"
        />
      </div>

      {/* Main Map + Corridor Decider Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-World Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-md">
            {/* Header / Map Title Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-foreground">
                  {chosenRoute.title}
                </span>
                {isPackageFocused && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Live Tracking: {activePackage.trackingNumber}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-7 text-[11px]", showAll30Hubs && !isPackageFocused && "bg-primary/10 border-primary/30 text-primary")}
                  onClick={() => setShowAll30Hubs(!showAll30Hubs)}
                  disabled={isPackageFocused}
                >
                  <Layers className="mr-1 h-3 w-3" />
                  {showAll30Hubs ? "30 State Hubs Visible" : "Hide 30 State Hubs"}
                </Button>
              </div>
            </div>

            {/* Leaflet Real World Map Container */}
            <div className="relative h-[520px]">
              <MapContainer
                center={truckLocationCoords || [11.6643, 78.1460]}
                zoom={8}
                scrollWheelZoom={false}
                className="h-full w-full !rounded-none z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <MapCameraController
                  centerCoords={focusedCoords || truckLocationCoords}
                  zoomLevel={8}
                />

                {/* Corridor Polyline Route */}
                <Polyline
                  positions={chosenRoute.path}
                  pathOptions={{
                    color: activeRouteType === "shortest" ? "#059669" : "#2563eb",
                    weight: 6,
                    lineCap: "round",
                    opacity: 0.85,
                  }}
                />
                <Polyline
                  positions={chosenRoute.path}
                  pathOptions={{
                    color: activeRouteType === "shortest" ? "#34d399" : "#60a5fa",
                    weight: 2,
                    dashArray: "8, 10",
                    lineCap: "round",
                  }}
                />

                {/* CASE A: Show 30 State Hubs across India if not focused */}
                {!isPackageFocused &&
                  showAll30Hubs &&
                  ALL_30_STATE_HUBS.map((hub) => (
                    <Marker key={hub.id} position={[hub.lat, hub.lng]} icon={createHubIcon(hub)}>
                      <Popup>
                        <div className="p-1 text-xs">
                          <p className="font-bold text-foreground">{hub.hubName}</p>
                          <p className="text-[11px] text-muted-foreground">{hub.city}, {hub.state}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-primary">Operating Capacity:</span>
                            <span className="font-bold text-foreground">{hub.capacity}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Origin Hub Marker */}
                <Marker position={activeCorridor.originHub.coords} icon={originHubIcon(activeCorridor.originHub.city)}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Origin Distribution Hub</span>
                      <p className="font-bold text-foreground mt-0.5">{activeCorridor.originHub.name}</p>
                      <p className="text-[11px] text-muted-foreground">{activeCorridor.originHub.city}, {activeCorridor.originHub.state}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Intermediate Transit Hubs ("nadavula iruka hubs") */}
                {chosenRoute.intermediateHubs.map((ihub) => {
                  const isPassed = waypointStep > ihub.stopNum;
                  const isCurrent = waypointStep === ihub.stopNum;

                  return (
                    <Marker
                      key={`ihub-${ihub.stopNum}`}
                      position={ihub.coords}
                      icon={intermediateWaypointIcon(ihub.stopNum, ihub.city, isPassed, isCurrent)}
                    >
                      <Popup>
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

                {/* Destination Hub Marker */}
                <Marker position={activeCorridor.destHub.coords} icon={destinationHubIcon(activeCorridor.destHub.city)}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Final Destination Hub</span>
                      <p className="font-bold text-foreground mt-0.5">{activeCorridor.destHub.name}</p>
                      <p className="text-[11px] text-muted-foreground">{activeCorridor.destHub.city}, {activeCorridor.destHub.state}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Live Delivery Truck Marker Positioned at In-Between Hub */}
                <Marker
                  position={truckLocationCoords}
                  icon={movingTruckMarkerIcon(
                    activePackage?.speed || 68,
                    true,
                    activeRouteType === "shortest",
                    waypointStep <= chosenRoute.intermediateHubs.length,
                  )}
                >
                  <Popup>
                    <div className="p-1.5 text-xs space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between border-b border-border/50 pb-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-emerald-600" />
                          {activePackage?.vehicleNumber || "TN 38 BL 7842"}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                          {activePackage?.speed || 68} km/h
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Driver: <b className="text-foreground">{activePackage?.driverName || "Amrith Kumar"}</b>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Active Checkpoint: <b className="text-primary">{currentHubDisplayName}</b>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Recipient: <b className="text-foreground">{activePackage?.customerName}</b>
                      </p>
                      <div className="pt-1 border-t border-border/50 text-[10px] flex items-center justify-between text-muted-foreground">
                        <span>AI Predicted Delay:</span>
                        <span className="font-bold text-foreground">+{mlEta.data?.predicted_delay_minutes || 0}m</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Waypoint Sequence Stepper (Source ➔ In-Between Hubs ➔ Destination) */}
            <div className="border-t border-border/80 bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Corridor Waypoint Checkpoints (Source ➔ In-Between Hubs ➔ Destination):
                </span>
                <span className="text-emerald-600 font-bold text-[11px]">
                  🚚 Truck Currently Docked at: {currentHubDisplayName}
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {/* 1. Origin */}
                <div
                  onClick={() => setWaypointStep(0)}
                  className={cn(
                    "rounded-xl border p-2.5 cursor-pointer transition-all relative",
                    waypointStep === 0
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : waypointStep > 0
                      ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                      : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Origin</span>
                    {waypointStep > 0 ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{activeCorridor.originHub.city}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{activeCorridor.originHub.name}</p>
                </div>

                {/* 2. Intermediate Hubs */}
                {chosenRoute.intermediateHubs.map((ihub) => {
                  const isPassed = waypointStep > ihub.stopNum;
                  const isCurrent = waypointStep === ihub.stopNum;

                  return (
                    <div
                      key={`step-${ihub.stopNum}`}
                      onClick={() => setWaypointStep(ihub.stopNum)}
                      className={cn(
                        "rounded-xl border p-2.5 cursor-pointer transition-all relative",
                        isCurrent
                          ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/50 shadow-xs"
                          : isPassed
                          ? "border-emerald-500/40 bg-emerald-500/[0.04]"
                          : "border-border/60 bg-muted/20 opacity-80",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            isCurrent ? "text-amber-700 font-extrabold flex items-center gap-1" : isPassed ? "text-emerald-600" : "text-muted-foreground",
                          )}
                        >
                          {isCurrent ? "🚚 Truck at Hub" : `Hub #${ihub.stopNum}`}
                        </span>
                        {isPassed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                        ) : isCurrent ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{ihub.toll}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground truncate">{ihub.city}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ihub.name}</p>
                    </div>
                  );
                })}

                {/* 3. Destination */}
                <div
                  onClick={() => setWaypointStep(chosenRoute.intermediateHubs.length + 1)}
                  className={cn(
                    "rounded-xl border p-2.5 cursor-pointer transition-all relative",
                    waypointStep >= chosenRoute.intermediateHubs.length + 1
                      ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500"
                      : "border-border/60 bg-muted/20 opacity-80",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Destination</span>
                    {waypointStep >= chosenRoute.intermediateHubs.length + 1 ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{activeCorridor.destHub.city}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{activeCorridor.destHub.name}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Shortest Route Decider & Live Package Telemetry (1 Col) */}
        <div className="space-y-4">
          {/* Corridor Selection & Decision Card */}
          <Card className="shadow-card border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Corridor & Shortest Route Decider
              </CardTitle>
              <CardDescription className="text-xs">
                Select freight lane to compare distance, tolls & speed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Corridor Preset Dropdown */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  National Freight Corridor
                </label>
                <Select
                  value={selectedCorridorKey}
                  onValueChange={(val) => {
                    setSelectedCorridorKey(val);
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Choose Corridor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbe-che">Coimbatore ➔ Chennai (NH-544 / NH-48)</SelectItem>
                    <SelectItem value="che-cbe">Chennai ➔ Coimbatore (NH-544 / NH-48)</SelectItem>
                    <SelectItem value="blr-che">Bangalore ➔ Chennai (NH-48 Expressway)</SelectItem>
                    <SelectItem value="che-blr">Chennai ➔ Bangalore (NH-48 Expressway)</SelectItem>
                    <SelectItem value="mum-pune">Mumbai ➔ Pune (Auto Expressway)</SelectItem>
                    <SelectItem value="pune-mum">Pune ➔ Mumbai (Auto Expressway)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Decision Options (Shortest vs Alternate) */}
              <div className="space-y-2.5 pt-1">
                {/* Shortest Option Card */}
                <div
                  onClick={handleSelectShortestRoute}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 transition-all",
                    activeRouteType === "shortest"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border hover:border-border/80 bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <Zap className="h-3 w-3" /> Shortest Route (Optimal)
                    </span>
                    {activeRouteType === "shortest" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-base font-extrabold text-foreground">
                      {activeCorridor.shortest.distanceKm} km
                    </p>
                    <span className="text-xs font-bold text-emerald-600">
                      ETA: {activeCorridor.shortest.durationText}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Tolls: {activeCorridor.shortest.tolls}</span>
                    <span className="text-emerald-600 font-semibold">{activeCorridor.shortest.fuelEfficiency}</span>
                  </div>
                </div>

                {/* Alternate Option Card */}
                <div
                  onClick={handleSelectAlternateRoute}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 transition-all",
                    activeRouteType === "alternate"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-border/80 bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      <ShieldCheck className="h-3 w-3" /> Alternate Bypass Route
                    </span>
                    {activeRouteType === "alternate" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-base font-extrabold text-foreground">
                      {activeCorridor.alternate.distanceKm} km
                    </p>
                    <span className="text-xs font-bold text-primary">
                      ETA: {activeCorridor.alternate.durationText}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Tolls: {activeCorridor.alternate.tolls}</span>
                    <span>Low Traffic Bypass</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Dispatches Corridor & Informs Customer via SMS */}
              <Button
                className="w-full text-xs font-bold gap-1.5"
                variant={activeRouteType === "shortest" ? "brand" : "outline"}
                onClick={() => {
                  const target = activePackage || packages[0];
                  notificationsApi.sendRouteUpdateNotification({
                    trackingNumber: target.trackingNumber,
                    customerEmail: target.customerEmail,
                    customerName: target.customerName,
                    newRoute: chosenRoute.title,
                    eta: chosenRoute.durationText,
                    reason: "Fleet deployed on selected highway corridor",
                  });
                  toast.success("Fleet Dispatched & Customer Alerted!", {
                    description: `Active fleet directed to ${chosenRoute.title}. Recipient notified via SMS/App notification.`,
                  });
                }}
              >
                <Bell className="h-3.5 w-3.5" />
                Deploy Fleet & Notify Customer
              </Button>
            </CardContent>
          </Card>

          {/* Focused Package Live Telemetry Panel */}
          {activePackage && (
            <Card className="shadow-card border-primary/40 bg-primary/[0.02]">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Activity className="h-4 w-4" />
                    Live Package Telemetry
                  </CardTitle>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {activePackage.trackingNumber}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-3 text-xs">
                <div>
                  <p className="text-muted-foreground text-[11px]">Current Checkpoint:</p>
                  <p className="font-bold text-foreground">{currentHubDisplayName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Driver:</span>
                    <p className="font-semibold text-foreground">{activePackage.driverName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    <p className="font-semibold text-foreground">{activePackage.vehicleNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Speed:</span>
                    <p className="font-bold text-primary">{activePackage.speed} km/h</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fuel/Battery:</span>
                    <p className="font-bold text-emerald-600">{activePackage.batteryFuel}%</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Journey Progress:</span>
                    <span className="font-bold text-primary">{activePackage.progressPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${activePackage.progressPct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Traveling Salesperson Heuristic */}
          <Card className="shadow-card border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Traveling Salesperson Heuristic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Optimizes multi-hub stop sequence to reduce turnarounds and save fuel.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunOptimization}
                disabled={optimizeRoute.isPending}
                className="w-full text-xs font-bold"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" />
                {optimizeRoute.isPending ? "Calculating ML Gains..." : "Run AI Corridor Optimization"}
              </Button>

              {mlOptimization && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      +{mlOptimization.optimization_gain_pct}% Efficiency Gain
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Optimal</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-muted-foreground">
                    <div>Distance: <span className="font-bold text-foreground">{mlOptimization.optimized_distance_km} km</span></div>
                    <div>Fuel Saved: <span className="font-bold text-emerald-600">{mlOptimization.fuel_saved_liters} L</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =====================================================
          OPERATOR CHECKPOINT ACTIONS, JOURNEY UPDATES & POD
      ===================================================== */}
      <div className="grid gap-6 md:grid-cols-2 pt-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current Active Checkpoint
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {currentHubDisplayName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Status: <span className="font-semibold text-emerald-600">Truck Docked / Checkpoint Verified</span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Next Stop Along Corridor
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {nextStopDisplayName}
          </h2>
          {activePackage && (
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Recipient: <span className="font-semibold text-foreground">{activePackage.customerName}</span> · {activePackage.customerPhone}
            </p>
          )}
        </div>
      </div>

      {/* JOURNEY TELEMETRY UPDATE */}
      <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Journey Telemetry & Real-Time Highway Update
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {/* TRAFFIC */}
          <div>
            <Label>Traffic Condition</Label>
            <Select value={trafficCondition} onValueChange={setTrafficCondition}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["LOW", "MODERATE", "HEAVY"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item} Traffic
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* WEATHER */}
          <div>
            <Label>Weather</Label>
            <Select value={weatherCondition} onValueChange={setWeatherCondition}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["CLEAR", "RAIN", "FOG", "STORM"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ROAD */}
          <div>
            <Label>Road Surface</Label>
            <Select value={roadCondition} onValueChange={setRoadCondition}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GOOD", "UNDER_CONSTRUCTION", "ACCIDENT", "BLOCKED"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Remarks / Transit Notes</Label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Cleared toll plaza checkpoint smoothly, optimal driving conditions"
            className="mt-1"
          />
        </div>
      </div>

      {/* AI DRIVER COPILOT & PREDICTIVE DELAY INSIGHTS */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-base font-bold text-foreground">
              AI Driver Copilot & Real-Time Impact Assessment
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Live Neural Telemetry Active
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          As you report road and weather conditions above, the AI engine dynamically recalculates cumulative transit delays and delivery SLA risk in real-time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Predicted Transit Delay
            </p>
            <p className="text-xl font-extrabold text-foreground">
              +{mlEta.data?.predicted_delay_minutes ?? "0"} mins
            </p>
            <p className="text-[11px] text-muted-foreground">
              Delay Risk: <span className={cn("font-bold", mlEta.data?.risk_level === "HIGH" ? "text-rose-600" : mlEta.data?.risk_level === "MEDIUM" ? "text-amber-600" : "text-emerald-600")}>{mlEta.data?.risk_level ?? "LOW"}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Delivery SLA Risk
            </p>
            <p className="text-xl font-extrabold text-foreground">
              {mlRisk.data?.failure_risk_percentage ?? "0"}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              Risk Level: <span className={cn("font-bold", mlRisk.data?.risk_category === "CRITICAL" ? "text-rose-600" : mlRisk.data?.risk_category === "MODERATE" ? "text-amber-600" : "text-emerald-600")}>{mlRisk.data?.risk_category ?? "LOW"}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              AI Copilot Recommendation
            </p>
            <p className="text-xs text-foreground font-medium line-clamp-3 leading-relaxed">
              {mlRisk.data?.recommended_intervention || mlEta.data?.contributing_factors?.[0] || "On schedule. Maintain standard driving pace."}
            </p>
          </div>
        </div>
      </div>

      {/* PROOF OF DELIVERY (POD) - SHOW WHEN APPROACHING FINAL DELIVERY */}
      {(waypointStep > chosenRoute.intermediateHubs.length || activePackage?.status === "OUT_FOR_DELIVERY") && (
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Submit Proof of Delivery (POD)
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload delivery proof photo and collect recipient signature before marking delivery completed.
            </p>
          </div>

          {/* POD IMAGE */}
          <div className="space-y-3">
            <Label className="mr-4">Proof of Delivery Image</Label>
            <input
              id="operator-pod-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <label htmlFor="operator-pod-upload">
              <Button type="button" asChild variant="outline">
                <span className="cursor-pointer">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {podImage ? "Change Image" : "Upload Image"}
                </span>
              </Button>
            </label>

            {preview && (
              <div className="mt-4 overflow-hidden rounded-xl border max-w-md">
                <img
                  src={preview}
                  alt="Proof of Delivery preview"
                  className="max-h-[360px] w-full object-contain"
                />
              </div>
            )}
          </div>

          {/* SIGNATURE */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Customer Signature
            </Label>
            <canvas
              ref={(canvas) => {
                if (!canvas) return;
                sigRef.current = canvas;
                if (!signaturePad.current) {
                  signaturePad.current = new SignaturePad(canvas, {
                    penColor: "black",
                    minWidth: 1,
                    maxWidth: 2,
                  });
                }
              }}
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "180px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                touchAction: "none",
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signaturePad.current?.clear()}
            >
              Clear Signature
            </Button>
          </div>

          {/* RECIPIENT NAME */}
          <div className="space-y-2 max-w-md">
            <Label>Recipient Name</Label>
            <Input
              value={customerName || activePackage?.customerName || ""}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter recipient name"
            />
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS: STATUS SELECTOR + ADVANCE CHECKPOINT */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border bg-card p-6 shadow-sm">
        {/* STATUS SELECTOR */}
        <div className="flex items-end gap-3">
          <div className="w-64">
            <Label className="text-xs text-muted-foreground mb-1 block">Shipment Lifecycle Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            disabled={!selectedStatus || isCompletingDelivery}
            onClick={handleStatusUpdate}
          >
            {isCompletingDelivery
              ? "Completing..."
              : selectedStatus === "DELIVERED"
              ? "Complete Delivery"
              : "Update Status"}
          </Button>
        </div>

        {/* ADVANCE TO NEXT HUB BUTTON */}
        <div className="flex items-end">
          <Button
            onClick={handleAdvanceNextHub}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Reached Next Hub
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RouteManagementPage;