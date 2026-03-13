"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cn } from '@/lib/utils';
import { Activity, Users, Clock, ShieldAlert, Zap, AlertTriangle, MessageSquare, TrendingUp } from 'lucide-react';

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
    if (!rawVisits) return { total: 0, peakHour: 'N/A', newReg: 0, blocks: 0, chartData: [], avgAge: 0 };
    
    const total = rawVisits.length;
    const blocks = rawVisits.filter(v => v.status === 'blocked').length;
    
    const hourly: Record<string, number> = {};
    const ages: number[] = [];

    rawVisits.forEach(v => {
      const h = new Date(v.timestamp).getHours();
      const label = `${h}:00`;
      hourly[label] = (hourly[label] || 0) + 1;
      if (v.patronAge) ages.push(v.patronAge);
    });

    const peakHour = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const chartData = Object.entries(hourly).map(([time, count]) => ({ time, count }));
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b) / ages.length) : 0;

    return { total, peakHour, newReg: Math.floor(total * 0.2), blocks, chartData, avgAge };
  }, [rawVisits]);

  if (isUserLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="font-headline font-black text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Synchronizing Data Infrastructure...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-fade-in fluid-container">
      {/* Tier 1: KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bento-tile bg-primary text-white border-none shadow-2xl flex flex-col justify-between h-48">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Total Attendance</p>
          <div className="flex items-baseline gap-4">
            <h3 className="text-6xl font-mono font-medium tracking-tighter">{stats.total}</h3>
            <div className="flex items-center gap-1 text-accent">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-black">+5%</span>
            </div>
          </div>
          <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Real-time Terminal Feed</p>
        </div>

        <div className="bento-tile flex flex-col justify-between h-48">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Peak Traffic Window</p>
          <h3 className="text-5xl font-mono font-medium text-primary tracking-tighter">{stats.peakHour}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calculated Temporal Zenith</p>
        </div>

        <div className="bento-tile flex flex-col justify-between h-48">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Avg. Visitor Age</p>
          <h3 className="text-5xl font-mono font-medium text-primary tracking-tighter">{stats.avgAge}Y</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Demographic Mean Index</p>
        </div>

        <div className="bento-tile bg-red-50 border-red-100 flex flex-col justify-between h-48">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Block Alerts</p>
          <h3 className="text-5xl font-mono font-medium text-red-600 tracking-tighter">{stats.blocks}</h3>
          <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Restricted Entry Attempts</p>
        </div>
      </div>

      {/* Tier 2: Monitoring & Command */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Entry Ticker (Text-Only) */}
        <div className="lg:col-span-8 bento-tile p-0 overflow-hidden flex flex-col h-[600px] shadow-2xl">
          <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tighter leading-none">Live Entry Ticker</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sequential monitoring of facility engagement</p>
            </div>
            <Badge variant="outline" className="h-10 px-6 rounded-2xl border-green-200 text-green-600 bg-green-50/50 font-black uppercase text-[10px] tracking-widest animate-pulse">
              System Live
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rawVisits?.map((visit) => (
              <div key={visit.id} className={cn("p-8 transition-all hover:bg-slate-50 flex items-center justify-between group zebra-row", visit.status === 'blocked' && 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-red-600')}>
                <div className="flex items-center gap-10">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className={cn("text-base font-black uppercase tracking-tight", visit.status === 'blocked' ? 'text-red-700' : 'text-slate-900')}>
                      {visit.patronName}
                    </span>
                    <span className="text-[11px] font-mono font-black text-slate-400 uppercase tracking-widest">{visit.schoolId}</span>
                  </div>
                  <div className="hidden md:flex flex-col gap-1 min-w-[200px]">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Department</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[180px]">{visit.patronDepartments?.join(', ')}</span>
                  </div>
                  <div className="hidden md:flex flex-col gap-1">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Purpose</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{visit.purpose}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <span className="text-[11px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">{format(new Date(visit.timestamp), 'HH:mm:ss')}</span>
                  {visit.status === 'blocked' && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Commands */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bento-tile bg-slate-900 border-none h-full flex flex-col justify-between p-10">
            <div className="space-y-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Panel</h2>
              <div className="space-y-4">
                <Button className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] justify-start px-8 gap-5 shadow-xl shadow-primary/20">
                  <Zap className="h-5 w-5 text-accent" />
                  Manual System Override
                </Button>
                <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[11px] justify-start px-8 gap-5">
                  <MessageSquare className="h-5 w-5" />
                  Broadcast Alert
                </Button>
              </div>
            </div>
            <div className="pt-10 border-t border-white/10 mt-10">
              <Button variant="ghost" className="w-full h-16 rounded-[1.5rem] text-red-400 hover:text-red-300 hover:bg-red-950/40 font-black uppercase tracking-widest text-[11px] justify-start px-8 gap-5 transition-all">
                <ShieldAlert className="h-5 w-5" />
                Emergency Lockdown
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 3: Temporal Analysis */}
      <div className="bento-tile h-[450px] p-0 overflow-hidden flex flex-col shadow-2xl">
        <div className="p-10 border-b bg-slate-50 flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Temporal Flow Analysis</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hourly distribution of facility utilization</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">24H High-Density View</p>
            <p className="text-3xl font-mono font-medium text-primary mt-1">Institutional Scale</p>
          </div>
        </div>
        <div className="flex-1 p-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006837" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#006837" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Roboto Mono'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Roboto Mono'}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600, fontFamily: 'Inter'}}
              />
              <Area type="monotone" dataKey="count" stroke="#006837" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
