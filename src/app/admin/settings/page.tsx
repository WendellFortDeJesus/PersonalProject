
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, writeBatch, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Library, 
  Database, 
  Fingerprint, 
  Globe, 
  Eraser, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle,
  Skull,
  UserCog,
  Activity,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const activityQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(5));
  }, [db]);
  const { data: recentVisits } = useCollection(activityQuery);

  const [domain, setDomain] = useState('');
  const [rfidPattern, setRfidPattern] = useState('');
  const [enableRfid, setEnableRfid] = useState(true);
  const [enableSso, setEnableSso] = useState(true);
  const [depts, setDepts] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setDomain(settings.enforcedDomain || 'neu.edu.ph');
      setRfidPattern(settings.rfidPattern || '^[0-9]{2}-[0-9]{5}-[0-9]{3}$');
      setEnableRfid(settings.allowRfidScan ?? true);
      setEnableSso(settings.allowEmailLogin ?? true);
      setDepts(settings.departments || []);
      setPurposes(settings.purposes || []);
      setRoles(settings.roles || ['Student', 'Visitor']);
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
      toast({ title: "Gatekeeper Updated", description: "Security protocols synchronized." });
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

  const addRole = () => setRoles([...roles, '']);
  const updateRole = (idx: number, val: string) => {
    const newRoles = [...roles];
    newRoles[idx] = val;
    setRoles(newRoles);
  };
  const removeRole = (idx: number) => setRoles(roles.filter((_, i) => i !== idx));

  const handleSavePillar2 = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(settingsRef!, {
        departments: depts,
        purposes: purposes,
        roles: roles.filter(r => r.trim() !== ''),
      }, { merge: true });
      toast({ title: "Registry Synchronized", description: "Academic units and intents updated." });
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

  const handlePurgeRegistry = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      const patronsSnap = await getDocs(collection(db, 'patrons'));
      const visitsSnap = await getDocs(collection(db, 'visits'));
      const batch = writeBatch(db);
      patronsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
      visitsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();
      toast({ title: "Registry Purged", description: "All records erased." });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed", description: "Failed to erase institutional data." });
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
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="@neu.edu.ph" className="h-12 rounded-xl font-bold bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-50 rounded-lg text-primary"><Fingerprint className="h-4 w-4" /></div>
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">RF-ID Pattern Enforcer</Label>
                  </div>
                  <Input value={rfidPattern} onChange={(e) => setRfidPattern(e.target.value)} placeholder="Regex Pattern" className="h-12 rounded-xl font-mono font-bold bg-slate-50 border-none shadow-inner" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSavePillar1} disabled={isSaving} className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-xl">
                  {isSaving ? "Syncing..." : "Synchronize Protocols"}
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
              <Button onClick={handleSavePillar2} disabled={isSaving} className="h-10 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest px-6 gap-2">
                <Save className="h-3.5 w-3.5" /> Save Registry
              </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Colleges & Departments</h3>
                  <Button onClick={addDept} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-primary">
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Unit
                  </Button>
                </div>
                <div className="border rounded-3xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-black text-[10px] uppercase py-4">Name</TableHead>
                        <TableHead className="font-black text-[10px] uppercase py-4 w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depts.map((dept, idx) => (
                        <TableRow key={dept.id || idx}>
                          <TableCell>
                            <Input value={dept.name} onChange={(e) => {
                              const n = [...depts]; n[idx].name = e.target.value; setDepts(n);
                            }} className="h-10 font-bold text-xs" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => removeDept(dept.id)} className="text-slate-300 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10">
                <div className="p-3 bg-red-50 rounded-2xl w-fit mb-4"><Eraser className="h-6 w-6 text-red-500" /></div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-red-600">End-of-Day Flush</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400">Terminal Session Resynchronization</CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <Button onClick={handleFlush} className="w-full h-14 rounded-2xl bg-red-600 text-white font-black text-[11px] uppercase">Force Check-Out All</Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10">
                <div className="p-3 bg-primary/5 rounded-2xl w-fit mb-4"><Skull className="h-6 w-6 text-red-600" /></div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-red-600">Nuclear Option</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400">Master Registry Purge</CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-14 rounded-2xl bg-red-600 font-black text-[11px] uppercase">Purge Registry</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0 bg-white">
                    <AlertDialogHeader className="p-10 bg-red-600 text-white text-center">
                      <div className="p-4 bg-white/20 rounded-full w-fit mx-auto mb-6">
                        <Skull className="h-10 w-10 text-white" />
                      </div>
                      <AlertDialogTitle className="text-2xl font-black uppercase text-white">
                        Confirm Registry Purge?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs font-bold text-red-100 uppercase mt-2">
                        This protocol will PERMANENTLY ERASE every patron record and visit log.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="p-10 grid grid-cols-2 gap-4">
                      <AlertDialogCancel className="h-12 rounded-xl font-black text-[9px] uppercase">Abort</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePurgeRegistry} className="h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 font-black text-[9px] uppercase">Confirm Purge</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
