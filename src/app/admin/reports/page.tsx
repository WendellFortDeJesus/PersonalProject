
"use client";

import { useState, useMemo, useEffect } from 'react';
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
  Label
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Calendar as CalendarIcon, Download, Users, UserCheck, ShieldCheck, Activity, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const db = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user]);

  const patronsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'patrons'));
  }, [db, user]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: rawPatrons, isLoading: isPatronsLoading } = useCollection(patronsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !selectedDate || !rawPatrons) return null;

    const filteredVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), selectedDate));
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    
    filteredVisits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const deptRankingData = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name: config?.departments?.find((d: any) => d.name === name)?.code || name,
        fullName: name,
        count,
        color: config?.departments?.find((d: any) => d.name === name)?.color || '#006837'
      }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const mostEngagedDept = deptRankingData[0];
    const totalTodayHits = filteredVisits.length;
    const trafficShare = totalTodayHits > 0 && mostEngagedDept ? Math.round((mostEngagedDept.count / totalTodayHits) * 100) : 0;

    return { 
      deptRankingData, 
      purposeData, 
      activePresence: filteredVisits.filter(v => v.status === 'granted').length,
      mostEngagedDept,
      trafficShare,
      registrySize: rawPatrons.length,
      totalToday: totalTodayHits,
      filteredVisits,
      dateStr: format(selectedDate, 'PPP')
    };
  }, [rawVisits, rawPatrons, selectedDate, config]);

  const handleDownloadCSV = () => {
    if (!analytics?.filteredVisits || analytics.filteredVisits.length === 0) return;

    const headers = ["Timestamp", "Patron Name", "School ID", "Department", "Purpose", "Status"];
    const rows = analytics.filteredVisits.map(v => [
      format(new Date(v.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      `"${v.patronName?.replace(/"/g, '""') || ''}"`,
      v.schoolId || v.patronEmail || '',
      `"${v.patronDepartments?.join(', ') || ''}"`,
      `"${v.purpose || ''}"`,
      v.status || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NEU_Library_Audit_${format(selectedDate!, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isVisitsLoading || isPatronsLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-8 font-body min-h-screen">
      <header className="flex justify-between items-end pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Institutional Audit</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Strategic Behavior & Departmental Impact</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 rounded-xl font-black border-slate-200 text-[10px] px-6 uppercase tracking-widest bg-white shadow-sm">
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {analytics?.dateStr}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="end">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
          </PopoverContent>
        </Popover>
      </header>

      {/* KPI Tiles (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Presence</p>
            <Users className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-mono font-bold text-slate-900 leading-none">{analytics?.activePresence}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Currently Inside</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm col-span-1 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck className="h-24 w-24" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departmental Lead (Undivided)</p>
            <ShieldCheck className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-primary uppercase leading-tight font-headline truncate">{analytics?.mostEngagedDept?.fullName || 'N/A'}</h3>
            <div className="flex gap-6 mt-3">
              <div className="space-y-1">
                <p className="text-[11px] font-mono font-bold text-slate-900">{analytics?.mostEngagedDept?.count || 0}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Registry Hits</p>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-6">
                <p className="text-[11px] font-mono font-bold text-slate-900">{analytics?.trafficShare}%</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Traffic Share</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Registered</p>
            <UserCheck className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-mono font-bold text-slate-900 leading-none">{analytics?.registrySize}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Institutional Identities</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Department Leaderboard (Large) */}
        <div className="lg:col-span-8 bg-white border-none rounded-2xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Departmental Engagement</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Volume ranking by college</p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-300" />
          </div>
          <div className="p-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={analytics?.deptRankingData} margin={{ left: 20, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {analytics?.deptRankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Intent (Donut) */}
        <div className="lg:col-span-4 bg-white border-none rounded-2xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Visit Intent</h2>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Demand Analytics</p>
          </div>
          <div className="flex-1 min-h-[320px] p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={analytics?.purposeData} 
                  innerRadius={65} 
                  outerRadius={95} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <Label 
                    value="INTENT" 
                    position="center" 
                    style={{ fontSize: '10px', fontWeight: '900', fill: '#0F172A', textTransform: 'uppercase' }} 
                  />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Download Center */}
      <Card className="p-8 bg-primary rounded-[2rem] border-none shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-headline">Strategic Generation Center</h2>
          <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">Produce high-fidelity institutional audits for accreditation</p>
        </div>
        <Button 
          onClick={handleDownloadCSV} 
          disabled={!analytics?.filteredVisits || analytics.filteredVisits.length === 0}
          className="h-12 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-transform active:scale-95"
        >
          <Download className="h-4 w-4 mr-3" />
          Download CSV Audit
        </Button>
      </Card>

      {/* Audit Registry Table */}
      <div className="bg-white border-none rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">Institutional Registry Log</h2>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verification: {analytics?.dateStr}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Department</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400 text-center">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics?.filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">{format(new Date(v.timestamp), 'HH:mm:ss')}</td>
                  <td className="px-6 py-4 font-black text-slate-900 uppercase tracking-tight font-headline">{v.patronName}</td>
                  <td className="px-6 py-4 uppercase font-bold text-slate-500 tracking-tight">{v.patronDepartments?.join(', ')}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-primary/5 text-primary px-3 py-1.5 rounded-full font-black uppercase text-[8px] border border-primary/10 tracking-widest">
                      {v.purpose}
                    </span>
                  </td>
                </tr>
              ))}
              {(!analytics?.filteredVisits || analytics.filteredVisits.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Waiting for Institutional Input...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
