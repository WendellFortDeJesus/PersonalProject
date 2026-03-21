"use client";

import { useEffect, Suspense } from 'react';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, timeout);
    return () => clearTimeout(timer);
  }, [router, timeout]);

  const handleManualContinue = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 font-body">
      <div className="w-full max-w-xl space-y-10 animate-fade-in text-center">
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mb-4 shadow-sm",
            isBlocked ? "bg-red-50 text-red-500 border border-red-100" : "bg-primary/5 text-primary border border-primary/10"
          )}>
            {isBlocked ? <ShieldAlert className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase">
            {isBlocked ? "Access Denied" : "Verified"}
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Institutional Registry Node
          </p>
        </div>

        <Card className="border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-12 space-y-8">
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                <User className="h-12 w-12 text-slate-200" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-headline font-black text-slate-800 uppercase tracking-tight">
                {name || "Identity Recorded"}
              </h2>
              <div className="h-1 w-12 mx-auto bg-primary/10 rounded-full" />
              <p className="text-sm font-bold text-slate-500 max-w-xs mx-auto leading-relaxed uppercase tracking-tight">
                {isBlocked 
                  ? "Security restriction detected. Please proceed to the library staff desk for further manual verification."
                  : "Your check-in has been successfully processed. You are cleared for entry into the facility."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-6">
          <Button 
            onClick={handleManualContinue}
            className="w-full h-16 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Continue to Gateway
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="text-slate-300 text-[8px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3">
            <span className="animate-pulse">Redirecting in {Math.round(timeout / 1000)}s</span>
            <div className="h-1 w-1 bg-slate-200 rounded-full" />
            <span>Secure Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Updating...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
