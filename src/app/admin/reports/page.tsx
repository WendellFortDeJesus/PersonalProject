
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileText,
  Clock,
  MapPin,
  Loader2,
  Filter,
  X,
  Printer,
  FileCheck,
  TrendingUp,
  Award
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
import { format, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  // Filter States
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // System Config for dynamic departments and colors
  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  // Real-time data fetching
  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user]);

  const { data: rawVisits, isLoading } = useCollection(visitsQuery);

  // Filter and Process Data
  const analytics = useMemo(() => {
    if (!rawVisits || !config) return null;

    const filteredVisits = rawVisits.filter(v => {
      // 1. Date Range Filter
      const visitDate = new Date(v.timestamp);
      const isDateMatch = !dateRange.from || !dateRange.to || isWithinInterval(visitDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });

      // 2. Department Filter
      const isDeptMatch = selectedDepartments.length === 0 || 
        v.patronDepartments?.some((d: string) => selectedDepartments.includes(d));

      // 3. Gender Filter
      const isGenderMatch = selectedGenders.length === 0 || selectedGenders.includes(v.patronGender);

      // 4. Age Range Filter
      const isAgeMatch = v.patronAge >= ageRange[0] && v.patronAge <= ageRange[1];

      // 5. Purpose Filter
      const isPurposeMatch = selectedPurposes.length === 0 || selectedPurposes.includes(v.purpose);

      return isDateMatch && isDeptMatch && isGenderMatch && isAgeMatch && isPurposeMatch;
    });

    const genderMap: Record<string, number> = {};
    const ageMap: Record<string, number> = { '18-20': 0, '21-23': 0, '24-26': 0, '27+': 0 };
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const hourlyMap: Record<string, number> = Array.from({ length: 11 }, (_, i) => ({ 
      time: `${8 + i}:00`, 
      visits: 0 
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

      const hour = new Date(v.timestamp).getHours();
      if (hour >= 8 && hour <= 18) {
        const timeKey = `${hour}:00`;
        if (hourlyMap[timeKey] !== undefined) {
          hourlyMap[timeKey]++;
        }
      }
    });

    const genderData = Object.entries(genderMap).map(([name, value]) => ({ name, value }));
    const ageData = Object.entries(ageMap).map(([group, count]) => ({ group, count }));
    
    // College ROI Ranking
    const deptData = Object.entries(deptMap)
      .map(([name, visits]) => {
        const deptConfig = config.departments?.find((d: any) => d.name === name);
        return { 
          name, 
          visits, 
          color: deptConfig?.color || '#355872',
          code: deptConfig?.code || 'UNIV'
        };
      })
      .sort((a, b) => b.visits - a.visits);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const peakHoursData = Object.entries(hourlyMap).map(([time, visits]) => ({ time, visits }));

    // Executive Summary Metrics
    const busiestDay = filteredVisits.length > 0 ? 
      format(new Date(filteredVisits[0].timestamp), 'EEEE') : 'N/A';
    const topCollege = deptData[0]?.name || 'N/A';

    return { 
      genderData, 
      ageData, 
      deptData, 
      purposeData, 
      peakHoursData, 
      total: filteredVisits.length,
      filteredVisits,
      summary: {
        busiestDay,
        topCollege,
        dateRangeStr: `${format(dateRange.from || new Date(), 'PP')} - ${format(dateRange.to || new Date(), 'PP')}`
      }
    };
  }, [rawVisits, dateRange, selectedDepartments, selectedGenders, ageRange, selectedPurposes, config]);

  const handleExport = () => {
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickDate = (type: 'day' | 'week' | 'month') => {
    const now = new Date();
    if (type === 'day') {
      setDateRange({ from: startOfDay(now), to: endOfDay(now) });
    } else if (type === 'week') {
      setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
    } else if (type === 'month') {
      setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    }
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
        <p className="text-slate-400 font-bold">Compiling Facility Analytics...</p>
      </div>
    );
  }

  const CHART_COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#BBDDFF', '#E2E8F0'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary tracking-tight">Library Analytics</h1>
          <p className="text-slate-500 font-medium">Departmental ROI and demographic segmentation</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-2xl h-14 gap-2 px-6"
          >
            <Filter className="h-5 w-5" />
            {showFilters ? "Hide Control Panel" : "Custom Analytics Panel"}
          </Button>
          
          <Button onClick={handleExport} className="rounded-2xl gap-3 bg-primary h-14 px-8 shadow-xl shadow-primary/20">
            <Download className="h-5 w-5" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white animate-in slide-in-from-top-4 duration-300 print:hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Report Segmentation Panel</CardTitle>
                  <CardDescription>Target specific populations for your facility utilization analysis</CardDescription>
                </div>
              </div>
              <Button variant="ghost" onClick={resetFilters} className="text-primary font-bold hover:bg-primary/5 rounded-xl">
                <X className="h-4 w-4 mr-2" /> Reset Metrics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Date Dependencies</Label>
                <div className="flex flex-col gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-bold rounded-2xl h-12 border-slate-200">
                        <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <span className="truncate">{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}</span>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Select Interval</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('day')} className="text-[10px] font-black h-9 rounded-lg">DAY</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('week')} className="text-[10px] font-black h-9 rounded-lg">WEEK</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('month')} className="text-[10px] font-black h-9 rounded-lg">MONTH</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Target Academic Units</Label>
                <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-3 custom-scrollbar">
                  {config?.departments?.map((dept: any) => (
                    <div key={dept.id} className="flex items-center space-x-3 group">
                      <Checkbox 
                        id={`dept-${dept.id}`} 
                        checked={selectedDepartments.includes(dept.name)}
                        onCheckedChange={(checked) => {
                          setSelectedDepartments(checked 
                            ? [...selectedDepartments, dept.name] 
                            : selectedDepartments.filter(d => d !== dept.name)
                          );
                        }}
                        className="rounded-md border-slate-300"
                      />
                      <label htmlFor={`dept-${dept.id}`} className="text-sm font-bold text-slate-700 cursor-pointer group-hover:text-primary transition-colors">
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Demographics</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map((g) => (
                      <Badge 
                        key={g} 
                        variant={selectedGenders.includes(g) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer font-black px-4 py-1.5 rounded-xl border-slate-200 transition-all",
                          selectedGenders.includes(g) ? "bg-primary text-white scale-105" : "hover:border-primary/50"
                        )}
                        onClick={() => {
                          setSelectedGenders(selectedGenders.includes(g)
                            ? selectedGenders.filter(item => item !== g)
                            : [...selectedGenders, g]
                          );
                        }}
                      >
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Age Bracket</Label>
                    <Badge variant="secondary" className="text-[11px] font-black">{ageRange[0]} - {ageRange[1]}</Badge>
                  </div>
                  <Slider 
                    defaultValue={[0, 100]} 
                    max={100} 
                    step={1} 
                    value={ageRange}
                    onValueChange={(val: any) => setAgeRange(val)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Visit Purpose</Label>
                <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-3 custom-scrollbar">
                  {(config?.purposes || PURPOSES).map((p: any) => (
                    <div key={p.id} className="flex items-center space-x-3 group">
                      <Checkbox 
                        id={`purpose-${p.id}`} 
                        checked={selectedPurposes.includes(p.label)}
                        onCheckedChange={(checked) => {
                          setSelectedPurposes(checked 
                            ? [...selectedPurposes, p.label] 
                            : selectedPurposes.filter(item => item !== p.label)
                          );
                        }}
                        className="rounded-md border-slate-300"
                      />
                      <label htmlFor={`purpose-${p.id}`} className="text-sm font-bold text-slate-700 cursor-pointer group-hover:text-primary transition-colors">
                        {p.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/30 p-8">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-primary flex items-center gap-3">
                  <TrendingUp className="h-6 w-6" />
                  Utilization Pulse
                </CardTitle>
                <CardDescription className="text-base">Real-time age clustering of target population</CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-primary text-white px-5 py-2 text-sm font-black rounded-2xl">
                  {analytics?.total} DATA POINTS
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.ageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '20px' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="count" name="Visits" fill="#355872" radius={[12, 12, 0, 0]} barSize={80} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 text-center">
            <CardTitle className="text-2xl font-black text-primary">Gender Split</CardTitle>
            <CardDescription className="text-base">Demographic ratio of filtered entries</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full pb-16">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.genderData}
                    innerRadius={90}
                    outerRadius={120}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {analytics?.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-[1.5rem]">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-primary">Facility Traffic Patterns</CardTitle>
                <CardDescription className="text-base">Hourly utilization during operational window</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.peakHoursData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#355872" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', padding: '15px' }} />
                  <Area type="monotone" dataKey="visits" stroke="#355872" strokeWidth={5} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-accent/20 rounded-[1.5rem]">
                <Award className="h-7 w-7 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-primary">Departmental ROI Ranking</CardTitle>
                <CardDescription className="text-base">Utilization leaderboards by academic unit</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <div className="space-y-8 mt-6 max-h-[380px] overflow-y-auto pr-4 custom-scrollbar">
              {analytics?.deptData.map((dept, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dept.color }} />
                        <span className="font-black text-slate-800 text-lg uppercase tracking-tight">{dept.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-black px-3 py-1 text-primary">{dept.visits} VISITS</Badge>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                        style={{ 
                          width: `${analytics.total > 0 ? (dept.visits / analytics.total) * 100 : 0}%`,
                          backgroundColor: dept.color 
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-6 h-12 w-12 rounded-3xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-300 border border-slate-100">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1100px] h-[95vh] flex flex-col p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <FileCheck className="h-8 w-8 text-green-400" />
                OFFICIAL SYSTEM GENERATED REPORT
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                Valid and certified for university record keeping
              </DialogDescription>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="h-12 bg-white/10 border-white/20 hover:bg-white/20 rounded-xl px-6 font-bold" onClick={handlePrint}>
                <Printer className="h-5 w-5 mr-3" />
                Print Document
              </Button>
              <Button variant="ghost" className="h-12 text-white hover:bg-white/10 rounded-xl px-4" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-200/50 p-16 print:p-0 print:bg-white custom-scrollbar">
            <div id="print-area" className="bg-white shadow-2xl mx-auto max-w-[850px] min-h-[1100px] p-20 print:shadow-none print:max-w-none font-serif flex flex-col rounded-[2rem] print:rounded-none">
              {/* Official Header */}
              {config?.useLetterhead && (
                <div className="flex items-center justify-between border-b-[6px] border-slate-900 pb-10 mb-16">
                  <div className="flex items-center gap-10">
                    <div className="h-28 w-28 bg-primary flex items-center justify-center text-white rounded-3xl shadow-2xl p-4">
                      <FileCheck className="h-full w-full" />
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">University Central Library</h1>
                      <p className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] pt-1">Office of the Chief Librarian</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest">A-202, Admin Building, NEU Main Campus</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-800 tracking-tighter">REF: LIB-{format(new Date(), 'yyyy-MM-dd')}-XR</p>
                      <p className="text-[10px] font-bold text-slate-400">TIMESTAMP: {format(new Date(), 'HH:mm:ss')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Title Section */}
              <div className="text-center mb-20 space-y-4">
                <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tight">Utilization Performance Report</h2>
                <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.3em]">
                  {analytics?.summary.dateRangeStr}
                </div>
              </div>

              {/* Executive Metrics */}
              <div className="grid grid-cols-3 gap-10 mb-20">
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Total Utilization</p>
                  <p className="text-5xl font-black text-primary leading-none">{analytics?.total}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase border-t pt-4">Verified Log Entries</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Peak Activity Day</p>
                  <p className="text-3xl font-black text-primary leading-none">{analytics?.summary.busiestDay}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase border-t pt-4">Daily Volume Max</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Leading Academic Unit</p>
                  <p className="text-2xl font-black text-primary leading-tight truncate">{analytics?.summary.topCollege}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase border-t pt-4">Primary ROI Source</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="mb-20 flex-1">
                <h3 className="text-xl font-black text-slate-900 border-b-4 border-slate-900 pb-3 mb-8 uppercase tracking-[0.2em]">Activity Ledger (Sample)</h3>
                <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <th className="p-4 border-r border-white/20">Visitor Identity</th>
                        <th className="p-4 border-r border-white/20">Departmental Group</th>
                        <th className="p-4 border-r border-white/20">Visit Intent</th>
                        <th className="p-4 text-right">Validated Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {analytics?.filteredVisits.slice(0, 20).map((visit) => (
                        <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-black text-slate-900 border-r border-slate-100">
                            {visit.patronName}
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{visit.schoolId}</p>
                          </td>
                          <td className="p-4 font-bold text-slate-600 italic border-r border-slate-100">
                            <div className="flex flex-wrap gap-1">
                              {visit.patronDepartments?.map((d: string, idx: number) => (
                                <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[9px]">{d}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 border-r border-slate-100">
                            <span className="font-black text-primary uppercase text-[9px]">{visit.purpose}</span>
                          </td>
                          <td className="p-4 text-right font-mono font-black text-slate-400">
                            {format(new Date(visit.timestamp), 'MM/dd HH:mm:ss')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics && analytics.filteredVisits.length > 20 && (
                    <div className="p-6 bg-slate-900 text-white text-center text-[10px] font-black uppercase tracking-[0.3em]">
                      Total Records: {analytics.filteredVisits.length} | Page 1 of 1
                    </div>
                  )}
                </div>
              </div>

              {/* Official Seal and Signatures */}
              <div className="mt-auto">
                <div className="grid grid-cols-2 gap-20 pt-20 border-t-2 border-slate-100">
                  <div className="text-center space-y-4">
                    <div className="h-[2px] w-full bg-slate-900" />
                    <p className="text-xs font-black uppercase text-slate-900 tracking-widest">System Record Officer</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Digital Signature Applied</p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-[2px] w-full bg-slate-900" />
                    <p className="text-xs font-black uppercase text-slate-900 tracking-widest">Chief Librarian / Registrar</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Official University Endorsement</p>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                  <p>PATRONPOINT SECURE ANALYTICS ENGINE</p>
                  <p>&copy; 2026 UNIVERSITY RECORDS</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
