import ProtectedRoute from "@/components/auth/protected-route";
import DashboardHome from "@/components/dashboard/dashboard-home";

export default function HrDashboardPage() {
  return <ProtectedRoute role="hr"><DashboardHome role="hr" /></ProtectedRoute>;
}
