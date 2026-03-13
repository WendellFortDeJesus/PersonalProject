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
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Download, FileText, Calendar as CalendarIcon, ArrowRight, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
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
    const dayMap: Record<string, number> = {};
    const hourlyMap: Record<string, number> = {};

    const uniquePatrons = new Set();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let totalToday = 0;

    filteredVisits.forEach(v => {
      uniquePatrons.add(v.patronId);
      const vDate = new Date(v.timestamp);
      const dateKey = format(vDate, 'yyyy-MM-dd');
      
      if (dateKey === todayStr) totalToday++;

      v.patronDepartments?.forEach((d: string) => {
        const name = d.split(':')[0];
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
      
      dayMap[dateKey] = (dayMap[dateKey] || 0) + 1;
      
      const hour = vDate.getHours();
      const timeKey = `${hour}:00`;
      hourlyMap[timeKey] = (hourlyMap[timeKey] || 0) + 1;
    });

    const deptDistributionData = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    
    const trendData = dateRange.from && dateRange.to 
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const key = format(day, 'yyyy-MM-dd');
          return { date: format(day, 'MMM dd'), count: dayMap[key] || 0 };
        })
      : [];

    const peakHour = Object.entries(hourlyMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const activeDept = deptDistributionData[0];
    const totalCount = filteredVisits.length;

    return { 
      deptDistributionData, 
      purposeData, 
      trendData,
      total: totalCount,
      totalToday,
      uniqueCount: uniquePatrons.size,
      mostActiveDept: activeDept ? activeDept.name : 'N/A',
      mostActiveDeptCount: activeDept ? activeDept.count : 0,
      mostActiveDeptPercent: activeDept && totalCount > 0 ? Math.round((activeDept.count / totalCount) * 100) : 0,
      peakHour,
      filteredVisits,
      summary: {
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`,
        fromStr: format(dateRange.from || new Date(), 'MMM dd, yyyy'),
        toStr: format(dateRange.to || new Date(), 'MMM dd, yyyy')
      }
    };
  }, [rawVisits, dateRange]);

  const handlePrint = () => {
    if (!isPreviewOpen) {
      setIsPreviewOpen(true);
      setTimeout(() => {
        window.print();
      }, 500);
    } else {
      window.print();
    }
  };

  if (isLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-8 animate-fade-in pb-16 fluid-container no-print">
      {/* KPI Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 bg-white border rounded-2xl p-8 shadow-sm flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Context</p>
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Reporting Range</h2>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-20 rounded-xl font-black gap-4 px-6 border-slate-200 justify-start w-full transition-all hover:bg-slate-50 hover:border-primary/20">
                <div className="flex items-center justify-center p-2.5 bg-primary/5 rounded-lg text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tight text-slate-400">
                    <span>{analytics?.summary.fromStr}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{analytics?.summary.toStr}</span>
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-tighter">Modify Active Range</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
            </PopoverContent>
          </Popover>

          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">System Status</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Intelligence Active
            </span>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-white border rounded-2xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Visitors (Today)</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.totalToday}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Live Count</span>
          </Card>

          <Card className="p-6 bg-white border-primary/20 border-2 rounded-2xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Most Active Department</p>
            <div className="mt-4 overflow-hidden">
              <h3 className="text-lg font-black text-primary uppercase truncate leading-tight">{analytics?.mostActiveDept}</h3>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] font-mono font-black text-slate-600 uppercase">{analytics?.mostActiveDeptCount} Visits</p>
                <p className="text-[11px] font-mono font-black text-primary uppercase">{analytics?.mostActiveDeptPercent}% Share</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Unit Utilization Index</span>
          </Card>

          <Card className="p-6 bg-white border rounded-2xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Peak Hour Today</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.peakHour}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Busiest Period</span>
          </Card>

          <Card className="p-6 bg-white border rounded-2xl flex flex-col justify-between shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unique Registered</p>
            <h3 className="text-4xl font-mono font-medium text-primary mt-4">{analytics?.uniqueCount}</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Active Database</span>
          </Card>
        </div>
      </div>

      {/* Grid: Trend & Purpose (70/30) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border rounded-2xl h-[450px] flex flex-col p-0 overflow-hidden shadow-sm">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Engagement Trend</h2>
            <Badge variant="outline" className="h-7 px-4 text-[9px] font-black uppercase tracking-widest">
              Last {differenceInDays(dateRange.to || new Date(), dateRange.from || new Date())} Days
            </Badge>
          </div>
          <div className="flex-1 p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '800'}} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#006837" 
                  strokeWidth={4} 
                  dot={{fill: '#006837', r: 4}} 
                  activeDot={{r: 6, strokeWidth: 0}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border rounded-2xl h-[450px] flex flex-col p-0 overflow-hidden shadow-sm">
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

      {/* Dept Ranking */}
      <div className="bg-white border rounded-2xl h-[400px] flex flex-col p-0 overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-slate-50/50">
          <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Departmental Utilization Ranking</h2>
        </div>
        <div className="flex-1 p-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.deptDistributionData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={200} 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} 
              />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {analytics?.deptDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Generation Suite */}
      <Card className="p-10 bg-slate-900 border-none rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Institutional Generation Center</h2>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center space-x-3">
              <Checkbox id="logs" checked={includeLogs} onCheckedChange={(v) => setIncludeLogs(!!v)} className="border-white/20 data-[state=checked]:bg-primary" />
              <label htmlFor="logs" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Include Master Log Table</label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="charts" checked={includeCharts} onCheckedChange={(v) => setIncludeCharts(!!v)} className="border-white/20 data-[state=checked]:bg-primary" />
              <label htmlFor="charts" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Include Intelligence Charts</label>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setIsPreviewOpen(true)} className="h-16 px-12 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:scale-[1.02]">
            <FileText className="mr-3 h-5 w-5" />
            Preview Registry
          </Button>
          <Button onClick={handlePrint} className="h-16 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg gap-3">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
        </div>
      </Card>

      {/* Report Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[900px] h-[90vh] p-0 border-none rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 no-print">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Library Report Preview</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">NEU Central Library Registry Records</DialogDescription>
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase text-[10px] tracking-widest px-8">
                  Save as PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-12 report-print-container">
            <div className="bg-white shadow-xl mx-auto max-w-[800px] min-h-[1000px] p-16 rounded-[2rem] border border-slate-200">
              <div className="flex justify-between items-end border-b-4 border-slate-900 pb-8 mb-12">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NEU Central Library</h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] pt-1">Administrative Registry Section</p>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date: {format(new Date(), 'PP')}</p>
              </div>

              <div className="text-center mb-12 space-y-2">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Attendance Report</h2>
                <Badge variant="secondary" className="font-black uppercase tracking-widest text-[9px]">{analytics?.summary.dateRangeStr}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Visitors (Today)</p>
                  <p className="text-4xl font-mono font-bold text-slate-900">{analytics?.totalToday}</p>
                </div>
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 text-center flex flex-col items-center justify-center gap-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Most Active Department</p>
                  <p className="text-lg font-black text-primary uppercase leading-tight truncate w-full">{analytics?.mostActiveDept}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-[10px] font-mono font-black text-slate-600 uppercase">{analytics?.mostActiveDeptCount} Visits</p>
                    <p className="text-[10px] font-mono font-black text-primary uppercase">{analytics?.mostActiveDeptPercent}% Participation</p>
                  </div>
                </div>
              </div>

              {includeCharts && (
                <div className="space-y-12 mb-12">
                  <div className="h-56 border-t pt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Engagement Trend Summary</p>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.trendData}>
                        <Line type="monotone" dataKey="count" stroke="#006837" strokeWidth={3} dot={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64 border-t pt-8">
                    <p className="text-[10px] font-black text-slate-900 uppercase mb-6 tracking-widest text-center">Visit Intent (Purpose Distribution)</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics?.purposeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {analytics?.purposeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: 800, textTransform: 'uppercase'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {includeLogs && (
                <div className="border-t pt-8">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Student / Visitor Identity Registry</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{analytics?.filteredVisits.length} Records Documented</p>
                  </div>
                  <table className="w-full text-left text-[8px] border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="p-3 uppercase font-black tracking-widest">Time</th>
                        <th className="p-3 uppercase font-black tracking-widest">Name</th>
                        <th className="p-3 uppercase font-black tracking-widest">Department</th>
                        <th className="p-3 uppercase font-black tracking-widest">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {analytics?.filteredVisits.slice(0, 100).map((v) => (
                        <tr key={v.id}>
                          <td className="p-3 font-mono text-slate-500">{format(new Date(v.timestamp), 'HH:mm')}</td>
                          <td className="p-3 font-black text-slate-900 uppercase">{v.patronName}</td>
                          <td className="p-3 uppercase font-bold text-slate-600">{v.patronDepartments?.[0]?.split(':')[0]}</td>
                          <td className="p-3 uppercase font-bold text-primary">{v.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[7px] text-slate-400 italic mt-6">* Institutional audit record - Page 1 of 1</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t no-print">
            <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest">
              Close Preview
            </Button>
            <div className="flex gap-3">
              <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-10 font-black uppercase text-[10px] tracking-widest">
                Save as PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
