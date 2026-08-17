import ProtectedRoute from "@/components/auth/protected-route";
import DashboardHome from "@/components/dashboard/dashboard-home";

export default function TechLeadDashboardPage() {
  return <ProtectedRoute role="tech_lead"><DashboardHome role="tech_lead" /></ProtectedRoute>;
}
