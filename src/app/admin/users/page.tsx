"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Clock,
  Activity,
  UserX,
  UserCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function VisitorManagementPage() {
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const visitsQuery = useMemoFirebase(() => {
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(100));
  }, [db]);

  const { data: visits, isLoading } = useCollection(visitsQuery);

  const safeFormat = (date: string | undefined, formatStr: string) => {
    if (!mounted || !date) return "...";
    try {
      return format(new Date(date), formatStr);
    } catch {
      return "...";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Live Activity Monitor</h1>
          <p className="text-muted-foreground">Historical feed of the last 100 library check-in events</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Real-time Traffic Feed</CardTitle>
              <CardDescription>Busiest logs based on current system activity</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              Push Feed Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="pl-6 font-bold text-slate-700">VISITOR</TableHead>
                <TableHead className="font-bold text-slate-700">TIME IN</TableHead>
                <TableHead className="font-bold text-slate-700">INTENT / PURPOSE</TableHead>
                <TableHead className="font-bold text-slate-700">ACADEMIC INFO</TableHead>
                <TableHead className="text-right pr-6 font-bold text-slate-700">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits?.map((visit) => (
                <TableRow key={visit.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://picsum.photos/seed/${visit.patronId}/100/100`} />
                        <AvatarFallback>{visit.patronName?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{visit.patronName}</span>
                        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{visit.schoolId}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {safeFormat(visit.timestamp, 'h:mm:ss a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={visit.status === 'blocked' ? 'destructive' : 'secondary'} className="bg-primary/5 text-primary border-primary/10 font-bold px-3">
                      {visit.status === 'blocked' ? 'Access Denied' : visit.purpose}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1">
                        {visit.patronDepartments?.map((dept, i) => (
                          <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                            {dept}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        AGE {visit.patronAge} • {visit.patronGender}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {visit.status === 'blocked' ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                          <UserX className="h-4 w-4" />
                          DENIED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                          <UserCheck className="h-4 w-4" />
                          GRANTED
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!visits || visits.length === 0) && !isLoading && (
            <div className="p-20 text-center space-y-4">
              <Activity className="h-12 w-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-bold text-lg">No traffic recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
