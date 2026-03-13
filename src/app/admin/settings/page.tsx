
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Palette, Settings2, ShieldAlert, Zap } from 'lucide-react';

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
  const [themeUrl, setThemeUrl] = useState('');
  const [opacity, setOpacity] = useState(70);

  useEffect(() => {
    if (settings) {
      setThemeUrl(settings.themeImageUrl || '');
      setOpacity((settings.overlayOpacity || 0.7) * 100);
    }
  }, [settings]);

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
    
    toast({
      title: "Academic Registry Updated",
      description: `${newDept.code} added to institutional source of truth.`,
    });
  };

  const handleRemoveDept = (deptId: string) => {
    if (!settingsRef || !settings?.departments) return;
    const updatedDepts = settings.departments.filter((d: any) => d.id !== deptId);
    handleSaveSettings({ departments: updatedDepts });
  };

  if (isLoading) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Synchronizing Control Room...</p>
    </div>
  );

  return (
    <div className="animate-fade-in bg-[#F8FAFC] min-h-full font-body">
      <header className="flex items-center justify-between p-8 bg-white border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter font-headline">Institutional Control Room</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accreditation Logic & Category Management</p>
        </div>
        <Settings2 className="h-5 w-5 text-slate-300" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8">
        {/* Department Registry (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 font-headline">
                  <Palette className="h-4 w-4 text-primary" />
                  Academic Registry
                </h2>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Manage Colleges & Visual Branding</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Full Institutional Name</Label>
                  <Input placeholder="COLLEGE OF INFORMATICS..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-11 rounded-xl text-xs font-bold uppercase border-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Code</Label>
                    <Input placeholder="CICS" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-11 rounded-xl font-mono font-bold border-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Visual Anchor (Hex)</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newDeptColor} onChange={(e) => setNewDeptColor(e.target.value)} className="h-11 w-full p-1 rounded-xl cursor-pointer bg-slate-50 border-none" />
                      <Button onClick={handleAddDept} disabled={!newDeptName || !newDeptCode} className="h-11 px-6 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-[1.25rem] overflow-hidden bg-slate-50/30">
                <Table>
                  <TableBody>
                    {settings?.departments?.map((dept: any) => (
                      <TableRow key={dept.id} className="group hover:bg-white transition-colors border-b last:border-0">
                        <TableCell className="pl-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[8px] font-black text-white font-mono shadow-md" style={{ backgroundColor: dept.color || '#006837' }}>{dept.code}</div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[180px] font-headline">{dept.name}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{dept.code} UNIT</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveDept(dept.id)} className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50 p-0 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Logic (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[1.5rem] overflow-hidden bg-white">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Operational Rules</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Privacy & Maintenance Logic</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase flex items-center gap-2">
                      <Zap className="h-3 w-3 text-accent" />
                      Auto-Clear Registry
                    </span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Reset current occupancy at midnight</p>
                  </div>
                  <Switch checked={settings?.autoClearLogs} onCheckedChange={(v) => handleSaveSettings({ autoClearLogs: v })} />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Library Seating Capacity</Label>
                    <span className="text-[10px] font-mono font-bold text-primary">{settings?.capacityLimit || 200} SEATS</span>
                  </div>
                  <Input 
                    type="number" 
                    value={settings?.capacityLimit || 200} 
                    onChange={(e) => handleSaveSettings({ capacityLimit: parseInt(e.target.value) })} 
                    className="h-11 rounded-xl font-bold border-slate-100 bg-slate-50/50" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[1.5rem] overflow-hidden bg-white">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Identity Standards</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Data Quality Management</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-700 uppercase">Identity Indexing</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Require Age Indexing</p>
                  </div>
                  <Switch checked={settings?.requireAge} onCheckedChange={(v) => handleSaveSettings({ requireAge: v })} />
                </div>
                <div className="pt-4 border-t border-slate-50 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    <p className="text-[8px] font-black text-red-600 uppercase leading-relaxed">
                      Restricting "Purpose" input ensures 100% accurate human behavior metrics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[1.5rem] overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-50">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Institutional Purpose configuration</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Defines sanctioned activities for space utilization</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {settings?.purposes?.map((purpose: any) => (
                  <div key={purpose.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-primary/20 transition-all">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight font-headline">{purpose.label}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-300 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="h-full border-dashed border-2 rounded-2xl text-slate-300 hover:text-primary hover:border-primary/30 py-6 flex flex-col gap-2 transition-all">
                  <Plus className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Define Activity</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
