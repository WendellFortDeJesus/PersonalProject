
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-4xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Audits</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Strategic Intelligence Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button className="rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] no-print bg-white/50 backdrop-blur-xl">
        <CardHeader className="p-8 border-b border-slate-100 bg-slate-50/50 rounded-t-[2.5rem]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Multivariate Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date Interval (From)</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date Interval (To)</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visit Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Intents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Intents</SelectItem>
                {PURPOSES.map(p => <SelectItem key={p.id} value={p.id} className="font-bold text-xs">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">College / Office</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Academic Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Units</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="font-bold text-xs">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visitor Profile</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">All Roles</SelectItem>
                <SelectItem value="Student" className="font-bold text-xs">Student</SelectItem>
                <SelectItem value="Faculty" className="font-bold text-xs">Faculty</SelectItem>
                <SelectItem value="Staff" className="font-bold text-xs">Staff</SelectItem>
                <SelectItem value="Visitor" className="font-bold text-xs">Visitor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white p-16 rounded-[3rem] shadow-2xl border-none min-h-[800px] print:shadow-none print:p-0 print:m-0 print:rounded-none">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary rounded-[1.5rem] shadow-lg shadow-primary/20">
              <Library className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-headline font-black text-primary uppercase tracking-tighter">Official Audit Report</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PatronPoint | NEU University Central Library</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            {/* NEU Logo Placeholder */}
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300">
               <span className="text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter">NEU LOGO</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Timestamp</p>
            <p className="text-sm font-black text-primary">{generatedOn || '---'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Record Count</p>
            <p className="text-4xl font-black text-primary tracking-tighter">{filteredVisits.length}</p>
          </div>
          <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Audit Window</p>
            <p className="text-sm font-black text-primary uppercase leading-tight">
              {format(new Date(dateFrom), 'MMMM dd, yyyy')} <br/> 
              <span className="text-slate-400 text-[9px] font-bold">UNTIL</span> <br/>
              {format(new Date(dateTo), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verification Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm font-black text-green-600 uppercase tracking-tight">System Validated</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Log Timestamp</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Patron Full Name</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Registry ID</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Academic Unit</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Primary Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-5 text-[10px] font-mono font-bold text-slate-400">{format(new Date(v.timestamp), 'HH:mm:ss | MM/dd')}</td>
                  <td className="px-10 py-5 text-[11px] font-black text-primary uppercase">{v.patronName}</td>
                  <td className="px-10 py-5 text-[11px] font-mono font-bold text-slate-600">{v.schoolId || 'SSO'}</td>
                  <td className="px-10 py-5 text-[10px] font-bold text-slate-500 uppercase">{v.patronDepartments?.[0] || 'Unassigned'}</td>
                  <td className="px-10 py-5">
                    <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10 tracking-widest">
                      {v.purpose}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="space-y-3">
                       <FileDown className="h-10 w-10 text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No registry records match the selected audit criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-32 pt-12 border-t border-dashed border-slate-200 flex justify-between items-end print:mt-12">
          <div className="space-y-2">
            <div className="w-64 h-px bg-slate-300 mb-6" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Authorized Librarian Signature</p>
            <p className="text-sm font-black text-primary uppercase">University Chief Librarian</p>
          </div>
          <div className="flex items-center gap-3 text-primary opacity-30 select-none">
            <ShieldCheck className="h-8 w-8" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">PATRONPOINT SECURE AUDIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
