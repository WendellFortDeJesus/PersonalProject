
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Building2, 
  ClipboardCheck, 
  Trash2, 
  FileText, 
  FileDown, 
  LayoutTemplate, 
  Settings, 
  AlertCircle, 
  Bell, 
  Image as ImageIcon,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Palette,
  Sun,
  Moon,
  Sliders
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [newPurposeLabel, setNewPurposeLabel] = useState('');
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
    try {
      await setDoc(settingsRef, {
        ...settings,
        ...updates
      }, { merge: true });
      toast({
        title: "Configuration Synchronized",
        description: "System preferences updated successfully.",
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
      if (currentDepts.some((d: any) => d.id === id)) {
        toast({
          variant: "destructive",
          title: "Duplicate Code",
          description: "This department code already exists.",
        });
        return;
      }

      handleSaveSettings({ departments: [newDept, ...currentDepts] });
      setNewDeptName('');
      setNewDeptCode('');
    }
  };

  const toggleDeptStatus = (id: string) => {
    const updatedDepts = settings?.departments?.map((d: any) => 
      d.id === id ? { ...d, isActive: !d.isActive } : d
    );
    handleSaveSettings({ departments: updatedDepts });
  };

  const removeDepartment = (id: string) => {
    const updatedDepts = settings?.departments?.filter((d: any) => d.id !== id);
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
          <h1 className="text-3xl font-headline font-bold text-primary uppercase tracking-tighter">Admin System Console</h1>
          <p className="text-slate-500 font-medium">Organizational structures and reporting preferences</p>
        </div>
      </div>

      <Tabs defaultValue="foundational" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-[1200px] mb-8 h-12 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="foundational" className="rounded-xl font-bold">Academic Structure</TabsTrigger>
          <TabsTrigger value="purposes" className="rounded-xl font-bold">Visit Purposes</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl font-bold">Theme & Branding</TabsTrigger>
          <TabsTrigger value="exports" className="rounded-xl font-bold">Export Config</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl font-bold">Threshold Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="foundational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Add New Department</CardTitle>
                  <CardDescription>Register a new academic unit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Unit Name</Label>
                    <Input 
                      placeholder="e.g. College of Science" 
                      className="rounded-xl h-11"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Code</Label>
                    <Input 
                      placeholder="e.g. CAS" 
                      className="rounded-xl h-11"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Report Color Theme
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition-all",
                            selectedColor === color.value ? "border-slate-900 scale-110 shadow-md" : "border-transparent"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={addDepartment} className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Register Unit
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Structure Import
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Upload a CSV file containing Name and Code columns to update the structure at once.</p>
                  <Button variant="outline" className="w-full h-10 border-dashed border-primary/30 text-primary">
                    Select CSV File
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Academic Registry Management</CardTitle>
                    <CardDescription>Current listing of all registered university units</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                  {settings?.departments?.map((dept: any) => (
                    <div key={dept.id} className={`flex items-center justify-between p-5 group hover:bg-slate-50/50 transition-colors ${!dept.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: dept.color || '#355872' }}
                        >
                          {dept.code}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{dept.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {dept.isActive ? 'Status: Visible' : 'Status: Deactivated'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-9 rounded-xl font-bold text-xs gap-2 ${dept.isActive ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}`}
                          onClick={() => toggleDeptStatus(dept.id)}
                        >
                          {dept.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-300 hover:text-destructive hover:bg-red-50"
                          onClick={() => removeDepartment(dept.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!settings?.departments || settings.departments.length === 0) && (
                    <div className="p-20 text-center space-y-2">
                      <Building2 className="h-12 w-12 text-slate-200 mx-auto" />
                      <p className="text-slate-400 font-bold">No academic units registered.</p>
                    </div>
                  )}
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

        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Terminal Theme Editor</CardTitle>
                    <CardDescription>Customize the layered aesthetic of visitor kiosks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="space-y-4">
                  <Label className="text-base font-bold text-slate-700">Library Background Layer</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://images.unsplash.com/..." 
                      className="h-12 rounded-xl"
                      value={themeUrl}
                      onChange={(e) => setThemeUrl(e.target.value)}
                    />
                    <Button 
                      onClick={() => handleSaveSettings({ themeImageUrl: themeUrl })}
                      className="h-12 rounded-xl px-6"
                    >
                      Update Image
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Recommended: 1920x1080px academic imagery.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-bold text-slate-700">Glass Overlay Opacity</Label>
                    <Badge variant="secondary" className="font-black">{opacity}%</Badge>
                  </div>
                  <Slider 
                    value={[opacity]} 
                    max={100} 
                    min={10}
                    step={1} 
                    onValueChange={(val) => {
                      setOpacity(val[0]);
                      handleSaveSettings({ overlayOpacity: val[0] / 100 });
                    }}
                  />
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Sliders className="h-4 w-4 text-slate-400" />
                    <p className="text-xs text-slate-500 italic">Adjust for optimal legibility based on background brightness.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-bold text-slate-700">Welcome Text Appearance</Label>
                  <RadioGroup 
                    value={settings?.welcomeTextColor || 'white'} 
                    onValueChange={(val) => handleSaveSettings({ welcomeTextColor: val })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 bg-slate-100 p-4 rounded-2xl flex-1 cursor-pointer hover:bg-slate-200 transition-colors">
                      <RadioGroupItem value="white" id="white" />
                      <Label htmlFor="white" className="flex items-center gap-2 cursor-pointer font-bold">
                        <Sun className="h-4 w-4" /> Bright (White)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-100 p-4 rounded-2xl flex-1 cursor-pointer hover:bg-slate-200 transition-colors">
                      <RadioGroupItem value="black" id="black" />
                      <Label htmlFor="black" className="flex items-center gap-2 cursor-pointer font-bold">
                        <Moon className="h-4 w-4" /> Dark (Black)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-slate-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Kiosk Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative aspect-video rounded-3xl overflow-hidden border-8 border-slate-800 shadow-2xl">
                  {/* Background Layer Preview */}
                  <div className="absolute inset-0">
                    <img src={settings?.themeImageUrl || themeUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                  </div>
                  
                  {/* Foreground Layer Preview */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                    <h2 
                      className={cn(
                        "text-2xl font-black mb-4 transition-colors",
                        settings?.welcomeTextColor === 'black' ? 'text-black' : 'text-white'
                      )}
                    >
                      NEU Library Terminal
                    </h2>
                    <div 
                      className="w-3/4 p-6 rounded-3xl border border-white/20 shadow-xl"
                      style={{ backgroundColor: `rgba(255, 255, 255, ${opacity / 100})`, backdropFilter: 'blur(12px)' }}
                    >
                      <div className="h-3 w-1/2 bg-slate-400/20 rounded-full mb-3" />
                      <div className="h-8 w-full bg-primary/20 rounded-xl" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-4 text-white/40">
                  <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <LayoutTemplate className="h-3 w-3" />
                    Responsive Layered Design
                  </span>
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Adaptive Assets
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
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
                      <AlertCircle className="h-12 w-12 text-slate-200 mx-auto" />
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
