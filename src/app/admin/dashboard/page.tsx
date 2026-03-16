
"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-12 flex items-center justify-center min-h-[calc(100vh-10rem)] animate-fade-in">
      <Card className="max-w-md w-full p-12 border-none shadow-2xl rounded-[3rem] bg-white text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-6 bg-primary/5 rounded-full relative">
            <ShieldCheck className="h-16 w-16 text-primary" />
            <div className="absolute top-0 right-0 h-4 w-4 bg-green-500 rounded-full border-4 border-white animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Terminal Active</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Secure Session</p>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connection</span>
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Node ID</span>
            <span className="text-[9px] font-mono font-bold text-slate-900 uppercase">NEU-LIB-01</span>
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
          The administrative modules have been decommissioned. You are currently in a secure monitoring state.
        </p>
      </Card>
    </div>
  );
}
