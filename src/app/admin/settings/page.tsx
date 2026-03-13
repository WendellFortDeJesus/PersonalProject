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
  ToggleLeft, 
  ToggleRight,
  ShieldAlert,
  Save,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SystemSettingsPage() {
  const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
  const [purposes, setPurposes] = useState(PURPOSES);
  const [newDept, setNewDept] = useState('');
  const [isRfidRequired, setIsRfidRequired] = useState(true);
  const [isSsoEnabled, setIsSsoEnabled] = useState(true);
  const { toast } = useToast();

  const handleAddDept = () => {
    if (newDept && !departments.includes(newDept)) {
      setDepartments([...departments, newDept]);
      setNewDept('');
      toast({
        title: "Department Added",
        description: `${newDept} has been added to the registry.`,
      });
    }
  };

  const handleRemoveDept = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
    toast({
      variant: "destructive",
      title: "Department Removed",
      description: `${dept} has been deleted.`,
    });
  };

  const handleSaveSystem = () => {
    toast({
      title: "Settings Saved",
      description: "System configuration has been updated successfully.",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">System Configuration</h1>
          <p className="text-slate-500">Manage organizational data and terminal behavior</p>
        </div>
        <Button onClick={handleSaveSystem} className="bg-primary rounded-2xl h-12 px-8 shadow-lg gap-2">
          <Save className="h-5 w-5" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="foundational" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 h-12 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="foundational" className="rounded-xl font-bold">Foundational Data</TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl font-bold">Terminal Security</TabsTrigger>
        </TabsList>

        <TabsContent value="foundational" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Management */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-6 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Colleges & Departments</CardTitle>
                    <CardDescription>Registered academic and administrative units</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter Department Name..." 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="rounded-xl h-12 bg-slate-50 focus-visible:ring-primary border-slate-100"
                  />
                  <Button onClick={handleAddDept} className="rounded-xl h-12 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {departments.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:shadow-md transition-all">
                      <span className="font-bold text-slate-700">{dept}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveDept(dept)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purpose Management */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-6 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <ClipboardCheck className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Visit Purposes</CardTitle>
                    <CardDescription>Pre-selected reasons for library check-in</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Button variant="outline" className="w-full border-dashed border-2 rounded-2xl h-16 text-slate-400 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                  <Plus className="h-5 w-5 mr-2" />
                  Configure New Purpose Category
                </Button>

                <div className="grid grid-cols-1 gap-4">
                  {purposes.map((purpose) => (
                    <div key={purpose.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <Settings2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <span className="font-bold text-slate-700">{purpose.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border-green-100">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <CardTitle className="text-2xl font-bold text-primary">Terminal Access Rules</CardTitle>
              <CardDescription className="text-base">Define how the kiosk validates users and handles registrations</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="space-y-1">
                  <Label className="text-lg font-bold text-slate-800">Strict RFID Enforcement</Label>
                  <p className="text-sm text-slate-500">Require physical RFID tap for all student entries. Manual typing disabled.</p>
                </div>
                <Switch 
                  checked={isRfidRequired} 
                  onCheckedChange={setIsRfidRequired} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="space-y-1">
                  <Label className="text-lg font-bold text-slate-800">Google SSO Authentication</Label>
                  <p className="text-sm text-slate-500">Enable "Sign in with NEU Email" as a fallback authentication method.</p>
                </div>
                <Switch 
                  checked={isSsoEnabled} 
                  onCheckedChange={setIsSsoEnabled} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 flex items-start gap-4">
                <ShieldAlert className="h-6 w-6 text-red-600 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-bold text-red-800">Security Note: Domain Lock</h4>
                  <p className="text-sm text-red-700/80 leading-relaxed">
                    SSO authentication is currently locked to the <strong>@neu.edu.ph</strong> domain. Any attempt to sign in with an external email provider (Gmail, Outlook, etc.) will be automatically rejected by the system.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="ghost" className="rounded-xl font-bold">Reset to Defaults</Button>
                <Button className="bg-primary rounded-xl font-bold px-8 shadow-lg">Confirm Security Policy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
