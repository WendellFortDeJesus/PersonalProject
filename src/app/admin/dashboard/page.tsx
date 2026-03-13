
"use client";

import { useState, useEffect, useMemo } from 'react';
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
        <p className="font-mono font-black text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Initializing Data Stream...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-0 animate-fade-in flex flex-col h-full bg-white">
      {/* Tier 1: System Status & Search */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white border-b sticky top-0 z-20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">System Clock</span>
            <span className="text-xs font-mono font-bold text-primary mt-1.5">{format(currentTime, 'MMM dd, yyyy • HH:mm:ss')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kiosk 01: Active</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl w-full">
          <Input 
            placeholder="Global Search (Name or ID Index)..." 
            className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs uppercase tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Tier 2: Dashboard Presence Row */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Inside</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-mono font-medium text-primary">{stats.inside}</h3>
              <span className="text-[9px] font-black text-slate-400 uppercase">Live Capacity</span>
            </div>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Newest Entry (Live)</p>
            <div className="flex flex-col truncate">
              <span className="text-xs font-black text-slate-900 uppercase truncate">{stats.newest?.patronName || 'No Data'}</span>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-1">{stats.newest?.schoolId || '---'}</span>
            </div>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Today</p>
            <h3 className="text-4xl font-mono font-medium text-primary">{stats.totalToday}</h3>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Visitors Logged</p>
            <h3 className="text-4xl font-mono font-medium text-primary">{stats.totalLogged}</h3>
          </div>
        </div>

        {/* Tier 3: Master Log Split (75/25) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
          <div className="lg:col-span-9 bg-white border rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-xs font-black text-primary uppercase tracking-widest">Master Visitor Log</h2>
              <Badge variant="outline" className="h-7 px-4 text-[9px] font-black uppercase tracking-widest">Library Records</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">School ID</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dept</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id} className={cn("zebra-row transition-colors", visit.status === 'blocked' && "bg-red-50")}>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase">
                        {format(new Date(visit.timestamp), 'HH:mm')}
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
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase border border-slate-200">
                          {visit.patronDepartments?.[0]?.split(':')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase">
                        {visit.patronAge}Y
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                          {visit.purpose}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-4">Today's Distribution</h2>
              <div className="space-y-4">
                {stats.distribution.map((dept, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                      <span className="text-slate-600 truncate max-w-[150px]">{dept.name}</span>
                      <span className="text-primary font-mono">{Math.round((dept.count / stats.totalToday) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(dept.count / stats.totalToday) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 border-none rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Library Report</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Quick Export Configuration</p>
              <Input type="date" className="h-10 bg-white/10 border-white/20 text-white text-[10px] font-bold" />
              <Button className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase text-[10px] tracking-widest">
                Generate Daily PDF
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
