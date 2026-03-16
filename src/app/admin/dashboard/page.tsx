"use client";

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DashboardPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [startOfToday, setStartOfToday] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    const updateToday = () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setStartOfToday(d);
    };
    updateToday();
    const interval = setInterval(updateToday, 60000);
    return () => clearInterval(interval);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(1000));
  }, [db, user, isUserLoading]);

  const patronsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return collection(db, 'patrons');
  }, [db, user, isUserLoading]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: patrons, isLoading: isPatronsLoading } = useCollection(patronsQuery);

  const stats = useMemo(() => {
    if (!visits || visits.length === 0 || !startOfToday) return {
      inside: 0,
      totalRegistered: 0,
      recentVisits: [],
      integrityScore: 100,
      flaggedCount: 0,
      primaryAuthMethod: 'N/A',
      authMethodPct: 0,
      uniqueDepts: 0
    };
    
    // Live Occupancy resets daily
    const activeToday = visits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return v.status === 'granted' && visitDate >= startOfToday;
    });
    
    const inside = activeToday.length;
    const totalRegistered = visits.length;

    let flaggedCount = 0;
    const uniqueDeptsSet = new Set<string>();

    visits.forEach(v => {
      v.patronDepartments?.forEach((d: string) => {
        uniqueDeptsSet.add(d);
      });

      // Find actual patron status
      const p = patrons?.find(p => p.id === v.patronId);
      const method = v.authMethod || (v.schoolId ? 'RF-ID Login' : 'SSO Login');
      const currentEmail = p?.email ?? v.patronEmail;
      
      const isSuspect = (method === 'SSO Login' && (!currentEmail || !currentEmail.includes('@'))) ||
                        (method === 'RF-ID Login' && (!v.schoolId || v.schoolId.length < 5)) ||
                        (!v.patronName || v.patronName === 'UNKNOWN') ||
                        (p && p.isBlocked);
      
      if (isSuspect) {
        flaggedCount++;
      }
    });

    const integrityScore = totalRegistered > 0 
      ? Math.max(0, Math.min(100, Number(((totalRegistered - flaggedCount) / totalRegistered * 100).toFixed(1))))
      : 100;

    const authCounts = activeToday.reduce((acc: Record<string, number>, v) => {
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
      recentVisits: visits.slice(0, 100),
      integrityScore,
      flaggedCount,
      primaryAuthMethod,
      authMethodPct,
      uniqueDepts: uniqueDeptsSet.size
    };
  }, [visits, patrons, startOfToday]);

  if (!mounted || isUserLoading || (user && (isVisitsLoading || isPatronsLoading))) return (
    <div className="flex h-[80vh] items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="font-mono font-black text-primary uppercase tracking-[0.4em] text-[10px]">Syncing Engine...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fade-in font-body overflow-hidden">
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
            <h3 className="text-sm font-headline font-black text-slate-900 uppercase leading-none">
              {stats?.primaryAuthMethod?.toUpperCase()}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
              {stats?.authMethodPct}% OF CURRENT VISITORS
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-accent/20" />
        </Card>

        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-red-500 h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Data Integrity</p>
            <h3 className="text-sm font-mono font-bold text-red-600 uppercase tracking-tighter truncate leading-none">
              {stats?.integrityScore}% ACCURATE
            </h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
              {stats?.flaggedCount} SUSPICIOUS ENTRIES
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ShieldAlert className="h-4 w-4 text-red-500/20" />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => router.push('/admin/users')}
              className="h-7 px-2 text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
            >
              Verify Registry
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </Card>

        <Card className="p-3 border-none shadow-sm bg-white rounded-xl flex items-center justify-between border-l-4 border-purple-500 h-20">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Departments</p>
            <h3 className="text-2xl font-mono font-bold text-slate-900 leading-none">{stats?.uniqueDepts ?? 0}</h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">
              UNITS REPRESENTED
            </p>
          </div>
          <Monitor className="h-5 w-5 text-purple-500/20" />
        </Card>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
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
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity Name & Detail</th>
                  <th className="w-[60px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</th>
                  <th className="w-[140px] px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Login Method</th>
                  <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentVisits.map((visit) => {
                  const p = patrons?.find(patron => patron.id === visit.patronId);
                  const isBlocked = p?.isBlocked ?? false;
                  const currentName = p?.name ?? visit.patronName;
                  const currentEmail = p?.email ?? visit.patronEmail;
                  const currentAge = p?.age ?? visit.patronAge;

                  const isActive = visit.status === 'granted';
                  const method = visit.authMethod || (visit.schoolId ? 'RF-ID Login' : 'SSO Login');
                  const isFlagged = (method === 'SSO Login' && (!currentEmail || !currentEmail.includes('@'))) ||
                                  (method === 'RF-ID Login' && (!visit.schoolId || visit.schoolId.length < 5)) ||
                                  (!currentName || currentName === 'UNKNOWN') ||
                                  isBlocked;
                  
                  const isExternal = visit.patronDepartments?.[0]?.toUpperCase().includes('VISITOR');
                  const detail = method === 'RF-ID Login' ? (visit.schoolId || 'ID NOT READ') : (currentEmail || 'EMAIL NOT READ');

                  return (
                    <tr key={visit.id} className={cn(
                      "hover:bg-slate-50/50 transition-colors group h-10", 
                      isFlagged && "bg-red-50",
                      isBlocked && "bg-red-100"
                    )}>
                      <td className="px-6 py-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          isBlocked ? "bg-red-600 text-white" : isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {isBlocked ? 'BLOCKED' : isActive ? 'IN' : 'OUT'}
                        </span>
                      </td>
                      <td className="px-6 py-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {format(new Date(visit.timestamp), 'hh:mm:ss aa')}
                        </span>
                      </td>
                      <td className={cn("px-6 py-1", isExternal && "bg-yellow-50/80")}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-tight",
                              isFlagged ? "text-red-700" : "text-slate-900"
                            )}>
                              {currentName}
                            </span>
                            {(isFlagged || isBlocked) && <ShieldAlert className="h-3 w-3 text-red-500" />}
                          </div>
                          <span className={cn(
                            "text-[9px] font-mono font-bold tracking-tight uppercase",
                            isFlagged ? "text-red-500" : "text-slate-400"
                          )}>
                            {detail}
                          </span>
                        </div>
                      </td>
                      <td className={cn("px-6 py-0", isExternal && "bg-yellow-50/80")}>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{currentAge}</span>
                      </td>
                      <td className={cn("px-6 py-0", isExternal && "bg-yellow-50/80")}>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          method === 'RF-ID Login' ? "text-primary" : "text-blue-600"
                        )}>
                          {method.toUpperCase()}
                        </span>
                      </td>
                      <td className={cn("px-6 py-0 truncate", isExternal && "bg-yellow-50/80")}>
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          isExternal ? "text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded border border-amber-200" : "text-slate-500"
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