'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library, Globe, Fingerprint } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white">
      {/* Background Image with Layered Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/library-high/1920/1080"
          alt="Library Background"
          fill
          className="object-cover scale-105"
          priority
          data-ai-hint="luxury library"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-black/60 backdrop-blur-[4px]" />
      </div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
            <Library className="h-6 w-6 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-white text-xl tracking-tighter uppercase leading-none">PatronPoint</span>
            <span className="text-[8px] font-black text-accent uppercase tracking-[0.4em] mt-1">NEU Central Library</span>
          </div>
        </div>

        <Link href="/admin/login">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 font-headline font-black text-[10px] uppercase tracking-widest gap-2 px-5 h-11 border border-white/20 backdrop-blur-md rounded-2xl transition-all hover:scale-105"
          >
            <ShieldCheck className="h-4 w-4 text-accent" />
            Staff Terminal
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center">
        <div className="text-white space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.6em]">Authorized Access Only</h2>
            <h1 className="text-6xl md:text-7xl font-headline font-black leading-[0.9] tracking-tighter uppercase">
              Institutional <br />
              <span className="text-accent">Gateway</span>
            </h1>
          </div>
          <p className="text-xl text-white/70 font-body leading-relaxed max-w-md">
            The NEU Central Library provides advanced research resources. Please verify your identity to access the facility.
          </p>
          
          <div className="flex items-center gap-8 pt-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">Network Secure</span>
              </div>
              <div className="h-1 w-24 bg-accent/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-accent animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest">Biometric Ready</span>
              </div>
              <div className="h-1 w-24 bg-accent/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-accent" />
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-none rounded-[3.5rem] overflow-hidden transform transition-all hover:scale-[1.01]">
          <div className="h-3 bg-accent" />
          <CardContent className="p-14 space-y-12">
            <div className="space-y-3 text-center">
              <h2 className="text-4xl font-headline font-black text-primary uppercase tracking-tight">Identity Hub</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Select Verification Protocol</p>
            </div>

            <div className="space-y-4">
              <Link href="/kiosk" className="w-full">
                <Button className="w-full h-24 text-2xl font-headline font-black uppercase tracking-[0.2em] gap-6 rounded-[2rem] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/95 transition-all active:scale-[0.98] group">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                    <LogIn className="h-8 w-8 text-accent" />
                  </div>
                  Visitor Check-in
                </Button>
              </Link>
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Institutional Notice</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 text-center uppercase leading-relaxed tracking-wider">
                  By checking in, you agree to the library data <br /> 
                  privacy policy and institutional code of conduct.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-8 flex items-center gap-4 text-white/30 text-[9px] font-black uppercase tracking-[0.5em]">
        <span>&copy; 2026 PatronPoint Strategic</span>
        <div className="w-1 h-1 bg-white/20 rounded-full" />
        <span>V 4.0.2 ALPHA</span>
      </footer>
    </div>
  );
}
