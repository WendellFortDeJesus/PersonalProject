
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const COLOR_PRESETS = [
  { name: 'Blue', value: '#355872' },
  { name: 'Sky', value: '#7AAACE' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
];

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
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [themeUrl, setThemeUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [opacity, setOpacity] = useState(70);

  useEffect(() => {
    if (settings) {
      setThemeUrl(settings.themeImageUrl || '');
      setLogoUrl(settings.universityLogoUrl || '');
      setOpacity((settings.overlayOpacity || 0.7) * 100);
    }
  }, [settings]);

  const handleSaveSettings = async (updates: any) => {
    if (!settingsRef) return;
    const finalData = { ...settings, ...updates };
    
    setDoc(settingsRef, finalData, { merge: true })
      .then(() => {
        toast({ title: "Configuration Synchronized" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'update',
          requestResourceData: finalData,
        }));
      });
  };

  const addDepartment = () => {
    if (newDeptName && newDeptCode) {
      const id = newDeptCode.toLowerCase().replace(/\s+/g, '_');
      const newDept = {
        id,
        name: newDeptName,
        code: newDeptCode,
        color: selectedColor,
        isActive: true
      };
      const currentDepts = settings?.departments || [];
      handleSaveSettings({ departments: [newDept, ...currentDepts] });
      setNewDeptName('');
      setNewDeptCode('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Establishing Command...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">System Command Center</h1>
          <p className="text-slate-500 font-bold tracking-tight uppercase text-[10px]">Define institutional variables and data schemas</p>
        </div>
        <Badge variant="outline" className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest text-green-600 bg-green-50 border-green-100 px-4">
          Core Synced
        </Badge>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-slate-100 p-1.5 rounded-2xl mb-8">
          <TabsTrigger value="schema" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Schema</TabsTrigger>
          <TabsTrigger value="behavior" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Behavior</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Branding</TabsTrigger>
          <TabsTrigger value="reporting" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] h-fit bg-white">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black uppercase">Define Unit</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Register new academic structure</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                  <Input placeholder="College of Engineering" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Short ID</Label>
                  <Input placeholder="COE" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Brand Color Mapping</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button key={c.value} onClick={() => setSelectedColor(c.value)} className={cn("h-6 w-6 rounded-lg border-2", selectedColor === c.value ? "border-slate-900 shadow-md" : "border-transparent")} style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>
                <Button onClick={addDepartment} className="w-full rounded-xl bg-primary h-12 font-black uppercase tracking-widest text-[10px]">Add to Schema</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <div className="p-8 bg-slate-50 border-b">
                <h3 className="font-black text-primary uppercase tracking-tighter">Academic Registry</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active institutional data units</p>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {settings?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm" style={{ backgroundColor: dept.color }}>{dept.code}</div>
                        <div>
                          <p className="font-black text-slate-800 tracking-tight uppercase text-sm">{dept.name}</p>
                          <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Active Unit</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl text-slate-300 hover:text-red-500 font-black uppercase text-[9px] tracking-widest" onClick={() => handleSaveSettings({ departments: settings.departments.filter((d: any) => d.id !== dept.id) })}>Delete</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white">
            <CardHeader className="p-10">
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Terminal Logic & Validation</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define mandatory data and system timeouts</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tight">Require Age Input</Label>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Enforce demographic recording</p>
                  </div>
                  <Switch checked={settings?.requireAge} onCheckedChange={(val) => handleSaveSettings({ requireAge: val })} />
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tight">Require Gender Mapping</Label>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Enforce diversity analytics</p>
                  </div>
                  <Switch checked={settings?.requireGender} onCheckedChange={(val) => handleSaveSettings({ requireGender: val })} />
                </div>
              </div>

              <div className="space-y-6 max-w-xl">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-black uppercase tracking-tight">Terminal Success Reset (Seconds)</Label>
                  <Badge className="font-black px-4">{settings?.timeoutSeconds || 3}S</Badge>
                </div>
                <Slider value={[settings?.timeoutSeconds || 3]} max={10} min={1} step={1} onValueChange={(val) => handleSaveSettings({ timeoutSeconds: val[0] })} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">How long the confirmation record remains visible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white">
            <CardHeader className="p-10">
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Visual Identity</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage institutional branding and terminal aesthetics</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal Background URL</Label>
                <div className="flex gap-2">
                  <Input placeholder="URL" value={themeUrl} onChange={(e) => setThemeUrl(e.target.value)} className="rounded-xl h-12" />
                  <Button onClick={() => handleSaveSettings({ themeImageUrl: themeUrl })} className="rounded-xl font-black uppercase text-[10px] px-8 bg-primary">Sync</Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Glass Overlay Density</Label>
                  <span className="text-[10px] font-black text-primary">{opacity}%</span>
                </div>
                <Slider value={[opacity]} max={100} min={10} step={1} onValueChange={(val) => { setOpacity(val[0]); handleSaveSettings({ overlayOpacity: val[0] / 100 }); }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white">
            <CardHeader className="p-10">
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Reporting Schema</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define output structure for institutional records</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Engagement Target</Label>
                <Input type="number" value={settings?.dailyEngagementTarget || 50} onChange={(e) => handleSaveSettings({ dailyEngagementTarget: parseInt(e.target.value) })} className="rounded-xl h-14 text-2xl font-black w-32" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional KPI used for goal tracking</p>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Header Metadata</Label>
                <Input value={settings?.reportHeaderTitle || ''} onChange={(e) => handleSaveSettings({ reportHeaderTitle: e.target.value })} className="rounded-xl h-12 font-bold uppercase" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
