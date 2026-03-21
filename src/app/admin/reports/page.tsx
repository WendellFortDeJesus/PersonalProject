
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, getDoc, writeBatch, where, getDocs } from 'firebase/firestore';
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
  Loader2
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
  
  // State for deletion
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
        const matchesPurpose = purpose === 'all' || v.purpose === PURPOSES.find(p => p.id === purpose)?.label;
        const matchesCollege = college === 'all' || (v.patronDepartments && v.patronDepartments[0] === college);
        const matchesRole = role === 'all' || v.patronRole === role;
        
        return inRange && matchesPurpose && matchesCollege && matchesRole;
      } catch (e) {
        return false;
      }
    });
  }, [visits, dateFrom, dateTo, purpose, college, role]);

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
        
        // BI-DIRECTIONAL DELETION: Delete patron profile
        const patronRef = doc(db, 'patrons', patronId);
        batch.delete(patronRef);
        
        // CASCADE DELETION: Delete all logs associated with this patron
        const q = query(collection(db, 'visits'), where('patronId', '==', patronId));
        const visitsSnap = await getDocs(q);
        visitsSnap.docs.forEach(d => batch.delete(d.ref));
        
        await batch.commit();
        toast({ 
          title: "Linked Identity Purged", 
          description: `Patron and all associated logs erased from registry by ${adminSignature}.` 
        });
      }

      setIsDeleteDialogOpen(false);
      setVisitToDelete(null);
      setAdminSignature('');
    } catch (error) {
      toast({ variant: "destructive", title: "Action Failed", description: "Failed to execute linked deletion." });
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
    setIsExporting(true);
    setTimeout(() => {
      handlePrint();
      setIsExporting(false);
      toast({ title: "Export Initialized", description: "Audit document is being prepared for save." });
    }, 300);
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

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Audits</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Strategic Intelligence Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            type="button"
            aria-label="Print audit report"
            onClick={handlePrint} 
            variant="outline" 
            className="rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Printer className="h-3.5 w-3.5 mr-2" />
            Print
          </Button>
          <Button 
            type="button"
            aria-label="Export audit report as PDF"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-md shadow-primary/10 hover:bg-primary/90 transition-all active:scale-95"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {[
          { title: "Filtered Records", value: reportStats.total, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { title: "Students", value: reportStats.students, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Employees", value: reportStats.employees, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "External Visitors", value: reportStats.external, icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
          { title: "Primary Intent", value: reportStats.topPurpose, icon: Library, color: "text-slate-700", bg: "bg-slate-100" },
          { title: "Peak Academic Unit", value: reportStats.topDept, icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.title}</p>
              <h3 className="text-sm font-black text-primary tracking-tight truncate leading-tight">
                {stat.value}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md rounded-[1.5rem] no-print bg-white/50 backdrop-blur-xl">
        <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-[1.5rem]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Multivariate Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={setToday} variant="ghost" className="h-7 text-[8px] font-black uppercase tracking-widest hover:bg-white border border-slate-100 rounded-lg px-3">Today</Button>
              <Button onClick={setThisWeek} variant="ghost" className="h-7 text-[8px] font-black uppercase tracking-widest hover:bg-white border border-slate-100 rounded-lg px-3">This Week</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Date From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Date To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[10px]">
                <SelectValue placeholder="All Intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-[10px]">All Intents</SelectItem>
                {PURPOSES.map(p => <SelectItem key={p.id} value={p.id} className="font-bold text-[10px]">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">College / Unit</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[10px]">
                <SelectValue placeholder="All Academic Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-[10px]">All Units</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="font-bold text-[10px]">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Profile Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[10px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-[10px]">All Roles</SelectItem>
                {allPossibleRoles.map(r => (
                  <SelectItem key={r} value={r} className="font-bold text-[10px]">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-slate-100 min-h-[800px] print:shadow-none print:p-4 print:m-0 print:rounded-none">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl shadow-md">
              <Library className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Official Audit Report</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">NEU University Central Library</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-dashed border-slate-200">
               <span className="text-[6px] font-black text-slate-400 text-center uppercase tracking-tighter">NEU LOGO</span>
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Audit Timestamp</p>
            <p className="text-[10px] font-black text-primary">{generatedOn || '---'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-5 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Record Count</p>
            <p className="text-2xl font-black text-primary tracking-tighter">{filteredVisits.length}</p>
          </div>
          <div className="p-5 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Window</p>
            <p className="text-[9px] font-black text-primary uppercase leading-tight">
              {format(new Date(dateFrom), 'MM/dd/yy')} - {format(new Date(dateTo), 'MM/dd/yy')}
            </p>
          </div>
          <div className="p-5 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[9px] font-black text-green-600 uppercase tracking-tight">System Validated</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Log Timestamp</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Patron Full Name</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Institutional Unit</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Role</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Primary Intent</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-3 text-[9px] font-mono font-bold text-slate-400">{v.timestamp ? format(new Date(v.timestamp), 'HH:mm | MM/dd') : '---'}</td>
                  <td className="px-6 py-3 text-[10px] font-black text-primary uppercase">{v.patronName || 'PURGED IDENTITY'}</td>
                  <td className="px-6 py-3 text-[9px] font-bold text-slate-500 uppercase">{(v.patronDepartments && v.patronDepartments[0]) || 'Unassigned'}</td>
                  <td className="px-6 py-3 text-[9px] font-black text-slate-600 uppercase tracking-tighter">{v.patronRole || 'Patron'}</td>
                  <td className="px-6 py-3">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 tracking-widest">
                      {v.purpose || 'Visit'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right no-print">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setVisitToDelete(v.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="space-y-2">
                       <FileDown className="h-8 w-8 text-slate-200 mx-auto" />
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">No registry records match the selected audit criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-20 pt-8 border-t border-dashed border-slate-200 flex justify-between items-end print:mt-10">
          <div className="space-y-1">
            <div className="w-48 h-px bg-slate-300 mb-4" />
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Librarian Signature</p>
            <p className="text-[10px] font-black text-primary uppercase">University Chief Librarian</p>
          </div>
          <div className="flex items-center gap-2 text-primary opacity-20 select-none">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-[8px] font-black uppercase tracking-widest tracking-[0.3em]">PATRONPOINT SECURE AUDIT</span>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if(!open) setAdminSignature(''); }}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden sm:max-w-md bg-white">
          <DialogHeader className="p-12 bg-red-600 text-white text-center">
            <div className="mx-auto bg-white/20 p-5 rounded-full w-fit mb-6">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white">Linked Identity Purge?</DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center space-y-6">
            <p className="text-sm font-bold text-slate-600 leading-relaxed">Warning: This will permanently remove this identity AND all associated logs from the institutional database.</p>
            
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
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Please sign to authorize this permanent removal.</p>
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
    </div>
  );
}
