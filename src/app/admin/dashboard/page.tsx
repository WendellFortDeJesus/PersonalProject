
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
  Database, 
  Activity,
  Circle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(500));
  }, [db]);

  const patronsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'patrons'));
  }, [db]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: patrons, isLoading: isPatronsLoading } = useCollection(patronsQuery);

  const stats = useMemo(() => {
    if (!visits || !patrons) return null;
    
    // 1. Current Occupancy (Mock logic: visits in last 8 hours marked as granted)
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const inside = visits.filter(v => new Date(v.timestamp) > eightHoursAgo && v.status === 'granted').length;

    // 2. Peak Traffic Time (Cumulative)
    const hourlyCounts: Record<number, number> = {};
    visits.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 14;
    const formattedPeak = `${peakHour > 12 ? Number(peakHour) - 12 : peakHour}:00 ${Number(peakHour) >= 12 ? 'PM' : 'AM'}`;

    // 3. Department Leaderboard
    const deptMap: Record<string, number> = {};
    visits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
    });
    const deptLeaderboard = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name: settings?.departments?.find((d: any) => d.name === name)?.code || name,
        fullName: name,
        count,
        color: settings?.departments?.find((d: any) => d.name === name)?.color || 'hsl(var(--primary))'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 4. Purpose Distribution
    const purposeMap: Record<string, number> = {};
    visits.forEach(v => {
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });
    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

    return {
      inside,
      formattedPeak,
      topDept: deptLeaderboard[0]?.name || 'N/A',
      registrySize: patrons.length,
      deptLeaderboard,
      purposeData,
      recentTicker: visits.slice(0, 5)
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
      {/* KPI Tiles (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 shrink-0">
        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex items-center gap-5">
          <div className="p-3 bg-primary/5 rounded-xl">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Current Occupancy</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900 mt-1">{stats?.inside}</h3>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex items-center gap-5">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peak Traffic Time</p>
            <h3 className="text-2xl font-mono font-bold text-slate-900 mt-1">{stats?.formattedPeak}</h3>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex items-center gap-5">
          <div className="p-3 bg-accent/10 rounded-xl">
            <Trophy className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Top Department</p>
            <h3 className="text-2xl font-headline font-black text-primary mt-1 uppercase truncate max-w-[120px]">{stats?.topDept}</h3>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white rounded-2xl flex items-center gap-5">
          <div className="p-3 bg-slate-50 rounded-xl">
            <Database className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Registry Size</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900 mt-1">{stats?.registrySize}</h3>
          </div>
        </Card>
      </div>

      {/* Main Content (Bento Grid) */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[350px]">
          {/* Departmental Leaderboard (60%) */}
          <Card className="lg:col-span-7 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Departmental Leaderboard</h2>
              <Activity className="h-4 w-4 text-slate-300" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats?.deptLeaderboard} margin={{ left: 0, right: 40 }}>
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
                    {stats?.deptLeaderboard.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Purpose Circle (40%) */}
          <Card className="lg:col-span-5 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Purpose Distribution</h2>
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
                      style={{ fontSize: '10px', fontWeight: '900', fill: '#0F172A', textTransform: 'uppercase' }} 
                    />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stats?.purposeData.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[8px] font-black text-slate-500 uppercase truncate tracking-tight">{p.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Live Visitor Registry (Table) */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest">Live Visitor Registry</h2>
            <Badge variant="outline" className="h-6 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">High Density Log</Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b">
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">School ID</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits?.slice(0, 20).map((visit) => {
                  const isRecent = new Date(visit.timestamp).getTime() > Date.now() - 30 * 60 * 1000;
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Circle className={cn("h-1.5 w-1.5 fill-current", isRecent ? "text-green-500 animate-pulse" : "text-slate-300")} />
                          <span className={cn("text-[8px] font-black uppercase tracking-tighter", isRecent ? "text-green-600" : "text-slate-400")}>
                            {isRecent ? 'Active' : 'Recorded'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight font-headline">{visit.patronName}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{visit.schoolId}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase border border-primary/10">
                          {settings?.departments?.find((d: any) => d.name === visit.patronDepartments?.[0])?.code || visit.patronDepartments?.[0]}
                        </span>
                      </td>
                      <td className="px-6 py-3">
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

      {/* Live Identity Ticker (Footer) */}
      <footer className="h-10 bg-primary flex items-center overflow-hidden shrink-0 shadow-lg">
        <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
          <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] border-r border-white/20 pr-12">Latest Entries:</span>
          {stats?.recentTicker.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white uppercase tracking-tight">{v.patronName}</span>
              <span className="text-[8px] font-bold text-white/50 font-mono">[{v.schoolId}]</span>
              <span className="text-[8px] font-black text-accent uppercase tracking-tighter">({settings?.departments?.find((d: any) => d.name === v.patronDepartments?.[0])?.code || v.patronDepartments?.[0]})</span>
              <span className="mx-6 text-white/20">|</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
