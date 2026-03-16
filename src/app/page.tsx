'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
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

      {/* Top Right Admin Access */}
      <div className="absolute top-6 right-6 z-20">
        <Link href="/admin/login">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 font-headline font-bold text-[10px] uppercase tracking-widest gap-2 px-4 py-2 border border-white/20 backdrop-blur-md rounded-xl"
          >
            <ShieldCheck className="h-4 w-4 text-accent" />
            Staff Terminal
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-xl shadow-lg">
              <Library className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold tracking-tight uppercase">PatronPoint</h1>
          </div>
          <p className="text-xl text-white/90 font-body leading-relaxed">
            Welcome to the University Central Library. Please check-in to access our facilities and resources.
          </p>
          <div className="hidden md:block pt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Smart Visitor Management • NEU Library</p>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur shadow-2xl border-none rounded-[2.5rem] overflow-hidden">
          <div className="h-2 bg-accent" />
          <CardContent className="p-10 space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-headline font-black text-primary uppercase tracking-tight">Identity Hub</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select your access mode</p>
            </div>

            <div className="grid gap-6">
              <Link href="/kiosk" className="w-full">
                <Button className="w-full h-20 text-xl font-headline font-black uppercase tracking-[0.2em] gap-4 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]">
                  <LogIn className="h-7 w-7" />
                  Visitor Check-in
                </Button>
              </Link>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                By checking in, you agree to comply with<br />Institutional Library Regulations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-4 text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">
        &copy; 2026 PatronPoint Strategic Systems
      </footer>
    </div>
  );
}
