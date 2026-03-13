"use client";

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Building2, User, ShieldAlert, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { MOCK_PATRONS } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const patronId = searchParams.get('patronId');
  const blockedName = searchParams.get('name');
  
  // Registration data
  const regName = searchParams.get('name');
  const regDepts = useMemo(() => {
    const deptsRaw = searchParams.get('departments');
    if (deptsRaw) {
      try {
        return JSON.parse(deptsRaw);
      } catch {
        return [];
      }
    }
    return null;
  }, [searchParams]);

  const patron = MOCK_PATRONS.find(p => p.id === patronId);
  const isBlocked = status === 'blocked';

  const displayName = patron?.name || regName || blockedName || "Guest User";
  const displayDepts = patron?.departments || regDepts || ["General Access"];

  // Auto-reset after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", isBlocked ? "bg-red-600" : "bg-primary")}>
      <div className="w-full max-w-2xl animate-fade-in">
        <Card className="shadow-2xl overflow-hidden border-none rounded-[3.5rem] bg-white">
          <div className={cn("h-4", isBlocked ? "bg-red-700" : "bg-accent")} />
          <CardContent className="p-0">
            {/* Header Banner */}
            <div className={cn("py-8 px-12 flex items-center justify-center gap-4 border-b", isBlocked ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800")}>
              {isBlocked ? (
                <ShieldAlert className="h-10 w-10 text-red-600" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              )}
              <h2 className="text-3xl font-headline font-bold">
                {isBlocked ? "Restricted Access" : "Welcome to NEU Library!"}
              </h2>
            </div>

            <div className="p-14 text-center space-y-12">
              {/* Visitor Photo Area */}
              <div className="flex justify-center">
                <div className={cn("relative h-56 w-56 rounded-full border-8 shadow-2xl overflow-hidden flex items-center justify-center", isBlocked ? "border-red-50 bg-red-50" : "border-slate-50 bg-slate-100")}>
                  {patron?.photoUrl && !isBlocked ? (
                    <Image 
                      src={patron.photoUrl} 
                      alt="Visitor Photo"
                      fill
                      className="object-cover"
                      data-ai-hint="patron portrait"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {isBlocked ? (
                        <User className="h-24 w-24 text-red-200" />
                      ) : (
                        <User className="h-24 w-24 text-slate-300" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className={cn("text-xs font-bold uppercase tracking-[0.3em]", isBlocked ? "text-red-400" : "text-slate-400")}>
                    {isBlocked ? "System Notification" : "Validated Visitor"}
                  </p>
                  <h1 className={cn("text-5xl font-headline font-bold", isBlocked ? "text-red-700" : "text-primary")}>
                    {displayName}
                  </h1>
                </div>
                
                {isBlocked ? (
                   <div className="flex flex-col items-center gap-6 p-8 bg-red-50 rounded-[2.5rem] border border-red-100">
                    <div className="flex items-center gap-3 text-red-800">
                      <AlertCircle className="h-8 w-8" />
                      <span className="text-2xl font-bold">Please see the library help desk</span>
                    </div>
                    <p className="text-sm font-medium text-red-600/80">
                      Your access credentials require administrative review before entry.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {displayDepts.map((dept, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-6 py-3 bg-primary/5 rounded-full text-primary border border-primary/10 shadow-sm">
                          <Building2 className="h-5 w-5" />
                          <span className="text-base font-bold">{dept}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-2 bg-slate-100 rounded-full text-slate-500 text-xs font-bold border border-slate-200 uppercase tracking-widest">
                      {patron?.role || "Patron"}
                    </div>
                  </div>
                )}
              </div>

              {!isBlocked && (
                <div className="pt-10 border-t border-slate-100">
                  <p className="text-lg text-slate-400 font-medium">
                    Session recorded successfully. Enjoy your study time!
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <div className={cn("h-2 w-2 rounded-full animate-bounce", isBlocked ? "bg-red-300" : "bg-primary")} />
                  <div className={cn("h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s]", isBlocked ? "bg-red-200" : "bg-primary/60")} />
                  <div className={cn("h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]", isBlocked ? "bg-red-100" : "bg-primary/30")} />
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Terminal Resetting</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
