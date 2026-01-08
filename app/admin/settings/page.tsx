import { NavbarClient } from "@/components/navbar-client";
import { Suspense } from "react";
import { FieldSettingsContent } from "./field-settings-content";

export default function FieldSettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <NavbarClient />
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <FieldSettingsContent />
      </Suspense>
    </div>
  );
}
