"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  Users as UsersIcon
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
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const { toast } = useToast();
  const db = useFirestore();

  // Real-time data fetching
  const visitsQuery = useMemoFirebase(() => {
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);

  const { data: rawVisits, isLoading } = useCollection(visitsQuery);

  // Filter and Process Data
  const analytics = useMemo(() => {
    if (!rawVisits) return null;

    const filteredVisits = rawVisits.filter(v => {
      if (!dateRange.from || !dateRange.to) return true;
      const visitDate = new Date(v.timestamp);
      return isWithinInterval(visitDate, { 
        start: startOfDay(dateRange.from), 
        end: endOfDay(dateRange.to) 
      });
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
      // Gender
      const gender = v.patronGender || 'Unknown';
      genderMap[gender] = (genderMap[gender] || 0) + 1;

      // Age
      const age = v.patronAge;
      if (age <= 20) ageMap['18-20']++;
      else if (age <= 23) ageMap['21-23']++;
      else if (age <= 26) ageMap['24-26']++;
      else ageMap['27+']++;

      // Dept (multi-select)
      v.patronDepartments?.forEach((d: string) => {
        deptMap[d] = (deptMap[d] || 0) + 1;
      });

      // Purpose
      const purpose = v.purpose || 'Other';
      purposeMap[purpose] = (purposeMap[purpose] || 0) + 1;

      // Peak Hours (8 AM to 6 PM focus)
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

    return { genderData, ageData, deptData, purposeData, peakHoursData, total: filteredVisits.length };
  }, [rawVisits, dateRange]);

  const handleExport = (formatType: 'PDF' | 'CSV') => {
    toast({
      title: `Exporting ${formatType} Report`,
      description: `Your ${formatType} file for ${analytics?.total || 0} entries is being prepared.`,
    });
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Library Analytics</h1>
          <p className="text-slate-500 font-medium">Data-driven insights for management and budget justification</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-2xl gap-2 border-slate-200 h-12 px-6">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <span className="font-bold">
                  {dateRange.from ? format(dateRange.from, "MMM d") : "Start"} - {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "End"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={() => handleExport('PDF')} className="rounded-2xl gap-2 bg-primary h-12 px-6 shadow-lg shadow-primary/20">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
          <Button onClick={() => handleExport('CSV')} variant="outline" className="rounded-2xl gap-2 border-slate-200 h-12 px-6">
            <FileText className="h-5 w-5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Age Group Bar Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Demographic Heatmap (Age)</CardTitle>
                <CardDescription>Breakdown of visitors by age category</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-white text-primary border-slate-200 px-3 py-1 font-bold">
                {analytics?.total} Total Visits
              </Badge>
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

        {/* Gender Pie Chart */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Gender Segmentation</CardTitle>
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
            <div className="mt-4 text-center">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ratio of Participation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Hours Area Chart */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Peak Hours Report</CardTitle>
                <CardDescription>Plotted against time of day (8 AM - 6 PM)</CardDescription>
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

        {/* Department Ranking */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <MapPin className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Departmental Activity</CardTitle>
                <CardDescription>Ranking of the most active university units</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-6 max-h-[350px] overflow-y-auto pr-2">
              {analytics?.deptData.map((dept, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">{dept.name}</span>
                      <span className="text-xs font-bold text-slate-400">{dept.visits} Visits</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000" 
                        style={{ width: `${analytics.total > 0 ? (dept.visits / analytics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-200 ml-4 group-hover:text-primary" />
                </div>
              ))}
              {(!analytics?.deptData || analytics.deptData.length === 0) && (
                <p className="text-center text-slate-300 py-20 font-medium">No activity recorded for this period.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purpose Statistics */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-0 pt-10">
          <CardTitle className="text-2xl font-bold">Intent-Based Purpose Summary</CardTitle>
          <CardDescription>Justifying facility budget based on visitor intent</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-12 p-12">
          <div className="h-[350px] w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.purposeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={130}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {analytics?.purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {analytics?.purposeData.map((item, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full mb-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{item.name}</p>
                <p className="text-3xl font-bold text-primary">{item.value}</p>
                <p className="text-xs font-bold text-slate-400 mt-2">TOTAL LOG ENTRIES</p>
              </div>
            ))}
            {(!analytics?.purposeData || analytics.purposeData.length === 0) && (
              <div className="col-span-2 py-10 text-center text-slate-300 italic">
                Gathering intent data...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
