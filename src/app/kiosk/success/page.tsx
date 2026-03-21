
"use client";

import { useEffect, Suspense, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const status = searchParams.get('status');
  const patronId = searchParams.get('patronId');
  const nameParam = searchParams.get('name');
  
  // Fetch patron data to get Department/College info
  const patronRef = useMemoFirebase(() => {
    if (!db || !patronId) return null;
    return doc(db, 'patrons', patronId);
  }, [db, patronId]);
  const { data: patron, isLoading: isPatronLoading } = useDoc(patronRef);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const timeout = (settings?.timeoutSeconds || 5) * 1000;
  const isBlocked = status === 'blocked';
  const isAdmin = status === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }, isAdmin ? 8000 : timeout);
    return () => clearTimeout(timer);
  }, [router, timeout, isAdmin]);

  const handleManualContinue = () => {
    if (isAdmin) {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  const displayName = patron?.name || nameParam || (isAdmin ? "JOSEPH CAESAR ESPERANZA" : "PATRON IDENTITY");
  const collegeName = patron?.departments?.[0] || (isAdmin ? "Institutional Administration" : "");

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 w-full max-w-2xl space-y-8 animate-fade-in text-center px-6">
        {/* Verification Icon */}
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl backdrop-blur-3xl ring-1 transition-all duration-700",
            isAdmin ? "bg-primary/20 text-accent ring-accent/40 animate-pulse" : 
            isBlocked ? "bg-red-500/20 text-red-500 ring-red-500/30" : "bg-[#355872]/20 text-[#7AAACE] ring-[#355872]/40"
          )}>
            {isBlocked ? <ShieldAlert className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>
        </div>

        {/* System Title */}
        <div className="space-y-2">
          <h1 className="text-5xl font-headline font-black text-white tracking-tighter uppercase leading-none">
            {isBlocked ? "ACCESS RESTRICTED" : "PROTOCOL VALIDATED"}
          </h1>
          <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.5em]">
            INSTITUTIONAL REGISTRY NODE
          </p>
        </div>

        {/* Main Identity Container */}
        <Card className="border-none shadow-[0_0_100px_rgba(0,0,0,0.6)] rounded-[3.5rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardContent className="p-16 space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-headline font-black text-white uppercase tracking-tight leading-tight">
                {displayName}
              </h2>
              
              <div className="space-y-2">
                {collegeName && (
                  <p className="text-sm font-bold text-[#7AAACE] uppercase tracking-widest">
                    College: {collegeName}
                  </p>
                )}
                
                <p className="text-slate-400 font-medium text-sm">
                  {isBlocked 
                    ? "Security restriction detected. Please proceed to the library staff desk for manual clearance."
                    : "Your check-in has been successfully processed."
                  }
                </p>
              </div>

              {!isBlocked && (
                <div className="pt-6">
                  <p className="text-2xl font-headline font-black text-primary uppercase tracking-tighter">
                    Welcome to NEU Library!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Control */}
        <div className="w-full max-w-md mx-auto">
          <Button 
            onClick={handleManualContinue}
            className={cn(
              "w-full h-14 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] group",
              isAdmin ? "bg-accent hover:bg-accent/90 shadow-accent/20" : "bg-[#355872] hover:bg-[#355872]/90 shadow-[#355872]/20"
            )}
          >
            {isAdmin ? "ENTER COMMAND CENTER" : "CONTINUE TO GATEWAY"}
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Auto-sync indicator */}
        <div className="pt-4 flex items-center justify-center gap-2 opacity-20">
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Auto-syncing session node...</span>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage(props: { params: Promise<any>, searchParams: Promise<any> }) {
  use(props.params);
  use(props.searchParams);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1218] flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Updating Registry...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
