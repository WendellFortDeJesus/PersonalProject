
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Wifi, Coffee, BookOpen, GraduationCap, Building2 } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 6000);
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
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl font-headline font-bold text-primary">Check-in Successful!</h1>
                <p className="text-xl text-slate-700 font-bold">Welcome, Alice Johnson</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
                  <Building2 className="h-4 w-4" />
                  College of Engineering
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Wifi className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Free WiFi</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Coffee className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Study Cafe</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Quiet Zone</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary/80 leading-relaxed italic">
                "Knowledge is power. Information is liberating. Education is the premise of progress."
              </p>
            </div>

            <p className="text-xs text-muted-foreground pt-4">Returning to home screen in a few seconds...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
