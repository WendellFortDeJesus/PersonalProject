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
  const authMethod = searchParams.get('authMethod') || 'RFID';
  const [selected, setSelected] = useState<string | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const handleSelect = async (id: string) => {
    if (!patronId || !db) return;
    setSelected(id);
    
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
        title: "Log Error",
        description: "Failed to record visit. Please notify staff.",
      });
    }
  };

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/library1/1920/1080";
  const overlayOpacity = settings?.overlayOpacity ?? 0.7;
  const textColor = settings?.welcomeTextColor === 'black' ? 'text-black' : 'text-white';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Library Background" 
          fill 
          className="object-cover"
          priority
          data-ai-hint="modern library"
        />
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
      </div>

      <div 
        className="relative z-10 w-full max-w-4xl space-y-8 animate-fade-in p-12 rounded-[3.5rem] border border-white/30 shadow-2xl"
        style={{ backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})`, backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute top-8 left-12">
          <div className="flex items-center gap-2">
            <Icons.Library className="h-6 w-6 text-primary" />
            <span className="font-headline font-bold text-primary text-sm tracking-widest uppercase">PatronPoint</span>
          </div>
        </div>

        <div className="text-center space-y-2 pt-8">
          <h1 className={cn("text-5xl font-headline font-bold tracking-tight", textColor)}>Identity Terminal</h1>
          <p className="text-xl text-slate-700 font-medium">Select your primary purpose of visit</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {(settings?.purposes || PURPOSES).map((purpose: any) => {
            const IconComponent = (Icons as any)[purpose.icon] || Icons.HelpCircle;
            return (
              <Button
                key={purpose.id}
                onClick={() => handleSelect(purpose.id)}
                variant="outline"
                className={`w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] h-44 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 border-2 bg-white/60 group ${
                  selected === purpose.id 
                    ? 'border-primary bg-white shadow-2xl ring-8 ring-primary/10' 
                    : 'border-white/50 hover:border-primary/30 hover:bg-white/90 hover:shadow-xl'
                }`}
              >
                <div className={`p-4 rounded-full transition-colors ${selected === purpose.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <span className={`text-lg font-bold uppercase tracking-tight ${selected === purpose.id ? 'text-primary' : 'text-slate-700'}`}>
                  {purpose.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            className="text-slate-600 font-bold hover:bg-white/20 px-8 py-6 rounded-2xl uppercase tracking-widest text-[10px]"
            onClick={() => router.push('/kiosk')}
          >
            Not you? Tap again
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PurposeSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading terminal...</div>}>
      <PurposeSelectionContent />
    </Suspense>
  );
}
