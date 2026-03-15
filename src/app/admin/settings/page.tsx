
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
import { Trash2, Palette, Settings2, ShieldAlert, Zap, Loader2, ShieldCheck, ToggleLeft, Smartphone, CreditCard } from 'lucide-react';

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

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#006837');
  const [newPurposeLabel, setNewPurposeLabel] = useState('');
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

  const handleAddDept = () => {
    if (!newDeptName || !newDeptCode || !settingsRef) return;
    
    const newDept = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDeptName.toUpperCase(),
      code: newDeptCode.toUpperCase(),
      isActive: true,
      color: newDeptColor
    };

    const updatedDepts = [...(settings?.departments || []), newDept];
    handleSaveSettings({ departments: updatedDepts });
    setNewDeptName('');
    setNewDeptCode('');
  };

  const handleAddPurpose = () => {
    if (!newPurposeLabel || !settingsRef) return;
    const newPurpose = {
      id: Math.random().toString(36).substr(2, 9),
      label: newPurposeLabel.toUpperCase(),
      icon: 'HelpCircle'
    };
    const updatedPurposes = [...(settings?.purposes || []), newPurpose];
    handleSaveSettings({ purposes: updatedPurposes });
    setNewPurposeLabel('');
  };

  const handlePurgeLiveVisitors = async () => {
    if (!db || !confirm("CRITICAL: This will permanently delete ALL visitor records from the dashboard. This action cannot be undone. Proceed?")) return;
    setIsResetting(true);
    
    try {
      const visitsRef = collection(db, 'visits');
      const snapshot = await getDocs(visitsRef);
      
      if (snapshot.empty) {
        setIsResetting(false);
        toast({ title: "System Ready", description: "No active occupancy records found to purge." });
        return;
      }

      // Execute real-time bulk deletion
      // We use Promise.all to ensure the local "Resetting" state stays active until the background queue is processed
      const deletePromises = snapshot.docs.map((docSnap) => 
        deleteDoc(docSnap.ref).catch(error => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docSnap.ref.path,
            operation: 'delete',
          }));
        })
      );

      await Promise.all(deletePromises);

      setIsResetting(false);
      toast({ title: "System Cleared", description: "All visitor information has been instantly deleted from the dashboard." });
    } catch (err) {
      console.error(err);
      setIsResetting(false);
      toast({ 
        variant: "destructive", 
        title: "Purge Failed", 
        description: "Communication with the identity hub failed." 
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
        <ShieldCheck className="h-6 w-6 text-primary" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Authentication Manager */}
        <Card className="lg:col-span-12 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <ToggleLeft className="h-4 w-4 text-primary" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Authentication Logic Manager</h2>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">Live Protocol Control</Badge>
          </div>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm"><CreditCard className="h-5 w-5 text-primary" /></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Allow RF-ID Login</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Physical Hardware Scanner Sync</p>
                </div>
              </div>
              <Switch checked={settings?.allowRfidScan ?? true} onCheckedChange={(v) => handleSaveSettings({ allowRfidScan: v })} />
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm"><Smartphone className="h-5 w-5 text-blue-500" /></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Allow SSO Login</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Manual Institutional Email Entry</p>
                </div>
              </div>
              <Switch checked={settings?.allowEmailLogin ?? true} onCheckedChange={(v) => handleSaveSettings({ allowEmailLogin: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Department Registry */}
        <Card className="lg:col-span-7 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Institutional Unit Registry</h2>
            </div>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Official Department Name</Label>
                <Input placeholder="COLLEGE OF INFORMATICS..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-12 rounded-xl text-xs font-bold uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Unit Code</Label>
                <Input placeholder="CICS" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-12 rounded-xl font-mono font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Theme Anchor</Label>
                <div className="flex gap-3">
                  <Input type="color" value={newDeptColor} onChange={(e) => setNewDeptColor(e.target.value)} className="h-12 w-16 p-1 rounded-xl cursor-pointer" />
                  <Button onClick={handleAddDept} className="flex-1 h-12 bg-primary font-black uppercase text-[10px] tracking-widest rounded-xl">Register Unit</Button>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
              <Table>
                <TableBody>
                  {settings?.departments?.map((dept: any) => (
                    <TableRow key={dept.id} className="group hover:bg-white transition-colors border-b last:border-0">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[8px] font-black text-white shadow-sm font-mono" style={{ backgroundColor: dept.color }}>{dept.code}</div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[200px]">{dept.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{dept.code} Unit</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-red-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Purpose Registry & Tools */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Intent Configuration</h2>
              <Settings2 className="h-4 w-4 text-slate-400" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Sanctioned Visit Purpose</Label>
                <div className="flex gap-3">
                  <Input placeholder="E.G., THESIS RESEARCH..." value={newPurposeLabel} onChange={(e) => setNewPurposeLabel(e.target.value)} className="h-12 rounded-xl text-[10px] font-bold uppercase" />
                  <Button onClick={handleAddPurpose} variant="outline" className="h-12 border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest rounded-xl px-6">Add</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {settings?.purposes?.map((p: any) => (
                  <Badge key={p.id} variant="secondary" className="bg-slate-100 text-[8px] font-black uppercase tracking-widest py-2 px-4 rounded-lg">
                    {p.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border-t-4 border-red-500">
            <div className="p-6 border-b bg-red-50/30 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-red-900 uppercase tracking-widest font-headline">Operational Maintenance</h2>
              <Zap className="h-4 w-4 text-red-500" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-red-900 uppercase">Emergency Reset</span>
                  <p className="text-[9px] font-bold text-red-600/60 uppercase">Clear all live visitors from terminal</p>
                </div>
                <Button 
                  onClick={handlePurgeLiveVisitors} 
                  disabled={isResetting}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                  {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Delete all visitor information from the dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
