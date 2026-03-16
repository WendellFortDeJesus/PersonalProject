
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  UserPlus,
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
import { format, isToday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const db = useFirestore();
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(format(new Date(), 'HH:mm:ss'));
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);
  const { data: visits, isLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;
    
    const todayVisits = visits.filter(v => isToday(new Date(v.timestamp)));
    const weekVisits = visits.filter(v => isThisWeek(new Date(v.timestamp)));
    
    // Logic for New Visitors: IDs whose first visit ever is today
    const firstVisits = new Map<string, Date>();
    [...visits].reverse().forEach(v => {
      const vDate = new Date(v.timestamp);
      if (!firstVisits.has(v.patronId)) {
        firstVisits.set(v.patronId, vDate);
      }
    });
    const newVisitorsToday = Array.from(firstVisits.values()).filter(d => isToday(d)).length;

    // Peak Analytics
    const hours = visits.map(v => new Date(v.timestamp).getHours());
    const hourCounts = hours.reduce((acc: any, h) => {
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.keys(hourCounts).length > 0 
      ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0')
      : '0';

    const colleges = visits.map(v => v.patronDepartments?.[0] || 'Unknown');
    const collegeCounts = colleges.reduce((acc: any, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const peakCollege = Object.keys(collegeCounts).length > 0
      ? Object.keys(collegeCounts).reduce((a, b) => collegeCounts[a] > collegeCounts[b] ? a : b, 'None')
      : 'None';

    const purposes = visits.map(v => v.purpose);
    const purposeCounts = purposes.reduce((acc: any, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const mostCommonPurpose = Object.keys(purposeCounts).length > 0
      ? Object.keys(purposeCounts).reduce((a, b) => purposeCounts[a] > purposeCounts[b] ? a : b, 'None')
      : 'None';

    return {
      todayCount: todayVisits.length,
      newVisitorsToday,
      weekCount: weekVisits.length,
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
    <div className="p-8 space-y-8 animate-fade-in w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Pulse</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Strategic Analytics Dashboard</p>
        </div>
        <div className="bg-white border p-4 rounded-3xl flex items-center gap-6 shadow-xl border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Node Alpha</span>
            <span className="text-lg font-black text-primary font-mono">{currentTime || '--:--:--'}</span>
          </div>
          <div className="w-px h-10 bg-slate-100" />
          <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[
          { title: "Visitors Today", value: stats?.todayCount, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { title: "New Visitors Today", value: stats?.newVisitorsToday, icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
          { title: "Visitors This Week", value: stats?.weekCount, icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
          { title: "Peak Hour Today", value: stats?.peakHour, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Common Reason", value: stats?.mostCommonPurpose, icon: BookOpen, color: "text-slate-700", bg: "bg-slate-100" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 bg-white">
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div className={cn("p-5 rounded-2xl transition-colors", item.bg)}>
                  <item.icon className={cn("h-7 w-7", item.color)} />
                </div>
                <TrendingUp className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-8 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</p>
                <h3 className="text-4xl font-black text-primary tracking-tighter truncate">{item.value ?? '0'}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white">
          <CardHeader className="p-10 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Visit Intent Analytics</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-sectional visitor motivation</p>
              </div>
              <Activity className="h-6 w-6 text-primary/20" />
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
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  interval={0}
                />
                <YAxis hide />
                <ChartTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-primary p-5 shadow-2xl rounded-2xl border-none">
                          <p className="text-[10px] font-black text-white/60 uppercase mb-2 tracking-widest">{payload[0].name}</p>
                          <p className="text-2xl font-black text-white tracking-tighter">{payload[0].value} Visits</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#355872" radius={[15, 15, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-white">
          <CardHeader className="p-10 pb-0">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Department Reach</CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional engagement map</p>
          </CardHeader>
          <CardContent className="p-10 h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats?.collegeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats?.collegeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-8">
              {stats?.collegeData.slice(0, 3).map((item: any, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] font-black uppercase text-slate-600 truncate max-w-[150px] tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-primary p-10 rounded-[3rem] shadow-2xl border-none text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Building2 className="h-48 w-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Activity className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Strategic Insight</h3>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Institutional Lead: {stats?.peakCollege}</p>
            </div>
          </div>
          <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <p className="text-xl font-bold leading-relaxed italic text-white/90">
              "The {stats?.peakCollege} currently maintains the highest engagement index within the library network, reflecting a strong trend in academic resource utilization."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
