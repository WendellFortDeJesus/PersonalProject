"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  Legend, 
  Area, 
  AreaChart,
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
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

  const { data: rawVisits, isLoading } = useCollection(visitsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !config) return null;

    const filteredVisits = rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return !dateRange.from || !dateRange.to || isWithinInterval(visitDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });
    });

    const totalDays = Math.max(1, differenceInDays(dateRange.to || new Date(), dateRange.from || subDays(new Date(), 30)));
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const hourlyMap: Record<string, number> = Array.from({ length: 11 }, (_, i) => ({ 
      time: `${8 + i}:00`, 
      count: 0 
    })).reduce((acc, curr) => ({ ...acc, [curr.time]: 0 }), {});

    const uniquePatrons = new Set();

    filteredVisits.forEach(v => {
      uniquePatrons.add(v.patronId);
      v.patronDepartments?.forEach((d: string) => {
        deptMap[d] = (deptMap[d] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
      
      const hour = new Date(v.timestamp).getHours();
      if (hour >= 8 && hour <= 18) {
        const timeKey = `${hour}:00`;
        if (hourlyMap[timeKey] !== undefined) hourlyMap[timeKey]++;
      }
    });

    const deptDistributionData = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const trafficFlowData = Object.entries(hourlyMap).map(([time, count]) => ({ time, count }));

    return { 
      deptDistributionData, 
      purposeData, 
      trafficFlowData, 
      total: filteredVisits.length,
      uniqueCount: uniquePatrons.size,
      filteredVisits,
      summary: {
        peakHour: Object.entries(hourlyMap).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A',
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`
      }
    };
  }, [rawVisits, dateRange, config]);

  if (isLoading) return <div className="p-32 text-center font-black uppercase tracking-widest text-primary/40 animate-pulse">Initializing BI Suite...</div>;

  const CHART_COLORS = ['#006837', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-8 animate-fade-in pb-16 fluid-container">
      {/* Tier 1: Global Filters & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-4 bento-tile flex flex-col justify-center gap-4 h-full">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Intelligence</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-14 rounded-2xl font-black gap-3 px-6 border-slate-200 justify-start w-full">
                {analytics?.summary.dateRangeStr}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden shadow-2xl" align="start">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bento-tile p-6 flex flex-col justify-between h-full bg-primary text-white border-none shadow-xl">
            <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Total Attendance</p>
            <h3 className="text-3xl font-mono font-medium mt-2">{analytics?.total}</h3>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[9px] font-bold text-accent">Real-time</span>
            </div>
          </Card>

          <Card className="bento-tile p-6 flex flex-col justify-between h-full">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unique Patrons</p>
            <h3 className="text-3xl font-mono font-medium text-primary mt-2">{analytics?.uniqueCount}</h3>
            <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Registered IDs</span>
          </Card>

          <Card className="bento-tile p-6 flex flex-col justify-between h-full">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Peak Time</p>
            <h3 className="text-3xl font-mono font-medium text-primary mt-2">{analytics?.summary.peakHour}</h3>
            <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Daily Zenith</span>
          </Card>

          <Card className="bento-tile p-6 flex flex-col justify-between h-full bg-slate-900 border-none">
            <Button onClick={() => setIsPreviewOpen(true)} className="w-full h-full bg-primary hover:bg-primary/90 rounded-2xl flex flex-col items-center justify-center p-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Generate BI Report</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Tier 2: The Visual Layer (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bento-tile h-[500px] flex flex-col p-0 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-primary uppercase tracking-tighter leading-none">Utilization Intelligence</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departmental traffic flow ranking</p>
            </div>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={180} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#334155', fontFamily: 'Inter'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={40}>
                  {analytics?.deptDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bento-tile h-[500px] flex flex-col p-0 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter leading-none">Purpose Distribution</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Facility intent breakdown</p>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 700, fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tier 3: Heatmap & Analysis */}
      <div className="bento-tile p-0 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Density Heatmap</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hourly engagement across active window</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded-sm" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Low</span>
              <div className="w-3 h-3 bg-primary rounded-sm ml-2" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Peak</span>
            </div>
            <Badge variant="outline" className="h-8 px-4 rounded-xl border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-widest">
              Live Feed
            </Badge>
          </div>
        </div>
        <div className="p-10 grid grid-cols-11 gap-4">
          {analytics?.trafficFlowData.map((hour, idx) => (
            <div key={idx} className="flex flex-col gap-3 items-center">
              <div 
                className="w-full aspect-square rounded-2xl transition-all duration-500 shadow-inner"
                style={{ 
                  backgroundColor: hour.count > 0 ? `rgba(0, 104, 55, ${Math.min(1, 0.15 + (hour.count / 12))})` : '#f1f5f9' 
                }}
              />
              <span className="text-[10px] font-mono font-bold text-slate-400">{hour.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1000px] h-[95vh] flex flex-col p-0 border-none rounded-[3.5rem] shadow-2xl overflow-hidden">
          <div className="p-10 bg-slate-900 text-white flex items-center justify-between shrink-0">
             <div className="space-y-1">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Institutional BI Audit</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Authorized Administrative Reporting Engine</DialogDescription>
            </div>
            <div className="flex gap-4">
               <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl">
                Finalize PDF
              </Button>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="text-white/40 hover:text-white rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-xs">
                Close Audit
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-16">
            <div className="bg-white shadow-2xl mx-auto max-w-[850px] min-h-[1100px] p-24 flex flex-col rounded-[3rem] border border-slate-200">
              <div className="flex items-center justify-between border-b-[8px] border-slate-900 pb-12 mb-20">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">NEU Central Library</h1>
                  <p className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] pt-2">Office of the Chief Librarian</p>
                </div>
                <div className="text-right text-[11px] font-black text-slate-400 leading-loose uppercase tracking-widest">
                  Ref: LIB-{format(new Date(), 'yyyyMMdd')}<br/>
                  Auth: SYSTEM_ROOT<br/>
                  TS: {format(new Date(), 'HH:mm:ss')}
                </div>
              </div>

              <div className="text-center mb-20 space-y-6">
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Utilization Summary</h2>
                <div className="inline-block px-10 py-3 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-lg">
                  {analytics?.summary.dateRangeStr}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 mb-16">
                 <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Visits</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.total}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Unique Users</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.uniqueCount}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Peak Period</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.summary.peakHour}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border-2 border-slate-900 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-6 uppercase tracking-widest text-[10px] font-black">Patron Identity</th>
                      <th className="p-6 uppercase tracking-widest text-[10px] font-black">Academic Unit</th>
                      <th className="p-6 uppercase tracking-widest text-[10px] font-black">Intent</th>
                      <th className="p-6 text-right uppercase tracking-widest text-[10px] font-black">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.filteredVisits.slice(0, 15).map((v) => (
                      <tr key={v.id} className="zebra-row">
                        <td className="p-6">
                          <p className="font-black text-slate-900 uppercase leading-none">{v.patronName}</p>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase pt-1 tracking-tighter">{v.schoolId}</p>
                        </td>
                        <td className="p-6 font-bold text-slate-600 uppercase text-[10px] leading-tight max-w-[200px] truncate">{v.patronDepartments?.join(', ')}</td>
                        <td className="p-6">
                           <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 rounded-lg">
                            {v.purpose}
                          </Badge>
                        </td>
                        <td className="p-6 text-right font-mono text-[10px] font-bold text-slate-400 uppercase">
                          {format(new Date(v.timestamp), 'MM/dd HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto pt-16 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                <p>PATRONPOINT SECURE BI ENGINE</p>
                <div className="flex items-center gap-2">
                  <p>OFFICIAL UNIVERSITY RECORD</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
