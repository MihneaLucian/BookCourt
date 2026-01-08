import { NavbarClient } from "@/components/navbar-client";
import { Suspense } from "react";
import { AdminRevenueContent } from "./admin-revenue-content";

export default function AdminRevenuePage() {
  // Use client-side authentication check for more reliable session reading
  return (
    <div className="min-h-screen bg-zinc-50">
      <NavbarClient />
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <AdminRevenueContent />
      </Suspense>
    </div>
  );
}
