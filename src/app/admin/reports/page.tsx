
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
import { FileText, Calendar as CalendarIcon, Download, Info } from 'lucide-react';
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
        day: format(currentDay, 'EEE'),
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
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-8 animate-fade-in pb-16 fluid-container no-print">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 bg-white border rounded-2xl p-8 shadow-sm flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Context</p>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Report Target</h2>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-24 rounded-xl font-black border-slate-200 w-full transition-all hover:bg-slate-50 hover:border-primary/20 p-0 overflow-hidden">
                <div className="flex h-full w-full">
                   <div className="w-16 flex items-center justify-center bg-primary/5 text-primary border-r border-slate-100">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 flex flex-col items-start justify-center px-6 gap-1 text-left">
                    <span className="text-[9px] font-black uppercase tracking-tight text-slate-400">Selected Date</span>
                    <div className="text-primary text-sm font-black uppercase tracking-tighter truncate w-full">
                      {analytics?.dateStr}
                    </div>
                  </div>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={setSelectedDate} 
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-white border rounded-2xl flex flex-col justify-between shadow-sm md:col-span-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Visitors</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.total}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Registry Hit Count</span>
          </Card>

          <Card className="p-6 bg-white border-primary/20 border-2 rounded-2xl flex flex-col justify-between shadow-sm md:col-span-3">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Most Active Department</p>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black uppercase">{analytics?.mostActiveDeptPercent}% Share</Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-primary uppercase leading-tight tracking-tight">
                {analytics?.mostActiveDept}
              </h3>
              <div className="flex gap-12 mt-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Registry Hits</p>
                  <p className="text-2xl font-mono font-bold text-slate-900">{analytics?.mostActiveDeptCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Volume Status</p>
                  <p className="text-2xl font-mono font-bold text-primary">PEAK</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border rounded-2xl h-[450px] flex flex-col shadow-sm">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Hourly Engagement</h2>
            <Badge variant="outline" className="h-7 px-4 text-[9px] font-black uppercase tracking-widest">Selected Day</Badge>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '800'}} />
                <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={4} dot={{fill: '#006837', r: 4}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-2xl h-[450px] flex flex-col shadow-sm">
          <div className="p-8 border-b bg-slate-50/50">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Visit Intent</h2>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: '800'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 800, textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Utilization Matrix (7x4 Grid) */}
      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Weekly Engagement Matrix</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">7x4 Strategic Utilization Grid</p>
          </div>
          <Info className="h-5 w-5 text-slate-300" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r">Week Period</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Morning (8-11)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mid-day (11-14)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Afternoon (14-17)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Evening (17-20)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analytics?.weekMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-primary uppercase tracking-tighter text-sm border-r">{row.day}</td>
                  <td className="px-8 py-6 text-center">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.morning > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.morning}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.midday > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.midday}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.afternoon > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.afternoon}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl font-mono font-bold text-sm", row.evening > 10 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>{row.evening}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="p-10 bg-slate-900 border-none rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Institutional Generation Center</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compile professional operational registry</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setIsPreviewOpen(true)} className="h-16 px-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
            <FileText className="mr-3 h-5 w-5" />
            Preview Registry
          </Button>
          <Button onClick={handlePrint} className="h-16 px-12 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-3">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[900px] h-[90vh] p-0 border-none rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 no-print">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Report Preview</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Operational Audit Verification</DialogDescription>
              </div>
              <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase text-[10px] tracking-widest px-8 h-11 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Save as PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-12 report-print-container">
            <div className="bg-white shadow-xl mx-auto max-w-[800px] min-h-[1000px] p-16 rounded-[2rem] border border-slate-200">
              <div className="flex justify-between items-end border-b-4 border-slate-900 pb-8 mb-12">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NEU Central Library</h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] pt-1">Administrative Audit Registry</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Total Visitors: {analytics?.total}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Audit Date: {analytics?.dateStr}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-6">
                  <div className="h-48 border rounded-xl p-6 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Hourly Utilization</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.trendData}>
                        <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col justify-center p-10 bg-primary/5 rounded-3xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">Most Active Department</p>
                  <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight mb-8">
                    {analytics?.mostActiveDept}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Registry Hits</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{analytics?.mostActiveDeptCount}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Traffic Share</span>
                      <span className="text-sm font-mono font-bold text-primary">{analytics?.mostActiveDeptPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Weekly 7x4 Engagement Matrix</p>
                <table className="w-full text-left text-[9px] border-collapse border">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-4 border">Period</th>
                      <th className="p-4 border">Morning</th>
                      <th className="p-4 border">Mid-day</th>
                      <th className="p-4 border">Afternoon</th>
                      <th className="p-4 border">Evening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.weekMatrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-4 border font-black">{row.day}</td>
                        <td className="p-4 border text-center">{row.morning}</td>
                        <td className="p-4 border text-center">{row.midday}</td>
                        <td className="p-4 border text-center">{row.afternoon}</td>
                        <td className="p-4 border text-center">{row.evening}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-100 pt-8">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Visitor Registry</p>
                <table className="w-full text-left text-[9px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 uppercase font-black tracking-widest border-b">Full Legal Name</th>
                      <th className="p-4 uppercase font-black tracking-widest border-b">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
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
          <DialogFooter className="p-6 bg-slate-50 border-t no-print">
            <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8">
              Close
            </Button>
            <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-12 font-black uppercase text-[10px] tracking-widest h-11 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
