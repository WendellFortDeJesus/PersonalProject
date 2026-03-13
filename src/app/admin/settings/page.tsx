
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
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      isActive: true,
      color: '#006837'
    };

    const updatedDepts = [...(settings?.departments || []), newDept];
    handleSaveSettings({ departments: updatedDepts });
    setNewDeptName('');
    setNewDeptCode('');
    
    toast({
      title: "Settings Updated",
      description: `${newDept.code} added to registry.`,
    });
  };

  const handleRemoveDept = (deptId: string) => {
    if (!settingsRef || !settings?.departments) return;
    const updatedDepts = settings.departments.filter((d: any) => d.id !== deptId);
    handleSaveSettings({ departments: updatedDepts });
  };

  if (isLoading) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Initializing System Engine...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in fluid-container bg-white min-h-full">
      <header className="flex items-center justify-between p-10 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">System Settings</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration & operational rules</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t">
        {/* Academic Infrastructure (Left) */}
        <div className="lg:col-span-4 border-r p-10 space-y-10">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Registry</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Institutional Source of Truth</p>
          </div>

          <div className="space-y-4">
            <Input placeholder="College Name..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-12 rounded-xl text-xs font-bold uppercase border-slate-200" />
            <div className="flex gap-2">
              <Input placeholder="Code" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-12 rounded-xl font-mono font-bold border-slate-200" />
              <Button onClick={handleAddDept} disabled={!newDeptName || !newDeptCode} className="h-12 px-6 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest">Add</Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-xl">
            <Table>
              <TableBody>
                {settings?.departments?.map((dept: any) => (
                  <TableRow key={dept.id} className="group transition-colors border-b last:border-0">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[8px] font-black text-white font-mono" style={{ backgroundColor: dept.color || '#006837' }}>{dept.code}</div>
                        <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDept(dept.id)} className="opacity-0 group-hover:opacity-100 text-red-500 font-black uppercase text-[8px] tracking-widest">Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Branding & Terminal (Center) */}
        <div className="lg:col-span-5 border-r p-10 space-y-10">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Terminal Branding</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Visitor Experience Control</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Background Identity URL</Label>
              <Input 
                value={themeUrl} 
                onChange={(e) => setThemeUrl(e.target.value)} 
                onBlur={() => handleSaveSettings({ themeImageUrl: themeUrl })} 
                className="h-12 rounded-xl font-bold border-slate-200" 
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Overlay Opacity</Label>
                <span className="text-[10px] font-mono font-bold text-primary">{opacity}%</span>
              </div>
              <Slider 
                value={[opacity]} 
                max={100} 
                min={10} 
                step={1} 
                onValueChange={(v) => { setOpacity(v[0]); handleSaveSettings({ overlayOpacity: v[0]/100 }); }} 
              />
            </div>

            <div className="pt-8 border-t space-y-4">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Identity Enforcement</span>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Require Age Index on Registration</p>
                </div>
                <Switch checked={settings?.requireAge} onCheckedChange={(v) => handleSaveSettings({ requireAge: v })} />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Rules (Right) */}
        <div className="lg:col-span-3 p-10 space-y-10 bg-slate-50/50">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Operational Rules</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Capacity & Maintenance</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Maximum Seating Capacity</Label>
              <Input 
                type="number" 
                value={settings?.capacityLimit || 200} 
                onChange={(e) => handleSaveSettings({ capacityLimit: parseInt(e.target.value) })} 
                className="h-12 rounded-xl font-bold border-slate-200" 
              />
              <p className="text-[8px] font-bold text-slate-400 uppercase">Alerts staff when reached</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700 uppercase">Auto-Clear Logs</span>
                <Switch checked={settings?.autoClearLogs} onCheckedChange={(v) => handleSaveSettings({ autoClearLogs: v })} />
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Reset occupancy at end of day</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700 uppercase">Privacy Retention</span>
                <Switch checked={settings?.privacyMode} onCheckedChange={(v) => handleSaveSettings({ privacyMode: v })} />
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Anonymize logs after semester</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
