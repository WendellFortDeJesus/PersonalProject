
"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="p-12 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="max-w-md w-full p-12 border-none shadow-sm rounded-3xl bg-white text-center space-y-6">
        <ShieldAlert className="h-12 w-12 text-slate-200 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-xl font-headline font-black text-slate-900 uppercase tracking-tight">Module Unavailable</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The Control Room has been removed</p>
        </div>
      </Card>
    </div>
  );
}
