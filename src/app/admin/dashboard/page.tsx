"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(100));
  }, [db, user]);

  const { data: visits, isLoading: isDataLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return { inside: 0, newest: null, totalToday: 0, totalLogged: 0, distribution: [] };
    
    const today = new Date().setHours(0, 0, 0, 0);
    const todayVisits = visits.filter(v => new Date(v.timestamp).getTime() >= today);
    
    const inside = todayVisits.filter(v => v.status === 'granted').length; 
    const newest = visits[0] || null;
    const totalToday = todayVisits.length;
    const totalLogged = visits.length;

    const deptCounts: Record<string, number> = {};
    todayVisits.forEach(v => {
      v.patronDepartments?.forEach((d: string) => {
        const name = d.split(':')[0];
        deptCounts[name] = (deptCounts[name] || 0) + 1;
      });
    });

    const distribution = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { inside, newest, totalToday, totalLogged, distribution };
  }, [visits]);

  const filteredVisits = useMemo(() => {
    if (!visits) return [];
    return visits.filter(v => 
      v.patronName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.schoolId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visits, searchTerm]);

  if (isUserLoading || !mounted) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-mono font-bold text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Synchronizing Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 fluid-container animate-fade-in">
      {/* Tier 1: System Status & Search Bar */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Institutional Clock</span>
            <span className="text-sm font-mono font-bold text-primary mt-1">{format(currentTime, 'MMM dd, yyyy • HH:mm:ss')}</span>
          </div>
          <div className="h-8 w-px bg-slate-100 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terminal 1: Online</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl w-full">
          <Input 
            placeholder="Global Identity Search (ID, Name, or Department)..." 
            className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs uppercase focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Tier 2: Dashboard Row: Live Presence KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 transition-all hover:border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Inside</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-mono font-bold text-primary">{stats.inside}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 transition-all hover:border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Newest Entry</p>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 uppercase truncate">{stats.newest?.patronName || 'No Data'}</span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1 tracking-tighter">{stats.newest?.schoolId || '---'}</span>
          </div>
        </div>

        <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 transition-all hover:border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Today</p>
          <h3 className="text-4xl font-mono font-bold text-primary">{stats.totalToday}</h3>
        </div>

        <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 transition-all hover:border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Visitors Logged</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-mono font-bold text-primary">{stats.totalLogged}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Records</span>
          </div>
        </div>
      </div>

      {/* Tier 3: Main Screen Split - 75/25 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (75%): Master Log Table */}
        <div className="lg:col-span-9 bg-white border rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Master Visitor Log</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sequential monitoring of facility engagement</p>
            </div>
            <Badge variant="outline" className="h-8 px-4 rounded-xl border-primary/20 text-primary bg-primary/5 font-black uppercase text-[10px] tracking-widest">
              System Live
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">School ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Intent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className={cn("zebra-row transition-colors group", visit.status === 'blocked' && "bg-red-50 hover:bg-red-100")}>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {format(new Date(visit.timestamp), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] font-bold text-primary uppercase">
                      {visit.schoolId}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-black uppercase tracking-tight", visit.status === 'blocked' ? 'text-red-700' : 'text-slate-900')}>
                        {visit.patronName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {visit.patronDepartments?.map((d: string, i: number) => (
                          <span key={i} className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase border border-slate-200">
                            {d.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase">
                      {visit.patronAge} / {visit.patronGender?.charAt(0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        {visit.purpose}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVisits.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching entries in active cache</p>
            </div>
          )}
        </div>

        {/* Right Side (25%): Mini-Analytics & Reporting Control */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-4">Today's Flow Distribution</h2>
            <div className="space-y-4">
              {stats.distribution.map((dept, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                    <span className="text-slate-600 truncate max-w-[150px]">{dept.name}</span>
                    <span className="text-primary font-mono">{Math.round((dept.count / stats.totalToday) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${(dept.count / stats.totalToday) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
              {stats.distribution.length === 0 && <p className="text-[9px] font-bold text-slate-400 uppercase text-center py-4">Awaiting Entry Data...</p>}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-4">Report Generation</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temporal Window</label>
                <div className="grid grid-cols-1 gap-2">
                  <Input type="date" className="h-10 text-[10px] rounded-lg font-bold uppercase" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                </div>
              </div>
              <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10">
                <Link href="/admin/reports">Review Library Report</Link>
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 border-none rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-4">System Core</h2>
            <Button asChild variant="outline" className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">
              <Link href="/admin/settings">Schema Registry</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
