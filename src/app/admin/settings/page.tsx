
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Settings2, 
  Building2, 
  ClipboardCheck, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Save,
  FileText,
  FileDown,
  LayoutTemplate,
  CheckCircle2,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SystemSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Real-time system settings from Firestore
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  // Local editing states
  const [newDept, setNewDept] = useState('');
  const [newPurposeLabel, setNewPurposeLabel] = useState('');

  const handleSaveSettings = async (updates: any) => {
    if (!settingsRef) return;
    try {
      await setDoc(settingsRef, {
        ...settings,
        ...updates
      }, { merge: true });
      toast({
        title: "Configuration Synchronized",
        description: "Terminal preferences updated across the university network.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not save system preferences.",
      });
    }
  };

  const addDepartment = () => {
    if (newDept && !settings?.departments?.includes(newDept)) {
      const updatedDepts = [newDept, ...(settings?.departments || [])];
      handleSaveSettings({ departments: updatedDepts });
      setNewDept('');
    }
  };

  const removeDepartment = (dept: string) => {
    const updatedDepts = settings?.departments?.filter((d: string) => d !== dept);
    handleSaveSettings({ departments: updatedDepts });
  };

  const addPurpose = () => {
    if (newPurposeLabel) {
      const id = newPurposeLabel.toLowerCase().replace(/\s+/g, '_');
      const updatedPurposes = [
        ...(settings?.purposes || []),
        { id, label: newPurposeLabel, icon: 'FileText' }
      ];
      handleSaveSettings({ purposes: updatedPurposes });
      setNewPurposeLabel('');
    }
  };

  const removePurpose = (id: string) => {
    const updatedPurposes = settings?.purposes?.filter((p: any) => p.id !== id);
    handleSaveSettings({ purposes: updatedPurposes });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-slate-400 font-bold">Syncing System Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Admin System Console</h1>
          <p className="text-slate-500 font-medium">Organizational structures and reporting preferences</p>
        </div>
      </div>

      <Tabs defaultValue="foundational" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px] mb-8 h-12 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="foundational" className="rounded-xl font-bold">College Registry</TabsTrigger>
          <TabsTrigger value="purposes" className="rounded-xl font-bold">Visit Purposes</TabsTrigger>
          <TabsTrigger value="exports" className="rounded-xl font-bold">Export Config</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl font-bold">Threshold Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="foundational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Register New College</CardTitle>
                <CardDescription>Add a new academic or office unit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Unit Name</Label>
                  <Input 
                    placeholder="e.g. College of Science" 
                    className="rounded-xl h-12"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                  />
                </div>
                <Button onClick={addDepartment} className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Registry
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Departmental Management</CardTitle>
                    <CardDescription>Current listing of all registered university units</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {settings?.departments?.map((dept: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {i + 1}
                        </div>
                        <span className="font-bold text-slate-700">{dept}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50"
                          onClick={() => removeDepartment(dept)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purposes" className="space-y-6">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-8 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <ClipboardCheck className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Kiosk Intent Config</CardTitle>
                    <CardDescription>Manage options available for visitor check-in reasons</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Input 
                    placeholder="New Purpose Name" 
                    className="h-11 rounded-xl w-64"
                    value={newPurposeLabel}
                    onChange={(e) => setNewPurposeLabel(e.target.value)}
                  />
                  <Button className="rounded-xl h-11 px-6 shadow-md" onClick={addPurpose}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Purpose
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings?.purposes?.map((p: any) => (
                <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-primary/20 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-50 rounded-[1.5rem] group-hover:bg-primary/5 group-hover:text-primary transition-colors text-slate-400">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-lg">{p.label}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Selector</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-destructive" onClick={() => removePurpose(p.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <FileDown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Export Preferences</CardTitle>
                    <CardDescription>Configure default formats for manual reports</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="space-y-4">
                  <Label className="text-base font-bold text-slate-700">Primary Report Format</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant={settings?.reportFormat === 'pdf' ? 'default' : 'outline'}
                      className={`h-24 rounded-2xl flex flex-col gap-2 font-bold ${settings?.reportFormat === 'pdf' ? 'bg-primary' : 'border-slate-100 text-slate-400'}`}
                      onClick={() => handleSaveSettings({ reportFormat: 'pdf' })}
                    >
                      <FileText className="h-6 w-6" />
                      Adobe PDF (.pdf)
                    </Button>
                    <Button 
                      variant={settings?.reportFormat === 'excel' ? 'default' : 'outline'}
                      className={`h-24 rounded-2xl flex flex-col gap-2 font-bold ${settings?.reportFormat === 'excel' ? 'bg-primary' : 'border-slate-100 text-slate-400'}`}
                      onClick={() => handleSaveSettings({ reportFormat: 'excel' })}
                    >
                      <LayoutTemplate className="h-6 w-6" />
                      MS Excel (.xlsx)
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-slate-800">Use Official Letterhead</Label>
                    <p className="text-xs text-slate-500">Include University logo and signature lines in PDF</p>
                  </div>
                  <Switch 
                    checked={settings?.useLetterhead} 
                    onCheckedChange={(val) => handleSaveSettings({ useLetterhead: val })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <LayoutTemplate className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Letterhead Preview</CardTitle>
                    <CardDescription>Visualization of your official PDF header</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className={`p-8 border-2 border-dashed rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center transition-all ${settings?.useLetterhead ? 'border-slate-200 bg-white shadow-inner' : 'border-slate-100 bg-slate-50 opacity-40'}`}>
                  {settings?.useLetterhead ? (
                    <div className="w-full space-y-12">
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-8">
                        <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs text-center px-2">UNIV LOGO</div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">University Central Library</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office of the Chief Librarian</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        <div className="h-4 w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <ShieldAlert className="h-12 w-12 text-slate-200 mx-auto" />
                      <p className="font-bold text-slate-400">Plain Report Format Selected</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden max-w-2xl">
            <CardHeader className="bg-slate-50/50 pb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Threshold Alerts</CardTitle>
                  <CardDescription>Configure capacity limits and dashboard notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-lg font-bold text-slate-800">Library Daily Capacity Limit</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number" 
                    className="h-14 rounded-xl text-2xl font-black w-32 border-slate-200"
                    value={settings?.capacityLimit || 100}
                    onChange={(e) => handleSaveSettings({ capacityLimit: parseInt(e.target.value) })}
                  />
                  <p className="text-sm font-medium text-slate-500 italic">
                    Maximum number of unique visitors allowed before dashboard alerts are triggered.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-bold text-red-900">Dashboard Notification Enabled</p>
                  <p className="text-xs text-red-700">The main dashboard will flash a red alert when this limit is reached in any given 24-hour cycle.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
