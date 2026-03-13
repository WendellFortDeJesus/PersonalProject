
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  Users as UsersIcon,
  Filter,
  Check,
  X,
  ChevronDown,
  Info,
  Printer,
  FileCheck
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { DEPARTMENTS, GENDERS, PURPOSES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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

  // System Config
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
    if (!rawVisits) return null;

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
    const deptData = Object.entries(deptMap)
      .map(([name, visits]) => ({ name, visits }))
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
  }, [rawVisits, dateRange, selectedDepartments, selectedGenders, ageRange, selectedPurposes]);

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

  const COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#BBDDFF', '#E2E8F0'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Library Traffic Reports</h1>
          <p className="text-slate-500 font-medium">Filtered insights and demographic breakdowns</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl h-12 gap-2"
          >
            <Filter className="h-5 w-5" />
            {showFilters ? "Hide Filters" : "Custom Filter Panel"}
          </Button>
          
          <Button onClick={handleExport} className="rounded-xl gap-2 bg-primary h-12 px-6 shadow-lg shadow-primary/20">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white animate-in slide-in-from-top-4 duration-300 print:hidden">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-bold">Report Customization</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary font-bold text-xs gap-1">
                <X className="h-3 w-3" /> Reset All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Time Interval</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl h-11">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
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
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('day')} className="text-[10px] font-bold h-8">TODAY</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('week')} className="text-[10px] font-bold h-8">THIS WEEK</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickDate('month')} className="text-[10px] font-bold h-8">THIS MONTH</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Colleges / Units</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {DEPARTMENTS.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`dept-${dept}`} 
                        checked={selectedDepartments.includes(dept)}
                        onCheckedChange={(checked) => {
                          setSelectedDepartments(checked 
                            ? [...selectedDepartments, dept] 
                            : selectedDepartments.filter(d => d !== dept)
                          );
                        }}
                      />
                      <label htmlFor={`dept-${dept}`} className="text-sm font-medium leading-none cursor-pointer">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Gender Identity</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map((g) => (
                      <Badge 
                        key={g} 
                        variant={selectedGenders.includes(g) ? "default" : "outline"}
                        className="cursor-pointer font-bold px-3 py-1"
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Age Range</Label>
                    <span className="text-[10px] font-bold text-primary">{ageRange[0]} - {ageRange[1]} yrs</span>
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
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Visit Intent</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {PURPOSES.map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`purpose-${p.id}`} 
                        checked={selectedPurposes.includes(p.label)}
                        onCheckedChange={(checked) => {
                          setSelectedPurposes(checked 
                            ? [...selectedPurposes, p.label] 
                            : selectedPurposes.filter(item => item !== p.label)
                          );
                        }}
                      />
                      <label htmlFor={`purpose-${p.id}`} className="text-sm font-medium leading-none cursor-pointer">
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
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 pb-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Demographic Heatmap (Age)</CardTitle>
                <CardDescription>Breakdown of filtered visitors by age cluster</CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="secondary" className="bg-white text-primary border-slate-200 px-3 py-1 font-bold">
                  {analytics?.total} Matching Entries
                </Badge>
                {mounted && (
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                    {format(dateRange.from || new Date(), "MMM d")} - {format(dateRange.to || new Date(), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.ageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Bar dataKey="count" name="Visits" fill="#355872" radius={[6, 6, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Gender Segmentation</CardTitle>
            <CardDescription className="text-center italic">Filtered demographic ratio</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full pb-12">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.genderData}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {analytics?.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Peak Hours Report</CardTitle>
                <CardDescription>Visualizing traffic across operating hours</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.peakHoursData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#355872" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Area type="monotone" dataKey="visits" stroke="#355872" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <MapPin className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">College Participation Ranking</CardTitle>
                <CardDescription>Most active academic units based on selection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {analytics?.deptData.map((dept, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">{dept.name}</span>
                      <span className="text-xs font-bold text-slate-400">{dept.visits} Visits</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000" 
                        style={{ width: `${analytics.total > 0 ? (dept.visits / analytics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-300">
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
        <DialogContent className="max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem]">
          <DialogHeader className="p-6 bg-slate-900 text-white flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-bold">PDF Report Preview</DialogTitle>
              <DialogDescription className="text-slate-400">Professional layout for university records</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-100 p-12 print:p-0 print:bg-white">
            <div id="print-area" className="bg-white shadow-xl mx-auto max-w-[800px] min-h-[1050px] p-16 print:shadow-none print:max-w-none font-serif">
              {/* Official Header */}
              {config?.useLetterhead && (
                <div className="flex items-center justify-between border-b-4 border-slate-900 pb-8 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 bg-primary flex items-center justify-center text-white rounded-xl shadow-lg">
                      <FileCheck className="h-12 w-12" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">University Central Library</h1>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Office of the Chief Librarian</p>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-400">
                    <p>GEN-ID: {format(new Date(), 'yyyyMMdd-HHmm')}</p>
                    <p>DATE: {format(new Date(), 'PPpp')}</p>
                  </div>
                </div>
              )}

              {/* Title Section */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-800 underline underline-offset-8">FACILITY UTILIZATION REPORT</h2>
                <p className="text-lg font-medium text-slate-500 mt-4 italic">Reporting Period: {analytics?.summary.dateRangeStr}</p>
              </div>

              {/* Executive Summary Section */}
              <div className="grid grid-cols-3 gap-8 mb-16">
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Utilization</p>
                  <p className="text-4xl font-black text-primary">{analytics?.total}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Recorded Visits</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peak Activity</p>
                  <p className="text-2xl font-black text-primary">{analytics?.summary.busiestDay}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Most Active Day</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Primary Unit</p>
                  <p className="text-xl font-black text-primary truncate">{analytics?.summary.topCollege}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Top Participating College</p>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="mb-16">
                <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-200 pb-2 mb-6 uppercase tracking-widest">Detailed Activity Log</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase">
                        <th className="p-3">Visitor Name</th>
                        <th className="p-3">College / Dept</th>
                        <th className="p-3">Demographics</th>
                        <th className="p-3">Intent of Visit</th>
                        <th className="p-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics?.filteredVisits.slice(0, 15).map((visit) => (
                        <tr key={visit.id}>
                          <td className="p-3 font-bold text-slate-800">{visit.patronName}</td>
                          <td className="p-3 font-medium text-slate-500 italic">{visit.patronDepartments?.[0]}</td>
                          <td className="p-3 text-slate-500">{visit.patronAge} / {visit.patronGender}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase">{visit.purpose}</Badge>
                          </td>
                          <td className="p-3 text-right font-mono text-[10px] text-slate-400">
                            {format(new Date(visit.timestamp), 'MM/dd HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics && analytics.filteredVisits.length > 15 && (
                    <div className="p-4 bg-slate-50 text-center text-[10px] font-bold text-slate-400 italic">
                      ... and {analytics.filteredVisits.length - 15} more entries in full database log ...
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-auto pt-24 flex justify-between">
                <div className="w-64 border-t-2 border-slate-900 pt-3 text-center">
                  <p className="text-xs font-black uppercase text-slate-900">System Administrator</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Certified Digital Record</p>
                </div>
                <div className="w-64 border-t-2 border-slate-900 pt-3 text-center">
                  <p className="text-xs font-black uppercase text-slate-900">Head Librarian</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Official University Endorsement</p>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                <p>PATRONPOINT SECURE LOGGING SYSTEM V2.4</p>
                <p>© 2026 UNIVERSITY RECORDS BUREAU</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
