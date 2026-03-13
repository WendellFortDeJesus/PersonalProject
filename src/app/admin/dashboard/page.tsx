
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  BookOpen, 
  Monitor, 
  Printer, 
  Search,
  MoreVertical
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
  Pie
} from 'recharts';
import { MOCK_VISITS, PURPOSES } from '@/lib/data';
import { Button } from '@/components/ui/button';

const chartData = [
  { name: 'Mon', visits: 120 },
  { name: 'Tue', visits: 185 },
  { name: 'Wed', visits: 230 },
  { name: 'Thu', visits: 210 },
  { name: 'Fri', visits: 160 },
  { name: 'Sat', visits: 85 },
  { name: 'Sun', visits: 45 },
];

const purposeData = [
  { name: 'Study', value: 450, color: '#355872' },
  { name: 'Research', value: 300, color: '#7AAACE' },
  { name: 'Meeting', value: 150, color: '#9CD5FF' },
  { name: 'Others', value: 100, color: '#E2E8F0' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Visits</p>
                <h3 className="text-3xl font-bold mt-1 text-primary">248</h3>
                <div className="flex items-center mt-2 text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from yesterday
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Stay Time</p>
                <h3 className="text-3xl font-bold mt-1 text-primary">2.4h</h3>
                <div className="flex items-center mt-2 text-slate-500 text-xs font-bold bg-slate-50 w-fit px-2 py-1 rounded">
                  <Clock className="h-3 w-3 mr-1" />
                  Stable this week
                </div>
              </div>
              <div className="p-3 bg-secondary/20 rounded-xl">
                <Clock className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <h3 className="text-3xl font-bold mt-1 text-primary">82</h3>
                <div className="flex items-center mt-2 text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  4 new check-ins
                </div>
              </div>
              <div className="p-3 bg-accent/20 rounded-xl">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <h3 className="text-3xl font-bold mt-1 text-primary">99.9%</h3>
                <div className="flex items-center mt-2 text-slate-500 text-xs font-bold bg-slate-50 w-fit px-2 py-1 rounded">
                  All systems operational
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visitor Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Check-in Trends</CardTitle>
              <CardDescription>Daily visitor count for the current week</CardDescription>
            </div>
            <Button variant="outline" size="sm">Download Report</Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(53, 88, 114, 0.05)'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="visits" 
                    fill="#355872" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Purpose Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Purpose Breakdown</CardTitle>
            <CardDescription>Most common reasons for library visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purposeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {purposeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {purposeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{Math.round((item.value/1000)*100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-ins */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Recent Check-ins</CardTitle>
            <CardDescription>Real-time stream of incoming patrons</CardDescription>
          </div>
          <Button variant="ghost" size="sm">View All</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {MOCK_VISITS.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${visit.patronId}/100/100`} />
                    <AvatarFallback>{visit.patronName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{visit.patronName}</p>
                    <p className="text-xs text-muted-foreground">{visit.purpose} &bull; {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    Student
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
