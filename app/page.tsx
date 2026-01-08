import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-emerald-950/20 pointer-events-none"></div>

      {/* Navbar */}
      <div className="absolute top-0 w-full z-10">
        <div className="max-w-7xl mx-auto p-6 flex justify-between items-center">
          <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            PlayOn
          </div>
          <div className="space-x-4 text-sm font-medium">
            {user ? (
              <Link href="/search" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm">
                  Autentificare
                </Link>
                <Link href="/auth/signup" className="bg-white text-zinc-900 px-6 py-2 rounded-lg font-semibold hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl">
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl space-y-8 mt-20 relative z-10">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-tight">
            Sportul tău, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500">
              fără bătăi de cap.
            </span>
          </h1>
          
          <p className="text-zinc-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
            Găsește terenuri în România, rezervă instant și împarte plata cu prietenii.
            <span className="block mt-2 text-zinc-400">Stop apelurilor telefonice.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/search">
            <button className="bg-white text-zinc-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-zinc-100 transition-all shadow-professional-lg hover:shadow-2xl hover:-translate-y-0.5 transform">
              Caută Teren
            </button>
          </Link>
          <button className="border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all shadow-professional hover:shadow-lg">
            Descarcă Aplicația
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-white/10">
          <div className="space-y-2">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-lg">Rezervare Instant</h3>
            <p className="text-zinc-400 text-sm">Rezervă în câteva click-uri, fără așteptare</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-semibold text-lg">Peste România</h3>
            <p className="text-zinc-400 text-sm">Mii de terenuri în toate orașele mari</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold text-lg">Plată Simplă</h3>
            <p className="text-zinc-400 text-sm">Plătește online sau împarte cu prietenii</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-zinc-600 text-sm z-10">
        &copy; 2026 PlayOn. Toate drepturile rezervate.
      </div>
    </main>
  );
}