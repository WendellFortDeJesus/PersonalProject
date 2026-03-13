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
import { Search, Save, Image as ImageIcon, Globe, Database } from 'lucide-react';

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
    setDoc(settingsRef, finalData, { merge: true }).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsRef.path,
        operation: 'update',
        requestResourceData: finalData,
      }));
    });
  };

  if (isLoading) return <div className="p-32 text-center font-black text-primary/40 uppercase tracking-widest animate-pulse">Establishing Command Suite...</div>;

  return (
    <div className="space-y-8 pb-12 animate-fade-in fluid-container">
      <div className="bento-tile flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">System Command Suite</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure global schema and visual variables</p>
        </div>
        <Badge className="h-9 px-6 rounded-xl bg-green-50 text-green-600 border-green-100 font-black uppercase text-[9px] tracking-widest">Core Synchronized</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Pane: Department Manager */}
        <div className="lg:col-span-4 bento-tile flex flex-col h-[700px] p-0 overflow-hidden">
          <div className="p-8 bg-slate-50/50 border-b space-y-4">
            <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Academic Registry</h2>
            <div className="space-y-4 pt-2">
              <Input placeholder="Full Name..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} className="h-11 rounded-xl" />
              <Input placeholder="Code (e.g. CICS)" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} className="h-11 rounded-xl" />
              <Button onClick={() => {}} className="w-full h-11 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest gap-2">
                <Database className="h-3 w-3" />
                Add to Registry
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {settings?.departments?.map((dept: any) => (
              <div key={dept.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: dept.color }}>{dept.code}</div>
                  <span className="text-xs font-black text-slate-700 uppercase">{dept.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-red-500 font-black uppercase text-[9px]">Remove</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Center Pane: Terminal Customization */}
        <div className="lg:col-span-5 bento-tile flex flex-col h-[700px]">
          <h2 className="text-lg font-black text-primary uppercase tracking-tighter mb-6 flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-primary/40" />
            Terminal Customization
          </h2>
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Background Asset URL</Label>
              <div className="flex gap-2">
                <Input value={themeUrl} onChange={(e) => setThemeUrl(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={() => handleSaveSettings({ themeImageUrl: themeUrl })} className="bg-primary px-8 rounded-xl"><Save className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Overlay Density</Label>
                <span className="text-xs font-mono font-bold text-primary">{opacity}%</span>
              </div>
              <Slider value={[opacity]} max={100} min={10} step={1} onValueChange={(val) => { setOpacity(val[0]); handleSaveSettings({ overlayOpacity: val[0] / 100 }); }} />
            </div>

            <div className="pt-8 border-t space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Live Twin Preview</h3>
              <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner group">
                <img src={themeUrl} className="object-cover w-full h-full" alt="Preview" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-48 h-32 rounded-3xl shadow-2xl border border-white/30"
                    style={{ backgroundColor: `rgba(255, 255, 255, ${opacity/100})`, backdropFilter: 'blur(10px)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Global Variables */}
        <div className="lg:col-span-3 bento-tile flex flex-col h-[700px] bg-slate-50 border-none shadow-inner">
          <h2 className="text-lg font-black text-primary uppercase tracking-tighter mb-8 flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary/40" />
            Global Controls
          </h2>
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schema Validation</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-600">Enforce Age Input</span>
                  <Switch checked={settings?.requireAge} onCheckedChange={(val) => handleSaveSettings({ requireAge: val })} />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-600">Require Gender</span>
                  <Switch checked={settings?.requireGender} onCheckedChange={(val) => handleSaveSettings({ requireGender: val })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Variables</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Engagement Target</Label>
                  <Input type="number" value={settings?.dailyEngagementTarget || 50} onChange={(e) => handleSaveSettings({ dailyEngagementTarget: parseInt(e.target.value) })} className="h-12 rounded-xl bg-white border-none font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Timeout (Sec)</Label>
                  <Input type="number" value={settings?.timeoutSeconds || 3} onChange={(e) => handleSaveSettings({ timeoutSeconds: parseInt(e.target.value) })} className="h-12 rounded-xl bg-white border-none font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
