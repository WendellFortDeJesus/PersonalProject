'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      {/* Background with soft overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/library-minimal/1920/1080"
          alt="Library Background"
          fill
          className="object-cover opacity-20 grayscale"
          priority
          data-ai-hint="clean library"
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-3">
          <Library className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="font-headline font-bold text-primary text-sm tracking-tight uppercase">PatronPoint</span>
            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">NEU Central Library</span>
          </div>
        </div>

        <Link href="/admin/login">
          <Button 
            variant="ghost" 
            className="text-slate-500 hover:text-primary hover:bg-white text-[10px] font-bold uppercase tracking-widest gap-2"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Staff
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-xl text-center space-y-12 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-5xl font-headline font-bold text-slate-900 tracking-tight leading-tight">
            Institutional <span className="text-primary">Gateway</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
            Welcome to the NEU Central Library. Please verify your identity to access our facilities and research resources.
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-slate-100 rounded-[2rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
            <Link href="/kiosk" className="block">
              <Button className="w-full h-16 text-sm font-bold uppercase tracking-widest gap-3 rounded-2xl bg-primary hover:bg-primary/90 transition-all shadow-none">
                <LogIn className="h-4 w-4" />
                Start Check-in
              </Button>
            </Link>
            
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                By entering, you agree to the library code of conduct.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-8 text-slate-300 text-[9px] font-bold uppercase tracking-widest">
        &copy; 2026 PatronPoint
      </footer>
    </div>
  );
}
