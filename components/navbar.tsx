import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user profile if logged in
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="border-b bg-white p-4 flex justify-between items-center sticky top-0 z-10">
      <Link href="/" className="text-xl font-bold text-blue-600">
        PlayOn
      </Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <UserMenu 
            user={user} 
            fullName={profile?.full_name || null}
            isAdmin={profile?.is_admin === true}
          />
        ) : (
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Autentificare
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
