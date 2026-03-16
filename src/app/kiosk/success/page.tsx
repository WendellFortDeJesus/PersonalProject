"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { User, ShieldAlert, ShieldCheck } from 'lucide-react';
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

  const timeout = (settings?.timeoutSeconds || 3) * 1000;
  const isBlocked = status === 'blocked';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, timeout);
    return () => clearTimeout(timer);
  }, [router, timeout]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 font-body">
      <div className="w-full max-w-xl space-y-10 animate-fade-in text-center">
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mb-4",
            isBlocked ? "bg-red-50 text-red-500" : "bg-primary/5 text-primary"
          )}>
            {isBlocked ? <ShieldAlert className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight leading-none uppercase">
            {isBlocked ? "Access Denied" : "Success"}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Institutional Registry Node
          </p>
        </div>

        <Card className="border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-12 space-y-8">
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <User className="h-12 w-12 text-slate-200" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-headline font-bold text-slate-800 uppercase tracking-tight">
                {name || "Identity Verified"}
              </h2>
              <div className="h-1 w-12 mx-auto bg-slate-100 rounded-full" />
              <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                {isBlocked 
                  ? "Security restriction detected. Please proceed to the library staff desk for further manual verification."
                  : "Your check-in has been recorded. You are cleared for entry into the facility."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-slate-300 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-3">
          <span className="animate-pulse">Redirecting to hub</span>
          <div className="h-1 w-1 bg-slate-200 rounded-full" />
          <span>Please wait</span>
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
