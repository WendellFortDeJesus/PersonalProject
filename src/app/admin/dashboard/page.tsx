
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Building2,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, startOfDay, startOfWeek, isToday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const db = useFirestore();

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);
  const { data: visits, isLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;
    
    const today = visits.filter(v => isToday(new Date(v.timestamp)));
    const week = visits.filter(v => isThisWeek(new Date(v.timestamp)));
    
    // Peak Hour
    const hours = visits.map(v => new Date(v.timestamp).getHours());
    const hourCounts = hours.reduce((acc: any, h) => {
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0');

    // Peak College
    const colleges = visits.map(v => v.patronDepartments?.[0] || 'Unknown');
    const collegeCounts = colleges.reduce((acc: any, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const peakCollege = Object.keys(collegeCounts).reduce((a, b) => collegeCounts[a] > collegeCounts[b] ? a : b, 'None');

    // Most Common Purpose
    const purposes = visits.map(v => v.purpose);
    const purposeCounts = purposes.reduce((acc: any, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const mostCommonPurpose = Object.keys(purposeCounts).reduce((a, b) => purposeCounts[a] > purposeCounts[b] ? a : b, 'None');

    return {
      todayCount: today.length,
      weekCount: week.length,
      peakHour: `${peakHour}:00`,
      peakCollege,
      mostCommonPurpose,
      purposeData: Object.entries(purposeCounts).map(([name, value]) => ({ name, value })),
      collegeData: Object.entries(collegeCounts).map(([name, value]) => ({ name, value })).slice(0, 5)
    };
  }, [visits]);

  const COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#1e293b', '#64748b'];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Pulse</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Strategic Analytics Dashboard</p>
        </div>
        <div className="bg-white border p-3 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Time</span>
            <span className="text-sm font-black text-primary font-mono">{format(new Date(), 'HH:mm:ss')}</span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Visitors Today", value: stats?.todayCount, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { title: "Visitors This Week", value: stats?.weekCount, icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
          { title: "Peak Hour Today", value: stats?.peakHour, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Common Reason", value: stats?.mostCommonPurpose, icon: BookOpen, color: "text-accent-foreground", bg: "bg-accent/20" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div className={cn("p-4 rounded-2xl", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-6 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.title}</p>
                <h3 className="text-3xl font-black text-primary tracking-tighter truncate">{item.value ?? '0'}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem]">
          <CardHeader className="p-10 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Visit Intent Analytics</CardTitle>
              <Activity className="h-5 w-5 text-slate-200" />
            </div>
          </CardHeader>
          <CardContent className="p-10 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.purposeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} 
                  interval={0}
                />
                <YAxis hide />
                <ChartTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-primary uppercase mb-1">{payload[0].name}</p>
                          <p className="text-lg font-black text-primary">{payload[0].value} Visits</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#355872" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem]">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Department Reach</CardTitle>
          </CardHeader>
          <CardContent className="p-10 h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats?.collegeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.collegeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-6">
              {stats?.collegeData.slice(0, 3).map((item: any, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] font-black uppercase text-slate-500 truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-none">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Peak College Impact</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Institutional Lead: {stats?.peakCollege}</p>
          </div>
          <Building2 className="h-6 w-6 text-primary/20" />
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
            "The {stats?.peakCollege} currently leads institutional engagement with {visits?.filter(v => v.patronDepartments?.[0] === stats?.peakCollege).length} recorded sessions this term."
          </p>
        </div>
      </div>
    </div>
  );
}
