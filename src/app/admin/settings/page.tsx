
"use client";

import { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';

export default function SystemSettingsPage() {
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [visitPurposes, setVisitPurposes] = useState(PURPOSES);
  const [newDept, setNewDept] = useState('');
  
  // Security & Preferences state
  const [isRfidRequired, setIsRfidRequired] = useState(true);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [useLetterhead, setUseLetterhead] = useState(true);
  
  const { toast } = useToast();

  const handleSaveSystem = () => {
    toast({
      title: "System Synchronized",
      description: "Terminal configuration and export preferences updated.",
      variant: "default",
    });
  };

  const handleAddDept = () => {
    if (newDept && !departments.includes(newDept)) {
      setDepartments([newDept, ...departments]);
      setNewDept('');
      toast({ title: "Department Registered", description: `${newDept} is now live.` });
    }
  };

  const removeDept = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
    toast({ title: "Unit Removed", variant: "destructive" });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Admin System Console</h1>
          <p className="text-slate-500 font-medium">Organizational structures and reporting preferences</p>
        </div>
        <Button onClick={handleSaveSystem} className="bg-primary rounded-2xl h-12 px-8 shadow-lg gap-2">
          <Save className="h-5 w-5" />
          Commit All Changes
        </Button>
      </div>

      <Tabs defaultValue="foundational" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-8 h-12 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="foundational" className="rounded-xl font-bold">College Registry</TabsTrigger>
          <TabsTrigger value="purposes" className="rounded-xl font-bold">Visit Purposes</TabsTrigger>
          <TabsTrigger value="exports" className="rounded-xl font-bold">Export Config</TabsTrigger>
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
                <Button onClick={handleAddDept} className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
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
                  {departments.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between p-4 group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {i + 1}
                        </div>
                        <span className="font-bold text-slate-700">{dept}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50"
                          onClick={() => removeDept(dept)}
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
            <CardHeader className="bg-slate-50/50 pb-8">
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
                <Button className="rounded-xl h-11 px-6 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Intent
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {visitPurposes.map((p) => (
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
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-primary">
                      <Edit3 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-destructive">
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
                      variant={reportFormat === 'pdf' ? 'default' : 'outline'}
                      className={`h-24 rounded-2xl flex flex-col gap-2 font-bold ${reportFormat === 'pdf' ? 'bg-primary' : 'border-slate-100 text-slate-400'}`}
                      onClick={() => setReportFormat('pdf')}
                    >
                      <FileText className="h-6 w-6" />
                      Adobe PDF (.pdf)
                    </Button>
                    <Button 
                      variant={reportFormat === 'excel' ? 'default' : 'outline'}
                      className={`h-24 rounded-2xl flex flex-col gap-2 font-bold ${reportFormat === 'excel' ? 'bg-primary' : 'border-slate-100 text-slate-400'}`}
                      onClick={() => setReportFormat('excel')}
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
                    checked={useLetterhead} 
                    onCheckedChange={setUseLetterhead}
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
                <div className={`p-8 border-2 border-dashed rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center transition-all ${useLetterhead ? 'border-slate-200 bg-white shadow-inner' : 'border-slate-100 bg-slate-50 opacity-40'}`}>
                  {useLetterhead ? (
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
                        <div className="h-4 w-1/2 bg-slate-100 rounded" />
                      </div>
                      <div className="pt-12 flex justify-end">
                        <div className="w-48 border-t border-slate-900 pt-2 text-center">
                          <p className="text-[9px] font-bold text-slate-900 uppercase">Authorized Signature</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <ShieldAlert className="h-12 w-12 text-slate-200 mx-auto" />
                      <p className="font-bold text-slate-400">Plain Report Format Selected</p>
                      <p className="text-xs text-slate-300 px-12">Headers and branding will be omitted from generated files.</p>
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
