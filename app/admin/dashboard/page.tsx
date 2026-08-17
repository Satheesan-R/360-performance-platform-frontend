import ProtectedRoute from "@/components/auth/protected-route";
import DashboardHome from "@/components/dashboard/dashboard-home";

export default function AdminDashboardPage() {
  return <ProtectedRoute role="admin"><DashboardHome role="admin" /></ProtectedRoute>;
}
