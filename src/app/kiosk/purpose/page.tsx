
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PURPOSES } from '@/lib/data';
import * as Icons from 'lucide-react';
import { useState } from 'react';

export default function PurposeSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    // Add a slight delay for visual feedback before navigating
    setTimeout(() => {
      router.push('/kiosk/success');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary">How can we help you today?</h1>
          <p className="text-xl text-muted-foreground">Select the primary purpose of your visit</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {PURPOSES.map((purpose) => {
            const IconComponent = (Icons as any)[purpose.icon] || Icons.HelpCircle;
            return (
              <Button
                key={purpose.id}
                onClick={() => handleSelect(purpose.id)}
                variant="outline"
                className={`h-48 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 border-2 bg-white ${
                  selected === purpose.id 
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                    : 'border-transparent hover:border-secondary hover:shadow-xl'
                }`}
              >
                <div className={`p-4 rounded-full ${selected === purpose.id ? 'bg-primary text-white' : 'bg-slate-100 text-primary'}`}>
                  <IconComponent className="h-10 w-10" />
                </div>
                <span className={`text-lg font-bold ${selected === purpose.id ? 'text-primary' : 'text-slate-700'}`}>
                  {purpose.label}
                </span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="link" 
            className="text-muted-foreground"
            onClick={() => router.push('/kiosk')}
          >
            Cancel and go back
          </Button>
        </div>
      </div>
    </div>
  );
}
