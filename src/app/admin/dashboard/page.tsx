
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Download,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  UserCheck,
  Building2
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
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { MOCK_VISITS, PURPOSES, DEPARTMENTS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Peak Hours Data (Visits vs Time of Day)
const peakHoursData = [
  { time: '08:00', visits: 12 },
  { time: '10:00', visits: 45 },
  { time: '12:00', visits: 78 },
  { time: '14:00', visits: 82 },
  { time: '16:00', visits: 55 },
  { time: '18:00', visits: 30 },
  { time: '20:00', visits: 15 },
];

// Demographic Data (Age Groups)
const ageDemographics = [
  { group: '18-20', count: 145 },
  { group: '21-23', count: 210 },
  { group: '24-26', count: 85 },
  { group: '27+', count: 40 },
];

// Gender Distribution
const genderData = [
  { name: 'Female', value: 280, color: '#355872' },
  { name: 'Male', value: 190, color: '#7AAACE' },
  { name: 'Other', value: 10, color: '#E2E8F0' },
];

// Purpose Distribution
const purposeStats = [
  { name: 'Reading Books', value: 450, color: '#355872' },
  { name: 'Research / Thesis', value: 300, color: '#7AAACE' },
  { name: 'Use of Computer', value: 150, color: '#9CD5FF' },
  { name: 'Doing Assignments', value: 100, color: '#BBDDFF' },
];

// Department Rankings
const departmentalUsage = [
  { name: 'Informatics', visits: 420 },
  { name: 'Engineering', visits: 340 },
  { name: 'Business', visits: 210 },
  { name: 'Arts/Sci', visits: 180 },
  { name: 'Nursing', visits: 120 },
];

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
  const [filterPreset, setFilterPreset] = useState('This Week');
  const { toast } = useToast();

  const handleDownloadReport = () => {
    toast({
      title: "Generating Comprehensive Report",
      description: "Preparing Demographic Heatmap, Peak Hours Analysis, and Departmental Usage rankings...",
    });
    
    setTimeout(() => {
      toast({
        title: "PDF Ready",
        description: `Library_Analytics_Report_${format(new Date(), 'yyyyMMdd')}.pdf downloaded.`,
      });
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-slate-700">Analytics Filters:</span>
          <div className="flex gap-1 ml-2">
            {['Today', 'This Week', 'This Month'].map((preset) => (
              <Button 
                key={preset}
                variant={filterPreset === preset ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterPreset(preset)}
                className="rounded-lg h-8 px-3 text-xs font-bold"
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-2 border-slate-200">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {dateRange.from ? format(dateRange.from, "PPP") : "Start"} - {dateRange.to ? format(dateRange.to, "PPP") : "End"}
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
          <Button onClick={handleDownloadReport} size="sm" className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Traffic</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">82</h3>
                <p className="text-[10px] font-bold text-green-600 mt-2 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                  CURRENTLY INSIDE
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily Average</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">312</h3>
                <div className="flex items-center mt-2 text-primary/60 text-[10px] font-bold">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs last week
                </div>
              </div>
              <div className="p-3 bg-accent/20 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Top College</p>
                <h3 className="text-2xl font-bold mt-1 text-primary truncate">Informatics</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                  42% of total traffic
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-2xl">
                <Building2 className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Main Purpose</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">Reading</h3>
                <p className="text-[10px] font-bold text-green-600 mt-2">
                  MOST ACTIVE: 10AM-2PM
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-2xl">
                <UserCheck className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Hours Report */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Peak Hours Report</CardTitle>
            <CardDescription>Visits plotted against time of day (Staff Scheduling Aid)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHoursData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#355872" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#355872" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demographic Heatmap (Age & Gender) */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Demographic Heatmap</CardTitle>
            <CardDescription>Usage breakdown by Age Group and Gender</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[200px]">
                <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest text-center">Age Groups</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageDemographics}>
                    <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" fill="#355872" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[200px]">
                <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest text-center">Gender Distribution</p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departmental Usage Ranking */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Departmental Usage Ranking</CardTitle>
            <CardDescription>Most active colleges and offices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentalUsage} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} width={100} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="visits" fill="#7AAACE" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Purpose Summary */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Purpose Summary</CardTitle>
            <CardDescription>Justifying facility allocation by visit reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purposeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {purposeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
