
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const { data: rawVisits, isLoading: isDataLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!rawVisits) return { total: 0, avgAge: 0, topDept: 'N/A', chartData: [] };
    
    const total = rawVisits.length;
    const sumAge = rawVisits.reduce((acc, v) => acc + (v.patronAge || 0), 0);
    const avgAge = total > 0 ? Math.round(sumAge / total) : 0;
    
    const depts: Record<string, number> = {};
    rawVisits.forEach(v => {
      v.patronDepartments?.forEach((d: string) => {
        depts[d] = (depts[d] || 0) + 1;
      });
    });
    const topDept = Object.entries(depts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const hourly: Record<string, number> = {};
    rawVisits.forEach(v => {
      const h = new Date(v.timestamp).getHours();
      const label = `${h}:00`;
      hourly[label] = (hourly[label] || 0) + 1;
    });
    const chartData = Object.entries(hourly).map(([time, count]) => ({ time, count }));

    return { total, avgAge, topDept, chartData };
  }, [rawVisits]);

  const safeFormat = (date: string | Date | undefined, formatStr: string, fallback = "...") => {
    if (!mounted || !date) return fallback;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, formatStr);
    } catch {
      return fallback;
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing Uplink...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* KPI Data Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem]">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-4">Total Visitors Today</p>
            <h3 className="text-5xl font-black">{stats.total}</h3>
            <p className="text-[10px] font-bold mt-2 text-white/70 uppercase">Pulse Active</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Top Academic Unit</p>
            <h3 className="text-xl font-black text-primary truncate uppercase">{stats.topDept}</h3>
            <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-widest">Highest Engagement</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Average Patron Age</p>
            <h3 className="text-5xl font-black text-primary">{stats.avgAge}</h3>
            <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-widest">Years Old</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardContent className="p-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Goal Progress</p>
            <div className="flex items-center gap-4">
              <h3 className="text-4xl font-black text-primary">{Math.min(100, Math.round((stats.total / (config?.dailyEngagementTarget || 50)) * 100))}%</h3>
            </div>
            <Progress value={(stats.total / (config?.dailyEngagementTarget || 50)) * 100} className="h-1.5 mt-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Hub */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Temporal Flow Analysis</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hourly distribution across the facility</p>
          </div>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#355872" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#355872" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="count" stroke="#355872" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Text Ticker */}
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Live Ticker</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sequential Entry Logs</p>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {rawVisits?.map((visit) => (
                <div key={visit.id} className={cn("p-5 transition-colors", visit.status === 'blocked' ? 'bg-red-50' : 'hover:bg-slate-50')}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-black text-slate-900">{visit.patronName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">{safeFormat(visit.timestamp, 'HH:mm')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{visit.schoolId}</span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{visit.purpose}</span>
                  </div>
                </div>
              ))}
              {(!rawVisits || rawVisits.length === 0) && !isDataLoading && (
                <div className="p-20 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Live Traffic</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
