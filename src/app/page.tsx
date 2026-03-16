
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, ShieldCheck, Library } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      {/* Background with subtle overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/campus/1920/1080"
          alt="University Campus Background"
          fill
          className="object-cover opacity-[0.15] grayscale"
          priority
          data-ai-hint="university campus"
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-10 z-20">
        <div className="flex items-center gap-3">
          <Library className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="font-headline font-bold text-primary text-sm tracking-tight uppercase">PatronPoint</span>
            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">NEU Central Library</span>
          </div>
        </div>

        <Link href="/admin/login">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-primary hover:bg-transparent text-[9px] font-black uppercase tracking-widest gap-2"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Authorized Personnel
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-lg text-center space-y-16 animate-fade-in">
        <div className="space-y-6">
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase">
            Institutional <br />
            <span className="text-primary">Registry Gateway</span>
          </h1>
          <div className="h-0.5 w-12 bg-primary/20 mx-auto" />
          <p className="text-slate-400 font-bold max-w-xs mx-auto leading-relaxed text-[10px] uppercase tracking-widest">
            Identity Verification Required <br />
            Access Node Alpha
          </p>
        </div>

        <Card className="bg-transparent border-none shadow-none overflow-hidden">
          <CardContent className="p-0">
            <Link href="/kiosk" className="block">
              <Button className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] gap-3 rounded-none bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/10">
                <LogIn className="h-4 w-4" />
                Initiate Check-in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <footer className="absolute bottom-8 text-slate-300 text-[8px] font-black uppercase tracking-[0.4em]">
        &copy; 2026 PatronPoint Secure Node
      </footer>
    </div>
  );
}
