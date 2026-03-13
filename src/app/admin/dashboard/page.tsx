
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Clock,
  UserCheck,
  CalendarDays,
  Activity,
  UserX,
  AlertTriangle,
  Bell,
  Search,
  Building2,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

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
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(100));
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

  if (isAuthLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold text-slate-400">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center p-10 border-dashed border-2">
          <CardContent className="space-y-4 pt-6">
            <UserX className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-slate-500">You must be logged in as a staff member to view this dashboard.</p>
            <Button onClick={() => window.location.href = '/admin/login'}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Capacity Alert */}
      {isAtCapacity && (
        <Card className="border-none bg-red-500 text-white shadow-lg animate-bounce">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <p className="font-bold uppercase tracking-widest text-sm">Library Capacity Alert</p>
                <p className="text-xs text-white/80">Threshold of {capacityLimit} visitors reached for today.</p>
              </div>
            </div>
            <Badge variant="outline" className="text-white border-white font-bold px-4 py-1">
              {totalLoginsToday} / {capacityLimit}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-xs font-bold text-white/60 uppercase tracking-[0.2em]">Total Traffic (Live)</p>
                <h3 className="text-6xl font-black">{totalLoginsToday}</h3>
                <div className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Validated entries today
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-[2rem] backdrop-blur-md">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">System Pulse</p>
                <div className="text-4xl font-black text-primary flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-500" />
                  ONLINE
                </div>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Firestore Push Connection: Active
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-[2rem]">
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Clock</p>
                <h3 className="text-2xl font-black text-primary">
                  {safeFormat(new Date(), 'MMMM d, yyyy')}
                </h3>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {safeFormat(new Date(), 'EEEE')} - Terminal Sync
                </div>
              </div>
              <div className="p-4 bg-accent/20 rounded-[2rem]">
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitor Header & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 w-full">
          <h2 className="text-3xl font-black text-primary">Live Traffic Monitor</h2>
          <p className="text-slate-500 font-medium">Real-time push notifications from library terminals</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Visitor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-48 h-12 rounded-xl bg-white border-slate-200">
              <Building2 className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {config?.departments?.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Traffic Feed */}
      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem] bg-white">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {visits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${visit.patronId}/150/150`} />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                        {visit.patronName?.[0] || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${visit.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-800">{visit.patronName}</span>
                      <Badge 
                        variant={visit.status === 'blocked' ? "destructive" : "secondary"} 
                        className="font-bold px-3 py-1 uppercase tracking-widest text-[10px]"
                      >
                        {visit.status === 'blocked' ? 'Access Denied' : visit.purpose}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                      <span className="text-primary/60 tracking-widest">{visit.schoolId}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <div className="flex flex-wrap gap-2">
                        {visit.patronDepartments?.map((deptName: string, i: number) => {
                          const deptConfig = config?.departments?.find((d: any) => d.name === deptName);
                          return (
                            <Badge 
                              key={i} 
                              className="px-3 py-0.5 rounded-lg text-[10px] font-black border-none shadow-sm text-white"
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
                
                <div className="flex flex-col items-end gap-2 pr-4">
                  <div className="flex items-center gap-2 text-primary font-black text-xl">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                    {safeFormat(visit.timestamp, 'h:mm:ss a')}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {visit.status === 'blocked' ? 'SECURITY INTERVENTION REQ' : 'LOGGED IN SYSTEM'}
                    </span>
                    {visit.status === 'blocked' && (
                      <span className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                        <UserX className="h-3 w-3" />
                        REDIRECT TO FRONT DESK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {visits.length === 0 && !isDataLoading && (
            <div className="p-32 text-center space-y-4">
              <div className="bg-slate-50 p-10 rounded-full w-fit mx-auto border border-slate-100">
                <Users className="h-16 w-16 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-2xl">No matching traffic detected.</p>
              <p className="text-slate-300 font-medium">Try adjusting your filters or wait for new check-ins.</p>
            </div>
          )}

          {isDataLoading && (
            <div className="p-32 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-slate-400 mt-4 font-bold tracking-widest">CONNECTING TO LIVE TERMINALS...</p>
            </div>
          )}
        </CardContent>
      </Card>
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
