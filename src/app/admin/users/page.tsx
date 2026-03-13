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

export default function AccessManagementPage() {
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
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left Sidebar (20%): Advanced Segmentation Control */}
      <aside className="w-80 border-r bg-white p-8 space-y-10 overflow-y-auto shrink-0 hidden lg:block">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Segmentation</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Filter library identity records</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Master Search</Label>
              <Input 
                placeholder="Name or ID Index..." 
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Academic Unit</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gender Profile</Label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t">
          <Button variant="outline" className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-black uppercase text-[10px] tracking-widest">
            Export Master CSV
          </Button>
        </div>
      </aside>

      {/* Main Content (80%): Edge-to-Edge Data Grid */}
      <main className="flex-1 bg-slate-50/30 overflow-y-auto">
        <div className="bg-white min-h-full border-l">
          <Table>
            <TableHeader className="bg-white sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="pl-10 h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Patron Identity</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Primary College</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Demographics</TableHead>
                <TableHead className="h-16 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Activity Start</TableHead>
                <TableHead className="h-16 pr-10 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Override</TableHead>
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
                      <span className={cn("text-sm font-black tracking-tight", patron.isBlocked ? "text-red-700" : "text-slate-900 uppercase")}>
                        {patron.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                        {patron.schoolId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {patron.departments?.map((dept: string, i: number) => (
                        <span key={i} className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded uppercase border border-slate-200">
                          {dept.split(':')[0]}
                        </span>
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
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" size="sm" className="h-9 px-4 text-primary font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-primary/5"
                        onClick={() => { setEditingPatron(patron); setIsEditDialogOpen(true); }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" size="sm" className={cn("h-9 px-4 font-black uppercase text-[9px] tracking-widest rounded-xl", patron.isBlocked ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}
                        onClick={() => handleToggleBlock(patron)}
                      >
                        {patron.isBlocked ? 'Unlock' : 'Restrict'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {isLoading && (
            <div className="p-32 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Compiling Global Registry...</p>
            </div>
          )}
        </div>
      </main>

      {/* Profile Editor Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-10 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Profile Management</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase tracking-widest text-[9px] mt-2">
              System override for formal visitor identity
            </DialogDescription>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Identity</Label>
                <Input value={editingPatron?.name || ''} className="h-12 rounded-xl font-bold uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Age Index</Label>
                  <Input type="number" value={editingPatron?.age || ''} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender Profile</Label>
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
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button className="bg-primary rounded-xl px-10 font-black uppercase text-[10px] tracking-widest">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}