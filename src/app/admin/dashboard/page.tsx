
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp,
  Activity,
  Monitor,
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
    if (!visits || visits.length === 0) return {
      inside: 0,
      totalRegistered: 0,
      topDept: 'N/A',
      recentVisits: [],
      integrityScore: 100,
      flaggedCount: 0,
      primaryAuthMethod: 'N/A',
      authMethodPct: 0
    };
    
    const activeVisits = visits.filter(v => v.status === 'granted');
    const inside = activeVisits.length;
    const totalRegistered = visits.length;

    const deptCountMap: Record<string, number> = {};
    let flaggedCount = 0;

    visits.forEach(v => {
      // Dept Mapping
      v.patronDepartments?.forEach((d: string) => {
        deptCountMap[d] = (deptCountMap[d] || 0) + 1;
      });

      // Integrity Logic: Flag if email missing @ or RF-ID too short
      const method = v.authMethod || (v.schoolId ? 'RF-ID Login' : 'SSO Login');
      if (method === 'SSO Login' && (!v.patronEmail || !v.patronEmail.includes('@'))) {
        flaggedCount++;
      } else if (method === 'RF-ID Login' && (!v.schoolId || v.schoolId.length < 5)) {
        flaggedCount++;
      }
    });

    const integrityScore = Math.max(0, Math.min(100, Number(((totalRegistered - flaggedCount) / totalRegistered * 100).toFixed(1))));

    // Primary Auth Method Logic
    const authCounts = activeVisits.reduce((acc: Record<string, number>, v) => {
      const method = v.authMethod || (v.schoolId ? 'RF-ID Login' : 'SSO Login');
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const topAuth = Object.entries(authCounts).sort((a, b) => b[1] - a[1])[0];
    const primaryAuthMethod = topAuth ? topAuth[0] : 'N/A';
    const authMethodPct = topAuth && inside > 0 
      ? Math.round((topAuth[1] / inside) * 100) 
      : 0;

    return {
      inside,
      totalRegistered,
      recentVisits: visits.slice(0, 50),
      integrityScore,
      flaggedCount,
      primaryAuthMethod,
      authMethodPct
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

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in font-body overflow-hidden">
      {/* Top KPI Strip - Bento Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 shrink-0">
        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-primary h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Occupancy</p>
            <h3 className="text-2xl font-mono font-bold text-slate-900 leading-none">{stats?.inside ?? 0}</h3>
          </div>
          <Users className="h-5 w-5 text-primary/20" />
        </Card>

        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-accent h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Primary Auth Method</p>
            <h3 className="text-sm font-headline font-black text-slate-900 uppercase truncate max-w-[120px] leading-none">
              {stats?.primaryAuthMethod?.toUpperCase()}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
              {stats?.authMethodPct}% OF CURRENT VISITORS
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-accent/20" />
        </Card>

        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-blue-500 h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Data Integrity</p>
            <h3 className="text-sm font-mono font-bold text-blue-600 uppercase tracking-tighter truncate leading-none">
              {stats?.integrityScore}% ACCURATE
            </h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
              {stats?.flaggedCount} FLAGGED REGISTRY DETAILS
            </p>
          </div>
          <ShieldAlert className="h-5 w-5 text-blue-500/20" />
        </Card>

        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-purple-500 h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Entries Today</p>
            <h3 className="text-2xl font-mono font-bold text-slate-900 leading-none">{stats?.totalRegistered ?? 0}</h3>
          </div>
          <Monitor className="h-5 w-5 text-purple-500/20" />
        </Card>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        {/* Live Visitor Log - Primary Focus (85% approx height) */}
        <Card className="flex-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">Live Identity Hub</h2>
              <Badge variant="outline" className="h-5 text-[7px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">Real-Time Registry</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-white sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="w-[70px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="w-[100px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity Name</th>
                  <th className="w-[60px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</th>
                  <th className="w-[140px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Login Method</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Detail</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentVisits.map((visit) => {
                  const isActive = visit.status === 'granted';
                  const method = visit.authMethod || (visit.schoolId ? 'RF-ID Login' : 'SSO Login');
                  const isFlagged = (method === 'SSO Login' && (!visit.patronEmail || !visit.patronEmail.includes('@'))) ||
                                  (method === 'RF-ID Login' && (!visit.schoolId || visit.schoolId.length < 5));
                  const isExternal = visit.patronDepartments?.[0]?.toUpperCase().includes('VISITOR');

                  return (
                    <tr key={visit.id} className={cn("hover:bg-slate-50/50 transition-colors group h-9", isFlagged && "bg-amber-50/50")}>
                      <td className="px-6 py-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{visit.patronName}</span>
                      </td>
                      <td className="px-6 py-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{visit.patronAge}</span>
                      </td>
                      <td className="px-6 py-0">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          method === 'RF-ID Login' ? "text-primary" : "text-blue-600"
                        )}>
                          {method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-0 truncate">
                        <span className={cn("text-[10px] font-mono font-bold", isFlagged ? "text-red-500" : "text-slate-400")}>
                          {method === 'RF-ID Login' ? visit.schoolId : visit.patronEmail}
                        </span>
                      </td>
                      <td className="px-6 py-0 truncate">
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          isExternal ? "text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded" : "text-slate-500"
                        )}>
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
    </div>
  );
}
