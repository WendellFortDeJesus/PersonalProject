
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileText,
  Clock,
  Loader2,
  Filter,
  X,
  Printer,
  FileCheck,
  BarChart3,
  PieChart as PieIcon,
  Users,
  Target,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
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
import { format, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      const isDateMatch = !dateRange.from || !dateRange.to || isWithinInterval(visitDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });
      const isDeptMatch = selectedDepartments.length === 0 || 
        v.patronDepartments?.some((d: string) => selectedDepartments.includes(d));

      return isDateMatch && isDeptMatch;
    });

    const uniquePatrons = new Set(filteredVisits.map(v => v.patronId)).size;
    const totalDays = Math.max(1, differenceInDays(dateRange.to || new Date(), dateRange.from || subDays(new Date(), 30)));
    const targetEngagement = (config.dailyEngagementTarget || 50) * totalDays;
    const engagementProgress = Math.min(100, (filteredVisits.length / targetEngagement) * 100);

    const genderMap: Record<string, number> = {};
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    
    const hourlyMap: Record<string, number> = Array.from({ length: 11 }, (_, i) => ({ 
      time: `${8 + i}:00`, 
      count: 0 
    })).reduce((acc, curr) => ({ ...acc, [curr.time]: 0 }), {});

    filteredVisits.forEach(v => {
      const gender = v.patronGender || 'Unknown';
      genderMap[gender] = (genderMap[gender] || 0) + 1;

      v.patronDepartments?.forEach((d: string) => {
        deptMap[d] = (deptMap[d] || 0) + 1;
      });

      const purpose = v.purpose || 'Other';
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;

      const dateObj = new Date(v.timestamp);
      const hour = dateObj.getHours();
      if (hour >= 8 && hour <= 18) {
        const timeKey = `${hour}:00`;
        if (hourlyMap[timeKey] !== undefined) hourlyMap[timeKey]++;
      }
    });

    const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }));
    const deptDistributionData = Object.entries(deptMap)
      .map(([name, count]) => {
        const deptConfig = config.departments?.find((d: any) => d.name === name);
        return { 
          name, 
          count, 
          color: deptConfig?.color || '#355872'
        };
      })
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const trafficFlowData = Object.entries(hourlyMap).map(([time, count]) => ({ 
      time, 
      count
    }));

    return { 
      genderData, 
      deptDistributionData, 
      purposeData, 
      trafficFlowData, 
      total: filteredVisits.length,
      uniquePatrons,
      engagementProgress,
      targetEngagement,
      filteredVisits,
      summary: {
        busiestDay: filteredVisits.length > 0 ? format(new Date(filteredVisits[0].timestamp), 'EEEE') : 'N/A',
        topCollege: deptDistributionData[0]?.name || 'N/A',
        peakHour: Object.entries(hourlyMap).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A',
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`
      }
    };
  }, [rawVisits, dateRange, selectedDepartments, config]);

  const resetFilters = () => {
    setSelectedDepartments([]);
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[10px]">Compiling Global Analytics...</p>
      </div>
    );
  }

  const CHART_COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#BBDDFF', '#E2E8F0'];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Analytics Suite Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase">Business Intelligence</h1>
          <p className="text-slate-500 font-bold tracking-tight">Facility utilization ROI, demographic flow, and temporal trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-2xl h-14 gap-2 px-6 shadow-sm border-slate-100 font-bold"
          >
            <Filter className="h-5 w-5" />
            Control Panel
          </Button>
          
          <Button onClick={() => setIsPreviewOpen(true)} className="rounded-2xl gap-3 bg-primary h-14 px-8 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs">
            <Download className="h-5 w-5" />
            Generate PDF Report
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl"><Filter className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-xl font-black">Refine Segmentation</CardTitle>
              </div>
              <Button variant="ghost" onClick={resetFilters} className="text-primary font-black uppercase tracking-widest text-[10px]">
                <X className="h-4 w-4 mr-2" /> Reset Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date Threshold</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-bold rounded-2xl h-14 border-slate-100 bg-slate-50">
                      <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                      {dateRange.from ? format(dateRange.from, "LLL dd, y") : "Select Range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
                    <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Units</Label>
                <div className="grid grid-cols-2 gap-4">
                  {config?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-white">
                      <Checkbox 
                        id={`dept-${dept.id}`} 
                        checked={selectedDepartments.includes(dept.name)} 
                        onCheckedChange={(checked) => setSelectedDepartments(checked ? [...selectedDepartments, dept.name] : selectedDepartments.filter(d => d !== dept.name))} 
                      />
                      <Label htmlFor={`dept-${dept.id}`} className="font-bold text-slate-600 text-xs">{dept.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 group hover:bg-primary transition-colors">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 group-hover:bg-white/10 rounded-3xl w-fit">
              <Users className="h-6 w-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 group-hover:text-white/50 uppercase tracking-[0.3em]">Total Visitors</p>
              <h3 className="text-4xl font-black text-slate-900 group-hover:text-white">{analytics?.total}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 group hover:bg-primary transition-colors">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 group-hover:bg-white/10 rounded-3xl w-fit">
              <Building2 className="h-6 w-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 group-hover:text-white/50 uppercase tracking-[0.3em]">Top College</p>
              <h3 className="text-2xl font-black text-slate-900 group-hover:text-white truncate">{analytics?.summary.topCollege}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 group hover:bg-primary transition-colors">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 group-hover:bg-white/10 rounded-3xl w-fit">
              <Clock className="h-6 w-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 group-hover:text-white/50 uppercase tracking-[0.3em]">Peak Hour</p>
              <h3 className="text-4xl font-black text-slate-900 group-hover:text-white">{analytics?.summary.peakHour}</h3>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 group hover:bg-primary transition-colors">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 group-hover:bg-white/10 rounded-3xl w-fit">
              <Target className="h-6 w-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 group-hover:text-white/50 uppercase tracking-[0.3em]">Unique Users</p>
              <h3 className="text-4xl font-black text-slate-900 group-hover:text-white">{analytics?.uniquePatrons}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Graph */}
        <Card className="lg:col-span-8 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Utilization Flow</CardTitle>
                <CardDescription className="font-bold">Hourly traffic distribution across the facility</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-green-500 font-black">
                <TrendingUp className="h-5 w-5" />
                <span>+5% Utilization</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trafficFlowData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#355872" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 900, color: '#355872'}}
                />
                <Area type="monotone" dataKey="count" stroke="#355872" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Purpose Breakdown */}
        <Card className="lg:col-span-4 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Intent Distribution</CardTitle>
            <CardDescription className="font-bold">Primary reason for facility engagement</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={analytics?.purposeData} 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={8} 
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 700, fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department ROI */}
        <Card className="lg:col-span-12 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Departmental ROI Ranking</CardTitle>
            <CardDescription className="font-bold">Total engagement counts per academic unit</CardDescription>
          </CardHeader>
          <CardContent className="p-10 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptDistributionData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={180} axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#334155'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={40}>
                  {analytics?.deptDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Official Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1100px] h-[95vh] flex flex-col p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black flex items-center gap-3"><FileCheck className="h-8 w-8 text-green-400" /> OFFICIAL SYSTEM REPORT</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{config?.reportHeaderTitle || "UNIVERSITY FACILITY UTILIZATION RECORD"}</DialogDescription>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px]" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print PDF
              </Button>
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-200/50 p-16">
            <div id="print-area" className="bg-white shadow-2xl mx-auto max-w-[850px] min-h-[1100px] p-20 flex flex-col rounded-[2rem]">
              <div className="flex items-center justify-between border-b-[6px] border-slate-900 pb-10 mb-16">
                <div className="flex items-center gap-6">
                  {config?.universityLogoUrl && <img src={config.universityLogoUrl} className="h-20 w-auto" alt="Logo" />}
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">NEU Central Library</h1>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] pt-1">{config?.reportHeaderTitle || "OFFICE OF THE CHIEF LIBRARIAN"}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-black text-slate-400">REF: LIB-{format(new Date(), 'yyyyMMdd')}<br/>TS: {format(new Date(), 'HH:mm:ss')}</div>
              </div>

              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Utilization Intelligence</h2>
                <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.3em]">{analytics?.summary.dateRangeStr}</div>
              </div>

              <div className="grid grid-cols-4 gap-6 mb-16">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Visits</p><p className="text-4xl font-black text-primary">{analytics?.total}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unique Users</p><p className="text-4xl font-black text-primary">{analytics?.uniquePatrons}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Peak Hour</p><p className="text-2xl font-black text-primary">{analytics?.summary.peakHour}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Goal Reach</p><p className="text-3xl font-black text-primary">{Math.round(analytics?.engagementProgress || 0)}%</p></div>
              </div>

              <div className="space-y-8 mb-16">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                   <TrendingUp className="h-5 w-5 text-primary" /> Traffic Analysis
                 </h3>
                 <div className="h-48 w-full bg-slate-50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chart Visualization Embedded in Export</p>
                 </div>
              </div>

              <div className="overflow-hidden rounded-2xl border-2 border-slate-900">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900 text-white"><tr><th className="p-4 uppercase tracking-widest text-[10px]">Patron</th><th className="p-4 uppercase tracking-widest text-[10px]">Academic Unit</th><th className="p-4 uppercase tracking-widest text-[10px]">Intent</th><th className="p-4 text-right uppercase tracking-widest text-[10px]">Timestamp</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics?.filteredVisits.slice(0, 20).map((v) => (
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
                <p>{config?.reportFooterText || "PATRONPOINT SECURE ANALYTICS ENGINE"}</p>
                <p>&copy; 2026 UNIVERSITY RECORDS</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
