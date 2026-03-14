'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library } from 'lucide-react';
import Image from 'next/image';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const db = useFirestore();
  const [startOfToday, setStartOfToday] = useState<string | null>(null);

  // Sync the start of the day to ensure occupancy resets at midnight without refresh
  useEffect(() => {
    const updateStartOfToday = () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setStartOfToday(d.toISOString());
    };
    updateStartOfToday();
    
    // Check every minute if the date has changed to maintain livetime reset logic
    const interval = setInterval(updateStartOfToday, 60000);
    return () => clearInterval(interval);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !startOfToday) return null;
    return query(collection(db, 'visits'), where('timestamp', '>=', startOfToday));
  }, [db, startOfToday]);

  const { data: visits } = useCollection(visitsQuery);

  const occupancy = useMemo(() => {
    if (!visits) return 0;
    // Occupancy resets daily as it only filters visits from the current calendar day
    return visits.filter(v => v.status === 'granted').length;
  }, [visits]);

  const isAtCapacity = occupancy >= (settings?.capacityLimit || 200);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/library1/1920/1080"
          alt="Library Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-xl shadow-lg">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold tracking-tight">PatronPoint</h1>
          </div>
          <p className="text-xl text-white/90 font-body leading-relaxed">
            Welcome to the University Central Library. Please check-in to access our facilities and resources.
          </p>
          <div className="hidden md:block pt-4">
            <p className="text-lg font-medium text-white/80">Smart Visitor Management for NEU Library.</p>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur shadow-2xl border-none">
          <CardContent className="p-8 space-y-6">
            {/* Real-time Occupancy Badge */}
            <div className="flex justify-center -mb-2">
              <div className={cn(
                "px-5 py-2.5 rounded-2xl border flex flex-col items-center gap-0.5 shadow-sm transition-all duration-300",
                isAtCapacity ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/10"
              )}>
                 <div className="flex items-center gap-1.5">
                   <div className={cn("w-1.5 h-1.5 rounded-full", isAtCapacity ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                   <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">CURRENTLY IN THE LIBRARY</span>
                 </div>
                 <div className="text-2xl font-headline font-black text-primary leading-none">{occupancy}</div>
                 <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter">Active students on premises</span>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-headline font-bold text-primary">Ready to Start?</h2>
              <p className="text-muted-foreground">Choose your access mode below</p>
            </div>

            <div className="grid gap-4">
              <Link href="/kiosk" className="w-full">
                <Button className="w-full h-16 text-lg font-bold gap-3 rounded-xl kiosk-btn bg-primary hover:bg-primary/90">
                  <LogIn className="h-6 w-6" />
                  Visitor Check-in
                </Button>
              </Link>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Admin Access</span>
                </div>
              </div>

              <Link href="/admin/login" className="w-full">
                <Button variant="outline" className="w-full h-14 font-medium gap-3 rounded-xl border-secondary text-primary hover:bg-secondary/10">
                  <ShieldCheck className="h-5 w-5" />
                  Staff Dashboard
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-4">
              By checking in, you agree to our library terms of service.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-4 text-white/60 text-sm font-medium">
        &copy; 2026 PatronPoint Systems. All rights reserved.
      </footer>
    </div>
  );
}
