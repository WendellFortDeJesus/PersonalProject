"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  UserCheck,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Database,
  UserPlus
} from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
} from 'recharts';

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
    
    const firstVisits = new Map<string, any>();
    const sortedVisits = [...visits].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedVisits.forEach(v => {
      if (!firstVisits.has(v.patronId)) {
        firstVisits.set(v.patronId, v);
      }
    });
    
    const newVisitorsTodayList = Array.from(firstVisits.values()).filter(v => isToday(new Date(v.timestamp)));

    const hourCounts = todayVisits.reduce((acc: any, v) => {
      const h = new Date(v.timestamp).getHours();
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.keys(hourCounts).length > 0 
      ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0')
      : '0';

    const purposeCounts = visits.reduce((acc: any, v) => {
      acc[v.purpose] = (acc[v.purpose] || 0) + 1;
      return acc;
    }, {});
    const mostCommonPurpose = Object.keys(purposeCounts).length > 0
      ? Object.keys(purposeCounts).reduce((a, b) => purposeCounts[a] > purposeCounts[b] ? a : b, 'None')
      : 'None';

    const intentData = Object.entries(purposeCounts).map(([name, value]) => ({
      name,
      value
    }));

    const deptCounts = todayVisits.reduce((acc: any, v) => {
      const dept = v.patronDepartments?.[0] || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    const studentOccupancyData = Object.entries(deptCounts).map(([name, count]) => ({
      name: name.replace('College of ', ''),
      count
    }));

    const COLORS = ['#355872', '#7AAACE', '#9CD5FF', '#2D4356', '#A5C9CA'];

    return {
      todayCount: todayVisits.length,
      newVisitorsList: newVisitorsTodayList,
      weekCount: weekVisits.length,
      peakHour: `${peakHour}:00`,
      mostCommonPurpose,
      intentData,
      studentOccupancyData,
      COLORS
    };
  }, [visits]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 space-y-4 animate-fade-in w-full max-w-full overflow-x-hidden bg-slate-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Pulse</h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Strategic Analytics Dashboard</p>
        </div>
        <div className="bg-white border p-2 px-3 rounded-xl flex items-center gap-3 shadow-sm border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">System Node Alpha</span>
            <span className="text-xs font-black text-primary font-mono">{currentTime || '--:--:--'}</span>
          </div>
          <div className="w-px h-5 bg-slate-100" />
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { title: "Visitors Today", value: stats?.todayCount, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { title: "All Time Visitors", value: visits?.length, icon: Database, color: "text-green-600", bg: "bg-green-50" },
          { title: "Visitors This Week", value: stats?.weekCount, icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
          { title: "Peak Hour Today", value: stats?.peakHour, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Common Reason", value: stats?.mostCommonPurpose, icon: BookOpen, color: "text-slate-700", bg: "bg-slate-100" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm rounded-xl overflow-hidden group bg-white">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className={cn("p-1.5 rounded-lg transition-colors", item.bg)}>
                  <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                </div>
                <TrendingUp className="h-3 w-3 text-slate-100 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.title}</p>
                <h3 className="text-lg font-black text-primary tracking-tighter truncate leading-tight">{item.value ?? '0'}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intent Distribution - Pie Chart */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-primary/5 rounded-lg">
              <PieIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Visit Intent Distribution</CardTitle>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Primary Purpose Breakdown</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[280px]">
            {stats?.intentData && stats.intentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, bottom: 20, left: 10, right: 10 }}>
                  <Pie
                    data={stats.intentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {stats.intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stats.COLORS[index % stats.COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                No intent data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Occupancy - Column Bar Chart */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <BarIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Student Occupancy</CardTitle>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Active Presence by Academic Unit</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[280px]">
            {stats?.studentOccupancyData && stats.studentOccupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.studentOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 7, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 7, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#355872" 
                    radius={[4, 4, 0, 0]} 
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                No student occupancy recorded today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Enlarged Registration Activity Section */}
      <div className="bg-primary p-12 md:p-16 lg:p-20 rounded-[3rem] shadow-xl border-none text-white overflow-hidden relative group transition-all duration-500 hover:shadow-primary/20">
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
              <UserCheck className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-4xl font-headline font-black uppercase tracking-tighter leading-none">New Registration Activity</h3>
              <p className="text-sm font-black text-white/50 uppercase tracking-[0.3em] mt-2">
                Total Institutional Growth Today: <span className="text-accent">{stats?.newVisitorsList.length || 0}</span> Active Identities
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[300px]">
            {stats?.newVisitorsList && stats.newVisitorsList.length > 0 ? (
              stats.newVisitorsList.map((v: any, idx: number) => (
                <div key={idx} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl flex flex-col justify-center transition-all hover:bg-white/10 hover:scale-[1.02] shadow-lg">
                  <p className="text-xl font-black text-accent uppercase tracking-tight leading-none mb-3 truncate">{v.patronName}</p>
                  <p className="text-sm font-bold text-white/70 uppercase tracking-tighter truncate">{v.patronDepartments?.[0] || 'Unit Unassigned'}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <p className="text-[10px] font-mono font-bold text-white/30 tracking-widest uppercase">ID Node</p>
                    <p className="text-[11px] font-mono font-black text-white/40">{v.schoolId}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/20 backdrop-blur-xl text-center flex flex-col items-center justify-center gap-8 w-full">
                <UserPlus className="h-20 w-20 text-white/10" />
                <p className="text-sm font-black text-white/30 uppercase tracking-[0.4em]">No new visitor registrations recorded for current cycle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}