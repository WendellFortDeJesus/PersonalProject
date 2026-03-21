
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { 
  FileDown, 
  Filter, 
  Printer, 
  Download, 
  ShieldCheck, 
  Library, 
  Calendar, 
  Users, 
  GraduationCap, 
  Briefcase, 
  UserPlus,
  Trash2,
  AlertTriangle,
  PenTool,
  Loader2,
  Table as TableIcon,
  CheckCircle2,
  Eye,
  X,
  FileSpreadsheet,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [purpose, setPurpose] = useState('all');
  const [college, setCollege] = useState('all');
  const [role, setRole] = useState('all');
  const [generatedOn, setGeneratedOn] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [adminSignature, setAdminSignature] = useState('');

  useEffect(() => {
    setGeneratedOn(format(new Date(), 'MMMM dd, yyyy HH:mm'));
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);
  const { data: visits, isLoading } = useCollection(visitsQuery);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    return visits.filter(v => {
      try {
        const vDate = new Date(v.timestamp);
        const inRange = isWithinInterval(vDate, {
          start: startOfDay(new Date(dateFrom)),
          end: endOfDay(new Date(dateTo))
        });
        const currentPurposes = settings?.purposes || PURPOSES;
        const matchesPurpose = purpose === 'all' || v.purpose === currentPurposes.find((p: any) => p.id === purpose)?.label;
        const matchesCollege = college === 'all' || (v.patronDepartments && v.patronDepartments[0] === college);
        const matchesRole = role === 'all' || v.patronRole === role;
        
        return inRange && matchesPurpose && matchesCollege && matchesRole;
      } catch (e) {
        return false;
      }
    });
  }, [visits, dateFrom, dateTo, purpose, college, role, settings]);

  const reportStats = useMemo(() => {
    const students = filteredVisits.filter(v => v.patronRole === 'Student').length;
    const employees = filteredVisits.filter(v => v.patronRole === 'Faculty' || v.patronRole === 'Staff' || v.patronRole === 'Admin').length;
    const external = filteredVisits.filter(v => v.patronRole === 'Visitor').length;

    const purposeMap = filteredVisits.reduce((acc, v) => {
      const p = v.purpose || 'Other';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topPurpose = Object.entries(purposeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const deptMap = filteredVisits.reduce((acc, v) => {
      const dept = (v.patronDepartments && v.patronDepartments[0]) || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total: filteredVisits.length, students, employees, external, topPurpose, topDept };
  }, [filteredVisits]);

  const handleDeleteVisit = async () => {
    if (!db || !visitToDelete || !adminSignature.trim()) return;
    setIsDeleting(true);
    try {
      const visitRef = doc(db, 'visits', visitToDelete);
      const visitSnap = await getDoc(visitRef);
      
      if (visitSnap.exists()) {
        const patronId = visitSnap.data().patronId;
        const batch = writeBatch(db);
        
        const patronRef = doc(db, 'patrons', patronId);
        batch.delete(patronRef);
        
        const q = query(collection(db, 'visits'), where('patronId', '==', patronId));
        const visitsSnap = await getDocs(q);
        visitsSnap.docs.forEach(d => batch.delete(d.ref));
        
        await batch.commit();
        toast({ 
          title: "Institutional Purge Successful", 
          description: `Identity and activity log stream permanently erased by ${adminSignature}.` 
        });
      }

      setIsDeleteDialogOpen(false);
      setVisitToDelete(null);
      setAdminSignature('');
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Failed to execute linked purge." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportPDF = () => {
    // PDF export implementation would typically use a library like jsPDF
    // For this prototype, we'll trigger the print dialog which can save as PDF
    handlePrint();
  };

  const setToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setDateFrom(today);
    setDateTo(today);
  };

  const setThisWeek = () => {
    const start = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const end = format(endOfWeek(new Date()), 'yyyy-MM-dd');
    setDateFrom(start);
    setDateTo(end);
  };

  const availableRoles = settings?.roles || ['Student', 'Visitor'];
  const allPossibleRoles = Array.from(new Set(['Admin', 'Staff', 'Faculty', ...availableRoles]));

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-fade-in max-w-[1600px] mx-auto overflow-x-hidden bg-slate-50/50 min-h-screen font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Audits</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Strategic Intelligence Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-[0.2em] h-12 px-8 bg-white text-slate-900 shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-3"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em] h-12 px-8 bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-3"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
        {[
          { title: "Filtered Records", value: reportStats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Students", value: reportStats.students, icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50" },
          { title: "Employees", value: reportStats.employees, icon: Briefcase, color: "text-amber-500", bg: "bg-amber-50" },
          { title: "External Visitors", value: reportStats.external, icon: UserPlus, color: "text-green-500", bg: "bg-green-50" },
          { title: "Primary Intent", value: reportStats.topPurpose, icon: Library, color: "text-slate-700", bg: "bg-slate-100" },
          { title: "Peak Academic Unit", value: reportStats.topDept, icon: ShieldCheck, color: "text-violet-500", bg: "bg-violet-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.title}</p>
              <h3 className="text-sm font-black text-primary tracking-tight truncate leading-tight">
                {stat.value}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white no-print">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-900">Multivariate Filters</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={setToday} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-lg px-4">Today</Button>
            <Button onClick={setThisWeek} variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-lg px-4">This Week</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner">
                <SelectValue placeholder="All Intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Intents</SelectItem>
                {(settings?.purposes || PURPOSES).map((p: any) => <SelectItem key={p.id} value={p.id} className="font-bold text-xs">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">College / Unit</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Units</SelectItem>
                {(settings?.departments || DEPARTMENTS.map(d => ({ name: d }))).map((d: any) => (
                  <SelectItem key={d.name || d} value={d.name || d} className="font-bold text-xs">{d.name || d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Profile Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs shadow-inner">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Roles</SelectItem>
                {allPossibleRoles.map(r => (
                  <SelectItem key={r} value={r} className="font-bold text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-[2.5rem] shadow-md border border-slate-100 overflow-hidden print-area">
        <div className="p-12 space-y-12">
          {/* Document Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-800 rounded-2xl shadow-lg">
                <TableIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-headline font-black text-slate-900 uppercase tracking-tighter leading-none">Official Audit Report</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5">NEU University Central Library</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                 <span className="text-[8px] font-black text-slate-300">NEULOGO</span>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Audit Timestamp</p>
              <p className="text-[10px] font-black text-primary uppercase">{generatedOn || '---'}</p>
            </div>
          </div>

          {/* Quick Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Record Count</p>
              <p className="text-3xl font-black text-primary tracking-tighter leading-none">{filteredVisits.length}</p>
            </div>
            <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Audit Window</p>
              <p className="text-[11px] font-black text-primary uppercase leading-tight font-mono">
                {format(new Date(dateFrom), 'MM/dd/yy')} - {format(new Date(dateTo), 'MM/dd/yy')}
              </p>
            </div>
            <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">System Validated</p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Log Timestamp</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Patron Full Name</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Institutional Unit</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Primary Intent</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-4 text-[10px] font-mono font-bold text-slate-400">
                      {v.timestamp ? format(new Date(v.timestamp), 'HH:mm | MM/dd') : '---'}
                    </td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-800 uppercase tracking-tight">
                      {v.patronName || 'PURGED IDENTITY'}
                    </td>
                    <td className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase leading-tight">
                      {(v.patronDepartments && v.patronDepartments[0]) || 'Unassigned'}
                    </td>
                    <td className="px-8 py-4">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{v.patronRole || 'Patron'}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {v.purpose || 'Visit'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right no-print">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setVisitToDelete(v.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredVisits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-20">
                          <TableIcon className="h-12 w-12" />
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">No identity records match active filters</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if(!open) setAdminSignature(''); }}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden sm:max-w-md bg-white">
          <DialogHeader className="p-12 bg-red-600 text-white text-center">
            <div className="mx-auto bg-white/20 p-5 rounded-full w-fit mb-6">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Authorize Linked Purge?</DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center space-y-6">
            <p className="text-sm font-bold text-slate-600 leading-relaxed">Warning: This will permanently remove this identity AND all associated visit logs from the institutional database.</p>
            
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-red-500 mb-2">
                <PenTool className="h-4 w-4" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Administrative Signature Required</Label>
              </div>
              <Input 
                placeholder="Admin Name / Staff ID" 
                value={adminSignature}
                onChange={(e) => setAdminSignature(e.target.value)}
                className="h-12 rounded-xl border-slate-200 font-bold text-center text-sm shadow-inner"
              />
            </div>
          </div>
          <DialogFooter className="p-10 bg-slate-50 border-t grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setAdminSignature(''); }} className="h-14 font-black uppercase text-[10px] tracking-widest border-slate-200 rounded-2xl bg-white shadow-sm">Abort</Button>
            <Button 
              onClick={handleDeleteVisit} 
              disabled={!adminSignature.trim() || isDeleting}
              className={cn(
                "h-14 font-black uppercase text-[10px] tracking-widest text-white rounded-2xl shadow-xl transition-all",
                adminSignature.trim() && !isDeleting ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-slate-300 cursor-not-allowed"
              )}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { 
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            height: 100% !important; 
            margin: 0 !important; 
            padding: 1.5cm !important; 
            box-shadow: none !important; 
            border: none !important; 
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
