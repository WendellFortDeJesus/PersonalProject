
"use client";

import { useEffect, Suspense, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldAlert, ShieldCheck, ChevronRight } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const status = searchParams.get('status');
  const name = searchParams.get('name');
  
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

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      <div className="relative z-10 w-full max-w-xl space-y-10 animate-fade-in text-center px-4">
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl backdrop-blur-3xl ring-1",
            isAdmin ? "bg-accent/20 text-accent ring-accent/40 animate-pulse" : 
            isBlocked ? "bg-red-500/20 text-red-500 ring-red-500/30" : "bg-primary/20 text-primary ring-primary/30"
          )}>
            {isBlocked ? <ShieldAlert className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-white tracking-tight uppercase">
            {isAdmin ? "Welcome, Master Admin" : isBlocked ? "Access Restricted" : "Protocol Validated"}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            {isAdmin ? "Institutional Command Center" : "Institutional Registry Node"}
          </p>
        </div>

        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardContent className="p-12 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">
                {name || (isAdmin ? "CHIEF LIBRARIAN" : "Identity Logged")}
              </h2>
              <p className="text-base font-medium text-slate-400 max-w-xs mx-auto">
                {isAdmin 
                  ? "Welcome back, Chief Librarian. System node is ready for administrative synchronization."
                  : isBlocked 
                  ? "Security restriction detected. Please proceed to the library staff desk for manual clearance."
                  : "Your check-in has been successfully processed."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleManualContinue}
          className={cn(
            "w-full h-18 rounded-2xl text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3",
            isAdmin ? "bg-accent hover:bg-accent/90 shadow-accent/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
          )}
        >
          {isAdmin ? "Enter Command Center" : "Continue to Gateway"}
          <ChevronRight className="h-4 w-4" />
        </Button>
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
