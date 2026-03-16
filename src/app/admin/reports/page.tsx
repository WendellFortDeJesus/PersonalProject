"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { FileDown, Filter, Printer, Download, ShieldCheck, Library, Calendar, Users, GraduationCap, Briefcase, UserPlus } from 'lucide-react';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const db = useFirestore();
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [purpose, setPurpose] = useState('all');
  const [college, setCollege] = useState('all');
  const [role, setRole] = useState('all');
  const [generatedOn, setGeneratedOn] = useState<string | null>(null);

  useEffect(() => {
    // Stability fix for hydration mismatches
    setGeneratedOn(format(new Date(), 'MMMM dd, yyyy HH:mm'));
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);
  const { data: visits, isLoading } = useCollection(visitsQuery);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    return visits.filter(v => {
      const vDate = new Date(v.timestamp);
      const inRange = isWithinInterval(vDate, {
        start: startOfDay(new Date(dateFrom)),
        end: endOfDay(new Date(dateTo))
      });
      const matchesPurpose = purpose === 'all' || v.purpose === PURPOSES.find(p => p.id === purpose)?.label;
      const matchesCollege = college === 'all' || v.patronDepartments?.[0] === college;
      const matchesRole = role === 'all' || v.patronRole === role;
      
      return inRange && matchesPurpose && matchesCollege && matchesRole;
    });
  }, [visits, dateFrom, dateTo, purpose, college, role]);

  const reportStats = useMemo(() => {
    const students = filteredVisits.filter(v => v.patronRole === 'Student').length;
    const employees = filteredVisits.filter(v => v.patronRole === 'Faculty' || v.patronRole === 'Staff').length;
    const external = filteredVisits.filter(v => v.patronRole === 'Visitor').length;

    const purposeMap = filteredVisits.reduce((acc, v) => {
      acc[v.purpose] = (acc[v.purpose] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topPurpose = Object.entries(purposeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const deptMap = filteredVisits.reduce((acc, v) => {
      const dept = v.patronDepartments?.[0] || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topDept = Object.entries(deptMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { total: filteredVisits.length, students, employees, external, topPurpose, topDept };
  }, [filteredVisits]);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Audits</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Strategic Intelligence Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-sm">
            <Printer className="h-3.5 w-3.5 mr-2" />
            Print
          </Button>
          <Button className="rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-md shadow-primary/10">
            <Download className="h-3.5 w-3.5 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid - VISIBLE ON DASHBOARD & REPORT */}
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
                <SelectItem value="Student" className="font-bold text-[10px]">Student</SelectItem>
                <SelectItem value="Faculty" className="font-bold text-[10px]">Faculty</SelectItem>
                <SelectItem value="Staff" className="font-bold text-[10px]">Staff</SelectItem>
                <SelectItem value="Visitor" className="font-bold text-[10px]">Visitor</SelectItem>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-3 text-[9px] font-mono font-bold text-slate-400">{format(new Date(v.timestamp), 'HH:mm | MM/dd')}</td>
                  <td className="px-6 py-3 text-[10px] font-black text-primary uppercase">{v.patronName}</td>
                  <td className="px-6 py-3 text-[9px] font-bold text-slate-500 uppercase">{v.patronDepartments?.[0] || 'Unassigned'}</td>
                  <td className="px-6 py-3 text-[9px] font-black text-slate-600 uppercase tracking-tighter">{v.patronRole || '---'}</td>
                  <td className="px-6 py-3">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 tracking-widest">
                      {v.purpose}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
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
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">PATRONPOINT SECURE AUDIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
