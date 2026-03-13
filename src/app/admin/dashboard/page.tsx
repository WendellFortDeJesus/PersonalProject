
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Clock,
  ArrowRight,
  UserCheck,
  Building2,
  CalendarDays
} from 'lucide-react';
import { MOCK_PATRONS, MOCK_VISITS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper for safe client-side date formatting
  const safeFormat = (date: Date | string | undefined, formatStr: string, fallback = "...") => {
    if (!mounted || !date) return fallback;
    return format(new Date(date), formatStr);
  };

  // Sort visits by most recent first
  const sortedVisits = [...MOCK_VISITS].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalLoginsToday = MOCK_VISITS.length;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Total Terminal Logins</p>
                <h3 className="text-6xl font-bold mt-2">{totalLoginsToday}</h3>
                <p className="text-sm font-medium mt-4 text-white/80 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Recorded entries in system
                </p>
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
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Patrons</p>
                <h3 className="text-6xl font-bold mt-2 text-primary">{MOCK_PATRONS.filter(p => !p.isBlocked).length}</h3>
                <p className="text-sm font-medium mt-4 text-slate-500 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Eligible for library entry
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-3xl">
                <Users className="h-8 w-8 text-primary" />
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
                <p className="text-sm font-medium mt-4 text-slate-500 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Live System Clock
                </p>
              </div>
              <div className="p-4 bg-accent/20 rounded-3xl">
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simplified Live Log-in Feed */}
      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-white pb-6 pt-8 px-8 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Visitor Login Activity</CardTitle>
              <CardDescription className="text-base">Real-time recording of check-ins from the terminal</CardDescription>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Monitoring Active
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {sortedVisits.map((visit) => {
              const patron = MOCK_PATRONS.find(p => p.id === visit.patronId);
              return (
                <div key={visit.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-sm">
                      <AvatarImage src={patron?.photoUrl || `https://picsum.photos/seed/${visit.patronId}/150/150`} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">{visit.patronName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-800">{visit.patronName}</span>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold">
                          {visit.purpose}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 uppercase tracking-tighter text-xs font-bold text-slate-400">
                          {visit.schoolId}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <div className="flex flex-wrap gap-1">
                          {visit.patronDepartments.map((dept, i) => (
                            <span key={i} className="text-xs">{dept}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 pr-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Clock className="h-4 w-4" />
                      {safeFormat(visit.timestamp, 'h:mm a')}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Check-in Logged
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {sortedVisits.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="bg-slate-100 p-6 rounded-full w-fit mx-auto">
                <Users className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-lg">No visitor logins recorded today</p>
              <p className="text-slate-400">Logins will appear here as soon as patrons tap their RFID.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
