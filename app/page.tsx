import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-emerald-950/20 pointer-events-none"></div>

      {/* Navbar */}
      <div className="sticky top-0 w-full z-50 backdrop-blur-md bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:p-6 flex justify-between items-center">
          <div className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            PlayOn
          </div>
          <div className="flex items-center gap-2 md:space-x-4 text-xs md:text-sm font-medium">
            {user ? (
              <Link href="/search" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm">
                  Autentificare
                </Link>
                <Link href="/auth/signup" className="bg-white text-zinc-900 px-4 py-1.5 md:px-6 md:py-2 rounded-lg font-semibold hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl text-xs md:text-sm">
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] md:min-h-[90vh] px-4 md:px-6 py-12 md:py-20">
        <div className="text-center max-w-4xl space-y-6 md:space-y-8 relative z-10">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-tight leading-tight px-2">
              Sportul tău, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500">
                fără bătăi de cap.
              </span>
            </h1>
            
            <p className="text-zinc-300 text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed px-4">
              Găsește terenuri în România, rezervă instant și împarte plata cu prietenii.
              <span className="block mt-2 text-zinc-400">Stop apelurilor telefonice.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-6 md:pt-8 px-4">
            <Link href="/search" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-white text-zinc-900 px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-zinc-100 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transform">
                Caută Teren
              </button>
            </Link>
            <button className="w-full sm:w-auto border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-white/10 transition-all shadow-lg hover:shadow-xl">
              Descarcă Aplicația
            </button>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-3 text-center p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg md:text-xl">Rezervare Instant</h3>
              <p className="text-zinc-400 text-sm md:text-base">Rezervă în câteva click-uri, fără așteptare sau apeluri telefonice</p>
            </div>
            <div className="space-y-3 text-center p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl mb-3">📍</div>
              <h3 className="font-semibold text-lg md:text-xl">Peste tot in România</h3>
              <p className="text-zinc-400 text-sm md:text-base">Mii de terenuri în toate orașele mari, de la București la Cluj</p>
            </div>
            <div className="space-y-3 text-center p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl md:text-4xl mb-3">💳</div>
              <h3 className="font-semibold text-lg md:text-xl">Plată Simplă</h3>
              <p className="text-zinc-400 text-sm md:text-base">Plătește online sigur sau împarte costul cu prietenii</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Cum funcționează?
            </h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto px-4">
              Trei pași simpli pentru a rezerva terenul perfect
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="relative">
              <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-xl md:text-2xl font-bold text-white z-20 shadow-lg">
                1
              </div>
              <div className="p-6 md:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 h-full pt-8 md:pt-8">
                <div className="text-4xl md:text-5xl mb-3 md:mb-4">🔍</div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Caută Terenul</h3>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                  Folosește filtrele noastre pentru a găsi terenul perfect în orașul tău. Vezi disponibilitatea în timp real și prețurile actualizate.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-xl md:text-2xl font-bold text-white z-20 shadow-lg">
                2
              </div>
              <div className="p-6 md:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 h-full pt-8 md:pt-8">
                <div className="text-4xl md:text-5xl mb-3 md:mb-4">📅</div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Rezervă Ora</h3>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                  Alege data și ora dorită, verifică disponibilitatea și confirmă rezervarea. Totul se întâmplă în câteva secunde.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-xl md:text-2xl font-bold text-white z-20 shadow-lg">
                3
              </div>
              <div className="p-6 md:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 h-full pt-8 md:pt-8">
                <div className="text-4xl md:text-5xl mb-3 md:mb-4">💸</div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Plătește Simplu</h3>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
                  Plătește online sigur sau trimite link-uri de plată prietenilor pentru a împărți costul. Confirmarea este instantanee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1 md:mb-2">
                10K+
              </div>
              <p className="text-zinc-400 text-xs md:text-sm lg:text-base">Utilizatori activi</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1 md:mb-2">
                500+
              </div>
              <p className="text-zinc-400 text-xs md:text-sm lg:text-base">Terenuri disponibile</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1 md:mb-2">
                50+
              </div>
              <p className="text-zinc-400 text-xs md:text-sm lg:text-base">Orașe acoperite</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1 md:mb-2">
                25K+
              </div>
              <p className="text-zinc-400 text-xs md:text-sm lg:text-base">Rezervări finalizate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Features */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              De ce PlayOn?
            </h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto px-4">
              Tot ce ai nevoie pentru a juca sportul tău preferat
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🔄</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Anulare Flexibilă</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Anulează rezervarea până la 24h înainte fără penalități</p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">⭐</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Recenzii Reale</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Citește recenzii de la alți jucători pentru fiecare teren</p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🔔</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Notificări Smart</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Primește notificări pentru terenuri noi și oferte speciale</p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">👥</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Împărțire Costuri</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Trimite link-uri de plată prietenilor pentru a împărți costul</p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">📱</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Aplicație Mobilă</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Rezervă din orice loc, oricând, direct din telefon</p>
            </div>
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">🛡️</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Plăți Sigure</h3>
              <p className="text-zinc-400 text-xs md:text-sm">Plăți criptate și securizate, protejate de fraudă</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Întrebări Frecvente
            </h2>
            <p className="text-zinc-400 text-base md:text-lg px-4">
              Tot ce trebuie să știi despre PlayOn
            </p>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg md:text-xl font-semibold mb-2">Cum funcționează rezervarea?</h3>
              <p className="text-zinc-400 text-sm md:text-base">
                Selectează terenul, data și ora dorită, verifică disponibilitatea și confirmă rezervarea. Vei primi un email de confirmare și poți plăti online sau împărți costul cu prietenii.
              </p>
            </div>
            
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg md:text-xl font-semibold mb-2">Pot anula o rezervare?</h3>
              <p className="text-zinc-400 text-sm md:text-base">
                Da, poți anula rezervarea până la 24 de ore înainte de ora rezervată fără penalități. După această perioadă, se poate aplica o taxă de anulare.
              </p>
            </div>
            
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg md:text-xl font-semibold mb-2">Cum împart costul cu prietenii?</h3>
              <p className="text-zinc-400 text-sm md:text-base">
                După ce faci rezervarea, poți genera link-uri de plată pe care le trimiți prietenilor. Fiecare poate plăti partea sa direct, fără să trebuiască să colectezi bani manual.
              </p>
            </div>
            
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg md:text-xl font-semibold mb-2">Ce metode de plată acceptați?</h3>
              <p className="text-zinc-400 text-sm md:text-base">
                Acceptăm carduri bancare, transferuri bancare și alte metode de plată online securizate. Toate plățile sunt procesate prin gateway-uri criptate și securizate.
              </p>
            </div>
            
            <div className="p-5 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg md:text-xl font-semibold mb-2">În ce orașe operați?</h3>
              <p className="text-zinc-400 text-sm md:text-base">
                Acoperim peste 50 de orașe din România, inclusiv toate orașele mari precum București, Cluj-Napoca, Timișoara, Iași, Constanța și multe altele. Continuăm să adăugăm terenuri noi în fiecare săptămână.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Gata să începi?
          </h2>
          <p className="text-zinc-400 text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Alătură-te miilor de jucători care folosesc PlayOn pentru a rezerva terenurile preferate
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Link href="/search" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-white text-zinc-900 px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-zinc-100 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transform">
                Caută Teren Acum
              </button>
            </Link>
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-white/10 transition-all shadow-lg hover:shadow-xl">
                Creează Cont Gratuit
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 md:py-12 px-4 md:px-6 border-t border-white/10 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-3 md:mb-4">
                PlayOn
              </div>
              <p className="text-zinc-400 text-xs md:text-sm">
                Platforma ta pentru rezervarea terenurilor sportive în România.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Link-uri Rapide</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-400">
                <li><Link href="/search" className="hover:text-white transition-colors">Caută Teren</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Înregistrare</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Autentificare</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Despre</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Despre Noi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cum Funcționează</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Suport</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Ajutor</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termeni și Condiții</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politica de Confidențialitate</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 md:pt-8 border-t border-white/10 text-center text-zinc-600 text-xs md:text-sm">
            &copy; 2026 PlayOn. Toate drepturile rezervate.
          </div>
        </div>
      </footer>
    </main>
  );
}