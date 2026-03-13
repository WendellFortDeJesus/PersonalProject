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
import { Download, Calendar as CalendarIcon, TrendingUp, Info } from 'lucide-react';

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

    filteredVisits.forEach(v => {
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
      filteredVisits,
      summary: {
        peakHour: Object.entries(hourlyMap).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A',
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`
      }
    };
  }, [rawVisits, dateRange, config]);

  if (isLoading) return <div className="p-32 text-center font-black uppercase tracking-widest text-primary/40">Compiling BI Suite...</div>;

  const CHART_COLORS = ['#006837', '#22c55e', '#a855f7', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-8 animate-fade-in pb-16 fluid-container">
      {/* Date Range Control Header */}
      <div className="bento-tile flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Visual Intelligence</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full-screen facility utilization record</p>
        </div>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl font-bold gap-2 px-6 border-slate-200">
                <CalendarIcon className="h-4 w-4" />
                {analytics?.summary.dateRangeStr}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="end">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setIsPreviewOpen(true)} className="h-12 px-8 bg-primary rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
            <Download className="h-3 w-3" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bento-tile h-[500px] flex flex-col p-0 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-primary uppercase tracking-tighter leading-none">Utilization Intelligence</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cross-departmental engagement ranking</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={180} axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 900, fill: '#334155'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
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
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter leading-none">Intent Distribution</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Reason for facility engagement</p>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 700, fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bento-tile p-0 overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Density Heatmap</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Peak engagement windows across time</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/20 rounded-sm" />
            <span className="text-[9px] font-bold text-slate-400">LOW</span>
            <div className="w-3 h-3 bg-primary rounded-sm ml-2" />
            <span className="text-[9px] font-bold text-slate-400">PEAK</span>
          </div>
        </div>
        <div className="p-10 grid grid-cols-11 gap-2">
          {analytics?.trafficFlowData.map((hour, idx) => (
            <div key={idx} className="flex flex-col gap-2 items-center">
              <div 
                className="w-full aspect-square rounded-xl transition-colors"
                style={{ 
                  backgroundColor: hour.count > 0 ? `rgba(0, 104, 55, ${Math.min(1, 0.2 + (hour.count / 10))})` : '#f1f5f9' 
                }}
              />
              <span className="text-[9px] font-mono font-bold text-slate-400">{hour.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1000px] h-[95vh] flex flex-col p-0 border-none rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
             <div className="space-y-1">
              <DialogTitle className="text-2xl font-black">OFFICIAL SYSTEM REPORT</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Audit-ready institutional record</DialogDescription>
            </div>
            <Button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs border border-white/20">
              Print PDF
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-12">
            <div className="bg-white shadow-2xl mx-auto max-w-[800px] min-h-[1050px] p-20 flex flex-col rounded-[2.5rem]">
              <div className="flex items-center justify-between border-b-[6px] border-slate-900 pb-10 mb-16">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">NEU Central Library</h1>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] pt-1">OFFICE OF THE CHIEF LIBRARIAN</p>
                </div>
                <div className="text-right text-[10px] font-black text-slate-400">REF: LIB-{format(new Date(), 'yyyyMMdd')}<br/>TS: {format(new Date(), 'HH:mm:ss')}</div>
              </div>
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Utilization Summary</h2>
                <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.3em]">{analytics?.summary.dateRangeStr}</div>
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-900">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-4 uppercase tracking-widest text-[10px]">Patron Identity</th>
                      <th className="p-4 uppercase tracking-widest text-[10px]">Academic Unit</th>
                      <th className="p-4 uppercase tracking-widest text-[10px]">Intent</th>
                      <th className="p-4 text-right uppercase tracking-widest text-[10px]">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.filteredVisits.slice(0, 15).map((v) => (
                      <tr key={v.id}>
                        <td className="p-4 font-black text-slate-900">{v.patronName}<br/><span className="text-[9px] font-bold text-slate-400 uppercase">{v.schoolId}</span></td>
                        <td className="p-4 font-bold text-slate-600">{v.patronDepartments?.join(', ')}</td>
                        <td className="p-4 font-black text-primary uppercase text-[9px]">{v.purpose}</td>
                        <td className="p-4 text-right font-mono text-slate-400">{format(new Date(v.timestamp), 'MM/dd HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-auto pt-12 border-t border-slate-100 flex items-center justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
                <p>PATRONPOINT SECURE ANALYTICS ENGINE</p>
                <p>&copy; 2026 UNIVERSITY RECORDS</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
