"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PURPOSES } from '@/lib/data';
import * as Icons from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function PurposeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patronId = searchParams.get('patronId');
  const isNew = searchParams.get('isNew') === 'true';
  const authMethod = searchParams.get('authMethod') || 'RF-ID Login';
  const initialEmail = searchParams.get('email');
  const initialSchoolId = searchParams.get('schoolId');

  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [binaryBits, setBinaryBits] = useState<string[]>([]);
  const db = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    // Generate random binary bits for background decoration
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  const handleSelect = async (id: string) => {
    if (isSubmitting) return;
    setSelected(id);

    // Flow for NEW users: Redirect to Registration with the selected purpose
    if (isNew) {
      const params = new URLSearchParams();
      params.set('purposeId', id);
      params.set('authMethod', authMethod);
      if (initialEmail) params.set('email', initialEmail);
      if (initialSchoolId) params.set('schoolId', initialSchoolId);
      router.push(`/kiosk/register?${params.toString()}`);
      return;
    }

    // Flow for RETURNING users: Submit visit directly
    if (!patronId || !db) return;
    setIsSubmitting(true);
    
    try {
      const patronRef = doc(db, 'patrons', patronId);
      const patronSnap = await getDoc(patronRef);
      if (!patronSnap.exists()) throw new Error("Patron not found");

      const patronData = patronSnap.data();
      const currentPurposes = settings?.purposes || PURPOSES;
      const purposeLabel = currentPurposes.find((p: any) => p.id === id)?.label || "Other";

      const visitData = {
        patronId,
        schoolId: patronData.schoolId,
        patronEmail: patronData.email,
        authMethod: authMethod,
        patronName: patronData.name.toUpperCase(),
        patronDepartments: patronData.departments,
        patronAge: patronData.age,
        patronRole: patronData.role || 'Student',
        purpose: purposeLabel,
        timestamp: new Date().toISOString(),
        status: "granted"
      };

      await addDoc(collection(db, 'visits'), visitData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'visits',
          operation: 'create',
          requestResourceData: visitData,
        }));
        throw error;
      });

      router.push(`/kiosk/success?patronId=${patronId}&purposeId=${id}&name=${encodeURIComponent(patronData.name)}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Log Entry Error",
        description: "Failed to record visit. Please try again.",
      });
      setIsSubmitting(false);
    }
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

      <div className="relative z-10 w-full max-w-5xl space-y-12 animate-fade-in px-6">
        <div className="flex flex-col items-center gap-6">
          <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-500 hover:text-white font-black uppercase tracking-[0.4em] text-[9px] h-auto self-start px-0 transition-colors"
            onClick={() => router.push('/kiosk')}
          >
            <Icons.ArrowLeft className="mr-2 h-3 w-3" />
            Abort Identity Protocol
          </Button>
          
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-headline font-black text-white tracking-tighter uppercase leading-none">Identity Intent</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
              {isNew ? "Node Registration: Select Primary Node Activity" : "Verification Step: Select Node Activity"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(settings?.purposes || PURPOSES).map((purpose: any) => {
            const IconComponent = (Icons as any)[purpose.icon] || Icons.HelpCircle;
            const isActive = selected === purpose.id;
            const isPending = isActive && isSubmitting;

            return (
              <Button
                key={purpose.id}
                disabled={isSubmitting}
                onClick={() => handleSelect(purpose.id)}
                variant="outline"
                className={cn(
                  "h-56 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 transition-all duration-300 border-white/5 bg-white/5 backdrop-blur-3xl ring-1 ring-white/10 group overflow-hidden",
                  isActive ? 'ring-primary/40 bg-primary/10 shadow-[0_0_40px_rgba(53,88,114,0.3)]' : 'hover:bg-white/10 hover:ring-white/20'
                )}
              >
                <div className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  isActive ? 'bg-primary text-white scale-110' : 'bg-black/40 text-slate-500 group-hover:text-primary'
                )}>
                  {isPending ? <Icons.Loader2 className="h-7 w-7 animate-spin" /> : <IconComponent className="h-8 w-8" />}
                </div>
                <div className="text-center space-y-1">
                  <span className={cn(
                    "block text-xs font-black uppercase tracking-widest transition-colors",
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}>
                    {purpose.label}
                  </span>
                  <span className="block text-[8px] font-bold text-slate-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    Initialize Segment
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="flex flex-col items-center gap-4 pt-8 border-t border-white/5">
           <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-500 hover:text-primary font-black uppercase tracking-[0.4em] text-[9px] transition-colors"
            onClick={() => router.push('/kiosk')}
          >
            Relinquish Identity Focus
          </Button>
           <span className="text-[7px] font-black text-primary/40 uppercase tracking-[0.4em]">Node Segment Isolation Active</span>
        </div>
      </div>
    </div>
  );
}

export default function PurposeSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B1218] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Segment...</div>}>
      <PurposeSelectionContent />
    </Suspense>
  );
}
