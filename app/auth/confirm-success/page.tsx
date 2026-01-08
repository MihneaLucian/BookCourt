"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/search';

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, next]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Email Confirmat!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-zinc-600">
            Contul tău a fost confirmat cu succes. Ești acum conectat!
          </p>
          <p className="text-sm text-zinc-500">
            Te redirecționăm automat în câteva secunde...
          </p>
          <div className="pt-4">
            <Link href={next} className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continuă
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
