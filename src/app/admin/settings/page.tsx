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
import { Trash2, Plus, Palette, Settings2, Info } from 'lucide-react';

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
      <header className="flex items-center justify-between p-8 bg-white border-b">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">System Configuration</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accreditation & Operational Logic</p>
        </div>
        <Settings2 className="h-5 w-5 text-slate-300" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8">
        {/* Category Management (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-xl">
            <div className="p-6 border-b bg-white">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Academic Infrastructure
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Manage Colleges & Color Branding</p>
            </div>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Full Institutional Name</Label>
                  <Input placeholder="COLLEGE OF INFORMATICS..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-10 rounded-lg text-xs font-bold uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Code</Label>
                    <Input placeholder="CICS" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-10 rounded-lg font-mono font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Visual Anchor</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newDeptColor} onChange={(e) => setNewDeptColor(e.target.value)} className="h-10 w-full p-1 rounded-lg cursor-pointer" />
                      <Button onClick={handleAddDept} disabled={!newDeptName || !newDeptCode} className="h-10 px-6 rounded-lg bg-primary font-black uppercase text-[10px] tracking-widest">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto border rounded-xl overflow-hidden">
                <Table className="high-density-table">
                  <TableBody>
                    {settings?.departments?.map((dept: any) => (
                      <TableRow key={dept.id} className="group hover:bg-slate-50 transition-colors border-b last:border-0">
                        <TableCell className="pl-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded flex items-center justify-center text-[7px] font-black text-white font-mono shadow-inner" style={{ backgroundColor: dept.color || '#006837' }}>{dept.code}</div>
                            <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[200px]">{dept.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
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

        {/* Operational Logic (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Terminal Branding</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Visitor Experience Context</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Environmental Backdrop URL</Label>
                  <Input 
                    value={themeUrl} 
                    onChange={(e) => setThemeUrl(e.target.value)} 
                    onBlur={() => handleSaveSettings({ themeImageUrl: themeUrl })} 
                    className="h-10 rounded-lg text-[10px] font-bold border-slate-200" 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Visual Overlay Intensity</Label>
                    <span className="text-[10px] font-mono font-bold text-primary">{opacity}%</span>
                  </div>
                  <Slider 
                    value={[opacity]} 
                    max={100} 
                    min={0} 
                    step={1} 
                    onValueChange={(v) => { setOpacity(v[0]); handleSaveSettings({ overlayOpacity: v[0]/100 }); }} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
              <div className="p-6 border-b">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Operational Rules</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Density & Privacy Management</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Maximum Safe Capacity</Label>
                  <Input 
                    type="number" 
                    value={settings?.capacityLimit || 200} 
                    onChange={(e) => handleSaveSettings({ capacityLimit: parseInt(e.target.value) })} 
                    className="h-10 rounded-lg font-bold border-slate-200" 
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-700 uppercase">Identity Verification</span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Require Age Index</p>
                    </div>
                    <Switch checked={settings?.requireAge} onCheckedChange={(v) => handleSaveSettings({ requireAge: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-700 uppercase">Auto-Clear Registry</span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Reset daily presence</p>
                    </div>
                    <Switch checked={settings?.autoClearLogs} onCheckedChange={(v) => handleSaveSettings({ autoClearLogs: v })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Institutional Purpose List</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Defines allowed reasons for facility entry</p>
              </div>
              <Info className="h-4 w-4 text-slate-300" />
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {settings?.purposes?.map((purpose: any) => (
                  <div key={purpose.id} className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between group">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{purpose.label}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-300 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="h-full border-dashed border-2 rounded-xl text-slate-400 hover:text-primary hover:border-primary py-4 flex flex-col gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Define New Purpose</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}