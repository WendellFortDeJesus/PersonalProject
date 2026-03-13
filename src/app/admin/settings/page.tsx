
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredDepts = settings?.departments?.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Initializing System Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in fluid-container">
      <div className="flex items-center justify-between h-32 bg-slate-900 border-none shadow-2xl p-10 rounded-[2rem]">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Settings</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Configuration and data logic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Academic Infrastructure */}
        <div className="lg:col-span-4 bg-white border rounded-[2rem] flex flex-col h-[700px] p-0 overflow-hidden shadow-sm">
          <div className="p-10 bg-slate-50 border-b space-y-6">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Academic Registry</h2>
            <div className="space-y-4">
              <Input placeholder="College Name..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-12 rounded-xl text-xs font-bold uppercase" />
              <div className="flex gap-2">
                <Input placeholder="Code" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-12 rounded-xl font-mono font-bold" />
                <Button onClick={handleAddDept} disabled={!newDeptName || !newDeptCode} className="h-12 px-6 rounded-xl bg-primary font-black uppercase text-[10px]">Add</Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableBody>
                {filteredDepts?.map((dept: any) => (
                  <TableRow key={dept.id} className="group transition-colors">
                    <TableCell className="pl-10">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[9px] font-black text-white font-mono" style={{ backgroundColor: dept.color || '#006837' }}>{dept.code}</div>
                        <span className="text-[11px] font-black text-slate-700 uppercase truncate max-w-[150px]">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDept(dept.id)} className="opacity-0 group-hover:opacity-100 text-red-500 font-black uppercase text-[9px]">Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Branding */}
        <div className="lg:col-span-5 bg-white border rounded-[2rem] p-10 shadow-sm">
          <h2 className="text-xl font-black text-primary uppercase tracking-tighter mb-10">Branding</h2>
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-slate-400">Background URL</Label>
              <Input value={themeUrl} onChange={(e) => setThemeUrl(e.target.value)} onBlur={() => handleSaveSettings({ themeImageUrl: themeUrl })} className="h-12 rounded-xl font-bold" />
            </div>
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-slate-400">Overlay Opacity: {opacity}%</Label>
              <Slider value={[opacity]} max={100} min={10} step={1} onValueChange={(v) => { setOpacity(v[0]); handleSaveSettings({ overlayOpacity: v[0]/100 }); }} />
            </div>
            <div className="pt-10 border-t space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enforce Accuracy</p>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-black text-slate-700 uppercase">Require Age Input</span>
                <Switch checked={settings?.requireAge} onCheckedChange={(v) => handleSaveSettings({ requireAge: v })} />
              </div>
            </div>
          </div>
        </div>

        {/* System Variables */}
        <div className="lg:col-span-3 bg-slate-50 border rounded-[2rem] p-10">
          <h2 className="text-xl font-black text-primary uppercase tracking-tighter mb-10">Rules</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Visitor Target</Label>
              <Input type="number" value={settings?.dailyEngagementTarget} onChange={(e) => handleSaveSettings({ dailyEngagementTarget: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Kiosk Timeout (Sec)</Label>
              <Input type="number" value={settings?.timeoutSeconds} onChange={(e) => handleSaveSettings({ timeoutSeconds: parseInt(e.target.value) })} className="h-12 rounded-xl font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
