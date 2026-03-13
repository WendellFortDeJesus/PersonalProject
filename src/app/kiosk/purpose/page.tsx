"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PURPOSES } from '@/lib/data';
import * as Icons from 'lucide-react';
import { useState, Suspense } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function PurposeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patronId = searchParams.get('patronId');
  const [selected, setSelected] = useState<string | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const handleSelect = async (id: string) => {
    if (!patronId) return;
    setSelected(id);
    
    try {
      // 1. Fetch Patron details
      const patronRef = doc(db, 'patrons', patronId);
      const patronSnap = await getDoc(patronRef);
      
      if (!patronSnap.exists()) {
        throw new Error("Patron not found");
      }

      const patronData = patronSnap.data();
      const purposeLabel = PURPOSES.find(p => p.id === id)?.label || "Other";

      // 2. Log Visit
      const visitsRef = collection(db, 'visits');
      await addDoc(visitsRef, {
        patronId,
        schoolId: patronData.schoolId,
        patronName: patronData.name,
        patronDepartments: patronData.departments,
        patronAge: patronData.age,
        patronGender: patronData.gender,
        purpose: purposeLabel,
        timestamp: new Date().toISOString(),
        status: "granted"
      });

      router.push(`/kiosk/success?patronId=${patronId}&purposeId=${id}`);
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Log Error",
        description: "Failed to record visit. Please notify staff.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary">Fast-Track Check-in</h1>
          <p className="text-xl text-muted-foreground">Select today's primary purpose of visit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PURPOSES.map((purpose) => {
            const IconComponent = (Icons as any)[purpose.icon] || Icons.HelpCircle;
            return (
              <Button
                key={purpose.id}
                onClick={() => handleSelect(purpose.id)}
                variant="outline"
                className={`h-40 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-300 border-2 bg-white group ${
                  selected === purpose.id 
                    ? 'border-primary bg-primary/5 ring-8 ring-primary/10' 
                    : 'border-slate-100 hover:border-primary/30 hover:shadow-2xl'
                }`}
              >
                <div className={`p-4 rounded-full transition-colors ${selected === purpose.id ? 'bg-primary text-white' : 'bg-slate-100 text-primary group-hover:bg-primary/10'}`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <span className={`text-xl font-bold ${selected === purpose.id ? 'text-primary' : 'text-slate-700'}`}>
                  {purpose.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="link" 
            className="text-muted-foreground font-semibold"
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