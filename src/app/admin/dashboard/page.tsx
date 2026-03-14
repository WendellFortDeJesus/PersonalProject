
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
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  Users, 
  LogIn, 
  Activity,
  TrendingUp,
  PieChart as PieIcon,
  Monitor
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db, user, isUserLoading]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;
    
    const today = startOfDay(new Date()).toISOString();
    const activeVisits = visits.filter(v => v.status === 'granted');
    
    const inside = activeVisits.length;
    const totalRegistered = visits.length;

    let rfidCount = 0;
    let ssoCount = 0;
    const deptCountMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};

    visits.forEach(v => {
      if (v.authMethod === 'RF-ID Login') rfidCount++;
      else if (v.authMethod === 'SSO Login') ssoCount++;

      v.patronDepartments?.forEach((d: string) => {
        deptCountMap[d] = (deptCountMap[d] || 0) + 1;
      });

      if (v.purpose) {
        purposeMap[v.purpose] = (purposeMap[v.purpose] || 0) + 1;
      }
    });

    const topAuth = rfidCount >= ssoCount ? 'RF-ID Login' : 'SSO Login';

    const deptData = Object.entries(deptCountMap).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    const intentData = Object.entries(purposeMap).map(([name, value]) => ({
      name,
      value
    }));

    const authMethodData = [
      { name: 'RF-ID Login', value: rfidCount },
      { name: 'SSO Login', value: ssoCount }
    ];

    // Peak Hour Logic
    const hours = visits.map(v => new Date(v.timestamp).getHours());
    const hourCounts: Record<number, number> = {};
    hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHourStr = peakHour ? `${peakHour[0]}:00 - ${Number(peakHour[0])+1}:00` : 'N/A';

    return {
      inside,
      totalRegistered,
      topAuth,
      deptData,
      intentData,
      authMethodData,
      recentVisits: visits.slice(0, 25),
      peakHourStr,
      systemIntegrity: visits.length > 0 ? 100 : 0
    };
  }, [visits]);

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="flex h-[80vh] items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="font-mono font-black text-primary uppercase tracking-[0.4em] text-[10px]">Syncing Engine...</p>
      </div>
    </div>
  );

  const COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in font-body overflow-hidden">
      {/* Top KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 shrink-0">
        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-primary">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Occupancy</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.inside ?? 0}</h3>
          </div>
          <Users className="h-6 w-6 text-primary/20" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-accent">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Top Login Method</p>
            <h3 className="text-lg font-headline font-black text-slate-900 uppercase truncate max-w-[120px]">
              {stats?.topAuth || 'N/A'}
            </h3>
          </div>
          <LogIn className="h-6 w-6 text-accent/20" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-blue-500">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peak Hourly Traffic</p>
            <h3 className="text-lg font-mono font-bold text-blue-600 uppercase tracking-tighter truncate">{stats?.peakHourStr}</h3>
          </div>
          <Activity className="h-6 w-6 text-blue-500/20" />
        </Card>

        <Card className="p-4 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-purple-500">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Students</p>
            <h3 className="text-3xl font-mono font-bold text-slate-900">{stats?.totalRegistered ?? 0}</h3>
          </div>
          <Monitor className="h-6 w-6 text-purple-500/20" />
        </Card>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-[400px]">
          {/* Vertical Bar Chart - Method Comparison */}
          <Card className="lg:col-span-6 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Authentication Analytics</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Hardware vs. SSO Utilization</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary/40" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.authMethodData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b', fontFamily: 'Roboto Mono' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={80}>
                    {stats?.authMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#006837' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart - Visit Intent */}
          <Card className="lg:col-span-4 p-6 border-none shadow-sm bg-white rounded-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Visit Purpose</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Behavioral Breakdown</p>
              </div>
              <PieIcon className="h-4 w-4 text-accent/40" />
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.intentData ?? []}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Live Visitor Log */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">High-Activity Registry</h2>
              <Badge variant="outline" className="h-5 text-[7px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">Live Monitoring</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-white sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="w-[80px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="w-[120px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity Name</th>
                  <th className="w-[150px] px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Detail</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentVisits.map((visit) => {
                  const isActive = visit.status === 'granted';
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group h-10">
                      <td className="px-6 py-0">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                          isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {isActive ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td className="px-6 py-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {format(new Date(visit.timestamp), 'hh:mm:ss aa')}
                        </span>
                      </td>
                      <td className="px-6 py-0 truncate">
                        <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-tight">{visit.patronName}</span>
                      </td>
                      <td className="px-6 py-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          visit.authMethod === 'RF-ID Login' ? "text-primary" : "text-blue-600"
                        )}>
                          {visit.authMethod === 'RF-ID Login' ? 'RF-ID' : 'SSO LOGIN'}
                        </span>
                      </td>
                      <td className="px-6 py-0 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {visit.authMethod === 'RF-ID Login' ? visit.schoolId : visit.patronEmail}
                        </span>
                      </td>
                      <td className="px-6 py-0 truncate">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{visit.patronDepartments?.[0]}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
