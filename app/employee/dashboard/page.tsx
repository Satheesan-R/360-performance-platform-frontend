import ProtectedRoute from "@/components/auth/protected-route";
import DashboardHome from "@/components/dashboard/dashboard-home";

export default function EmployeeDashboardPage() {
  return <ProtectedRoute role="employee"><DashboardHome role="employee" /></ProtectedRoute>;
}
