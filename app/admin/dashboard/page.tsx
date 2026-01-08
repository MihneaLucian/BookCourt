import { NavbarClient } from "@/components/navbar-client";
import { AdminDashboardContent } from "./admin-dashboard-content";

export default function AdminDashboardPage() {
  // Use client-side authentication check for more reliable session reading
  return (
    <div className="min-h-screen bg-zinc-50">
      <NavbarClient />
      <AdminDashboardContent />
    </div>
  );
}
