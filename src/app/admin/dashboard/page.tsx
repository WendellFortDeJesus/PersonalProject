"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // System Config
  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  // Real-time listener for visits
  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(50));
  }, [db, user]);

  const { data: rawVisits, isLoading: isDataLoading } = useCollection(visitsQuery);

  // Filter logic
  const visits = useMemo(() => {
    if (!rawVisits) return [];
    return rawVisits.filter(v => {
      const matchesSearch = v.patronName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.schoolId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'all' || v.patronDepartments?.includes(deptFilter);
      return matchesSearch && matchesDept;
    });
  }, [rawVisits, searchTerm, deptFilter]);

  const safeFormat = (date: string | Date | undefined, formatStr: string, fallback = "...") => {
    if (!mounted || !date) return fallback;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, formatStr);
    } catch {
      return fallback;
    }
  };

  const totalLoginsToday = rawVisits?.length || 0;
  const capacityLimit = config?.capacityLimit || 100;
  const isAtCapacity = totalLoginsToday >= capacityLimit;
  const engagementTarget = config?.dailyEngagementTarget || 50;
  const goalProgress = Math.min(100, (totalLoginsToday / engagementTarget) * 100);

  if (isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Capacity Alert Banner */}
      {isAtCapacity && (
        <Card className="border-none bg-destructive text-destructive-foreground shadow-2xl shadow-destructive/20 animate-pulse overflow-hidden rounded-[2rem]">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-0.5">
                <p className="font-black uppercase tracking-[0.2em] text-sm">Critical Capacity Reached</p>
                <p className="text-xs opacity-80 font-bold">Facility has reached the safety threshold of {capacityLimit} visitors.</p>
              </div>
            </div>
            <Badge variant="outline" className="text-white border-white/50 bg-white/10 font-black px-6 py-2 rounded-xl text-lg">
              {totalLoginsToday} / {capacityLimit}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Enterprise KPI Suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white rounded-[2.5rem] overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Facility Traffic</p>
                <h3 className="text-5xl font-black">{totalLoginsToday}</h3>
                <div className="text-xs font-bold text-white/70">
                  +12% from yesterday
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Daily Goal</p>
                <h3 className="text-5xl font-black text-primary">{Math.round(goalProgress)}%</h3>
                <Progress value={goalProgress} className="h-2 w-32 bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Status</p>
                <div className="text-3xl font-black text-green-600 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Push connection active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Server Clock</p>
                <h3 className="text-2xl font-black text-primary">{safeFormat(new Date(), 'HH:mm:ss')}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{safeFormat(new Date(), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Monitor Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">Live Pulse Monitor</h2>
          <p className="text-slate-500 font-bold tracking-tight">Real-time engagement from university library terminals</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Input 
              placeholder="Search active visitor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-primary shadow-inner"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-56 h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-600">
              <SelectValue placeholder="All Academic Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Traffic</SelectItem>
              {config?.departments?.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sliding Traffic Cards */}
      <div className="grid grid-cols-1 gap-4">
        {visits.map((visit) => (
          <Card key={visit.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] overflow-hidden bg-white group">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                      <AvatarImage src={`https://picsum.photos/seed/${visit.patronId}/200/200`} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary font-black uppercase">
                        {visit.patronName?.[0] || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${visit.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{visit.patronName}</span>
                      <Badge 
                        variant={visit.status === 'blocked' ? "destructive" : "secondary"} 
                        className="font-black px-4 py-1.5 uppercase tracking-widest text-[10px] rounded-lg shadow-sm"
                      >
                        {visit.status === 'blocked' ? 'RESTRICTED ACCESS' : visit.purpose}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{visit.schoolId}</span>
                      <div className="flex flex-wrap gap-2">
                        {visit.patronDepartments?.map((deptName: string, i: number) => {
                          const deptConfig = config?.departments?.find((d: any) => d.name === deptName);
                          return (
                            <Badge 
                              key={i} 
                              className="px-3 py-1 rounded-lg text-[9px] font-black border-none shadow-sm text-white transition-transform hover:scale-105"
                              style={{ backgroundColor: deptConfig?.color || '#355872' }}
                            >
                              {deptName}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 pr-4">
                  <div className="text-primary font-black text-2xl">
                    {safeFormat(visit.timestamp, 'h:mm:ss a')}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      {visit.status === 'blocked' ? 'SECURITY ALERT ISSUED' : 'SYSTEM LOGGED'}
                    </span>
                    {visit.status === 'blocked' && (
                      <span className="text-[10px] font-black text-red-500 mt-2 flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg">
                        DENY ENTRY IMMEDIATELY
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visits.length === 0 && !isDataLoading && (
        <div className="py-40 text-center space-y-6 bg-white rounded-[3rem] shadow-sm border border-dashed">
          <div className="space-y-2">
            <p className="text-slate-400 font-black text-2xl uppercase tracking-tighter">Quiet Environment</p>
            <p className="text-slate-300 font-bold text-sm tracking-widest uppercase">No live traffic detected matching criteria</p>
          </div>
        </div>
      )}

      {isDataLoading && (
        <div className="py-40 text-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.5em] animate-pulse">Establishing Secure Uplink...</p>
        </div>
      )}
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}