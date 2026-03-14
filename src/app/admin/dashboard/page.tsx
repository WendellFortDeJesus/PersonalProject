
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  Users, 
  LogIn, 
  ShieldCheck, 
  Activity,
  Circle,
  LayoutGrid
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString();
  }, []);

  // Only initiate queries if the user is authenticated and services are ready
  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(500));
  }, [db, user]);

  const activeVisitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), where('timestamp', '>=', today), where('status', '==', 'granted'));
  }, [db, today, user]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: activeVisits } = useCollection(activeVisitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;
    
    const inside = activeVisits?.length || 0;
    const todayEntries = visits.filter(v => v.timestamp >= today).length;

    let rfidCount = 0;
    let ssoCount = 0;
    visits.forEach(v => {
      if (v.authMethod === 'School ID Login') rfidCount++;
      else if (v.authMethod === 'SSO Login') ssoCount++;
    });

    const topAuth = rfidCount >= ssoCount ? 'School ID' : 'Email SSO';

    const authData = [
      { name: 'School ID', count: rfidCount, color: '#006837' },
      { name: 'Email SSO', count: ssoCount, color: '#3b82f6' }
    ];

    const activeDepts = new Set<string>();
    activeVisits?.forEach(v => {
      v.patronDepartments?.forEach((d: string) => activeDepts.add(d));
    });

    return {
      inside,
      todayEntries,
      topAuth,
      activeDeptCount: activeDepts.size,
      authData,
      recentVisits: visits.slice(0, 20)
    };
  }, [visits, activeVisits, today]);

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-mono font-black text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Synchronizing Security Protocols...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="font-mono font-black text-red-500/40 uppercase tracking-[0.4em] text-[10px]">Restricted: Admin Identity Required</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in font-body overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 shrink-0">
        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Occupancy</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.inside ?? 0}</h3>
          </div>
          <Users className="h-6 w-6 text-primary/20 group-hover:text-primary transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Entries Today</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.todayEntries ?? 0}</h3>
          </div>
          <Activity className="h-6 w-6 text-accent/30 group-hover:text-accent transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Top Login Method</p>
            <h3 className="text-xl font-headline font-black text-primary uppercase truncate">{stats?.topAuth ?? 'N/A'}</h3>
          </div>
          <LogIn className="h-6 w-6 text-blue-500/20 group-hover:text-blue-500 transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Departments</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.activeDeptCount ?? 0}</h3>
          </div>
          <LayoutGrid className="h-6 w-6 text-purple-500/20 group-hover:text-purple-500 transition-colors" />
        </Card>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-4">
        <Card className="h-[300px] p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Authentication Utilization</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[8px] font-black uppercase text-slate-400">School ID</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] font-black uppercase text-slate-400">Email SSO</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.authData ?? []} barGap={40} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  style={{ textTransform: 'uppercase' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                  {stats?.authData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">Live Identity Stream</h2>
            <Badge variant="outline" className="h-6 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">High-Density Registry</Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b">
                  <th className="w-[100px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="w-[120px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                  <th className="w-[150px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Login Method</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Provided</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentVisits.map((visit) => {
                  const isRecent = new Date(visit.timestamp).getTime() > Date.now() - 30 * 60 * 1000;
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Circle className={cn("h-1.5 w-1.5 fill-current", isRecent ? "text-green-500 animate-pulse" : "text-slate-300")} />
                          <span className={cn("text-[8px] font-black uppercase tracking-tighter", isRecent ? "text-green-600" : "text-slate-400")}>
                            {isRecent ? 'Active' : 'Logged'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {format(new Date(visit.timestamp), 'hh:mm aa')}
                        </span>
                      </td>
                      <td className="px-6 py-3 truncate">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight font-body">{visit.patronName}</span>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          visit.authMethod === 'School ID Login' ? "border-primary/20 text-primary" : "border-blue-200 text-blue-600"
                        )}>
                          {visit.authMethod === 'School ID Login' ? 'School ID' : 'Email SSO'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {visit.authMethod === 'School ID Login' ? visit.schoolId : visit.patronEmail}
                        </span>
                      </td>
                      <td className="px-6 py-3 truncate">
                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase border border-primary/10">
                          {visit.patronDepartments?.[0]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <footer className="h-10 bg-primary flex items-center overflow-hidden shrink-0 shadow-lg border-t border-white/10">
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
          <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] border-r border-white/20 pr-12">LIVE TICKER:</span>
          {stats?.recentVisits.slice(0, 10).map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white uppercase tracking-tight">{v.patronName}</span>
              <span className="text-[8px] font-bold text-white/50 font-mono">[{v.authMethod === 'School ID Login' ? v.schoolId : 'SSO'}]</span>
              <span className="text-[8px] font-black text-accent uppercase tracking-tighter">({v.patronDepartments?.[0]})</span>
              <span className="mx-6 text-white/20">|</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
