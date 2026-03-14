
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
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';
import { 
  Users, 
  Clock, 
  Trophy, 
  ShieldCheck, 
  Activity,
  Circle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db]);

  const patronsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'patrons'));
  }, [db]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: patrons, isLoading: isPatronsLoading } = useCollection(patronsQuery);

  const stats = useMemo(() => {
    if (!visits || !patrons) return null;
    
    // 1. Live Occupancy (Status: Granted in last 12 hours)
    const activeThreshold = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const inside = visits.filter(v => new Date(v.timestamp) > activeThreshold && v.status === 'granted').length;

    // 2. Peak Hourly Traffic (Cumulative)
    const hourlyCounts: Record<number, number> = {};
    visits.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const formattedPeak = `${peakHour}:00 - ${Number(peakHour) + 1}:00`;

    // 3. System Integrity (% complete data)
    const completeEntries = visits.filter(v => v.patronName && v.schoolId && v.purpose).length;
    const integrity = Math.round((completeEntries / (visits.length || 1)) * 100);

    // 4. Department Champion
    const deptMap: Record<string, number> = {};
    visits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
    });
    const deptRankingData = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name: settings?.departments?.find((d: any) => d.name === name)?.code || name,
        fullName: name,
        count,
        color: settings?.departments?.find((d: any) => d.name === name)?.color || 'hsl(var(--primary))'
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Purpose Distribution
    const purposeMap: Record<string, number> = {};
    visits.forEach(v => {
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });
    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

    return {
      inside,
      formattedPeak,
      integrity,
      champion: deptRankingData[0]?.name || 'N/A',
      deptRankingData: deptRankingData.slice(0, 8),
      purposeData,
      recentVisits: visits.slice(0, 20)
    };
  }, [visits, patrons, settings]);

  if (!mounted || isVisitsLoading || isPatronsLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Initializing Command Center...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in font-body overflow-hidden">
      {/* KPI Section (Slim, high-contrast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 shrink-0">
        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Occupancy</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.inside}</h3>
          </div>
          <Users className="h-6 w-6 text-primary/20 group-hover:text-primary transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dept Champion</p>
            <h3 className="text-2xl font-headline font-black text-primary uppercase truncate max-w-[120px]">{stats?.champion}</h3>
          </div>
          <Trophy className="h-6 w-6 text-accent/30 group-hover:text-accent transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peak Hourly</p>
            <h3 className="text-xl font-mono font-bold text-slate-900">{stats?.formattedPeak}</h3>
          </div>
          <Clock className="h-6 w-6 text-blue-500/20 group-hover:text-blue-500 transition-colors" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">System Integrity</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.integrity}%</h3>
          </div>
          <ShieldCheck className="h-6 w-6 text-green-500/20 group-hover:text-green-500 transition-colors" />
        </Card>
      </div>

      {/* Strategic Bento Grid */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[350px]">
          {/* Dept Leaderboard (60%) */}
          <Card className="lg:col-span-7 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Institutional Leaderboard</h2>
              <Activity className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats?.deptRankingData} margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={10} 
                    fontWeight={900} 
                    axisLine={false} 
                    tickLine={false} 
                    width={50}
                    style={{ textTransform: 'uppercase', fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats?.deptRankingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Activity Distribution (40%) */}
          <Card className="lg:col-span-5 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Visit Intent Distribution</h2>
            </div>
            <div className="flex-1 relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats?.purposeData} 
                    innerRadius={65} 
                    outerRadius={90} 
                    paddingAngle={8} 
                    dataKey="value"
                  >
                    {stats?.purposeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                    <Label 
                      value="INTENT" 
                      position="center" 
                      style={{ fontSize: '10px', fontWeight: '900', fill: '#0F172A', textTransform: 'uppercase', fontFamily: 'Montserrat' }} 
                    />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Live Visitor Registry (High-Density Table) */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">Live Visitor Registry</h2>
            <Badge variant="outline" className="h-6 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">Real-Time Verification</Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b">
                  <th className="w-[120px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                  <th className="w-[150px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Reference</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Unit</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentVisits.map((visit) => {
                  const isRecent = new Date(visit.timestamp).getTime() > Date.now() - 30 * 60 * 1000;
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <Circle className={cn("h-1.5 w-1.5 fill-current", isRecent ? "text-green-500 animate-pulse" : "text-slate-300")} />
                          <span className={cn("text-[8px] font-black uppercase tracking-tighter", isRecent ? "text-green-600" : "text-slate-400")}>
                            {isRecent ? 'Active' : 'Logged'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 truncate">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight font-body">{visit.patronName}</span>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{visit.schoolId}</span>
                      </td>
                      <td className="px-6 py-2 truncate">
                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase border border-primary/10">
                          {settings?.departments?.find((d: any) => d.name === visit.patronDepartments?.[0])?.code || visit.patronDepartments?.[0]}
                        </span>
                      </td>
                      <td className="px-6 py-2 truncate">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{visit.purpose}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Live Identity Ticker */}
      <footer className="h-10 bg-primary flex items-center overflow-hidden shrink-0 shadow-lg border-t border-white/10">
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
          <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] border-r border-white/20 pr-12">LIVE TICKER:</span>
          {stats?.recentVisits.slice(0, 10).map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white uppercase tracking-tight">{v.patronName}</span>
              <span className="text-[8px] font-bold text-white/50 font-mono">[{v.schoolId}]</span>
              <span className="text-[8px] font-black text-accent uppercase tracking-tighter">({v.purpose})</span>
              <span className="mx-6 text-white/20">|</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
