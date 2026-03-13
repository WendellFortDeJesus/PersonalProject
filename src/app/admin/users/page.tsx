"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { GENDERS } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Search, UserCog, ShieldOff, Filter, Download } from 'lucide-react';

export default function VisitorManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');

  const db = useFirestore();
  const { toast } = useToast();

  const patronsQuery = useMemoFirebase(() => {
    return query(collection(db, 'patrons'), orderBy('name', 'asc'));
  }, [db]);

  const { data: patrons, isLoading } = useCollection(patronsQuery);

  const filteredPatrons = patrons?.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.schoolId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || p.departments?.includes(selectedDept);
    const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
    return matchesSearch && matchesDept && matchesGender;
  });

  const handleToggleBlock = (patron: any) => {
    if (!db) return;
    const patronRef = doc(db, 'patrons', patron.id);
    const update = { isBlocked: !patron.isBlocked };
    
    updateDoc(patronRef, update).catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: patronRef.path,
        operation: 'update',
        requestResourceData: update,
      }));
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* 20% Filter Sidebar */}
      <aside className="w-80 border-r bg-white p-8 space-y-10 overflow-y-auto shrink-0">
        <div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Segmentation Control</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Search Identity</Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Name or ID..." 
                  className="h-11 rounded-xl bg-slate-50 border-slate-100 pl-11 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Academic Unit</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {/* Dynamic depts from settings would go here */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Gender Filter</Label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t">
          <Button className="w-full h-12 rounded-xl bg-primary font-black uppercase text-[10px] tracking-widest gap-2">
            <Download className="h-3 w-3" />
            Export CSV
          </Button>
        </div>
      </aside>

      {/* 80% Main Content Grid */}
      <main className="flex-1 bg-slate-50/50 p-8 overflow-y-auto">
        <div className="data-table-container">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-10 h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Patron Identity</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Department</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Demographics</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Activity</TableHead>
                <TableHead className="h-16 pr-10 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron) => (
                <TableRow 
                  key={patron.id} 
                  className={cn(
                    "zebra-row group transition-colors",
                    patron.isBlocked && "bg-red-50/70 hover:bg-red-100/70"
                  )}
                >
                  <TableCell className="pl-10 py-5">
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-black tracking-tight", patron.isBlocked ? "text-red-700" : "text-slate-900")}>
                        {patron.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {patron.schoolId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {patron.departments?.map((dept: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-tighter bg-white/50 border-slate-200 text-slate-600 px-2">
                          {dept.split(':')[0]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono font-black text-primary/60 uppercase">
                      {patron.age}Y • {patron.gender}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {patron.createdAt ? format(new Date(patron.createdAt), 'MMM dd, yyyy') : '...'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary rounded-xl"
                        onClick={() => { setEditingPatron(patron); setIsEditDialogOpen(true); }}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl", patron.isBlocked ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}
                        onClick={() => handleToggleBlock(patron)}
                      >
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {isLoading && (
            <div className="p-32 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Compiling Registry Data...</p>
            </div>
          )}
        </div>
      </main>

      {/* Profile Editor Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-10 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Identity Management</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase tracking-widest text-[10px] mt-2">
              Formal system override for visitor credentials
            </DialogDescription>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Full Legal Identity</Label>
                <Input value={editingPatron?.name || ''} className="h-12 rounded-xl font-bold uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Age Index</Label>
                  <Input type="number" value={editingPatron?.age || ''} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Gender Identity</Label>
                  <Select value={editingPatron?.gender || ''}>
                    <SelectTrigger className="h-12 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-10 bg-slate-50 gap-4">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
            <Button className="bg-primary rounded-xl px-10 font-black uppercase text-[10px]">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
