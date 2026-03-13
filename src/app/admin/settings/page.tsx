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
import { cn } from '@/lib/utils';
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
      title: "Registry Updated",
      description: `${newDept.code} has been added to the system.`,
    });
  };

  const handleRemoveDept = (deptId: string) => {
    if (!settingsRef || !settings?.departments) return;
    const updatedDepts = settings.departments.filter((d: any) => d.id !== deptId);
    handleSaveSettings({ departments: updatedDepts });
    
    toast({
      title: "Registry Updated",
      description: "Academic unit has been removed from the registry.",
    });
  };

  const filteredDepts = settings?.departments?.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-32 text-center font-black text-primary/40 uppercase tracking-widest animate-pulse">Initializing Command Center...</div>;

  return (
    <div className="space-y-8 pb-16 animate-fade-in fluid-container">
      {/* Header Panel */}
      <div className="bento-tile flex items-center justify-between h-32 bg-slate-900 border-none shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Engine Room</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global schema logic and aesthetic synchronization</p>
        </div>
        <div className="flex items-center gap-6">
          <Badge className="h-10 px-6 rounded-2xl bg-primary/20 text-primary border-primary/20 font-black uppercase text-[10px] tracking-widest">
            Core Synchronized
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Section A: Academic Infrastructure (Left Pane) */}
        <div className="lg:col-span-4 bento-tile flex flex-col h-[800px] p-0 overflow-hidden shadow-2xl">
          <div className="p-10 bg-slate-50 border-b space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Academic Registry</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input placeholder="College Identity Name..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-14 rounded-2xl border-slate-200 font-bold uppercase text-xs" />
                <div className="flex gap-4">
                  <Input placeholder="Short Code" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-14 rounded-2xl border-slate-200 font-mono font-bold" />
                  <Button onClick={handleAddDept} disabled={!newDeptName || !newDeptCode} className="h-14 px-8 rounded-2xl bg-primary shadow-lg font-black uppercase text-[10px] tracking-widest">Add</Button>
                </div>
              </div>
              <div className="relative">
                <Input 
                  placeholder="Filter Registry..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 rounded-2xl bg-white border-slate-100 text-[11px] font-bold uppercase"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="bg-white sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Identity</TableHead>
                  <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right pr-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepts?.map((dept: any) => (
                  <TableRow key={dept.id} className="zebra-row group">
                    <TableCell className="pl-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-[10px] font-black text-white shadow-lg" style={{ backgroundColor: dept.color || '#006837' }}>{dept.code}</div>
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter leading-tight max-w-[180px]">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveDept(dept.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 font-black uppercase text-[9px] tracking-widest"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Section B: Terminal Logic & Branding (Center Pane) */}
        <div className="lg:col-span-5 bento-tile flex flex-col h-[800px] shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Terminal Customization</h2>
          </div>
          
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Background Asset Pipeline</Label>
              <div className="flex gap-3">
                <Input value={themeUrl} onChange={(e) => setThemeUrl(e.target.value)} className="h-14 rounded-2xl border-slate-200 font-bold" />
                <Button onClick={() => handleSaveSettings({ themeImageUrl: themeUrl })} className="bg-primary h-14 px-10 rounded-2xl shadow-xl transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest">
                  Save
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Overlay Density Matrix</Label>
                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-4 py-1 rounded-full">{opacity}%</span>
              </div>
              <Slider 
                value={[opacity]} max={100} min={10} step={1} 
                onValueChange={(val) => { setOpacity(val[0]); handleSaveSettings({ overlayOpacity: val[0] / 100 }); }} 
              />
            </div>

            <div className="pt-10 border-t space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Live Terminal Preview</h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary">Dynamic Twin</Badge>
              </div>
              <div className="relative aspect-video rounded-[3rem] overflow-hidden border-[6px] border-slate-100 shadow-2xl group transition-transform hover:scale-[1.02]">
                <img src={themeUrl} className="object-cover w-full h-full" alt="Terminal Preview" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div 
                    className="w-full h-full rounded-[2.5rem] shadow-2xl border border-white/40 flex flex-col items-center justify-center gap-4"
                    style={{ backgroundColor: `rgba(255, 255, 255, ${opacity/100})`, backdropFilter: 'blur(16px)' }}
                  >
                     <div className="h-12 w-32 bg-primary/10 rounded-2xl animate-pulse" />
                     <div className="h-6 w-48 bg-slate-200/50 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section C: System Audit & Access (Right Pane) */}
        <div className="lg:col-span-3 bento-tile flex flex-col h-[800px] bg-slate-50 border-none shadow-inner p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">System Variables</h2>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 border-slate-200">Schema Validation</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-slate-100 transition-all hover:border-primary/20">
                  <span className="text-[11px] font-black text-slate-700 uppercase">Enforce Age Index</span>
                  <Switch checked={settings?.requireAge} onCheckedChange={(val) => handleSaveSettings({ requireAge: val })} />
                </div>
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-slate-100 transition-all hover:border-primary/20">
                  <span className="text-[11px] font-black text-slate-700 uppercase">Require Gender Identity</span>
                  <Switch checked={settings?.requireGender} onCheckedChange={(val) => handleSaveSettings({ requireGender: val })} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4 border-slate-200">Institutional Targets</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Daily Engagement Target</Label>
                  <Input type="number" value={settings?.dailyEngagementTarget || 50} onChange={(e) => handleSaveSettings({ dailyEngagementTarget: parseInt(e.target.value) })} className="h-14 rounded-2xl bg-white border-none font-mono font-bold text-lg shadow-inner text-primary" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Timeout (Seconds)</Label>
                  <Input type="number" value={settings?.timeoutSeconds || 3} onChange={(e) => handleSaveSettings({ timeoutSeconds: parseInt(e.target.value) })} className="h-14 rounded-2xl bg-white border-none font-mono font-bold text-lg shadow-inner text-primary" />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10 border-t border-slate-200">
               <Button variant="ghost" className="w-full h-16 rounded-2xl bg-white border border-slate-200 font-black uppercase text-[10px] tracking-widest text-primary shadow-sm hover:bg-slate-50 transition-all">
                Access Audit Logs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
