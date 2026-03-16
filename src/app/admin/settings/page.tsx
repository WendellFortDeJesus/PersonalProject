"use client";

import React, { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Palette, 
  Settings2, 
  ShieldAlert, 
  Zap, 
  Loader2, 
  ShieldCheck, 
  ToggleLeft, 
  Smartphone, 
  CreditCard,
  Lock,
  Database
} from 'lucide-react';

export default function SystemSettingsPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const db = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [isResetting, setIsResetting] = useState(false);

  const handleSaveSettings = async (updates: any) => {
    if (!settingsRef) return;
    const finalData = { ...settings, ...updates };
    setDoc(settingsRef, finalData, { merge: true }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsRef.path,
        operation: 'update',
        requestResourceData: finalData,
      }));
    });
  };

  const handlePurgeLiveVisitors = async () => {
    if (!db || !confirm("CRITICAL: This will permanently and instantly delete ALL visitor records from the dashboard. This action cannot be undone. Proceed?")) return;
    setIsResetting(true);
    
    try {
      const visitsRef = collection(db, 'visits');
      const snapshot = await getDocs(visitsRef);
      
      if (snapshot.empty) {
        setIsResetting(false);
        toast({ title: "System Ready", description: "No visitor records found to purge." });
        return;
      }

      // Use a batch for faster, more "instant" deletion
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit().catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'visits/purge',
          operation: 'delete',
        }));
      });

      setIsResetting(false);
      toast({ title: "Dashboard Cleared", description: "All information has been instantly deleted from the live dashboard." });
    } catch (err) {
      console.error(err);
      setIsResetting(false);
      toast({ 
        variant: "destructive", 
        title: "Purge Failed", 
        description: "Communication with the identity hub failed. Please check permissions." 
      });
    }
  };

  if (isLoading) return (
    <div className="p-32 text-center h-screen bg-white">
      <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="font-mono font-black text-primary uppercase tracking-[0.5em] text-[10px]">Loading Control Engine...</p>
    </div>
  );

  return (
    <div className="animate-fade-in bg-[#F8FAFC] min-h-full font-body p-8 space-y-8">
      <header className="flex items-center justify-between pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline">Control Room</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Engine & Maintenance Logic</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-4 py-1 rounded-full font-black text-[9px] tracking-widest uppercase">Institutional Governance</Badge>
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-12 border-none shadow-sm rounded-3xl bg-white overflow-hidden border-t-4 border-red-500">
          <div className="p-6 border-b bg-red-50/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-red-500" />
              <h2 className="text-[10px] font-black text-red-900 uppercase tracking-widest font-headline">Emergency Operations</h2>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="p-10 bg-red-50 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-2xl font-black text-red-900 uppercase tracking-tighter">Emergency Reset</span>
                <p className="text-[11px] font-bold text-red-600/70 uppercase tracking-widest leading-relaxed">Instantly and permanently delete all active visitor information from the dashboard.</p>
              </div>
              <Button 
                onClick={handlePurgeLiveVisitors} 
                disabled={isResetting}
                className="h-16 px-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 min-w-[320px]"
              >
                {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
                Delete all visitor information from the dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Security & Deletion Policy</h2>
            </div>
          </div>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm"><ShieldAlert className="h-5 w-5 text-primary" /></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Require Deletion Reason</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Enforce Audit Trail for purged records</p>
                </div>
              </div>
              <Switch checked={settings?.requireDeleteReason ?? true} onCheckedChange={(v) => handleSaveSettings({ requireDeleteReason: v })} />
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm"><Database className="h-5 w-5 text-blue-500" /></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Enable Hard Delete</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Permanently erase instead of Archiving</p>
                </div>
              </div>
              <Switch checked={settings?.hardDelete ?? false} onCheckedChange={(v) => handleSaveSettings({ hardDelete: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}