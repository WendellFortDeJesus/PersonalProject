
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
  PieChart as PieChartIcon
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
  CartesianGrid
} from 'recharts';
import { MOCK_VISITS, PURPOSES, DEPARTMENTS } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const chartData = [
  { name: 'Mon', visits: 120 },
  { name: 'Tue', visits: 185 },
  { name: 'Wed', visits: 230 },
  { name: 'Thu', visits: 210 },
  { name: 'Fri', visits: 160 },
  { name: 'Sat', visits: 85 },
  { name: 'Sun', visits: 45 },
];

const purposeStats = [
  { name: 'Reading Books', value: 450, color: '#355872' },
  { name: 'Research / Thesis', value: 300, color: '#7AAACE' },
  { name: 'Use of Computer', value: 150, color: '#9CD5FF' },
  { name: 'Doing Assignments', value: 100, color: '#E2E8F0' },
];

const collegeStats = [
  { name: 'Engineering', visits: 340 },
  { name: 'Informatics', visits: 420 },
  { name: 'Business', visits: 210 },
  { name: 'Arts/Sci', visits: 180 },
  { name: 'Others', visits: 90 },
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
      title: "Generating Report",
      description: "Your PDF report is being prepared for download.",
    });
    // In a real app, this would trigger jsPDF or a backend PDF service
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: `Library_Report_${format(new Date(), 'yyyyMMdd')}.pdf has been downloaded.`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-slate-700">Analytics Filter:</span>
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
            Download PDF
          </Button>
        </div>
      </div>

      {/* Live Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Traffic</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">82</h3>
                <p className="text-[10px] font-bold text-green-600 mt-2 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                  PATRONS INSIDE NOW
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Total</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">248</h3>
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

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg. Session</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">2.4h</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2">
                  PEAK: 10AM - 2PM
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-2xl">
                <Clock className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Satisfaction</p>
                <h3 className="text-4xl font-bold mt-1 text-primary">98%</h3>
                <p className="text-[10px] font-bold text-green-600 mt-2">
                  KIOSK UPTIME: 100%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Analysis */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Visitor Traffic Trends</CardTitle>
            <CardDescription>Frequency of visits over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#355872" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#355872', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Purpose Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Purpose Breakdown</CardTitle>
            <CardDescription>Primary reasons for visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purposeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {purposeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {purposeStats.map((item) => (
                <div key={item.name} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary ml-3">{Math.round((item.value/1000)*100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* College Breakdown */}
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">College / Department Engagement</CardTitle>
            <CardDescription>Visitor volume categorized by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collegeStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeights: '600'}} width={100} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="visits" fill="#7AAACE" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
