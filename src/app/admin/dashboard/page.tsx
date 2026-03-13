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
import { Activity, Users, Clock, ShieldAlert, Zap, AlertTriangle, MessageSquare } from 'lucide-react';

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
    rawVisits.forEach(v => {
      const h = new Date(v.timestamp).getHours();
      const label = `${h}:00`;
      hourly[label] = (hourly[label] || 0) + 1;
    });

    const peakHour = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const chartData = Object.entries(hourly).map(([time, count]) => ({ time, count }));

    return { total, peakHour, newReg: Math.floor(total * 0.2), blocks, chartData };
  }, [rawVisits]);

  if (isUserLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="font-headline font-black text-primary/40 uppercase tracking-[0.3em] text-xs">Synchronizing System...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in fluid-container">
      {/* Top Row: Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bento-tile bg-primary text-white border-none shadow-xl shadow-primary/10">
          <p className="text-[10px] font-headline font-black text-white/50 uppercase tracking-[0.3em] mb-4">Live Occupancy</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-mono font-medium tracking-tighter">{stats.total}</h3>
            <span className="text-xs font-bold text-accent">+5%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <Activity className="h-3 w-3 text-accent animate-pulse" />
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Active Pulse</p>
          </div>
        </div>

        <div className="bento-tile">
          <p className="text-[10px] font-headline font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Peak Traffic Hour</p>
          <h3 className="text-5xl font-mono font-medium text-primary tracking-tighter">{stats.peakHour}</h3>
          <div className="flex items-center gap-1.5 mt-4">
            <Clock className="h-3 w-3 text-primary/40" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Busiest Window</p>
          </div>
        </div>

        <div className="bento-tile">
          <p className="text-[10px] font-headline font-black text-slate-400 uppercase tracking-[0.3em] mb-4">New Registrations</p>
          <h3 className="text-5xl font-mono font-medium text-primary tracking-tighter">{stats.newReg}</h3>
          <div className="flex items-center gap-1.5 mt-4">
            <Users className="h-3 w-3 text-primary/40" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First-time Entry</p>
          </div>
        </div>

        <div className="bento-tile bg-red-50 border-red-100">
          <p className="text-[10px] font-headline font-black text-red-400 uppercase tracking-[0.3em] mb-4">Block Alerts</p>
          <h3 className="text-5xl font-mono font-medium text-red-600 tracking-tighter">{stats.blocks}</h3>
          <div className="flex items-center gap-1.5 mt-4">
            <ShieldAlert className="h-3 w-3 text-red-600 animate-bounce" />
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Restricted Attempts</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Ticker & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bento-tile p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Live Entry Ticker</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sequential Monitoring Feed</p>
            </div>
            <div className="px-4 py-1.5 bg-green-50 rounded-full border border-green-100">
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest animate-pulse">System Online</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {rawVisits?.map((visit) => (
              <div key={visit.id} className={cn("p-6 transition-all hover:bg-slate-50 flex items-center justify-between group", visit.status === 'blocked' && 'bg-red-50 hover:bg-red-100/50')}>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className={cn("text-sm font-black tracking-tight", visit.status === 'blocked' ? 'text-red-700' : 'text-slate-900')}>
                      {visit.patronName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{visit.schoolId}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-100" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Purpose</span>
                    <span className="text-xs font-bold text-slate-600">{visit.purpose}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">{format(new Date(visit.timestamp), 'HH:mm:ss')}</span>
                  {visit.status === 'blocked' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bento-tile bg-slate-900 border-none h-full flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl font-headline font-black text-white uppercase tracking-tighter">Command Panel</h2>
              <div className="space-y-3">
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs justify-start px-6 gap-4">
                  <Zap className="h-4 w-4 text-accent" />
                  Manual System Override
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs justify-start px-6 gap-4">
                  <MessageSquare className="h-4 w-4" />
                  Broadcast Alert
                </Button>
              </div>
            </div>
            <div className="pt-8 mt-8 border-t border-white/10">
              <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-950/30 font-black uppercase tracking-widest text-xs justify-start px-6 gap-4">
                <ShieldAlert className="h-4 w-4" />
                Emergency Lockdown
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Traffic Flow */}
      <div className="bento-tile h-[400px] p-0 overflow-hidden flex flex-col">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-headline font-black text-primary uppercase tracking-tighter">Temporal Flow Analysis</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hourly distribution across the facility</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">24H Utilization</p>
            <p className="text-2xl font-mono font-medium text-primary">High Density</p>
          </div>
        </div>
        <div className="flex-1 p-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006837" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#006837" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Roboto Mono'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'Roboto Mono'}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Inter', fontWeight: 600}}
              />
              <Area type="monotone" dataKey="count" stroke="#006837" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
