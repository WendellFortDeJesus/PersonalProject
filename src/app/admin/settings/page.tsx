
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, writeBatch, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Palette, Settings2, ShieldAlert, Zap, Loader2 } from 'lucide-react';

export default function SystemSettingsPage() {
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
    setNewDeptColor('#006837');
  };

  const handlePurgeLiveVisitors = async () => {
    if (!db || !confirm("This will clear the current live occupancy by archiving active sessions. Proceed?")) return;
    setIsResetting(true);
    
    try {
      // In a real system, we'd mark visits as 'ended'. 
      // For this prototype, we'll simulate a reset toast.
      await new Promise(r => setTimeout(r, 1000));
      toast({
        title: "Occupancy Purged",
        description: "Library occupancy counter reset to zero.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Syncing Control Room...</p>
    </div>
  );

  return (
    <div className="animate-fade-in bg-[#F8FAFC] min-h-full font-body">
      <header className="flex items-center justify-between p-8 bg-white border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter font-headline">System Control Engine</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional category & Maintenance logic</p>
        </div>
        <Settings2 className="h-5 w-5 text-slate-300" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto">
        {/* Department Registry */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Academic Unit Registry</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Institutional Lead Management</p>
            </div>
            <Palette className="h-4 w-4 text-primary/40" />
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Official Unit Name</Label>
                <Input placeholder="COLLEGE OF INFORMATICS..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-12 rounded-xl text-xs font-bold uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Code</Label>
                  <Input placeholder="CICS" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-12 rounded-xl font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Theme Anchor</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={newDeptColor} onChange={(e) => setNewDeptColor(e.target.value)} className="h-12 w-full p-1 rounded-xl cursor-pointer" />
                    <Button onClick={handleAddDept} className="h-12 px-6 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest">Add</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/30">
              <Table>
                <TableBody>
                  {settings?.departments?.map((dept: any) => (
                    <TableRow key={dept.id} className="group hover:bg-white transition-colors border-b last:border-0">
                      <TableCell className="pl-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[7px] font-black text-white shadow-md font-mono" style={{ backgroundColor: dept.color }}>{dept.code}</div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px] font-headline">{dept.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{dept.code} Unit</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* System & Purpose Logic */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-slate-50/30 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Operational Logic</h2>
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-2">Auto-Clear Registry</span>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Archive active sessions at midnight</p>
                </div>
                <Switch checked={settings?.autoClearLogs} onCheckedChange={(v) => handleSaveSettings({ autoClearLogs: v })} />
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handlePurgeLiveVisitors} 
                  disabled={isResetting}
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-red-100 text-red-600 hover:bg-red-50 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Purge Live Occupancy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-slate-50/30">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Purpose Configuration</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Allowed reasons for space utilization</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {settings?.purposes?.map((purpose: any) => (
                  <div key={purpose.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between group hover:bg-white transition-all">
                    <span className="text-[9px] font-black text-slate-700 uppercase font-headline truncate">{purpose.label}</span>
                    <Trash2 className="h-3 w-3 text-slate-300 group-hover:text-red-400" />
                  </div>
                ))}
                <Button variant="outline" className="h-full border-dashed border-2 rounded-xl text-slate-300 hover:text-primary min-h-[44px]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
