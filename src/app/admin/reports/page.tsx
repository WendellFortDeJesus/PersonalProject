"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  MapPin,
  ChevronRight
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
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demographic Data
const ageDemographics = [
  { group: '18-20', count: 145, female: 85, male: 60 },
  { group: '21-23', count: 210, female: 120, male: 90 },
  { group: '24-26', count: 85, female: 45, male: 40 },
  { group: '27+', count: 40, female: 20, male: 20 },
];

const genderData = [
  { name: 'Female', value: 280, color: '#355872' },
  { name: 'Male', value: 190, color: '#7AAACE' },
  { name: 'Other', value: 10, color: '#E2E8F0' },
];

const purposeStats = [
  { name: 'Reading Books', value: 450, color: '#355872' },
  { name: 'Research / Thesis', value: 300, color: '#7AAACE' },
  { name: 'Use of Computer', value: 150, color: '#9CD5FF' },
  { name: 'Doing Assignments', value: 100, color: '#BBDDFF' },
];

const departmentalUsage = [
  { name: 'Informatics', visits: 420, active: 85 },
  { name: 'Engineering', visits: 340, active: 62 },
  { name: 'Business', visits: 210, active: 45 },
  { name: 'Arts/Sci', visits: 180, active: 30 },
  { name: 'Nursing', visits: 120, active: 25 },
];

const peakHoursData = [
  { time: '08:00', visits: 12 },
  { time: '09:00', visits: 28 },
  { time: '10:00', visits: 45 },
  { time: '11:00', visits: 62 },
  { time: '12:00', visits: 78 },
  { time: '13:00', visits: 85 },
  { time: '14:00', visits: 82 },
  { time: '15:00', visits: 68 },
  { time: '16:00', visits: 55 },
  { time: '17:00', visits: 42 },
  { time: '18:00', visits: 30 },
];

export default function ReportsPage() {
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const { toast } = useToast();

  const handleExport = (formatType: 'PDF' | 'CSV') => {
    toast({
      title: `Exporting ${formatType} Report`,
      description: `Your ${formatType} file is being prepared and will download shortly.`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Library Analytics</h1>
          <p className="text-slate-500 font-medium">Comprehensive insight into facility usage and demographics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-2xl gap-2 border-slate-200 h-12 px-6">
                <CalendarIcon className="h-5 w-5 text-slate-400" />
                <span className="font-bold">
                  {date.from ? format(date.from, "MMM d") : "Start"} - {date.to ? format(date.to, "MMM d, yyyy") : "End"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                selected={{ from: date.from, to: date.to }}
                onSelect={(range: any) => setDate({ from: range?.from, to: range?.to })}
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
        {/* Main Demographics Card */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Demographic Heatmap</CardTitle>
                <CardDescription>Visitor distribution by Age and Gender</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-white text-primary border-slate-200 px-3 py-1 font-bold">
                Last 30 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDemographics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="female" name="Female Visitors" stackId="a" fill="#355872" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar dataKey="male" name="Male Visitors" stackId="a" fill="#7AAACE" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Breakdown Card */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">Gender Split</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full pb-12">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center space-y-1">
              <p className="text-4xl font-bold text-primary">58%</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Female Dominance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Hours Report */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Peak Hours Report</CardTitle>
                <CardDescription>Daily traffic flow and busiest periods</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHoursData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#355872" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#355872" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Usage Ranking */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <MapPin className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Departmental Activity</CardTitle>
                <CardDescription>Most active college departments and offices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-6">
              {departmentalUsage.map((dept, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700">{dept.name}</span>
                      <span className="text-xs font-bold text-slate-400">{dept.visits} Visits</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000" 
                        style={{ width: `${(dept.visits / 450) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-200 ml-4 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purpose Summary */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-xl font-bold">Purpose Allocation Summary</CardTitle>
          <CardDescription>Justifying facility allocation based on visitor intent</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-12 p-12 pt-6">
          <div className="h-[350px] w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={purposeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={130}
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
          <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {purposeStats.map((item, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-4 h-4 rounded-full mb-3" style={{ backgroundColor: item.color }} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{item.name}</p>
                <p className="text-3xl font-bold text-primary">{item.value}</p>
                <p className="text-xs font-bold text-slate-400 mt-2">TOTAL ENTRIES</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
