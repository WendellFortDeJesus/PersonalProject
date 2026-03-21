
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
    setBinaryBits(Array.from({ length: 48 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  const handleSelect = async (id: string) => {
    if (isSubmitting) return;
    setSelected(id);

    if (isNew) {
      const params = new URLSearchParams();
      params.set('purposeId', id);
      params.set('authMethod', authMethod);
      if (initialEmail) params.set('email', initialEmail);
      if (initialSchoolId) params.set('schoolId', initialSchoolId);
      router.push(`/kiosk/register?${params.toString()}`);
      return;
    }

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
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
            {bit}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-6xl space-y-12 animate-fade-in px-8">
        <div className="flex flex-col items-center gap-8">
          <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-500 hover:text-red-400 font-bold text-sm h-12 self-start px-6 border border-white/5 bg-white/5 rounded-2xl transition-all hover:bg-red-500/10 hover:border-red-500/20"
            onClick={() => router.push('/kiosk')}
          >
            <Icons.ArrowLeft className="mr-3 h-4 w-4" />
            Abort Identity Protocol
          </Button>
          
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-headline font-black text-white tracking-tighter uppercase leading-none">IDENTITY INTENT</h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              {isNew ? "Node Registration: Select primary node activity" : "Verification Step: Select node activity"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  "h-64 rounded-[3rem] flex flex-col items-center justify-center gap-6 transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-3xl ring-1 ring-white/10 group overflow-hidden hover:scale-[1.05] hover:brightness-110 shadow-lg",
                  isActive 
                    ? 'ring-primary/60 bg-primary/20 shadow-[0_0_50px_rgba(53,88,114,0.4)] scale-[1.05] border-primary/40' 
                    : 'hover:bg-white/10 hover:ring-white/30'
                )}
              >
                <div className={cn(
                  "p-8 rounded-[2rem] transition-all duration-500 shadow-xl relative",
                  isActive 
                    ? 'bg-primary text-white scale-110 shadow-[0_0_30px_rgba(53,88,114,0.6)]' 
                    : 'bg-black/40 text-slate-500 group-hover:text-primary group-hover:bg-primary/10'
                )}>
                  {/* Subtle Background Icon Glow */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {isPending ? <Icons.Loader2 className="h-16 w-16 animate-spin" /> : <IconComponent className="h-16 w-16 relative z-10" />}
                </div>
                <div className="text-center space-y-2">
                  <span className={cn(
                    "block text-xl font-bold transition-colors",
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}>
                    {purpose.label}
                  </span>
                  <div className={cn(
                    "h-1 w-8 mx-auto rounded-full transition-all duration-500",
                    isActive ? "bg-primary w-20" : "bg-transparent group-hover:bg-primary/40 group-hover:w-16"
                  )} />
                  <span className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    Initialize Protocol
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="flex flex-col items-center gap-6 pt-12 border-t border-white/10">
           <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-xs font-bold text-slate-600 hover:text-primary transition-all hover:tracking-widest group"
            onClick={() => router.push('/kiosk')}
          >
            Relinquish Identity Focus
          </Button>
           <div className="flex items-center gap-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
              <span className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">Identity Segment Node Alpha Active</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
           </div>
        </div>
      </div>
    </div>
  );
}

export default function PurposeSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B1218] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Segment Node...</div>}>
      <PurposeSelectionContent />
    </Suspense>
  );
}
