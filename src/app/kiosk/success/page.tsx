
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, User, ShieldAlert, AlertCircle } from 'lucide-react';
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

  const timeout = (settings?.timeoutSeconds || 3) * 1000;
  const isBlocked = status === 'blocked';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, timeout);
    return () => clearTimeout(timer);
  }, [router, timeout]);

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 transition-colors duration-500", isBlocked ? "bg-red-600" : "bg-primary")}>
      <div className="w-full max-w-2xl animate-fade-in">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[3.5rem] bg-white">
          <div className={cn("h-4", isBlocked ? "bg-red-700" : "bg-accent")} />
          <CardContent className="p-0">
            <div className={cn("py-8 px-12 flex items-center justify-center gap-4 border-b", isBlocked ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}>
              {isBlocked ? (
                <ShieldAlert className="h-10 w-10 text-red-600" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              )}
              <h2 className="text-3xl font-headline font-bold">
                {isBlocked ? "Access Restricted" : "Welcome to NEU Library!"}
              </h2>
            </div>

            <div className="p-14 text-center space-y-12">
              <div className="flex justify-center">
                <div className={cn("relative h-56 w-56 rounded-full border-8 shadow-2xl overflow-hidden flex items-center justify-center", isBlocked ? "border-red-50 bg-red-50" : "border-slate-50 bg-slate-100")}>
                  <div className="flex flex-col items-center gap-2">
                    {isBlocked ? (
                      <User className="h-24 w-24 text-red-200" />
                    ) : (
                      <User className="h-24 w-24 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className={cn("text-xs font-bold uppercase tracking-[0.3em]", isBlocked ? "text-red-400" : "text-slate-400")}>
                    {isBlocked ? "Institutional Notification" : "Validated Visitor"}
                  </p>
                  <h1 className={cn("text-5xl font-headline font-bold uppercase tracking-tight", isBlocked ? "text-red-700" : "text-primary")}>
                    {regName || blockedName || "Guest User"}
                  </h1>
                </div>
                
                {isBlocked ? (
                   <div className="flex flex-col items-center gap-6 p-10 bg-red-50 rounded-[3rem] border border-red-100 shadow-inner">
                    <div className="flex items-center gap-3 text-red-800 text-center">
                      <AlertCircle className="h-10 w-10" />
                      <span className="text-2xl font-black uppercase tracking-tight">Please proceed to the Admin Desk</span>
                    </div>
                    <p className="text-sm font-bold text-red-600/80 uppercase tracking-widest">
                      Manual verification is required for this identity
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="px-8 py-3 bg-slate-100 rounded-full text-slate-500 text-[10px] font-black border border-slate-200 uppercase tracking-[0.3em]">
                      Registry Entry Verified
                    </div>
                  </div>
                )}
              </div>

              {!isBlocked && (
                <div className="pt-10 border-t border-slate-100">
                  <p className="text-lg text-slate-400 font-bold uppercase tracking-tight">
                    Visit logged. Enjoy your stay!
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full animate-bounce", isBlocked ? "bg-red-300" : "bg-primary")} />
                  <div className={cn("h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.15s]", isBlocked ? "bg-red-200" : "bg-primary/60")} />
                  <div className={cn("h-2.5 w-2.5 rounded-full animate-bounce [animation-delay:-0.3s]", isBlocked ? "bg-red-100" : "bg-primary/30")} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Auto-Resetting Terminal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary flex items-center justify-center font-black text-white uppercase tracking-widest">Validating Registry...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
