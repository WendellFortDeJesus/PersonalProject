"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Clock,
  UserCheck,
  CalendarDays,
  Activity,
  UserX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time listener for visits
  const visitsQuery = useMemoFirebase(() => {
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(50));
  }, [db]);

  const { data: visits, isLoading } = useCollection(visitsQuery);

  const safeFormat = (date: string | Date | undefined, formatStr: string, fallback = "...") => {
    if (!mounted || !date) return fallback;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, formatStr);
    } catch {
      return fallback;
    }
  };

  const totalLoginsToday = visits?.length || 0;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Live Activity Logins</p>
                <h3 className="text-6xl font-bold mt-2">{totalLoginsToday}</h3>
                <div className="text-sm font-medium mt-4 text-white/80 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Real-time entries detected
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">System Status</p>
                <h3 className="text-4xl font-bold mt-2 text-primary flex items-center gap-2">
                  <Activity className="h-8 w-8 text-green-500" />
                  ONLINE
                </h3>
                <div className="text-sm font-medium mt-4 text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Firebase Sync Active
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-3xl">
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reporting Date</p>
                <h3 className="text-2xl font-bold mt-2 text-primary">
                  {safeFormat(new Date(), 'MMMM d, yyyy')}
                </h3>
                <div className="text-sm font-medium mt-4 text-slate-500 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Live System Clock
                </div>
              </div>
              <div className="p-4 bg-accent/20 rounded-3xl">
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Visitor Traffic Feed */}
      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-white pb-6 pt-8 px-8 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Real-Time Traffic Monitoring</CardTitle>
              <CardDescription className="text-base font-medium">Instant feed of visitor data pushed from the terminals</CardDescription>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-xs font-bold uppercase tracking-widest border border-green-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Push Active
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {visits?.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                      <AvatarImage src={`https://picsum.photos/seed/${visit.patronId}/150/150`} />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                        {visit.patronName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${visit.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-800">{visit.patronName}</span>
                      <Badge variant={visit.status === 'blocked' ? "destructive" : "secondary"} className="font-bold px-3 py-1 uppercase tracking-widest text-[10px]">
                        {visit.status === 'blocked' ? 'Access Denied' : visit.purpose}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                      <span className="text-primary/60 tracking-widest">{visit.schoolId}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-slate-500">{visit.patronAge} Yrs • {visit.patronGender}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <div className="flex flex-wrap gap-1.5">
                        {visit.patronDepartments.map((dept, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-bold">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 pr-4">
                  <div className="flex items-center gap-2 text-primary font-black text-lg">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                    {safeFormat(visit.timestamp, 'h:mm:ss a')}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {visit.status === 'blocked' ? 'SECURITY ALERT TRIGGERED' : 'OFFICIAL LOG RECORDED'}
                    </span>
                    {visit.status === 'blocked' && (
                      <span className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                        <UserX className="h-3 w-3" />
                        BLOCKED USER REDIRECTED TO DESK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {(!visits || visits.length === 0) && !isLoading && (
            <div className="p-32 text-center space-y-4">
              <div className="bg-slate-50 p-10 rounded-full w-fit mx-auto border border-slate-100">
                <Users className="h-16 w-16 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-2xl">Waiting for system traffic...</p>
              <p className="text-slate-300 font-medium">Check-ins will appear here as soon as they occur at the kiosk.</p>
            </div>
          )}

          {isLoading && (
            <div className="p-32 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-slate-400 mt-4 font-bold">Establishing Push Connection...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple loader helper
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