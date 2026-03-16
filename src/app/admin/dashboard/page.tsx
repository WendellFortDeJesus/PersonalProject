
"use client";

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock,
  Building2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Monitor,
  Search
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format, startOfDay, startOfWeek, isToday, isThisWeek } from 'date-fns';

export default function DashboardPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user, isUserLoading]);

  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;

    const today = new Date();
    const todayVisits = visits.filter(v => isToday(new Date(v.timestamp)));
    const weekVisits = visits.filter(v => isThisWeek(new Date(v.timestamp)));

    // Peak Hour Today
    const hourMap: Record<number, number> = {};
    todayVisits.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
    const peakHourDisplay = peakHour ? format(new Date().setHours(Number(peakHour[0])), 'hh:mm aa') : 'N/A';

    // Peak College
    const collegeMap: Record<string, number> = {};
    todayVisits.forEach(v => {
      const dept = v.patronDepartments?.[0] || 'Unknown';
      collegeMap[dept] = (collegeMap[dept] || 0) + 1;
    });
    const peakCollege = Object.entries(collegeMap).sort((a, b) => b[1] - a[1])[0];

    // Most Common Reason
    const reasonMap: Record<string, number> = {};
    todayVisits.forEach(v => {
      const purpose = v.purpose || 'Other';
      reasonMap[purpose] = (reasonMap[purpose] || 0) + 1;
    });
    const topReason = Object.entries(reasonMap).sort((a, b) => b[1] - a[1])[0];

    return {
      today: todayVisits.length,
      week: weekVisits.length,
      peakHour: peakHourDisplay,
      peakCollege: peakCollege ? peakCollege[0] : 'N/A',
      topReason: topReason ? topReason[0] : 'N/A',
      recent: visits.slice(0, 10)
    };
  }, [visits]);

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="font-mono font-black text-primary uppercase tracking-[0.4em] text-[9px]">Syncing Engine...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black text-primary uppercase tracking-tighter">Strategic Overview</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Access Intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl px-4 font-bold text-[9px] tracking-widest uppercase" onClick={() => router.push('/admin/users')}>
            <Users className="mr-2 h-3.5 w-3.5" /> User Registry
          </Button>
          <Button size="sm" className="h-9 rounded-xl px-4 font-bold text-[9px] tracking-widest uppercase bg-primary shadow-lg" onClick={() => router.push('/admin/reports')}>
            <Monitor className="mr-2 h-3.5 w-3.5" /> Reports Hub
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all border-b-4 border-primary">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Visitors Today</p>
              <h3 className="text-2xl font-mono font-bold text-slate-900">{stats?.today || 0}</h3>
            </div>
            <Users className="h-4 w-4 text-primary/20" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[7px] font-black px-1.5 py-0 bg-green-50 border-green-100 text-green-600">LIVE SYNC</Badge>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all border-b-4 border-accent">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weekly Cumulative</p>
              <h3 className="text-2xl font-mono font-bold text-slate-900">{stats?.week || 0}</h3>
            </div>
            <TrendingUp className="h-4 w-4 text-accent/20" />
          </div>
          <div className="mt-2">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">SINCE {format(startOfWeek(new Date()), 'MMM dd')}</p>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all border-b-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Peak Hour Today</p>
              <h3 className="text-lg font-headline font-black text-slate-900 uppercase">{stats?.peakHour}</h3>
            </div>
            <Clock className="h-4 w-4 text-blue-500/20" />
          </div>
          <div className="mt-2">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">HIGHEST DENSITY PERIOD</p>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl flex flex-col justify-between hover:shadow-md transition-all border-b-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Top Academic Unit</p>
              <h3 className="text-[11px] font-headline font-black text-slate-900 uppercase truncate leading-tight mt-1">{stats?.peakCollege}</h3>
            </div>
            <Building2 className="h-4 w-4 text-purple-500/20" />
          </div>
          <div className="mt-2">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">MAX DEPT ENGAGEMENT</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-[9px] font-black text-primary uppercase tracking-widest font-headline">Live Identity Registry</h2>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest text-slate-400" onClick={() => router.push('/admin/users')}>
              View Full Audit <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 border-b">
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Identity Name</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Intent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recent.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50 transition-colors group h-12">
                    <td className="px-6 py-0 font-mono text-[9px] font-bold text-slate-500">
                      {format(new Date(visit.timestamp), 'hh:mm aa')}
                    </td>
                    <td className="px-6 py-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                          {visit.patronName}
                        </span>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase leading-none">ID: {visit.schoolId || 'SSO'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase truncate block max-w-[150px]">{visit.patronDepartments?.[0]}</span>
                    </td>
                    <td className="px-6 py-0">
                      <Badge variant="outline" className="text-[7px] font-black px-1.5 py-0 uppercase border-primary/20 text-primary bg-primary/5">
                        {visit.purpose}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 border-none shadow-sm bg-primary text-white rounded-2xl space-y-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-accent uppercase tracking-[0.3em]">Institutional Pulse</p>
              <h2 className="text-xl font-headline font-black uppercase tracking-tighter">Primary Visit Intent</h2>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                <h4 className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">Top Student Intent:</h4>
                <p className="text-lg font-headline font-black uppercase tracking-tight text-accent">{stats?.topReason}</p>
              </div>
              <p className="text-[8px] font-bold text-white/40 leading-relaxed uppercase tracking-wider">
                Trend based on {stats?.today} verified entries in last 24h.
              </p>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white rounded-2xl space-y-4">
            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest font-headline">Quick Navigation</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="h-11 justify-start rounded-xl px-4 border-slate-100 hover:border-primary/20 hover:bg-slate-50 transition-all group" onClick={() => router.push('/admin/users')}>
                <Search className="mr-3 h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                <span className="font-bold text-[9px] uppercase tracking-widest text-slate-600">User Management</span>
              </Button>
              <Button variant="outline" size="sm" className="h-11 justify-start rounded-xl px-4 border-slate-100 hover:border-red-100 hover:bg-red-50 transition-all group" onClick={() => router.push('/admin/users')}>
                <ShieldAlert className="mr-3 h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
                <span className="font-bold text-[9px] uppercase tracking-widest text-slate-600">Identity Audit</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
