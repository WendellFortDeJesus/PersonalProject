"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, User, ShieldAlert, AlertCircle, ShieldCheck } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const status = searchParams.get('status');
  const blockedName = searchParams.get('name');
  const regName = searchParams.get('name');

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const timeout = (settings?.timeoutSeconds || 4) * 1000;
  const isBlocked = status === 'blocked';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, timeout);
    return () => clearTimeout(timer);
  }, [router, timeout]);

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-6 transition-all duration-700", 
      isBlocked ? "bg-red-600/90" : "bg-primary"
    )}>
      <div className="w-full max-w-3xl animate-fade-in relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
            <div className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white",
                isBlocked ? "bg-red-700" : "bg-accent"
            )}>
                {isBlocked ? <ShieldAlert className="h-10 w-10 text-white" /> : <ShieldCheck className="h-10 w-10 text-primary" />}
            </div>
        </div>

        <Card className="shadow-[0_64px_96px_-24px_rgba(0,0,0,0.6)] overflow-hidden border-none rounded-[4rem] bg-white">
          <CardContent className="p-0">
            <div className={cn(
                "pt-20 pb-10 px-16 text-center border-b space-y-2", 
                isBlocked ? "bg-red-50" : "bg-slate-50"
            )}>
              <h2 className={cn("text-4xl font-headline font-black uppercase tracking-tighter", isBlocked ? "text-red-700" : "text-primary")}>
                {isBlocked ? "Identity Restricted" : "Clearance Granted"}
              </h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">NEU Central Library Hub</p>
            </div>

            <div className="p-16 text-center space-y-12">
              <div className="flex justify-center">
                <div className={cn(
                    "relative h-64 w-64 rounded-[4rem] border-8 shadow-2xl overflow-hidden flex items-center justify-center group transition-transform duration-700 hover:scale-105", 
                    isBlocked ? "border-red-100 bg-red-50/50" : "border-slate-100 bg-slate-50"
                )}>
                    <User className={cn("h-32 w-32 transition-all duration-700", isBlocked ? "text-red-200" : "text-slate-200")} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className={cn("text-6xl font-headline font-black uppercase tracking-tighter", isBlocked ? "text-red-800" : "text-primary")}>
                    {regName || blockedName || "Guest Identification"}
                  </h1>
                  <div className="h-1.5 w-32 mx-auto bg-slate-100 rounded-full overflow-hidden">
                     <div className={cn("h-full w-2/3 rounded-full animate-marquee", isBlocked ? "bg-red-400" : "bg-accent")} />
                  </div>
                </div>
                
                {isBlocked ? (
                   <div className="flex flex-col items-center gap-6 p-12 bg-red-600 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    <div className="relative z-10 flex flex-col items-center gap-4 text-white text-center">
                      <AlertCircle className="h-12 w-12" />
                      <span className="text-3xl font-headline font-black uppercase tracking-tighter">Manual Audit Required</span>
                      <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] max-w-xs leading-relaxed">
                        Security mismatch detected. Please report to the Administrator Desk immediately.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-6">
                        <div className="px-10 py-4 bg-primary/5 border border-primary/10 rounded-2xl">
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Node Registry Verified</p>
                        </div>
                        <div className="px-10 py-4 bg-accent/10 border border-accent/20 rounded-2xl">
                           <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Audit Entry Logged</p>
                        </div>
                    </div>
                    <p className="text-xl text-slate-400 font-bold uppercase tracking-tight">
                        Identity confirmed. Enjoy institutional resources.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-12 border-t border-slate-100">
                <div className="flex flex-col items-center gap-5">
                    <div className="flex gap-2">
                        {[1,2,3,4].map(i => (
                            <div key={i} className={cn(
                                "h-2 w-2 rounded-full animate-bounce", 
                                isBlocked ? "bg-red-400" : "bg-primary",
                                i === 2 && "[animation-delay:0.2s]",
                                i === 3 && "[animation-delay:0.4s]",
                                i === 4 && "[animation-delay:0.6s]"
                            )} />
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Terminal Auto-Reset Active</span>
                </div>
              </div>
            </div>
          </CardContent>
          <div className={cn("h-4", isBlocked ? "bg-red-800" : "bg-accent")} />
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary flex items-center justify-center font-black text-white uppercase tracking-[0.5em] animate-pulse">Authenticating Identity...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
