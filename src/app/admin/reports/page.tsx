"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
    if (!rawVisits) return null;

    const filteredVisits = rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return !dateRange.from || !dateRange.to || isWithinInterval(visitDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });
    });

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
        const name = d.split(':')[0];
        deptMap[name] = (deptMap[name] || 0) + 1;
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
  }, [rawVisits, dateRange]);

  if (isLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-8 animate-fade-in pb-16 fluid-container">
      {/* Tier 1: System Filters & KPI Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 bg-white border rounded-2xl p-8 shadow-sm flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Filter</p>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Reporting Range</h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-14 rounded-xl font-black gap-3 px-6 border-slate-200 justify-start w-full text-xs uppercase tracking-tight">
                {analytics?.summary.dateRangeStr}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
            </PopoverContent>
          </Popover>
          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">System Status</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Intelligence Active
            </span>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-8 flex flex-col justify-between h-full bg-primary text-white border-none shadow-xl rounded-2xl">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total Traffic</p>
            <h3 className="text-4xl font-mono font-medium mt-4">{analytics?.total}</h3>
            <span className="text-[9px] font-bold text-accent uppercase mt-2 tracking-widest">Aggregate Count</span>
          </Card>

          <Card className="p-8 flex flex-col justify-between h-full bg-white border rounded-2xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unique Patrons</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.uniqueCount}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Identified IDs</span>
          </Card>

          <Card className="p-8 flex flex-col justify-between h-full bg-white border rounded-2xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Peak window</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.summary.peakHour}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Busiest period</span>
          </Card>

          <Card className="p-2 bg-slate-900 border-none rounded-2xl shadow-sm">
            <Button onClick={() => setIsPreviewOpen(true)} className="w-full h-full bg-primary hover:bg-primary/90 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:scale-[1.02]">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Generate Official PDF</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Tier 2: Distribution Visuals (70/30 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border rounded-2xl h-[550px] flex flex-col p-0 overflow-hidden shadow-sm">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tighter leading-none">College Attendance Density</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparative usage ranking by academic unit</p>
            </div>
          </div>
          <div className="flex-1 p-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={220} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#64748b', fontFamily: 'Inter'}} 
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'}} 
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {analytics?.deptDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-2xl h-[550px] flex flex-col p-0 overflow-hidden shadow-sm">
          <div className="p-10 border-b bg-slate-50/50">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter leading-none">Visit intent</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Primary motivation breakdown</p>
          </div>
          <div className="flex-1 p-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={90} outerRadius={125} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase'}} 
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{paddingTop: '30px', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase'}} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tier 3: High-Density Hourly Heatmap */}
      <div className="bg-white border rounded-2xl p-0 overflow-hidden shadow-sm">
        <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Engagement Heatmap</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hourly visitor density across terminal operational hours</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/10 rounded-sm" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Idle</span>
              <div className="w-3 h-3 bg-primary rounded-sm ml-4" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Zenith</span>
            </div>
            <Badge variant="outline" className="h-9 px-6 rounded-xl border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-widest">
              High Density Analytics
            </Badge>
          </div>
        </div>
        <div className="p-12 grid grid-cols-11 gap-6">
          {analytics?.trafficFlowData.map((hour, idx) => (
            <div key={idx} className="flex flex-col gap-4 items-center group">
              <div 
                className="w-full aspect-square rounded-xl transition-all duration-500 shadow-inner group-hover:scale-110"
                style={{ 
                  backgroundColor: hour.count > 0 ? `rgba(0, 104, 55, ${Math.min(1, 0.15 + (hour.count / 15))})` : '#f8fafc' 
                }}
              />
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter">{hour.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1000px] h-[95vh] flex flex-col p-0 border-none rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="p-10 bg-slate-900 text-white flex items-center justify-between shrink-0">
             <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Official Library Records</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Institutional Visitor Management Division</DialogDescription>
            </div>
            <div className="flex gap-4">
               <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-14 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl">
                Export PDF
              </Button>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="text-white/40 hover:text-white rounded-xl h-14 px-6 font-black uppercase tracking-widest text-[11px]">
                Close
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-16">
            <div className="bg-white shadow-2xl mx-auto max-w-[850px] min-h-[1100px] p-20 flex flex-col rounded-[2.5rem] border border-slate-200">
              <div className="flex items-center justify-between border-b-[6px] border-slate-900 pb-10 mb-16">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">NEU Central Library</h1>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] pt-2">Administrative Registry Section</p>
                </div>
                <div className="text-right text-[10px] font-black text-slate-400 leading-loose uppercase tracking-widest">
                  Reference: LIB-{format(new Date(), 'yyyyMMdd')}<br/>
                  Authority: Institutional Root<br/>
                  Compiled: {format(new Date(), 'PP p')}
                </div>
              </div>

              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Attendance Analytics</h2>
                <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                  {analytics?.summary.dateRangeStr}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-12">
                 <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Entries</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.total}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Unique Users</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.uniqueCount}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Peak window</p>
                  <p className="text-3xl font-mono font-medium text-slate-900">{analytics?.summary.peakHour}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-mono">
                    <tr>
                      <th className="p-5 uppercase tracking-widest text-[9px] font-black">Patron Identity</th>
                      <th className="p-5 uppercase tracking-widest text-[9px] font-black">College / Unit</th>
                      <th className="p-5 uppercase tracking-widest text-[9px] font-black">Intent</th>
                      <th className="p-5 text-right uppercase tracking-widest text-[9px] font-black">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.filteredVisits.slice(0, 20).map((v) => (
                      <tr key={v.id} className="zebra-row group">
                        <td className="p-5">
                          <p className="font-black text-slate-900 uppercase leading-none">{v.patronName}</p>
                          <p className="text-[8px] font-mono font-bold text-slate-400 uppercase pt-1 tracking-tighter">{v.schoolId}</p>
                        </td>
                        <td className="p-5 font-bold text-slate-600 uppercase text-[9px] leading-tight max-w-[200px] truncate">{v.patronDepartments?.join(', ')}</td>
                        <td className="p-5">
                           <span className="text-[8px] font-black uppercase text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                            {v.purpose}
                          </span>
                        </td>
                        <td className="p-5 text-right font-mono text-[9px] font-bold text-slate-400 uppercase">
                          {format(new Date(v.timestamp), 'MM/dd HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto pt-10 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                <p>PATRONPOINT SECURE REPORTING</p>
                <div className="flex items-center gap-2">
                  <p>CONFIDENTIAL UNIVERSITY DOCUMENT</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
