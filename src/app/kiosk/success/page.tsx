
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Building2, User } from 'lucide-react';
import Image from 'next/image';

export default function SuccessPage() {
  const router = useRouter();

  // Auto-reset after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[3rem]">
          <div className="h-4 bg-accent" />
          <CardContent className="p-0">
            {/* Success Banner */}
            <div className="bg-green-50 py-6 px-12 flex items-center justify-center gap-4 border-b">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <h2 className="text-3xl font-headline font-bold text-green-800">Welcome to NEU Library!</h2>
            </div>

            <div className="p-12 text-center space-y-10">
              {/* Visitor Photo Area */}
              <div className="flex justify-center">
                <div className="relative h-48 w-48 rounded-full border-8 border-slate-50 shadow-xl overflow-hidden bg-slate-100">
                  <Image 
                    src="https://picsum.photos/seed/alice/300/300" 
                    alt="Visitor Photo"
                    fill
                    className="object-cover"
                  />
                  {/* Fallback Icon if no image */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 -z-10">
                    <User className="h-20 w-20 text-slate-300" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Validated Visitor</p>
                  <h1 className="text-5xl font-headline font-bold text-primary">Alice Johnson</h1>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-6 py-3 bg-primary/5 rounded-2xl text-primary border border-primary/10">
                    <Building2 className="h-6 w-6" />
                    <span className="text-lg font-bold">College of Informatics and Computing Sciences</span>
                  </div>
                  <div className="px-4 py-1.5 bg-slate-100 rounded-full text-slate-600 text-sm font-bold border border-slate-200 uppercase">
                    Student
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-sm text-slate-500 font-medium">
                  Your visit has been recorded. Enjoy your study time!
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="text-xs text-muted-foreground ml-2">Resetting terminal...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
