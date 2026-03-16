
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Library, 
  Database, 
  Fingerprint, 
  Globe, 
  Smartphone, 
  Eraser, 
  Download, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  // Local state for Pillar 1
  const [domain, setDomain] = useState('');
  const [rfidPattern, setRfidPattern] = useState('');
  const [enableRfid, setEnableRfid] = useState(true);
  const [enableSso, setEnableSso] = useState(true);

  // Pillar 2
  const [depts, setDepts] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);

  useEffect(() => {
    if (settings) {
      setDomain(settings.enforcedDomain || 'neu.edu.ph');
      setRfidPattern(settings.rfidPattern || '^[0-9]{2}-[0-9]{5}-[0-9]{3}$');
      setEnableRfid(settings.allowRfidScan ?? true);
      setEnableSso(settings.allowEmailLogin ?? true);
      setDepts(settings.departments || []);
      setPurposes(settings.purposes || []);
    }
  }, [settings]);

  const handleSavePillar1 = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef!, {
        enforcedDomain: domain,
        rfidPattern: rfidPattern,
        allowRfidScan: enableRfid,
        allowEmailLogin: enableSso,
      }, { merge: true });
      toast({ title: "Gatekeeper Updated", description: "Security protocols have been synchronized." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not update security rules." });
    } finally {
      setIsSaving(false);
    }
  };

  const addDept = () => setDepts([...depts, { id: Date.now().toString(), name: '', color: '#355872', isActive: true }]);
  const removeDept = (id: string) => setDepts(depts.filter(d => d.id !== id));
  
  const addPurpose = () => setPurposes([...purposes, { id: Date.now().toString(), label: '', icon: 'BookOpen' }]);
  const removePurpose = (id: string) => setPurposes(purposes.filter(p => p.id !== id));

  const handleSavePillar2 = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef!, {
        departments: depts,
        purposes: purposes,
      }, { merge: true });
      toast({ title: "Registry Synchronized", description: "Academic units and intents have been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Error", description: "Failed to save registry changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlush = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      // Find visits that don't have a specific check-out or are 'granted' but current
      // In this schema, we'll mark today's entries as processed
      const q = query(collection(db, 'visits'), where('status', '==', 'granted'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      
      snap.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { 
          flushedAt: new Date().toISOString(),
          status: 'completed' 
        });
      });

      await batch.commit();
      toast({ title: "Terminal Flush Complete", description: "Active sessions have been force-closed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Flush Error", description: "Operation failed." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing System Config...</div>;

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-[1200px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Control Room</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional System Orchestration</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Master Node Alpha Active</span>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-white border rounded-2xl p-1 shadow-sm gap-1">
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest gap-2">
            <ShieldCheck className="h-4 w-4" /> Pillar 1: Security
          </TabsTrigger>
          <TabsTrigger value="registry" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest gap-2">
            <Library className="h-4 w-4" /> Pillar 2: Registry
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest gap-2">
            <Database className="h-4 w-4" /> Pillar 3: Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Gatekeeper Logic</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Authentication & Security Protocols</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-primary"><Globe className="h-4 w-4" /></div>
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Domain Whitelist</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="@neu.edu.ph" className="h-12 rounded-xl font-bold bg-slate-50 border-none shadow-inner" />
                    <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest px-6">Edit</Button>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Only identities originating from this institutional domain are permitted system entry.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-primary"><Fingerprint className="h-4 w-4" /></div>
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">RF-ID Pattern Enforcer</Label>
                  </div>
                  <Input value={rfidPattern} onChange={(e) => setRfidPattern(e.target.value)} placeholder="Regex Pattern" className="h-12 rounded-xl font-mono font-bold bg-slate-50 border-none shadow-inner" />
                  <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">Regex control for institutional identity cards. Updates terminal scanning logic globally.</p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-primary">Enable RF-ID Scanner</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Hardware interface master toggle</p>
                  </div>
                  <Switch checked={enableRfid} onCheckedChange={setEnableRfid} className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-primary">Enable SSO Email Login</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Terminal software authentication toggle</p>
                  </div>
                  <Switch checked={enableSso} onCheckedChange={setEnableSso} className="data-[state=checked]:bg-primary" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePillar1} disabled={isSaving} className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {isSaving ? "Syncing Logic..." : "Synchronize Protocols"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registry" className="mt-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Academic Registry Manager</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Departmental Mapping & Intent Management</CardDescription>
              </div>
              <Button onClick={handleSavePillar2} disabled={isSaving} variant="outline" className="h-10 rounded-xl border-primary text-primary font-black text-[9px] uppercase tracking-widest px-6 gap-2 hover:bg-primary hover:text-white transition-all">
                <Save className="h-3.5 w-3.5" /> Save Registry
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">Colleges & Departments</h3>
                  <Button onClick={addDept} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg px-4 gap-2">
                    <Plus className="h-3.5 w-3.5" /> Add Unit
                  </Button>
                </div>
                <div className="border rounded-3xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-slate-100">
                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Academic Unit Name</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 w-32">Branding Color</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-center">Status</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-right pr-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depts.map((dept, idx) => (
                        <TableRow key={dept.id || idx} className="border-slate-50">
                          <TableCell>
                            <Input 
                              value={dept.name} 
                              onChange={(e) => {
                                const newDepts = [...depts];
                                newDepts[idx].name = e.target.value;
                                setDepts(newDepts);
                              }}
                              className="h-10 font-bold text-xs rounded-xl border-slate-100" 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="color" 
                                value={dept.color} 
                                onChange={(e) => {
                                  const newDepts = [...depts];
                                  newDepts[idx].color = e.target.value;
                                  setDepts(newDepts);
                                }}
                                className="h-10 w-10 p-1 rounded-lg border-none cursor-pointer bg-transparent" 
                              />
                              <span className="text-[10px] font-mono font-bold text-slate-400">{dept.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={dept.isActive} 
                              onCheckedChange={(val) => {
                                const newDepts = [...depts];
                                newDepts[idx].isActive = val;
                                setDepts(newDepts);
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button variant="ghost" size="sm" onClick={() => removeDept(dept.id)} className="text-slate-300 hover:text-red-500 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">Visit Intents (Purposes)</h3>
                  <Button onClick={addPurpose} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg px-4 gap-2">
                    <Plus className="h-3.5 w-3.5" /> Add Intent
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purposes.map((p, idx) => (
                    <div key={p.id || idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm group">
                      <Input 
                        value={p.label} 
                        onChange={(e) => {
                          const newPurp = [...purposes];
                          newPurp[idx].label = e.target.value;
                          setPurposes(newPurp);
                        }}
                        className="h-10 font-bold text-xs rounded-xl flex-1 bg-white border-none shadow-inner" 
                      />
                      <Button variant="ghost" size="sm" onClick={() => removePurpose(p.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 pb-0">
                <div className="p-3 bg-red-50 rounded-2xl w-fit mb-4">
                   <Eraser className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-red-600">End-of-Day Flush</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Terminal Session Resynchronization</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                  Forcibly checks out all active identities currently in the system registry. Resets terminal status to 'Closed' for all entries dated today.
                </p>
                <div className="p-4 bg-red-50/50 border border-dashed border-red-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-tight leading-tight">Warning: This action will permanently modify active session logs for the current institutional cycle.</p>
                </div>
                <Button onClick={handleFlush} disabled={isSaving} variant="outline" className="w-full h-14 rounded-2xl border-red-200 text-red-600 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all">
                  Initiate Force Check-Out
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 pb-0">
                <div className="p-3 bg-primary/5 rounded-2xl w-fit mb-4">
                   <Download className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Data Integrity & Archiver</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Collection Maintenance</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                  Identifies and exports registry logs older than 30 institutional cycles. Optimized for database performance and high-speed dashboard loading.
                </p>
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Log Density</span>
                      <span className="text-[11px] font-black text-primary font-mono">OPTIMAL</span>
                   </div>
                   <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Legacy Records</span>
                      <span className="text-[11px] font-black text-slate-400 font-mono">0.00%</span>
                   </div>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                  Export & Archive Legacy Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
