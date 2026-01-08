"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    }
    signOut();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <p className="text-zinc-500">Se deconectează...</p>
    </div>
  );
}
