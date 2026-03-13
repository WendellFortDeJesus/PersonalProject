
"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Upload,
  Palette,
  Sun,
  Moon,
  Target,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  Archive,
  BarChart,
  PieChart as PieIcon,
  Search,
  UserX,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [logoUrl, setLogoUrl] = useState('');
  const [opacity, setOpacity] = useState(70);
  const [newBlockReason, setNewBlockReason] = useState('');
  const [blockSearch, setBlockSearch] = useState('');
  const [foundPatrons, setFoundPatrons] = useState<any[]>([]);

  useEffect(() => {
    if (settings) {
      setThemeUrl(settings.themeImageUrl || '');
      setLogoUrl(settings.universityLogoUrl || '');
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

  const addBlockReason = () => {
    if (newBlockReason) {
      const updatedReasons = [...(settings?.blockReasons || []), newBlockReason];
      handleSaveSettings({ blockReasons: updatedReasons });
      setNewBlockReason('');
    }
  };

  const searchPatron = async () => {
    if (!db || blockSearch.length < 3) return;
    const q = query(
      collection(db, 'patrons'), 
      where('schoolId', '>=', blockSearch),
      where('schoolId', '<=', blockSearch + '\uf8ff')
    );
    const snap = await getDocs(q);
    setFoundPatrons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const toggleBlockPatron = async (patron: any) => {
    if (!db) return;
    const ref = doc(db, 'patrons', patron.id);
    await updateDoc(ref, { isBlocked: !patron.isBlocked });
    searchPatron();
    toast({
      title: patron.isBlocked ? "Access Restored" : "User Blocked",
      variant: patron.isBlocked ? "default" : "destructive"
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-slate-400 font-bold">Syncing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary uppercase tracking-tighter">System Command Center</h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage library variables, terminal branding, and institutional goals</p>
        </div>
        <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
            <p className="text-sm font-bold text-green-600">FULLY SYNCED</p>
          </div>
          <div className="h-10 w-10 bg-green-500 rounded-full animate-pulse border-4 border-white shadow-sm" />
        </div>
      </div>

      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 bg-slate-100 p-1.5 rounded-2xl mb-8">
          <TabsTrigger value="academic" className="rounded-xl font-bold flex gap-2">
            <Building2 className="h-4 w-4" /> Academic Units
          </TabsTrigger>
          <TabsTrigger value="terminal" className="rounded-xl font-bold flex gap-2">
            <Timer className="h-4 w-4" /> Check-in Config
          </TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl font-bold flex gap-2">
            <Palette className="h-4 w-4" /> Theme & Branding
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl font-bold flex gap-2">
            <BarChart className="h-4 w-4" /> Report Settings
          </TabsTrigger>
          <TabsTrigger value="access" className="rounded-xl font-bold flex gap-2">
            <UserX className="h-4 w-4" /> Access Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl h-fit">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Add Academic Unit</CardTitle>
                <CardDescription>Register a new college or department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="College of Science" 
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Code</Label>
                  <Input 
                    placeholder="CAS" 
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setSelectedColor(c.value)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition-all",
                          selectedColor === c.value ? "border-slate-900 scale-110 shadow-md" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addDepartment} className="w-full rounded-xl bg-slate-900 h-11">
                  <Plus className="h-4 w-4 mr-2" /> Add Unit
                </Button>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full rounded-xl border-dashed h-11">
                    <Upload className="h-4 w-4 mr-2" /> Bulk Import (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-6">
                <CardTitle className="text-xl font-bold">Academic Structure</CardTitle>
                <CardDescription>Active and Archived departments across the university</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {settings?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-5 hover:bg-slate-50/30">
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: dept.color }}
                        >
                          {dept.code}
                        </div>
                        <div>
                          <p className={cn("font-bold text-slate-800", !dept.isActive && "text-slate-400 line-through")}>{dept.name}</p>
                          <Badge variant={dept.isActive ? "secondary" : "outline"} className="text-[9px] uppercase font-black px-1.5 py-0">
                            {dept.isActive ? "Active" : "Archived"}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl text-slate-400 hover:text-primary"
                        onClick={() => toggleDeptStatus(dept.id)}
                      >
                        {dept.isActive ? <Archive className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {dept.isActive ? "Archive" : "Reactivate"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terminal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Kiosk Behavior</CardTitle>
                <CardDescription>Customize form requirements and timeouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="space-y-1">
                    <Label className="text-base">Require Age</Label>
                    <p className="text-xs text-slate-400">Force visitor to input age on registration</p>
                  </div>
                  <Switch 
                    checked={settings?.requireAge} 
                    onCheckedChange={(val) => handleSaveSettings({ requireAge: val })} 
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="space-y-1">
                    <Label className="text-base">Require Gender</Label>
                    <p className="text-xs text-slate-400">Force visitor to select gender</p>
                  </div>
                  <Switch 
                    checked={settings?.requireGender} 
                    onCheckedChange={(val) => handleSaveSettings({ requireGender: val })} 
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Terminal Timeout (Seconds)</Label>
                    <Badge variant="secondary" className="font-bold">{settings?.timeoutSeconds || 3}s</Badge>
                  </div>
                  <Slider 
                    value={[settings?.timeoutSeconds || 3]} 
                    max={10} 
                    min={1} 
                    step={1}
                    onValueChange={(val) => handleSaveSettings({ timeoutSeconds: val[0] })}
                  />
                  <p className="text-xs text-slate-400 italic">How long the success message stays before resetting for the next visitor.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Visit Purposes</CardTitle>
                  <CardDescription>Manage options for terminal intents</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Group Study" 
                    value={newPurposeLabel}
                    onChange={(e) => setNewPurposeLabel(e.target.value)}
                    className="w-32 rounded-xl h-9 text-xs"
                  />
                  <Button size="sm" onClick={addPurpose} className="rounded-xl h-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {settings?.purposes?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg"><ClipboardCheck className="h-4 w-4 text-slate-400" /></div>
                        <span className="font-bold text-slate-700">{p.label}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Branding Controls</CardTitle>
                <CardDescription>Terminal backgrounds and university identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <Label>Terminal Background URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="High-res Library Image URL" 
                      value={themeUrl}
                      onChange={(e) => setThemeUrl(e.target.value)}
                      className="rounded-xl"
                    />
                    <Button onClick={() => handleSaveSettings({ themeImageUrl: themeUrl })} className="rounded-xl">Update</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>University Logo URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Official Logo URL" 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="rounded-xl"
                    />
                    <Button onClick={() => handleSaveSettings({ universityLogoUrl: logoUrl })} className="rounded-xl">Update</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Glass Overlay Opacity</Label>
                    <Badge variant="secondary" className="font-bold">{opacity}%</Badge>
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
                </div>
                <div className="space-y-4">
                  <Label>Welcome Text Color</Label>
                  <RadioGroup 
                    value={settings?.welcomeTextColor || 'white'} 
                    onValueChange={(val) => handleSaveSettings({ welcomeTextColor: val })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl flex-1 cursor-pointer">
                      <RadioGroupItem value="white" id="white" />
                      <Label htmlFor="white" className="flex items-center gap-2 font-bold cursor-pointer"><Sun className="h-4 w-4" /> White</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl flex-1 cursor-pointer">
                      <RadioGroupItem value="black" id="black" />
                      <Label htmlFor="black" className="flex items-center gap-2 font-bold cursor-pointer"><Moon className="h-4 w-4" /> Black</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-slate-900 flex flex-col items-center justify-center p-8">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Live Terminal Preview</p>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
                <img src={settings?.themeImageUrl || themeUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                   <h2 className={cn("text-xl font-black mb-2", settings?.welcomeTextColor === 'black' ? 'text-black' : 'text-white')}>Welcome to NEU Library</h2>
                   <div className="w-3/4 p-4 rounded-2xl border border-white/20 shadow-xl" style={{ backgroundColor: `rgba(255, 255, 255, ${opacity / 100})`, backdropFilter: 'blur(10px)' }}>
                      <div className="h-2 w-1/2 bg-slate-200 rounded-full mb-2" />
                      <div className="h-6 w-full bg-primary/20 rounded-lg" />
                   </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">PDF Visual Preferences</CardTitle>
                  <CardDescription>Control how charts and text appear on formal exports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Default Chart Representation</Label>
                    <RadioGroup 
                      value={settings?.defaultChartType || 'bar'} 
                      onValueChange={(val) => handleSaveSettings({ defaultChartType: val })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl flex-1 cursor-pointer">
                        <RadioGroupItem value="bar" id="bar-chart" />
                        <Label htmlFor="bar-chart" className="flex items-center gap-2 font-bold cursor-pointer"><BarChart className="h-4 w-4" /> Bar Chart</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl flex-1 cursor-pointer">
                        <RadioGroupItem value="pie" id="pie-chart" />
                        <Label htmlFor="pie-chart" className="flex items-center gap-2 font-bold cursor-pointer"><PieIcon className="h-4 w-4" /> Pie Chart</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label>Institutional Header Title</Label>
                    <Input 
                      placeholder="e.g. OFFICE OF THE CHIEF LIBRARIAN" 
                      value={settings?.reportHeaderTitle || ''}
                      onChange={(e) => handleSaveSettings({ reportHeaderTitle: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Institutional Footer Text</Label>
                    <Input 
                      placeholder="e.g. PatronPoint Secure Analytics Engine" 
                      value={settings?.reportFooterText || ''}
                      onChange={(e) => handleSaveSettings({ reportFooterText: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">ROI & Engagement Goals</CardTitle>
                  <CardDescription>Track library utilization against university KPIs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Daily Engagement Target (Visitors)</Label>
                    <div className="flex gap-4 items-center">
                      <Input 
                        type="number"
                        value={settings?.dailyEngagementTarget || 50}
                        onChange={(e) => handleSaveSettings({ dailyEngagementTarget: parseInt(e.target.value) })}
                        className="rounded-xl h-14 text-2xl font-black w-32"
                      />
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex-1">
                        <p className="text-xs text-green-700 font-medium">Used to calculate "Goal Percentage" in weekly intelligence reports.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-bold text-slate-700">Auto-Email Weekly Reports</span>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Standard Block Reasons</CardTitle>
                    <CardDescription>Preset options for revoking access</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New Reason" 
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      className="w-32 rounded-xl h-9 text-xs"
                    />
                    <Button size="sm" onClick={addBlockReason} className="rounded-xl h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {(settings?.blockReasons || ["Suspended", "Expired ID", "Unreturned Materials"]).map((r: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 px-6">
                      <span className="font-bold text-slate-700">{r}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Master Search & Quick Block</CardTitle>
                <CardDescription>Instantly search for and block/unblock any visitor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Enter School ID..." 
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && searchPatron()}
                    className="pl-10 h-12 rounded-xl"
                  />
                  <Button 
                    className="absolute right-1.5 top-1.5 h-9 rounded-lg" 
                    size="sm"
                    onClick={searchPatron}
                  >Search</Button>
                </div>

                <div className="space-y-3">
                  {foundPatrons.map((p) => (
                    <div key={p.id} className="p-4 border rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white", p.isBlocked ? "bg-red-500" : "bg-primary")}>
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.schoolId}</p>
                        </div>
                      </div>
                      <Button 
                        variant={p.isBlocked ? "outline" : "destructive"} 
                        size="sm" 
                        className="rounded-xl h-9"
                        onClick={() => toggleBlockPatron(p)}
                      >
                        {p.isBlocked ? <UserCheck className="h-4 w-4 mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
                        {p.isBlocked ? "Unblock" : "Block User"}
                      </Button>
                    </div>
                  ))}
                  {foundPatrons.length === 0 && blockSearch.length >= 3 && (
                    <div className="p-8 text-center text-slate-400 font-bold italic">
                      No matching student found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
