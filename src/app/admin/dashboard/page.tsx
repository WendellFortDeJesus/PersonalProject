"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Smartphone, ContactRound } from 'lucide-react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(200));
  }, [db]);

  const { data: visits, isLoading: isDataLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return { inside: 0, newest: null, totalToday: 0, totalLogged: 0, distribution: [] };
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVisits = visits.filter(v => new Date(v.timestamp).getTime() >= todayStart.getTime());
    
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
      v.schoolId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.patronEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [visits, searchTerm]);

  const isAtCapacity = stats.inside >= (settings?.capacityLimit || 200);

  if (isUserLoading || !mounted) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-mono font-black text-primary/40 uppercase tracking-[0.4em] text-[10px] animate-pulse">Initializing Terminal Control...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-0 animate-fade-in flex flex-col h-full bg-white">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white border-b sticky top-0 z-20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">System Clock</span>
            <span className="text-xs font-mono font-bold text-primary mt-1.5">{format(currentTime, 'MMM dd, yyyy • HH:mm:ss')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", isAtCapacity ? "bg-red-500 animate-pulse" : "bg-green-500")} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isAtCapacity ? 'Capacity Reached' : 'Terminal Online'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl w-full">
          <Input 
            placeholder="Search Master Index (Name, ID, or Email)..." 
            className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-xs uppercase tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={cn("p-6 border rounded-2xl flex flex-col justify-between h-32 transition-colors", isAtCapacity ? "bg-red-50 border-red-200" : "bg-white")}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Currently Inside</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-4xl font-mono font-medium", isAtCapacity ? "text-red-700" : "text-primary")}>{stats.inside}</h3>
              <span className="text-[8px] font-black text-slate-400 uppercase">Limit: {settings?.capacityLimit || 200}</span>
            </div>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Newest Entry</p>
            <div className="flex flex-col truncate">
              <span className="text-xs font-black text-slate-900 uppercase truncate">{stats.newest?.patronName || '---'}</span>
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                {stats.newest?.authMethod === 'SSO Login' ? stats.newest?.patronEmail : stats.newest?.schoolId || '---'}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Today</p>
            <h3 className="text-4xl font-mono font-medium text-primary">{stats.totalToday}</h3>
          </div>

          <div className="p-6 bg-white border rounded-2xl flex flex-col justify-between h-32">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overall Visitors Logged</p>
            <h3 className="text-4xl font-mono font-medium text-primary">{stats.totalLogged}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
          <div className="lg:col-span-12 bg-white border rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-widest">Master Visitor Log</h2>
              <Badge variant="outline" className="h-7 px-4 text-[8px] font-black uppercase tracking-widest">Library Audit</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Method</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Patron Identity</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id} className={cn("zebra-row transition-colors", visit.status === 'blocked' && "bg-red-50")}>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase align-middle">
                        {format(new Date(visit.timestamp), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          {visit.authMethod === 'SSO Login' ? (
                            <Smartphone className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <ContactRound className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">
                            {visit.authMethod || 'School ID Login'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("text-xs font-black uppercase tracking-tight", visit.status === 'blocked' ? 'text-red-700' : 'text-slate-900')}>
                            {visit.patronName}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                            {visit.authMethod === 'SSO Login' ? visit.patronEmail : visit.schoolId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase border border-slate-200 inline-block">
                          {visit.patronDepartments?.[0]?.split(':')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 uppercase align-middle">
                        {visit.patronAge}Y / {visit.patronGender?.charAt(0) || 'U'}
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 inline-block">
                          {visit.purpose}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
          <aside className="lg:col-span-4 bg-white border rounded-2xl p-6 space-y-6">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-widest border-b pb-4">Today's Distribution</h2>
            <div className="space-y-4">
              {stats.distribution.map((dept, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                    <span className="text-slate-600 truncate max-w-[150px]">{dept.name}</span>
                    <span className="text-primary font-mono">{stats.totalToday > 0 ? Math.round((dept.count / stats.totalToday) * 100) : 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${stats.totalToday > 0 ? (dept.count / stats.totalToday) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </aside>
          
          <div className="lg:col-span-8 bg-slate-900 border-none rounded-2xl p-8 space-y-4 shadow-xl flex items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Report Center</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate current operational audit</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/admin/reports')} className="h-11 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase text-[10px] tracking-widest px-8">
                Go to Report Center
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
