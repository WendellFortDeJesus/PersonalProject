
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
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, getHours } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Calendar as CalendarIcon, Download, Users, TrendingUp, UserCheck, ShieldCheck } from 'lucide-react';

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

    const filteredVisits = rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return isSameDay(visitDate, selectedDate);
    });

    const activePresence = filteredVisits.filter(v => v.status === 'granted').length;
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const hourlyData: Record<number, number> = {};
    
    // Initialize hours 8am to 8pm
    for (let i = 8; i <= 20; i++) hourlyData[i] = 0;

    filteredVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      const hour = getHours(vDate);
      if (hour >= 8 && hour <= 20) {
        hourlyData[hour]++;
      }

      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const trendData = Object.entries(hourlyData).map(([hour, count]) => ({
      time: `${hour}:00`,
      count
    }));

    const deptRankingData = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name, 
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
      trendData,
      activePresence,
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

    // CSV Headers
    const headers = ["Timestamp", "Patron Name", "School ID", "Department", "Purpose", "Status"];
    
    // Map data to CSV rows
    const rows = analytics.filteredVisits.map(v => [
      format(new Date(v.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      `"${v.patronName?.replace(/"/g, '""') || ''}"`,
      v.schoolId || v.patronEmail || '',
      `"${v.patronDepartments?.join(', ') || ''}"`,
      `"${v.purpose || ''}"`,
      v.status || ''
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and download link
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
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-6 font-body min-h-screen">
      <header className="flex justify-between items-end pb-4 border-b">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Institutional Audit</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Human Behavior & Departmental Impact</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 rounded-lg font-bold border-slate-200 text-[10px] px-4 uppercase tracking-widest">
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {analytics?.dateStr}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden shadow-2xl" align="end">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
          </PopoverContent>
        </Popover>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Presence</p>
            <Users className="h-4 w-4 text-primary/40" />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-slate-900 leading-none">{analytics?.activePresence}</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Currently Inside</p>
          </div>
        </Card>

        <Card className="p-5 bg-white border rounded-xl flex flex-col justify-between shadow-sm col-span-1 lg:col-span-2">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Most Engaged Department (Detailed)</p>
            <ShieldCheck className="h-4 w-4 text-primary/40" />
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-primary uppercase leading-tight truncate">{analytics?.mostEngagedDept?.name || 'N/A'}</h3>
            <div className="flex gap-4 mt-2">
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold text-slate-900">{analytics?.mostEngagedDept?.count || 0}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase">Registry Hits</p>
              </div>
              <div className="space-y-0.5 border-l pl-4">
                <p className="text-[10px] font-mono font-bold text-slate-900">{analytics?.trafficShare}%</p>
                <p className="text-[7px] font-black text-slate-400 uppercase">Traffic Share</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Size</p>
            <UserCheck className="h-4 w-4 text-primary/40" />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-slate-900 leading-none">{analytics?.registrySize}</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Unique Institutional IDs</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border rounded-xl flex flex-col shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Hourly Engagement Trend</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Selected Day Utilization</p>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-300" />
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="time" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} fontWeight={700} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={3} dot={{ r: 4, fill: '#006837' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-xl flex flex-col shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Visit Intent</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Resource Demand</p>
          </div>
          <div className="flex-1 min-h-[300px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 800}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Card className="p-8 bg-primary rounded-xl border-none shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Report Generation</h2>
          <p className="text-[9px] font-black text-primary-foreground/60 uppercase tracking-widest">Generate high-fidelity institutional audits</p>
        </div>
        <Button 
          onClick={handleDownloadCSV} 
          disabled={!analytics?.filteredVisits || analytics.filteredVisits.length === 0}
          className="h-11 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV Report
        </Button>
      </Card>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-widest">Audit Registry</h2>
          <span className="text-[8px] font-bold text-slate-400 uppercase">Verification Log: {analytics?.dateStr}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-white">
              <tr className="border-b">
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Time</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Visitor Identity</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Department</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics?.filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">{format(new Date(v.timestamp), 'HH:mm')}</td>
                  <td className="px-6 py-4 font-black text-slate-900 uppercase">{v.patronName}</td>
                  <td className="px-6 py-4 uppercase font-bold text-slate-500">{v.patronDepartments?.join(', ')}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-full font-black uppercase text-[8px] border border-primary/10">
                      {v.purpose}
                    </span>
                  </td>
                </tr>
              ))}
              {(!analytics?.filteredVisits || analytics.filteredVisits.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No activity recorded for this period</p>
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
