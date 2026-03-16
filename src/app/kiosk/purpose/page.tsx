"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
  const authMethod = searchParams.get('authMethod') || 'RF-ID Login';
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
    if (!patronId || !db || isSubmitting) return;
    setSelected(id);
    setIsSubmitting(true);
    
    try {
      const patronRef = doc(db, 'patrons', patronId);
      const patronSnap = await getDoc(patronRef).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'get',
        }));
        throw error;
      });
      
      if (!patronSnap.exists()) {
        throw new Error("Patron not found");
      }

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
        patronGender: patronData.gender || 'Unknown',
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
      console.error(err);
      toast({
        variant: "destructive",
        title: "Log Entry Error",
        description: "Protocol failure in recording visit. Notify system administrator.",
      });
      setIsSubmitting(false);
    }
  };

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/purpose-bg/1920/1080";
  const overlayOpacity = settings?.overlayOpacity ?? 0.8;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Purpose Background" 
          fill 
          className="object-cover scale-110"
          priority
          data-ai-hint="library bookshelves"
        />
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
      </div>

      <div 
        className="relative z-10 w-full max-w-5xl space-y-12 animate-fade-in p-16 rounded-[4rem] border border-white/30 shadow-[0_48px_80px_-16px_rgba(0,0,0,0.6)]"
        style={{ backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})`, backdropFilter: 'blur(40px)' }}
      >
        <div className="absolute top-10 left-16 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
                <Icons.Library className="h-5 w-5 text-white" />
            </div>
            <span className="font-headline font-black text-primary text-sm tracking-[0.4em] uppercase">PatronPoint</span>
        </div>

        <div className="text-center space-y-4 pt-4">
          <h1 className="text-6xl font-headline font-black text-primary tracking-tighter uppercase leading-none">Visit Intent</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Classify primary objective</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  "h-56 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 transition-all duration-500 border-2 bg-white/40 shadow-sm relative group overflow-hidden",
                  selected === purpose.id 
                    ? 'border-primary bg-white shadow-2xl ring-8 ring-primary/5 scale-[1.02]' 
                    : 'border-white hover:border-primary/40 hover:bg-white hover:shadow-2xl hover:scale-[1.02]'
                )}
              >
                <div className={cn(
                  "p-6 rounded-3xl transition-all duration-500",
                  selected === purpose.id ? 'bg-primary text-white scale-110' : 'bg-primary/5 text-primary group-hover:bg-primary/10 group-hover:rotate-6'
                )}>
                  {isPending ? <Icons.Loader2 className="h-10 w-10 animate-spin" /> : <IconComponent className="h-10 w-10" />}
                </div>
                <div className="text-center">
                  <span className={cn(
                    "text-xl font-headline font-black uppercase tracking-tight transition-colors",
                    selected === purpose.id ? 'text-primary' : 'text-slate-800'
                  )}>
                    {purpose.label}
                  </span>
                  <div className={cn(
                    "h-1 w-12 mx-auto mt-2 rounded-full transition-all duration-500",
                    selected === purpose.id ? 'bg-primary w-24' : 'bg-transparent'
                  )} />
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="flex flex-col items-center gap-4 pt-6">
          <Button 
            variant="ghost" 
            disabled={isSubmitting}
            className="text-slate-400 font-black hover:bg-black/5 px-10 h-14 rounded-2xl uppercase tracking-[0.4em] text-[10px] border border-transparent hover:border-slate-200 transition-all"
            onClick={() => router.push('/kiosk')}
          >
            Switch Profile Node
          </Button>
          <div className="flex gap-1">
             {[1,2,3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurposeSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-primary uppercase tracking-[0.5em]">Synchronising Hub...</div>}>
      <PurposeSelectionContent />
    </Suspense>
  );
}
