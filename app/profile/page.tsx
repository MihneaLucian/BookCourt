import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "@/components/navbar-client";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Try to get user, but don't redirect immediately
  // Let the client component handle the redirect if needed
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavbarClient />
      <ProfileContent initialUser={user} />
    </div>
  );
}
