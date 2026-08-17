import ProtectedRoute from "@/components/auth/protected-route";
import DashboardHome from "@/components/dashboard/dashboard-home";

export default function ManagerDashboardPage() {
  return <ProtectedRoute role="department_manager"><DashboardHome role="department_manager" /></ProtectedRoute>;
}
