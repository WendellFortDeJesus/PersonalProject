
"use client";

import React, { useState, useMemo, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  FileText,
  Printer,
  Calendar,
  Filter,
  Users,
  Building2,
  BookOpen,
  ArrowDownToLine
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, subDays } from 'date-fns';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';

const COLORS = ['#006837', '#FFD700', '#355872', '#7AAACE', '#9CD5FF', '#F59E0B', '#6366F1'];

export default function ReportsPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user, isUserLoading]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const filteredData = useMemo(() => {
    if (!rawVisits) return [];
    
    return rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      
      // Date Logic
      let dateMatch = true;
      if (dateFilter === 'today') dateMatch = isToday(visitDate);
      else if (dateFilter === 'week') dateMatch = isThisWeek(visitDate);
      else if (dateFilter === 'month') dateMatch = isThisMonth(visitDate);
      else if (dateFilter === 'yesterday') dateMatch = visitDate >= startOfDay(subDays(new Date(), 1)) && visitDate <= endOfDay(subDays(new Date(), 1));

      // Categorical Match
      const reasonMatch = reasonFilter === 'all' || v.purpose === reasonFilter;
      const collegeMatch = collegeFilter === 'all' || v.patronDepartments?.includes(collegeFilter);
      const roleMatch = roleFilter === 'all' || v.patronRole === roleFilter || (roleFilter === 'Student' && !v.patronRole); // Handle legacy or missing roles

      return dateMatch && reasonMatch && collegeMatch && roleMatch;
    });
  }, [rawVisits, dateFilter, reasonFilter, collegeFilter, roleFilter]);

  const analytics = useMemo(() => {
    if (!filteredData) return null;

    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const roleMap: Record<string, number> = {};
    
    filteredData.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
      const role = v.patronRole || 'Student';
      roleMap[role] = (roleMap[role] || 0) + 1;
    });

    const deptData = Object.entries(deptMap).map(([name, count]) => ({
      name: name.length > 20 ? name.substring(0, 17) + '...' : name,
      fullName: name,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 7);

    const intentData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const roleData = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    return { 
      deptData,
      intentData,
      roleData,
      totalCount: filteredData.length,
      topDept: deptData[0],
      topIntent: intentData.sort((a, b) => b.value - a.value)[0]
    };
  }, [filteredData]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="p-32 text-center bg-white h-screen">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="font-mono font-black text-primary uppercase tracking-[0.5em] text-[11px]">Compiling Strategic Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in bg-[#F8FAFC] p-8 font-body min-h-screen no-print">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Visual Intelligence</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Cumulative Institutional Behavior Hub</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-primary text-white hover:bg-primary/90 rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg">
                <ArrowDownToLine className="mr-3 h-4 w-4" />
                Export as PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl bg-white">
              <DialogHeader className="p-8 pb-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">Official Institutional Audit</DialogTitle>
              </DialogHeader>
              <div id="printable-report" className="p-16 space-y-12 report-container bg-white">
                <header className="flex justify-between items-start border-b-2 border-slate-900 pb-10">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline leading-none">PatronPoint Strategic Audit</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">NEU Library Visitor Record</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Report Generated</p>
                    <p className="text-xs font-mono font-bold text-slate-900">{format(new Date(), 'PPPP p')}</p>
                  </div>
                </header>

                <div className="grid grid-cols-3 gap-8">
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Scope</p>
                    <p className="text-lg font-black uppercase text-primary">{dateFilter.toUpperCase()}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Verified Entries</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{analytics?.totalCount}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Academic Unit</p>
                    <p className="text-sm font-black uppercase text-slate-900">{analytics?.topDept?.fullName || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Departmental Impact Matrix</h3>
                    <div className="h-[250px] w-full bg-slate-50/50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.deptData ?? []}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                          <Bar dataKey="count" fill="#006837" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Visit Intent Distribution</h3>
                    <div className="h-[250px] w-full flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics?.intentData ?? []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analytics?.intentData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Verified Identity Feed (Filtered)</h3>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-900">
                      <tr>
                        <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest">Time</th>
                        <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest">Name & Registry ID</th>
                        <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest">Academic Unit</th>
                        <th className="px-4 py-3 font-black text-slate-900 uppercase tracking-widest">Intent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.slice(0, 15).map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-3 font-mono font-bold text-slate-400">{format(new Date(v.timestamp), 'hh:mm aa')}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 uppercase">{v.patronName}</span>
                              <span className="font-mono text-slate-400">{v.schoolId || 'SSO'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 uppercase font-bold text-slate-500">{v.patronDepartments?.[0]}</td>
                          <td className="px-4 py-3 uppercase font-black text-primary">{v.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredData.length > 15 && (
                    <p className="text-[8px] font-bold text-slate-400 uppercase text-center italic">... and {filteredData.length - 15} more verified records</p>
                  )}
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-11">Cancel</Button>
                <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-xl h-11">
                  <Printer className="mr-3 h-4 w-4" />
                  Print Official Audit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card className="p-6 bg-white border-none shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Date Range
            </label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <BookOpen className="h-3 w-3" /> Visit Reason
            </label>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {PURPOSES.map(p => (
                  <SelectItem key={p.id} value={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Building2 className="h-3 w-3" /> College / Office
            </label>
            <Select value={collegeFilter} onValueChange={setCollegeFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Users className="h-3 w-3" /> User Category
            </label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Faculty">Faculty</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Visitor">Visitor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 p-8 border-none shadow-sm bg-white rounded-3xl min-h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline">Departmental Engagement</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Top 7 Units by Volume</p>
            </div>
            <Badge variant="outline" className="h-6 text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/10">Active Filters Applied</Badge>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptData ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', textTransform: 'uppercase' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 700, color: '#006837' }}
                />
                <Bar dataKey="count" fill="#006837" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-8">
          <Card className="p-8 border-none shadow-sm bg-white rounded-3xl flex flex-col items-center">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-headline mb-8 w-full">Intent Distribution</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.intentData ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics?.intentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-primary text-white rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
            <Users className="h-8 w-8 text-accent" />
            <div className="space-y-1">
              <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Scope Visitors</h4>
              <p className="text-4xl font-mono font-black text-white">{analytics?.totalCount}</p>
            </div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Verified Institutional Identity</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
