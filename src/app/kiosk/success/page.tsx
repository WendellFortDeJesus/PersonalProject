
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
  const [binaryBits, setBinaryBits] = useState<string[]>([]);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const timeout = (settings?.timeoutSeconds || 5) * 1000;
  const isBlocked = status === 'blocked';

  useEffect(() => {
    setBinaryBits(Array.from({ length: 48 }, () => Math.random() > 0.5 ? '1' : '0'));
    const timer = setTimeout(() => {
      router.push('/');
    }, timeout);
    return () => clearTimeout(timer);
  }, [router, timeout]);

  const handleManualContinue = () => {
    router.push('/');
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden no-scrollbar">
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

      <div className="relative z-10 w-full max-w-xl space-y-10 animate-fade-in text-center px-4">
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-[2rem] flex items-center justify-center mb-4 shadow-2xl backdrop-blur-3xl ring-1",
            isBlocked ? "bg-red-500/20 text-red-500 ring-red-500/30" : "bg-primary/20 text-primary ring-primary/30"
          )}>
            {isBlocked ? <ShieldAlert className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-white tracking-tight leading-none uppercase">
            {isBlocked ? "Access Restricted" : "Protocol Validated"}
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Institutional Registry Node
          </p>
        </div>

        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardContent className="p-12 space-y-8">
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-[2rem] bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
                <User className="h-12 w-12 text-primary/40" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tight">
                {name || "Identity Logged"}
              </h2>
              <div className="h-1 w-12 mx-auto bg-primary/20 rounded-full" />
              <p className="text-base font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
                {isBlocked 
                  ? "Security restriction detected. Please proceed to the library staff desk for manual clearance."
                  : "Your check-in has been successfully processed. You are cleared for facility entry."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-6">
          <Button 
            onClick={handleManualContinue}
            className="w-full h-18 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Continue to Gateway
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="animate-pulse">Redirecting in {Math.round(timeout / 1000)}s</span>
            <div className="h-1 w-1 bg-white/10 rounded-full" />
            <span>Secure Node Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Unwrap promises to satisfy Next.js 15 sync-dynamic-apis requirements
  use(props.params);
  use(props.searchParams);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1218] flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Updating Registry...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
