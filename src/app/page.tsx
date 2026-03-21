'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, Library, User, ArrowLeft, Shield, Circle, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [binaryBits, setBinaryBits] = useState<string[]>([]);

  useEffect(() => {
    // Generate binary decoration bits only on client to prevent hydration mismatch
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      {/* Floating Binary Bits Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {binaryBits.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>

      {/* Header with Protocol Progress */}
      <header className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-12 z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/20 rounded-xl ring-1 ring-primary/40 shadow-[0_0_20px_rgba(53,88,114,0.3)]">
            <Library className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-white text-sm tracking-tight uppercase leading-none">PatronPoint</span>
            <span className="text-[8px] font-black text-primary/50 uppercase tracking-[0.4em] mt-1.5 leading-none">NEU Central Library</span>
          </div>
        </div>

        {/* Node Progress Concept */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full", !showRoleSelection ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-white/10")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", !showRoleSelection ? "text-white" : "text-white/20")}>Gateway</span>
          </div>
          <div className="w-8 h-px bg-white/5" />
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full", showRoleSelection ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-white/10")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", showRoleSelection ? "text-white" : "text-white/20")}>Node Select</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 w-full max-w-4xl text-center space-y-16 animate-fade-in px-8">
        {!showRoleSelection ? (
          <div className="space-y-16">
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.5em]">Identity Registry Node Alpha</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-headline font-black text-white tracking-tighter leading-[0.85] uppercase">
                Strategic <br />
                <span className="text-primary drop-shadow-[0_0_30px_rgba(53,88,114,0.5)]">Gateway</span>
              </h1>
              <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed text-[10px] uppercase tracking-[0.3em]">
                Authorized Library Entrance Protocol <br />
                Initialize Identity Verification to Proceed
              </p>
            </div>

            <div className="flex flex-col items-center gap-8">
              <Button 
                onClick={() => setShowRoleSelection(true)}
                className="w-full max-w-md h-24 text-base font-bold gap-6 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white transition-all shadow-[0_0_40px_rgba(53,88,114,0.4)] hover:scale-[1.02] active:scale-[0.98] group"
              >
                <LogIn className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                Start Check-in Process
              </Button>
              
              <div className="flex items-center gap-6 w-full max-w-md px-8 opacity-20">
                <div className="h-px bg-white flex-1" />
                <span className="text-[7px] font-black uppercase tracking-widest text-white">Secure Protocol Handshake</span>
                <div className="h-px bg-white flex-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-4xl font-headline font-black text-white tracking-tighter uppercase">Identify Your Node</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Select your institutional profile to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link href="/kiosk" className="group">
                <div className="h-72 p-10 bg-white/5 border border-white/10 rounded-[4rem] flex flex-col items-center justify-center gap-8 transition-all duration-500 backdrop-blur-3xl hover:bg-white/10 hover:border-primary/40 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(53,88,114,0.3)] group-active:scale-[0.98] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-8 bg-black/40 rounded-[2.5rem] text-slate-500 transition-all duration-500 group-hover:bg-primary group-hover:text-white shadow-inner relative z-10">
                    <User className="h-12 w-12" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <p className="text-xl font-bold text-white">Student / Patron</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Terminal Access</p>
                  </div>
                  <div className="h-1 w-0 bg-primary absolute bottom-0 left-1/2 -translate-x-1/2 group-hover:w-full transition-all duration-700" />
                </div>
              </Link>

              <Link href="/admin/login" className="group">
                <div className="h-72 p-10 bg-white/5 border border-white/10 rounded-[4rem] flex flex-col items-center justify-center gap-8 transition-all duration-500 backdrop-blur-3xl hover:bg-white/10 hover:border-primary/40 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(53,88,114,0.3)] group-active:scale-[0.98] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="p-8 bg-black/40 rounded-[2.5rem] text-slate-500 transition-all duration-500 group-hover:bg-primary group-hover:text-white shadow-inner relative z-10">
                    <Shield className="h-12 w-12" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <p className="text-xl font-bold text-white">Staff / Admin</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff Terminal Access</p>
                  </div>
                  <div className="h-1 w-0 bg-primary absolute bottom-0 left-1/2 -translate-x-1/2 group-hover:w-full transition-all duration-700" />
                </div>
              </Link>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setShowRoleSelection(false)}
              className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest gap-4 py-8 px-12 rounded-[2rem] hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Gateway
            </Button>
          </div>
        )}
      </div>
      
      <footer className="absolute bottom-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-10 opacity-10">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="flex items-center gap-3">
          <Orbit className="h-3 w-3 text-primary animate-spin-slow" />
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.4em]">
            Institutional Security System Alpha-01
          </p>
        </div>
      </footer>
      
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
