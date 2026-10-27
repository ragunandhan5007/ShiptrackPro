
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/context/auth-context";
import { RequireAuth, RequireGuest } from "@/components/layouts/route-guards";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import  LoginPage  from "@/pages/login";

import  DashboardRouter  from "@/pages/dashboards/dashboard-router";
import { ShipmentsPage } from "@/pages/shipments";
import { ShipmentDetailPage } from "@/pages/shipment-detail";

import { AnalyticsPage } from "@/pages/analytics";
import { NotificationsPage } from "@/pages/notifications";
import { SettingsPage } from "@/pages/settings";
import { ProfilePage } from "@/pages/profile";
import { TeamPage } from "@/pages/team";

import { TicketsPage } from "@/pages/tickets";
import { CreateTicketPage } from "@/pages/create-ticket";
import { TicketDetailPage } from "@/pages/ticket-detail";

import { NotFoundPage } from "@/pages/not-found";

import { RouteManagementPage } from "@/pages/route-management";
import { PodPage } from "@/pages/pod";
import { ReportsPage } from "@/pages/reports";



import { DeliveryReportsPage } from "@/pages/delivery-reports";
import { CreateShipmentPage } from "@/pages/create-shipment";
import { TrackPage } from "@/pages/track";
import LiveMapPage from "@/pages/live-map";

import { ShipmentHistoryPage } from "@/pages/shipment-history";
import { BusinessReportsPage } from "@/pages/business-reports";
import { MyDeliveriesPage } from "@/pages/my-deliveries";
import LandingPage from "./pages/landingPage";
import RegisterPage from "./pages/registerPage";
import AdminDashboard from "./pages/dashboards/admin-dashboard";
import CustomerDashboard from "./pages/dashboards/customer-dashboard";
import BusinessDashboard from "./pages/dashboards/business-dashboard";
import OperatorDashboard from "./pages/dashboards/operator-dashboard";
import SupportDashboard from "./pages/dashboards/support-dashboard";
import CompanyDashboard from "./pages/dashboards/company-dashboard";
import OperatorNavigationPage from "@/pages/navigation";
import CustomerPodUploadPage from "@/pages/customer-pod-upload";
import ResetPasswordPage from "@/pages/reset-password";


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest-only routes */}
            <Route element={<RequireGuest />}>
              <Route path="/landingPage" element={<LandingPage />} />

              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/track" element={<TrackPage />} />
            </Route>

            {/* Authenticated routes */}
            <Route element={<RequireAuth />}>
              <Route path="/app" element={<DashboardLayout />}>
                <Route
                  index
                  element={<Navigate to="/app/dashboard" replace />}
                />
                <Route path="dashboard" element={<DashboardRouter />} />

                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route
                  path="customer/dashboard"
                  element={<CustomerDashboard />}
                />
                <Route
                  path="business_client/dashboard"
                  element={<BusinessDashboard />}
                />
                <Route
                  path="logistics_operator/dashboard"
                  element={<OperatorDashboard />}
                />
                <Route
                  path="support_agent/dashboard"
                  element={<SupportDashboard />}
                />

                <Route path="shipments" element={<ShipmentsPage />} />
                <Route path="shipments/:id" element={<ShipmentDetailPage />} />

                <Route
                  path="customer/pod/:shipmentId"
                  element={<CustomerPodUploadPage />}
                />
                <Route
                  path="operator/pod/:shipmentId"
                  element={<CustomerPodUploadPage />}
                />

                <Route
                  path="operator/navigation/:id"
                  element={<OperatorNavigationPage />}
                />

                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="team" element={<TeamPage />} />
               
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/new" element={<CreateTicketPage />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />

                <Route path="routes" element={<RouteManagementPage />} />
                <Route path="pod" element={<PodPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="delivery-reports" element={<DeliveryReportsPage />} />
                
                <Route
                  path="create-shipment"
                  element={<CreateShipmentPage />}
                />
               
                <Route
                  path="shipment-history"
                  element={<ShipmentHistoryPage />}
                />
                <Route
                  path="business-reports"
                  element={<BusinessReportsPage />}
                />
                <Route path="deliveries" element={<MyDeliveriesPage />} />
                <Route path="track" element={<TrackPage />} />
                <Route path="map" element={<Navigate to="/app/routes" replace />} />
                <Route path="live-map" element={<Navigate to="/app/routes" replace />} />
                <Route path="company/dashboard" element={<CompanyDashboard />} />
                <Route path="fleet" element={<CompanyDashboard />} />
              </Route>
            </Route>

            {/* Catch-all routes */}
            
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}