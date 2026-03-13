
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
  Target
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
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { GENDERS, PURPOSES } from '@/lib/data';
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
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
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
      const isGenderMatch = selectedGenders.length === 0 || selectedGenders.includes(v.patronGender);
      const isAgeMatch = v.patronAge >= ageRange[0] && v.patronAge <= ageRange[1];
      const isPurposeMatch = selectedPurposes.length === 0 || selectedPurposes.includes(v.purpose);

      return isDateMatch && isDeptMatch && isGenderMatch && isAgeMatch && isPurposeMatch;
    });

    const uniquePatrons = new Set(filteredVisits.map(v => v.patronId)).size;
    const totalDays = Math.max(1, differenceInDays(dateRange.to || new Date(), dateRange.from || subDays(new Date(), 30)));
    const targetEngagement = (config.dailyEngagementTarget || 50) * totalDays;
    const engagementProgress = Math.min(100, (filteredVisits.length / targetEngagement) * 100);

    const genderMap: Record<string, number> = {};
    const ageMap: Record<string, number> = { '18-20': 0, '21-23': 0, '24-26': 0, '27+': 0 };
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    
    const hourlyMap: Record<string, number> = Array.from({ length: 11 }, (_, i) => ({ 
      time: `${8 + i}:00`, 
      count: 0 
    })).reduce((acc, curr) => ({ ...acc, [curr.time]: 0 }), {});

    filteredVisits.forEach(v => {
      const gender = v.patronGender || 'Unknown';
      genderMap[gender] = (genderMap[gender] || 0) + 1;

      const age = v.patronAge;
      if (age <= 20) ageMap['18-20']++;
      else if (age <= 23) ageMap['21-23']++;
      else if (age <= 26) ageMap['24-26']++;
      else ageMap['27+']++;

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
    const ageData = Object.entries(ageMap).map(([group, count]) => ({ group, count }));
    const deptDistributionData = Object.entries(deptMap)
      .map(([name, count]) => {
        const deptConfig = config.departments?.find((d: any) => d.name === name);
        return { 
          name, 
          count, 
          color: deptConfig?.color || '#355872',
          code: deptConfig?.code || 'UNIV'
        };
      })
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const trafficFlowData = Object.entries(hourlyMap).map(([time, count]) => ({ 
      time, 
      count,
      target: config.dailyEngagementTarget / 11 || 5
    }));

    return { 
      genderData, 
      ageData, 
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
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`
      }
    };
  }, [rawVisits, dateRange, selectedDepartments, selectedGenders, ageRange, selectedPurposes, config]);

  const handleQuickDate = (type: 'day' | 'week' | 'month') => {
    const now = new Date();
    if (type === 'day') setDateRange({ from: startOfDay(now), to: endOfDay(now) });
    else if (type === 'week') setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
    else if (type === 'month') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
  };

  const resetFilters = () => {
    setSelectedDepartments([]);
    setSelectedGenders([]);
    setSelectedPurposes([]);
    setAgeRange([0, 100]);
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-slate-400 font-bold">Compiling Facility Intelligence...</p>
      </div>
    );
  }

  const CHART_COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#BBDDFF', '#E2E8F0'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary tracking-tight uppercase">Library Intelligence</h1>
          <p className="text-slate-500 font-medium">Facility utilization, demographic ROI, and temporal trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-2xl h-14 gap-2 px-6 shadow-sm"
          >
            <Filter className="h-5 w-5" />
            {showFilters ? "Hide Filters" : "Analytics Control Panel"}
          </Button>
          
          <Button onClick={() => setIsPreviewOpen(true)} className="rounded-2xl gap-3 bg-primary h-14 px-8 shadow-xl shadow-primary/20">
            <Download className="h-5 w-5" />
            Export Formal Report
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white animate-in slide-in-from-top-4 duration-300 print:hidden mb-8">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl"><Filter className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-xl font-bold">Segmentation Control</CardTitle>
              </div>
              <Button variant="ghost" onClick={resetFilters} className="text-primary font-bold">
                <X className="h-4 w-4 mr-2" /> Reset Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Time Interval</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-bold rounded-2xl h-12">
                      <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                      {dateRange.from ? format(dateRange.from, "LLL dd") : "Select Range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Academic Units</Label>
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-2">
                  {config?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox id={`dept-${dept.id}`} checked={selectedDepartments.includes(dept.name)} onCheckedChange={(checked) => setSelectedDepartments(checked ? [...selectedDepartments, dept.name] : selectedDepartments.filter(d => d !== dept.name))} />
                      <Label htmlFor={`dept-${dept.id}`}>{dept.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden p-8 flex flex-col justify-center gap-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-primary flex items-center gap-3"><Target className="h-6 w-6 text-accent-foreground" /> Engagement Goal Progress</h3>
            <span className="text-3xl font-black text-primary">{Math.round(analytics?.engagementProgress || 0)}%</span>
          </div>
          <Progress value={analytics?.engagementProgress} className="h-4" />
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>0 Visitors</span>
            <span>Target: {analytics?.targetEngagement} visitors</span>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-accent/10 p-8 flex flex-col justify-center items-center text-center">
          <Users className="h-10 w-10 text-accent-foreground mb-2" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Unique Patrons</p>
          <h3 className="text-4xl font-black text-primary">{analytics?.uniquePatrons}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8"><CardTitle className="text-2xl font-black text-primary">Departmental ROI</CardTitle></CardHeader>
          <CardContent className="p-8 pt-0 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptDistributionData} layout="vertical">
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fontWeight: '900'}} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {analytics?.deptDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8"><CardTitle className="text-2xl font-black text-primary">Visitor Intent Breakdown</CardTitle></CardHeader>
          <CardContent className="p-8 pt-0 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1100px] h-[95vh] flex flex-col p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black flex items-center gap-3"><FileCheck className="h-8 w-8 text-green-400" /> OFFICIAL SYSTEM REPORT</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{config?.reportHeaderTitle || "UNIVERSITY FACILITY UTILIZATION RECORD"}</DialogDescription>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" onClick={() => window.print()}><Printer className="h-5 w-5 mr-3" /> Print Official PDF</Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-200/50 p-16 print:p-0 print:bg-white">
            <div id="print-area" className="bg-white shadow-2xl mx-auto max-w-[850px] min-h-[1100px] p-20 print:shadow-none flex flex-col rounded-[2rem] print:rounded-none">
              <div className="flex items-center justify-between border-b-[6px] border-slate-900 pb-10 mb-16">
                <div className="flex items-center gap-6">
                  {config?.universityLogoUrl && <img src={config.universityLogoUrl} className="h-20 w-auto" alt="University Logo" />}
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">University Central Library</h1>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] pt-1">{config?.reportHeaderTitle || "OFFICE OF THE CHIEF LIBRARIAN"}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-black text-slate-400">REF: LIB-{format(new Date(), 'yyyyMMdd')}<br/>TS: {format(new Date(), 'HH:mm:ss')}</div>
              </div>
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-black text-slate-900 uppercase">Facility Utilization Intelligence</h2>
                <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.3em]">{analytics?.summary.dateRangeStr}</div>
              </div>
              <div className="grid grid-cols-4 gap-6 mb-16">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Visits</p><p className="text-4xl font-black text-primary">{analytics?.total}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unique Users</p><p className="text-4xl font-black text-primary">{analytics?.uniquePatrons}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Peak Day</p><p className="text-2xl font-black text-primary">{analytics?.summary.busiestDay}</p></div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Goal Reach</p><p className="text-3xl font-black text-primary">{Math.round(analytics?.engagementProgress || 0)}%</p></div>
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-900 mb-16">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900 text-white"><tr><th className="p-4">Identity</th><th className="p-4">Unit</th><th className="p-4">Purpose</th><th className="p-4 text-right">Timestamp</th></tr></thead>
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
              <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
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
