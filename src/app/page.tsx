
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
      {/* Background with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/campus/1920/1080"
          alt="University Campus"
          fill
          className="object-cover opacity-[0.1] grayscale"
          priority
          data-ai-hint="university campus"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/50" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-12 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/5 rounded-xl">
            <Library className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-primary text-sm tracking-tight uppercase leading-none">PatronPoint</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 leading-none">NEU Central Library</span>
          </div>
        </div>

        <Link href="/admin/login">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-primary hover:bg-slate-50 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl h-10 px-4"
          >
            <ShieldCheck className="h-4 w-4" />
            Terminal Access
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-lg text-center space-y-12 animate-fade-in">
        <div className="space-y-6">
          <div className="inline-block px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.5em]">Identity Registry Node Alpha</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-black text-slate-900 tracking-tighter leading-[0.9] uppercase">
            Strategic <br />
            <span className="text-primary">Gateway</span>
          </h1>
          <p className="text-slate-400 font-bold max-w-xs mx-auto leading-relaxed text-[10px] uppercase tracking-[0.2em]">
            Authorized Library Entrance <br />
            Please Initiate Identity Verification
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link href="/kiosk" className="w-full">
            <Button className="w-full h-20 text-[11px] font-black uppercase tracking-[0.3em] gap-4 rounded-3xl bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
              <LogIn className="h-5 w-5" />
              Start Check-in Process
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 w-full px-8 opacity-20">
            <div className="h-px bg-slate-900 flex-1" />
            <span className="text-[7px] font-black uppercase tracking-widest">Secure Handshake</span>
            <div className="h-px bg-slate-900 flex-1" />
          </div>
        </div>
      </div>
      
      <footer className="absolute bottom-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-8 opacity-30">
          <div className="h-1 w-1 bg-slate-900 rounded-full" />
          <div className="h-1 w-1 bg-slate-900 rounded-full" />
          <div className="h-1 w-1 bg-slate-900 rounded-full" />
        </div>
        <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.5em]">
          &copy; 2026 PatronPoint | Institutional Security
        </p>
      </footer>
    </div>
  );
}
