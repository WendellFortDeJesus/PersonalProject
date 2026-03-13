"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  ShieldCheck, 
  UserX,
  UserCheck,
  Ban,
  Clock,
  Activity,
  User as UserIcon,
  Info,
  Calendar
} from 'lucide-react';
import { MOCK_PATRONS, MOCK_VISITS, Patron, Visit, PURPOSES } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function VisitorManagementPage() {
  const [patrons, setPatrons] = useState<Patron[]>(MOCK_PATRONS);
  const [visits, setVisits] = useState<Visit[]>(MOCK_VISITS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const { toast } = useToast();

  const toggleStatus = (id: string) => {
    setPatrons(patrons.map(p => {
      if (p.id === id) {
        const newBlockedStatus = !p.isBlocked;
        toast({
          title: newBlockedStatus ? "Patron Blocked" : "Access Restored",
          description: `${p.name}'s library privileges have been ${newBlockedStatus ? 'revoked' : 'reactivated'}.`,
          variant: newBlockedStatus ? 'destructive' : 'default',
        });
        return { ...p, isBlocked: newBlockedStatus };
      }
      return p;
    }));
  };

  const filteredPatrons = patrons.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.schoolId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isNew = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  const getPatronHistory = (patronId: string) => {
    return visits.filter(v => v.patronId === patronId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Visitor Management</h1>
          <p className="text-muted-foreground">Monitor live traffic and manage the patron database</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl shadow-lg h-12 px-6">
          <UserPlus className="h-5 w-5" />
          Add New Patron
        </Button>
      </div>

      <Tabs defaultValue="monitor" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 h-12 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="monitor" className="rounded-lg font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Activity className="w-4 h-4 mr-2" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="directory" className="rounded-lg font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <UserIcon className="w-4 h-4 mr-2" />
            Master Directory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-white border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Real-time Traffic Feed</CardTitle>
                  <CardDescription>Recently checked-in visitors</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Live Feed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-6 font-bold text-slate-700">VISITOR</TableHead>
                    <TableHead className="font-bold text-slate-700">TIME IN</TableHead>
                    <TableHead className="font-bold text-slate-700">PURPOSE</TableHead>
                    <TableHead className="font-bold text-slate-700">COLLEGE / DEPT</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-slate-700">QUICK ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((visit) => {
                    const patron = patrons.find(p => p.id === visit.patronId);
                    return (
                      <TableRow key={visit.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src={patron?.photoUrl || `https://picsum.photos/seed/${visit.patronId}/100/100`} />
                              <AvatarFallback>{visit.patronName[0]}</AvatarFallback>
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
                            {format(new Date(visit.timestamp), 'h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-3">
                            {visit.purpose}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {visit.patronDepartments.map((dept, i) => (
                              <span key={i} className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatus(visit.patronId)}
                            className={`rounded-lg font-bold text-xs h-8 ${patron?.isBlocked ? 'text-green-600' : 'text-destructive hover:bg-red-50'}`}
                          >
                            {patron?.isBlocked ? 'Restore Access' : 'Quick Block'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-white border-b border-slate-50 pb-6 pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-[450px]">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search Patron by Name, Email, or ID..." 
                    className="pl-12 border-slate-100 rounded-xl h-11 bg-slate-50/50 focus-visible:ring-primary shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2 rounded-xl border-slate-200 font-bold">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="w-[300px] pl-6 font-bold text-slate-700">PATRON IDENTITY</TableHead>
                    <TableHead className="font-bold text-slate-700">COLLEGE / DEPT</TableHead>
                    <TableHead className="font-bold text-slate-700">STATUS</TableHead>
                    <TableHead className="font-bold text-slate-700">LAST VISIT</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-slate-700">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatrons.map((patron) => (
                    <TableRow key={patron.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                            <AvatarImage src={patron.photoUrl || `https://picsum.photos/seed/${patron.id}/150/150`} />
                            <AvatarFallback>{patron.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{patron.name}</span>
                              {isNew(patron.createdAt) && (
                                <Badge className="bg-blue-500 hover:bg-blue-600 text-[9px] h-4 px-1 font-bold uppercase tracking-tighter">NEW</Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patron.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {patron.departments.map((dept, i) => (
                            <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 whitespace-nowrap bg-slate-100 text-slate-600">
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patron.isBlocked ? "destructive" : "outline"} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${!patron.isBlocked ? 'bg-green-50 text-green-700 border-green-100' : ''}`}>
                          {patron.isBlocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-500">
                          {patron.lastVisit ? format(new Date(patron.lastVisit), 'MMM d, yyyy') : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                              <Info className="h-4 w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                            <div className="h-2 bg-primary w-full" />
                            <DialogHeader className="p-8 pb-0">
                              <div className="flex items-start gap-6">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                  <AvatarImage src={patron.photoUrl || `https://picsum.photos/seed/${patron.id}/200/200`} />
                                  <AvatarFallback className="text-2xl">{patron.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <DialogTitle className="text-3xl font-headline font-bold text-primary">{patron.name}</DialogTitle>
                                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <Badge variant="outline" className="font-bold">{patron.role}</Badge>
                                    <span>•</span>
                                    <span>{patron.schoolId}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-2">
                                    {patron.departments.map((d, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px]">{d}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogHeader>
                            <div className="p-8 space-y-6">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Visits</p>
                                  <p className="text-2xl font-bold text-primary">{getPatronHistory(patron.id).length}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Top Purpose</p>
                                  <p className="text-sm font-bold text-primary truncate">
                                    {getPatronHistory(patron.id)[0]?.purpose || 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                                  <p className="text-sm font-bold text-primary">
                                    {format(new Date(patron.createdAt), 'MMM yyyy')}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Recent Activity Log
                                </h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                  {getPatronHistory(patron.id).length > 0 ? (
                                    getPatronHistory(patron.id).map(v => (
                                      <div key={v.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-700">{v.purpose}</span>
                                          <span className="text-[10px] text-slate-400">{format(new Date(v.timestamp), 'PPpp')}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px]">Logged</Badge>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-slate-400 py-8 italic">No recent visits recorded</p>
                                  )}
                                </div>
                              </div>

                              <div className="pt-4 flex gap-3">
                                <Button className="flex-1 rounded-xl font-bold" variant="outline">Edit Profile</Button>
                                <Button 
                                  onClick={() => toggleStatus(patron.id)}
                                  className={`flex-1 rounded-xl font-bold ${patron.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                  {patron.isBlocked ? 'Restore Access' : 'Block Access'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase p-3">Management</DropdownMenuLabel>
                            <DropdownMenuItem className="rounded-lg cursor-pointer py-3 font-medium">
                              <Info className="w-4 h-4 mr-2" /> View Audit Log
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg cursor-pointer py-3 font-medium">
                              <Activity className="w-4 h-4 mr-2" /> Session History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <DropdownMenuItem 
                              onClick={() => toggleStatus(patron.id)}
                              className={`rounded-lg cursor-pointer py-3 font-bold ${
                                !patron.isBlocked ? 'text-destructive' : 'text-green-600'
                              }`}
                            >
                              {!patron.isBlocked ? (
                                <><UserX className="h-4 w-4 mr-2" /> Revoke Privileges</>
                              ) : (
                                <><UserCheck className="h-4 w-4 mr-2" /> Restore Access</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}