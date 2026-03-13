
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, startOfWeek, addDays } from 'date-fns';
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
import { FileText, Calendar as CalendarIcon, Download, Info, Library } from 'lucide-react';
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

  const { data: rawVisits, isLoading } = useCollection(visitsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !selectedDate) return null;

    const filteredVisits = rawVisits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return isSameDay(visitDate, selectedDate);
    });

    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {};

    filteredVisits.forEach(v => {
      const vDate = new Date(v.timestamp);
      const hourKey = vDate.getHours();
      hourMap[hourKey] = (hourMap[hourKey] || 0) + 1;

      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const deptDistributionData = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    
    // Strict 8 AM to 8 PM hourly range
    const trendData = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => ({
      hour: `${h}:00`,
      count: hourMap[h] || 0
    }));

    const activeDept = deptDistributionData[0];
    const totalCount = filteredVisits.length;

    // Weekly Matrix Logic (7x4)
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekMatrix = Array.from({ length: 7 }).map((_, dayIdx) => {
      const currentDay = addDays(weekStart, dayIdx);
      const dayVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), currentDay));
      
      return {
        day: format(currentDay, 'EEEE'),
        morning: dayVisits.filter(v => { const h = new Date(v.timestamp).getHours(); return h >= 8 && h < 11; }).length,
        midday: dayVisits.filter(v => { const h = new Date(v.timestamp).getHours(); return h >= 11 && h < 14; }).length,
        afternoon: dayVisits.filter(v => { const h = new Date(v.timestamp).getHours(); return h >= 14 && h < 17; }).length,
        evening: dayVisits.filter(v => { const h = new Date(v.timestamp).getHours(); return h >= 17 && h < 20; }).length,
      };
    });

    return { 
      deptDistributionData, 
      purposeData, 
      trendData,
      weekMatrix,
      total: totalCount,
      mostActiveDept: activeDept ? activeDept.name : 'N/A',
      mostActiveDeptCount: activeDept ? activeDept.count : 0,
      mostActiveDeptPercent: activeDept && totalCount > 0 ? Math.round((activeDept.count / totalCount) * 100) : 0,
      filteredVisits,
      dateStr: format(selectedDate, 'PPP')
    };
  }, [rawVisits, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Loading Analytics Dashboard...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-10 animate-fade-in pb-16 fluid-container no-print bg-slate-50/30 p-8">
      {/* 1. Visitor Summary Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Visitor Summary</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-8 bg-white border rounded-3xl flex flex-col justify-center shadow-sm border-slate-100">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Library Visitors</p>
            <div className="flex items-baseline gap-4 mt-4">
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter">{analytics?.total}</h3>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today</span>
            </div>
          </Card>

          <Card className="p-8 bg-white border rounded-3xl flex flex-col justify-center shadow-sm border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <Library className="h-12 w-12 text-primary/5" />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Most Active Department</p>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                {analytics?.mostActiveDept}
              </h3>
              <div className="flex gap-8 mt-4 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registry Hits</p>
                  <p className="text-xl font-black text-primary">{analytics?.mostActiveDeptCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Traffic Share</p>
                  <p className="text-xl font-black text-slate-900">{analytics?.mostActiveDeptPercent}%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 2 & 3. Daily Traffic & Purpose of Visit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border rounded-3xl h-[450px] flex flex-col shadow-sm border-slate-100">
          <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Hourly Engagement</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Daily Traffic Flow (8:00 AM - 8:00 PM)</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl font-bold border-slate-200 text-xs px-4">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {analytics?.dateStr}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '800'}}
                />
                <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={4} dot={{fill: '#006837', r: 4}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-3xl h-[450px] flex flex-col shadow-sm border-slate-100">
          <div className="p-8 border-b bg-slate-50/30">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Visit Intent</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Distribution of Academic Purpose</p>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: '800'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', paddingTop: '20px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Weekly Utilization Matrix */}
      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm border-slate-100">
        <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Weekly Matrix</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institutional Engagement Grid (Monday - Sunday)</p>
          </div>
          <Info className="h-5 w-5 text-slate-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day of Week</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-50">Morning (8-11)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-50">Mid-day (11-14)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-50">Afternoon (14-17)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-50">Evening (17-20)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics?.weekMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-900 uppercase tracking-tighter text-sm">{row.day}</td>
                  <td className="px-8 py-5 text-center border-l border-slate-50">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.morning > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.morning}</div>
                  </td>
                  <td className="px-8 py-5 text-center border-l border-slate-50">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.midday > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.midday}</div>
                  </td>
                  <td className="px-8 py-5 text-center border-l border-slate-50">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.afternoon > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.afternoon}</div>
                  </td>
                  <td className="px-8 py-5 text-center border-l border-slate-50">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.evening > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.evening}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Center */}
      <Card className="p-8 bg-primary rounded-[2.5rem] border-none shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Institutional Report Hub</h2>
          <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">Generate professional operational audits</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setIsPreviewOpen(true)} className="h-14 px-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
            <FileText className="mr-2 h-4 w-4" />
            Preview Registry
          </Button>
          <Button onClick={handlePrint} className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[950px] h-[90vh] p-0 border-none rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 no-print">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Administrative Audit Preview</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Strategic Verification Hub</DialogDescription>
              </div>
              <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-[10px] tracking-widest px-10 h-12 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Save as PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-12 report-print-container">
            <div className="bg-white shadow-xl mx-auto max-w-[850px] min-h-[1100px] p-16 rounded-[2.5rem] border border-slate-200">
              {/* Report Header */}
              <div className="flex justify-between items-end border-b-4 border-slate-900 pb-10 mb-12">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NEU Central Library</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] pt-1">Institutional Audit Record</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-slate-900">{analytics?.total}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Visitors: {analytics?.dateStr}</p>
                </div>
              </div>

              {/* 4 Core Sections in Preview */}
              <div className="grid grid-cols-2 gap-10 mb-12">
                {/* Section 1: Top Department */}
                <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">Most Active Department</p>
                  <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight mb-8">
                    {analytics?.mostActiveDept}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Registry Hits</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{analytics?.mostActiveDeptCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Traffic Share</span>
                      <span className="text-sm font-mono font-bold text-primary">{analytics?.mostActiveDeptPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Visit Intent (Donut) */}
                <div className="h-56 border border-slate-100 rounded-[2rem] p-6 bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Visit Intent Profile</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics?.purposeData} innerRadius={50} outerRadius={70} dataKey="value">
                        {analytics?.purposeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Section 3: Daily Trend */}
              <div className="mb-12">
                <div className="h-56 border border-slate-100 rounded-[2rem] p-10 bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Hourly Utilization Matrix</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.trendData}>
                      <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={4} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Section 4: Weekly Matrix */}
              <div className="mb-12">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Weekly Engagement Grid (7x4)</p>
                <table className="w-full text-left text-[10px] border-collapse border border-slate-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-4 border font-black text-slate-400 uppercase tracking-widest">Period</th>
                      <th className="p-4 border font-black text-slate-400 uppercase tracking-widest text-center">Morning</th>
                      <th className="p-4 border font-black text-slate-400 uppercase tracking-widest text-center">Mid-day</th>
                      <th className="p-4 border font-black text-slate-400 uppercase tracking-widest text-center">Afternoon</th>
                      <th className="p-4 border font-black text-slate-400 uppercase tracking-widest text-center">Evening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.weekMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-4 border font-black text-slate-900 uppercase">{row.day}</td>
                        <td className="p-4 border text-center font-mono font-bold">{row.morning}</td>
                        <td className="p-4 border text-center font-mono font-bold">{row.midday}</td>
                        <td className="p-4 border text-center font-mono font-bold">{row.afternoon}</td>
                        <td className="p-4 border text-center font-mono font-bold">{row.evening}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-100 pt-8">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Student Activity Registry</p>
                <table className="w-full text-left text-[9px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest border-b text-slate-400">Student Identity</th>
                      <th className="p-4 uppercase font-black tracking-widest border-b text-slate-400">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics?.filteredVisits.map((v) => (
                      <tr key={v.id}>
                        <td className="p-4 font-black text-slate-900 uppercase">{v.patronName}</td>
                        <td className="p-4 uppercase font-bold text-slate-500">{v.patronDepartments?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t no-print">
            <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="rounded-2xl font-black uppercase text-[10px] tracking-widest px-8">
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl px-12 font-black uppercase text-[10px] tracking-widest h-12 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

