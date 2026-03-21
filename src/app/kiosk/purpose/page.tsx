"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PURPOSES } from '@/lib/data';
import * as Icons from 'lucide-react';
import { useState, Suspense } from 'react';
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
  const db = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

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
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 font-body">
      <div className="w-full max-w-4xl space-y-12 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-primary self-start"
            onClick={() => router.push('/kiosk')}
          >
            <Icons.ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight">Visit Intent</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              {isNew ? "Step 1: Select your primary activity" : "Select your primary activity"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(settings?.purposes || PURPOSES).map((purpose: any) => {
            const IconComponent = (Icons as any)[purpose.icon] || Icons.HelpCircle;
            const isPending = selected === purpose.id && isSubmitting;

            return (
              <Button
                key={purpose.id}
                disabled={isSubmitting}
                onClick={() => handleSelect(purpose.id)}
                variant="outline"
                className={cn(
                  "h-48 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-slate-100 bg-white shadow-none group",
                  selected === purpose.id ? 'border-primary ring-2 ring-primary/10' : 'hover:border-primary/20'
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl transition-colors",
                  selected === purpose.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-primary'
                )}>
                  {isPending ? <Icons.Loader2 className="h-6 w-6 animate-spin" /> : <IconComponent className="h-7 w-7" />}
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  selected === purpose.id ? 'text-primary' : 'text-slate-600'
                )}>
                  {purpose.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-300 font-black uppercase tracking-[0.4em] text-[8px] hover:text-primary transition-colors"
            onClick={() => router.push('/kiosk')}
          >
            Switch Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PurposeSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing...</div>}>
      <PurposeSelectionContent />
    </Suspense>
  );
}