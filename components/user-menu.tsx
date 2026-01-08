"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User, LogOut, Calendar, Settings } from "lucide-react";

interface UserMenuProps {
  user: {
    id: string;
    email?: string;
  };
  fullName: string | null;
  isAdmin?: boolean;
}

export function UserMenu({ user, fullName, isAdmin }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Debug: Log admin status
  useEffect(() => {
    console.log('UserMenu - isAdmin prop:', isAdmin, 'Type:', typeof isAdmin);
  }, [isAdmin]);
  
  // Explicitly check for true (not just truthy)
  const showAdminLink = isAdmin === true;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const displayName = fullName || user.email?.split('@')[0] || 'Utilizator';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-zinc-700 hidden sm:block">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-zinc-200 py-1 z-20">
            <div className="px-4 py-3 border-b border-zinc-200">
              <p className="text-sm font-semibold text-zinc-900">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <User className="w-4 h-4" />
              Profilul Meu
            </Link>
            
            <Link
              href="/bookings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Rezervările Mele
            </Link>
            
            {showAdminLink && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Dashboard Admin
              </Link>
            )}
            
            <div className="border-t border-zinc-200 my-1" />
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Deconectare
            </button>
          </div>
        </>
      )}
    </div>
  );
}
