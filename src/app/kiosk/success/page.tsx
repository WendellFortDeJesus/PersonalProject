
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Library, Wifi, Coffee, BookOpen } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-xl animate-fade-in">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[2rem]">
          <div className="h-3 bg-accent" />
          <CardContent className="p-12 text-center space-y-8">
            <div className="flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <CheckCircle2 className="h-20 w-20 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-headline font-bold text-primary">Check-in Successful!</h1>
              <p className="text-xl text-muted-foreground">Welcome back, Alice Johnson</p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50">
                <Wifi className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-slate-500">Free WiFi</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50">
                <Coffee className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-slate-500">Study Cafe</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-slate-500">Quiet Zone</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary/80 leading-relaxed italic">
                "Knowledge is power. Information is liberating. Education is the premise of progress."
              </p>
            </div>

            <p className="text-sm text-muted-foreground">This screen will automatically return to home in 5 seconds.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
