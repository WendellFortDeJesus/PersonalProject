
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Download,
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  UserCheck,
  Building2,
  Clock,
  ChevronRight,
  UserPlus
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
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { MOCK_PATRONS, MOCK_VISITS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isAfter, subHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
  const [filterPreset, setFilterPreset] = useState('This Week');
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadReport = () => {
    toast({
      title: "Generating Comprehensive Report",
      description: "Preparing Demographic Heatmap, Peak Hours Analysis, and New Visitor Logs...",
    });
    
    setTimeout(() => {
      toast({
        title: "PDF Ready",
        description: `Library_Analytics_Report_${format(new Date(), 'yyyyMMdd')}.pdf downloaded.`,
      });
    }, 2500);
  };

  const isNewVisitor = (createdAt: string) => {
    return isAfter(new Date(createdAt), subHours(new Date(), 24));
  };

  const newVisitors = MOCK_PATRONS.filter(p => isNewVisitor(p.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Helper for safe client-side date formatting
  const safeFormat = (date: Date | string | undefined, formatStr: string, fallback = "...") => {
    if (!mounted || !date) return fallback;
    return format(new Date(date), formatStr);
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
                  {safeFormat(dateRange.from, "PPP", "Start")} - {safeFormat(dateRange.to, "PPP", "End")}
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New Registrations</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">{newVisitors.length}</h3>
                <p className="text-[10px] font-bold text-blue-600 mt-2 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                  LAST 24 HOURS
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-2xl">
                <UserPlus className="h-6 w-6 text-blue-600" />
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
                <p className="text-[10px] font-bold text-green-600 mt-2 uppercase">
                  PEAK: 10AM-2PM
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

        {/* New Visitor Login Users */}
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">New Visitor Login Users</CardTitle>
              <CardDescription>Recently registered patrons in the last 24 hours</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold gap-1 rounded-lg">
              View Directory
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newVisitors.length > 0 ? (
                newVisitors.map((visitor) => (
                  <div key={visitor.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all cursor-pointer">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={visitor.photoUrl || `https://picsum.photos/seed/${visitor.id}/100/100`} />
                      <AvatarFallback>{visitor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">{visitor.name}</span>
                        <Badge className="bg-blue-500 text-[8px] h-3.5 px-1 font-bold">NEW</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {visitor.schoolId}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-[10px] text-slate-500">
                          Registered {safeFormat(visitor.createdAt, 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <Users className="h-8 w-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold">No new visitors today</p>
                    <p className="text-xs text-slate-400">Visitor activity will appear here as they register.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
