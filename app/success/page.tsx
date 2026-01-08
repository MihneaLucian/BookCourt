import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Rezervare Confirmată!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-zinc-600">
            Rezervarea ta a fost creată cu succes. Vei primi un email de confirmare în curând.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/search" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Caută Alte Terenuri
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Acasă
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
