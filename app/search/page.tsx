"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavbarClient } from "@/components/navbar-client";
import { supabase } from "@/lib/supabase/client";
import { Search, MapPin, TrendingUp } from "lucide-react";
import type { Teren } from "@/lib/data";
import { removeDiacritics, containsIgnoringDiacritics } from "@/lib/utils/romanian";

const ROMANIAN_CITIES = [
  'Arad', 'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța',
  'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila',
  'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare',
  'Buzău', 'Satu Mare', 'Botoșani', 'Râmnicu Vâlcea', 'Suceava',
  'Piatra Neamț', 'Drobeta-Turnu Severin', 'Focșani', 'Târgu Jiu',
  'Tulcea', 'Târgoviște', 'Reșița', 'Bistrița', 'Slatina'
].filter((v, i, a) => a.indexOf(v) === i).sort(); // Remove duplicates and sort

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || '';
  
  const [city, setCity] = useState(initialCity);
  const [fields, setFields] = useState<Teren[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialCity);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Load fields if city is in URL
  useEffect(() => {
    if (initialCity) {
      searchByCity(initialCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchByCity = async (searchCity: string) => {
    if (!searchCity.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Get all fields and filter client-side to handle diacritics
      // Exclude blocked fields and check if blocked_until date has passed
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('is_active', true)
        .order('nume');

      if (error) {
        console.error('Error fetching fields:', error);
        setFields([]);
      } else {
        // Normalize search term (remove diacritics)
        const normalizedSearch = removeDiacritics(searchCity.toLowerCase().trim());
        
        // Filter fields where city matches (with or without diacritics)
        // Also exclude blocked fields or fields blocked until a future date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredData = (data || []).filter((field: any) => {
          if (!field.city) return false;
          
          // Check if field is blocked
          if (field.is_blocked) {
            // If blocked_until exists and is in the past, field is no longer blocked
            if (field.blocked_until) {
              const blockedUntil = new Date(field.blocked_until);
              blockedUntil.setHours(0, 0, 0, 0);
              if (blockedUntil < today) {
                // Block has expired, field is available
              } else {
                // Still blocked
                return false;
              }
            } else {
              // Blocked indefinitely
              return false;
            }
          }
          
          const normalizedCity = removeDiacritics(field.city.toLowerCase());
          return normalizedCity.includes(normalizedSearch);
        });

        const transformedFields = filteredData.map((field: any) => ({
          id: field.id,
          nume: field.nume,
          sport: field.sport,
          suprafata: field.suprafata,
          pret: Number(field.pret),
          locatie: field.locatie,
          imagine: field.imagine,
          liber: true,
          rating: field.rating ? Number(field.rating) : undefined,
          reviewCount: field.review_count,
        }));
        setFields(transformedFields);
      }
    } catch (error) {
      console.error('Error:', error);
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      searchByCity(city);
      // Update URL without reload
      window.history.pushState({}, '', `/search?city=${encodeURIComponent(city)}`);
    }
  };

  const filteredCities = city
    ? ROMANIAN_CITIES.filter(c => 
        containsIgnoringDiacritics(c, city)
      ).slice(0, 8)
    : ROMANIAN_CITIES.slice(0, 8);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.city-search-container')) {
        setShowCitySuggestions(false);
      }
    };
    
    if (showCitySuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCitySuggestions]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <NavbarClient />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Search Section */}
        <div className="mb-10">
          <Card className="shadow-professional border border-zinc-200">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
                  Găsește Terenuri Sportive
                </h1>
                <p className="text-zinc-600">
                  Caută terenuri disponibile în orașul tău
                </p>
              </div>
              
              <form onSubmit={handleSearch} className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative city-search-container">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                      placeholder="Introdu numele orașului (ex: Arad, București, Cluj-Napoca)"
                      className="w-full pl-10 pr-4 py-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all"
                    />
                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div 
                        className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {filteredCities.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCity(c);
                              setShowCitySuggestions(false);
                              searchByCity(c);
                              window.history.pushState({}, '', `/search?city=${encodeURIComponent(c)}`);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-base font-medium rounded-md shadow-professional transition-colors disabled:opacity-50"
                    disabled={loading || !city.trim()}
                  >
                    {loading ? (
                      <>Se caută...</>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Caută
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Popular Cities */}
              {!hasSearched && (
                <div className="mt-6">
                  <p className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Orașe populare:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROMANIAN_CITIES.slice(0, 8).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c);
                          searchByCity(c);
                          window.history.pushState({}, '', `/search?city=${encodeURIComponent(c)}`);
                        }}
                        className="px-5 py-3 bg-white border-2 border-zinc-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 hover:border-blue-300 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-3 text-sm">Sport</h3>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-zinc-300" defaultChecked /> Fotbal
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-zinc-300" defaultChecked /> Tenis
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-zinc-300" /> Padel
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-3 text-sm">Preț Maxim</h3>
                    <input type="range" className="w-full accent-blue-600" />
                    <div className="text-xs text-zinc-500 mt-1">Până la 150 RON</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="md:col-span-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-zinc-500">Se caută terenuri...</p>
                </div>
              ) : fields.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-2">
                      Nu s-au găsit terenuri în <strong>{city}</strong>.
                    </p>
                    <p className="text-sm text-zinc-400">
                      Încearcă un alt oraș sau verifică dacă ai scris corect.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-zinc-600">
                      {fields.length} {fields.length === 1 ? 'teren găsit' : 'terenuri găsite'} în <strong>{city}</strong>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fields.map((teren) => (
                      <Card key={teren.id} className="overflow-hidden card-hover border border-zinc-200 cursor-pointer">
                        <div className="h-40 bg-zinc-100 flex items-center justify-center text-5xl">
                          {teren.imagine || '🏟️'}
                        </div>
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">{teren.sport}</Badge>
                            {teren.liber ? (
                              <span className="text-xs font-medium text-emerald-600">Disponibil</span>
                            ) : (
                              <span className="text-xs font-medium text-zinc-400">Ocupat</span>
                            )}
                          </div>
                          <CardTitle className="text-lg font-semibold text-zinc-900 mb-1">
                            {teren.nume}
                          </CardTitle>
                          <p className="text-sm text-zinc-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {teren.locatie} • {teren.suprafata}
                          </p>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="text-2xl font-bold text-zinc-900">
                                {teren.pret}
                                <span className="text-sm font-normal text-zinc-500 ml-1">RON</span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">pe oră</p>
                            </div>
                            {teren.rating && (
                              <div className="text-sm text-zinc-600">
                                ⭐ {teren.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="p-5 pt-0">
                          <Link href={`/book/${teren.id}`} className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                              Rezervă Acum
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Initial State - Show when no search has been made */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🏟️</div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">
                Găsește terenurile perfecte pentru tine
              </h2>
              <p className="text-zinc-600 mb-8">
                Caută după oraș pentru a vedea toate terenurile disponibile în zona ta
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ROMANIAN_CITIES.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      searchByCity(c);
                      window.history.pushState({}, '', `/search?city=${encodeURIComponent(c)}`);
                    }}
                    className="p-6 bg-white border-2 border-zinc-200 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-emerald-50 hover:border-blue-400 transition-all hover:shadow-professional-lg hover:-translate-y-1 transform group"
                  >
                    <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium text-sm">{c}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
