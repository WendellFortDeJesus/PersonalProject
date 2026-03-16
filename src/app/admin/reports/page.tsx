
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FileDown, Filter, Printer, Download, ShieldCheck, Library } from 'lucide-react';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-4xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Reports & Analytics</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Audit Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-11 px-6">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button className="rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] no-print">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50 rounded-t-[2.5rem]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Intelligence Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visit Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Purposes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {PURPOSES.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">College / Office</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">User Type</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Faculty">Faculty</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border-none min-h-[600px] print:shadow-none print:p-0 print:m-0">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl">
              <Library className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-headline font-black text-primary uppercase tracking-tighter">Official Audit Report</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PatronPoint | University Central Library</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated On</p>
            <p className="text-sm font-black text-primary">{generatedOn || '...'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Record Count</p>
            <p className="text-3xl font-black text-primary">{filteredVisits.length}</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Interval</p>
            <p className="text-sm font-black text-primary uppercase">
              {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd')}
            </p>
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
            <p className="text-sm font-black text-green-600 uppercase">Verified Session</p>
          </div>
        </div>

        <div className="border rounded-[2rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Patron Name</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">School ID</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">College</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4 text-[10px] font-mono font-bold text-slate-400">{format(new Date(v.timestamp), 'HH:mm | MMM dd')}</td>
                  <td className="px-8 py-4 text-[10px] font-black text-primary uppercase">{v.patronName}</td>
                  <td className="px-8 py-4 text-[10px] font-mono font-bold text-slate-600">{v.schoolId || 'SSO'}</td>
                  <td className="px-8 py-4 text-[10px] font-bold text-slate-500">{v.patronDepartments?.[0] || 'Unassigned'}</td>
                  <td className="px-8 py-4">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 tracking-widest">
                      {v.purpose}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching records found for the selected interval</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-20 pt-10 border-t border-dashed flex justify-between items-end print:mt-10">
          <div className="space-y-1">
            <div className="w-48 h-px bg-slate-300 mb-4" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified by Institutional Node</p>
            <p className="text-xs font-black text-primary uppercase">Chief Librarian</p>
          </div>
          <div className="flex items-center gap-2 text-primary opacity-20">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">SECURE SYSTEM GENERATED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
