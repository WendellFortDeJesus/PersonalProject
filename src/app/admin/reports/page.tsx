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
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfWeek, addDays, getHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Download, Info, ShieldCheck, Users, TrendingUp, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const filteredVisits = rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return isSameDay(visitDate, selectedDate);
    });

    const activePresence = filteredVisits.filter(v => v.status === 'granted').length;
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const heatMapData: number[][] = Array(7).fill(0).map(() => Array(12).fill(0)); // 7 days, 8am-8pm

    rawVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      const day = vDate.getDay(); // 0-6
      const hour = getHours(vDate);
      if (hour >= 8 && hour < 20) {
        heatMapData[day][hour - 8]++;
      }

      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const deptRankingData = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name, 
        count,
        color: config?.departments?.find((d: any) => d.name === name)?.color || '#006837'
      }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const totalVisitsCount = rawVisits.length;
    const peakOccupancy = Math.min(Math.round((activePresence / (config?.capacityLimit || 200)) * 100), 100);

    return { 
      deptRankingData, 
      purposeData, 
      heatMapData,
      activePresence,
      mostEngagedDept: deptRankingData[0],
      peakOccupancy,
      registrySize: rawPatrons.length,
      totalToday: filteredVisits.length,
      filteredVisits,
      dateStr: format(selectedDate, 'PPP')
    };
  }, [rawVisits, rawPatrons, selectedDate, config]);

  const handlePrint = () => {
    window.print();
  };

  if (isVisitsLoading || isPatronsLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container no-print bg-[#F8FAFC] p-6 font-body min-h-screen">
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

      {/* KPI Tiles */}
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

        <Card className="p-5 bg-white border rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Most Engaged Dept</p>
            <ShieldCheck className="h-4 w-4 text-primary/40" />
          </div>
          <div className="mt-2">
            <h3 className="text-xs font-black text-primary uppercase truncate leading-tight">{analytics?.mostEngagedDept?.name || 'N/A'}</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{analytics?.mostEngagedDept?.count || 0} Total Registry Hits</p>
          </div>
        </Card>

        <Card className="p-5 bg-white border rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peak Occupancy</p>
            <TrendingUp className="h-4 w-4 text-primary/40" />
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-mono font-bold text-slate-900 leading-none">{analytics?.peakOccupancy}%</h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">System Load Limit</p>
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

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white border rounded-xl flex flex-col shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Weekly Intensity Heatmap</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Hourly Utilization Density (8:00 AM - 8:00 PM)</p>
            </div>
            <Info className="h-4 w-4 text-slate-300" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <div className="grid grid-rows-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} className="text-[8px] font-black text-slate-400 uppercase flex items-center h-5">{d}</span>
                ))}
              </div>
              <div className="grid grid-rows-7 gap-1">
                {analytics?.heatMapData.map((row, dayIdx) => (
                  <div key={dayIdx} className="grid grid-cols-12 gap-1 h-5">
                    {row.map((val, hrIdx) => (
                      <div 
                        key={hrIdx} 
                        className="rounded-[2px] border border-slate-50"
                        title={`${val} visits at ${hrIdx + 8}:00`}
                        style={{ 
                          backgroundColor: val === 0 ? '#F1F5F9' : `rgba(0, 104, 55, ${Math.min(val / 10, 1)})` 
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="col-start-2 grid grid-cols-12 gap-1 mt-1">
                {['8a', '', '10a', '', '12p', '', '2p', '', '4p', '', '6p', '8p'].map((t, i) => (
                  <span key={i} className="text-[7px] font-bold text-slate-400 uppercase text-center">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-xl flex flex-col shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Visit Intent</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Strategic Resource Demand</p>
          </div>
          <div className="flex-1 min-h-[300px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: '800'}} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', paddingTop: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart (Ranking) */}
      <Card className="bg-white border rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Departmental Ranking</h2>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Engagement Volume by College</p>
        </div>
        <div className="p-6 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.deptRankingData} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 800, fill: '#64748B', width: 100}} 
              />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: '800'}} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {analytics?.deptRankingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Generation Center */}
      <Card className="p-8 bg-primary rounded-xl border-none shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Institutional Report Hub</h2>
          <p className="text-[9px] font-black text-primary-foreground/60 uppercase tracking-widest">Generate professional strategic audits</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsPreviewOpen(true)} className="h-11 px-8 bg-white/10 hover:bg-white/20 text-white rounded-lg font-black uppercase text-[10px] tracking-widest transition-all">
            Preview Audit
          </Button>
          <Button onClick={handlePrint} className="h-11 px-8 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 border-none rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 bg-slate-900 text-white shrink-0 no-print">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tighter">Administrative Audit Preview</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Accreditation Verification Record</DialogDescription>
              </div>
              <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-black uppercase text-[10px] tracking-widest px-8 h-10 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Save PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-10 report-print-container">
            <div className="bg-white shadow-sm mx-auto p-12 rounded-xl border border-slate-200 min-h-[1000px]">
              {/* Report Header */}
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">NEU Central Library</h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Institutional Audit Record</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900">{analytics?.totalToday}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Visitors: {analytics?.dateStr}</p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mb-8 p-6 bg-slate-50 rounded-lg border">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 border-b pb-1">Executive Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strategic data analysis for <strong>{analytics?.dateStr}</strong> identifies <strong>{analytics?.mostEngagedDept?.name}</strong> as the primary institutional engagement driver, contributing significantly to a total of <strong>{analytics?.totalToday}</strong> verified entries. Facility utilization peaked at <strong>{analytics?.peakOccupancy}%</strong> capacity, with a strong emphasis on academic resource usage including <strong>Research</strong> and <strong>Assignments</strong>.
                </p>
              </div>

              {/* Departmental Comparison */}
              <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-1">Departmental Comparison Table</h3>
                <table className="w-full text-left text-[9px] border-collapse high-density-table">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 border font-black text-slate-400 uppercase">College / Department</th>
                      <th className="p-3 border font-black text-slate-400 uppercase text-center">Engagement Score (Total Hits)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics?.deptRankingData.map((dept, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 border font-black text-slate-900 uppercase">{dept.name}</td>
                        <td className="p-3 border text-center font-mono font-bold text-primary">{dept.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Student Registry */}
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-1">Visitor Identity Registry</h3>
                <table className="w-full text-left text-[9px] border-collapse high-density-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 border uppercase font-black tracking-widest text-slate-400">Student Identity</th>
                      <th className="p-3 border uppercase font-black tracking-widest text-slate-400">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics?.filteredVisits.map((v) => (
                      <tr key={v.id}>
                        <td className="p-3 border font-black text-slate-900 uppercase">{v.patronName}</td>
                        <td className="p-3 border uppercase font-bold text-slate-500">{v.patronDepartments?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t no-print">
            <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="rounded-lg font-black uppercase text-[9px] tracking-widest px-8">
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg px-10 font-black uppercase text-[9px] tracking-widest h-10 flex items-center gap-2">
              <Download className="h-3.5 w-3.5" />
              Download Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}