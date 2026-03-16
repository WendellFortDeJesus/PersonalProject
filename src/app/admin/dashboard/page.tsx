"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  UserPlus,
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  UserCheck
} from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const db = useFirestore();
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    // Stability fix: Only set time on client mount to avoid hydration mismatch
    setCurrentTime(format(new Date(), 'HH:mm:ss'));
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db]);
  const { data: visits, isLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;
    
    const todayVisits = visits.filter(v => isToday(new Date(v.timestamp)));
    const weekVisits = visits.filter(v => isThisWeek(new Date(v.timestamp)));
    
    // Logic to identify "New Visitors Today" (first ever visit is today)
    const firstVisits = new Map<string, any>();
    const sortedVisits = [...visits].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedVisits.forEach(v => {
      if (!firstVisits.has(v.patronId)) {
        firstVisits.set(v.patronId, v);
      }
    });
    
    const newVisitorsTodayList = Array.from(firstVisits.values()).filter(v => isToday(new Date(v.timestamp)));
    const newVisitorsTodayCount = newVisitorsTodayList.length;

    const hourCounts = todayVisits.reduce((acc: any, v) => {
      const h = new Date(v.timestamp).getHours();
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.keys(hourCounts).length > 0 
      ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '0')
      : '0';

    const purposeCounts = visits.reduce((acc: any, v) => {
      acc[v.purpose] = (acc[v.purpose] || 0) + 1;
      return acc;
    }, {});
    const mostCommonPurpose = Object.keys(purposeCounts).length > 0
      ? Object.keys(purposeCounts).reduce((a, b) => purposeCounts[a] > purposeCounts[b] ? a : b, 'None')
      : 'None';

    return {
      todayCount: todayVisits.length,
      newVisitorsToday: newVisitorsTodayCount,
      newVisitorsList: newVisitorsTodayList,
      weekCount: weekVisits.length,
      peakHour: `${peakHour}:00`,
      mostCommonPurpose
    };
  }, [visits]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 space-y-4 animate-fade-in w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-headline font-black text-primary uppercase tracking-tighter leading-none">Institutional Pulse</h1>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Strategic Analytics Dashboard</p>
        </div>
        <div className="bg-white border p-2 px-3 rounded-xl flex items-center gap-3 shadow-sm border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">System Node Alpha</span>
            <span className="text-xs font-black text-primary font-mono">{currentTime || '--:--:--'}</span>
          </div>
          <div className="w-px h-5 bg-slate-100" />
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { title: "Visitors Today", value: stats?.todayCount, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { title: "New Visitors Today", value: stats?.newVisitorsToday, icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
          { title: "Visitors This Week", value: stats?.weekCount, icon: Calendar, color: "text-secondary", bg: "bg-secondary/10" },
          { title: "Peak Hour Today", value: stats?.peakHour, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Common Reason", value: stats?.mostCommonPurpose, icon: BookOpen, color: "text-slate-700", bg: "bg-slate-100" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden group bg-white">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg transition-colors", item.bg)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <TrendingUp className="h-3 w-3 text-slate-200 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.title}</p>
                <h3 className="text-xl font-black text-primary tracking-tighter truncate leading-tight">{item.value ?? '0'}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Enlarged Registration Activity Section */}
      <div className="bg-primary p-10 rounded-[2.5rem] shadow-xl border-none text-white overflow-hidden relative group transition-all duration-500 hover:shadow-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
          <UserPlus className="h-48 w-48" />
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
              <UserCheck className="h-8 w-8 text-accent" />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-headline font-black uppercase tracking-tighter leading-none">New Registration Activity</h3>
              <p className="text-xs font-black text-white/50 uppercase tracking-[0.3em] mt-2">
                Total Institutional Growth Today: <span className="text-accent">{stats?.newVisitorsToday}</span> Active Identities
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats?.newVisitorsList && stats.newVisitorsList.length > 0 ? (
              stats.newVisitorsList.map((v: any, idx: number) => (
                <div key={idx} className="p-6 bg-white/5 rounded-[1.5rem] border border-white/10 backdrop-blur-xl flex flex-col justify-center transition-all hover:bg-white/10 hover:scale-[1.02]">
                  <p className="text-lg font-black text-accent uppercase tracking-tight leading-none mb-2 truncate">{v.patronName}</p>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-tighter truncate">{v.patronDepartments?.[0] || 'Unit Unassigned'}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <p className="text-[9px] font-mono font-bold text-white/30 tracking-widest uppercase">ID Node</p>
                    <p className="text-[10px] font-mono font-black text-white/40">{v.schoolId}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/20 backdrop-blur-xl text-center flex flex-col items-center justify-center gap-6 min-h-[300px]">
                <UserPlus className="h-16 w-16 text-white/10" />
                <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">No new visitor registrations recorded for current cycle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}