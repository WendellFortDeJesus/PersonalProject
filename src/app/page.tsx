'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, ShieldCheck, Library, User, ArrowLeft, Shield } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-white overflow-hidden font-body">
      {/* Background with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/campus/1920/1080"
          alt="University Campus"
          fill
          className="object-cover opacity-[0.05] grayscale"
          priority
          data-ai-hint="university campus"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
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
      </div>

      <div className="relative z-10 w-full max-w-xl text-center space-y-12 animate-fade-in">
        {!showRoleSelection ? (
          <div className="space-y-12">
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
              <Button 
                onClick={() => setShowRoleSelection(true)}
                className="w-full h-20 text-[11px] font-black uppercase tracking-[0.3em] gap-4 rounded-3xl bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/10 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="h-5 w-5" />
                Start Check-in Process
              </Button>
              
              <div className="flex items-center gap-4 w-full px-8 opacity-10">
                <div className="h-px bg-slate-900 flex-1" />
                <span className="text-[7px] font-black uppercase tracking-widest">Secure Handshake</span>
                <div className="h-px bg-slate-900 flex-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-3xl font-headline font-black text-slate-900 tracking-tighter uppercase">Identify Your Node</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Select your institutional profile to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/kiosk" className="group">
                <div className="h-56 p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/5 group-active:scale-[0.98]">
                  <div className="p-5 bg-primary/5 rounded-2xl text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <User className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Student / Patron</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Public Terminal Access</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin/login" className="group">
                <div className="h-56 p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/5 group-active:scale-[0.98]">
                  <div className="p-5 bg-slate-50 rounded-2xl text-slate-400 transition-colors group-hover:bg-primary group-hover:text-white">
                    <Shield className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">Staff / Admin</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Staff Terminal Access</p>
                  </div>
                </div>
              </Link>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setShowRoleSelection(false)}
              className="text-slate-400 hover:text-primary font-black text-[9px] uppercase tracking-widest gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Gateway
            </Button>
          </div>
        )}
      </div>
      
      <footer className="absolute bottom-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-8 opacity-20">
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
