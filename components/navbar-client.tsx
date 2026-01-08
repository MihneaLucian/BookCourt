"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export function NavbarClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, is_admin')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        }
        
        setProfile(data);
        
        // Debug: Log admin status
        if (data) {
          console.log('Profile data:', data);
          console.log('Is admin:', data.is_admin);
        }
      }
      
      setLoading(false);
    }
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <nav className="border-b bg-white p-4 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="text-xl font-bold text-blue-600">
          PlayOn
        </Link>
        <div className="w-24 h-8 bg-zinc-200 animate-pulse rounded" />
      </nav>
    );
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
