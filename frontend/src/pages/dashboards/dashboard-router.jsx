import { useAuth } from "@/context/auth-context";
import AdminDashboard from "./admin-dashboard";
import OperatorDashboard from "./operator-dashboard";
import BusinessDashboard from "./business-dashboard";
import CustomerDashboard from "./customer-dashboard";
import SupportDashboard from "./support-dashboard";
import CompanyDashboard from "./company-dashboard";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "logistics_operator":
      return <OperatorDashboard />;
    case "business_client":
      return <BusinessDashboard />;
    case "company":
    case "fleet_operator":
      return <CompanyDashboard />;
    case "customer":
      return <CustomerDashboard />;
    case "support_agent":
      return <SupportDashboard />;
    default:
      return <div>Unauthorized</div>;
  }
}
