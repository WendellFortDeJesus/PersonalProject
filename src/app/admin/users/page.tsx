
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
import { GENDERS, DEPARTMENTS } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Search, ShieldOff, UserCog } from 'lucide-react';

export default function VisitorManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const patronsQuery = useMemoFirebase(() => {
    return query(collection(db, 'patrons'), orderBy('name', 'asc'));
  }, [db]);

  const { data: patrons, isLoading } = useCollection(patronsQuery);

  const filteredPatrons = patrons?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.schoolId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleBlock = (patron: any) => {
    if (!db) return;
    const patronRef = doc(db, 'patrons', patron.id);
    const update = { isBlocked: !patron.isBlocked };
    
    updateDoc(patronRef, update)
      .then(() => {
        toast({
          title: patron.isBlocked ? "Access Restored" : "User Restricted",
          variant: patron.isBlocked ? "default" : "destructive",
        });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: update,
        }));
      });
  };

  const handleUpdatePatron = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatron || !db) return;

    const patronRef = doc(db, 'patrons', editingPatron.id);
    const update = {
      name: editingPatron.name,
      age: editingPatron.age,
      gender: editingPatron.gender,
      departments: editingPatron.departments,
      updatedAt: new Date().toISOString()
    };

    updateDoc(patronRef, update)
      .then(() => {
        setIsEditDialogOpen(false);
        toast({ title: "Profile Synchronized" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: update,
        }));
      });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Search & Filter - Glassmorphic */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/50 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search Master Registry by Name or School ID..." 
            className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary pl-11 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 bg-white">
            Segment Data
          </Button>
          <Button className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest px-6 bg-primary shadow-lg shadow-primary/20">
            Export View
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem] bg-white">
        <CardContent className="p-0">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b-2 border-slate-100 hover:bg-transparent">
                <TableHead className="pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Identity Registry</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Academic Units</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Demographics</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Registered On</TableHead>
                <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron, index) => (
                <TableRow 
                  key={patron.id} 
                  className={cn(
                    "transition-colors border-slate-50",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                    patron.isBlocked && "bg-red-50/50 hover:bg-red-50"
                  )}
                >
                  <TableCell className="pl-10 py-5">
                    <div className="flex flex-col">
                      <span className={cn("font-black text-slate-800 tracking-tight", patron.isBlocked && "text-red-700")}>
                        {patron.name}
                      </span>
                      <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">
                        {patron.schoolId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {patron.departments?.map((dept: string, i: number) => (
                        <Badge key={i} variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-tighter border-slate-200 bg-white text-slate-600 px-2 py-0.5">
                          {dept.split(':')[0]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[11px] text-slate-500 font-bold uppercase font-mono">
                      {patron.age}Y • {patron.gender}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {patron.createdAt ? format(new Date(patron.createdAt), 'MMM dd, yyyy') : '...'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg"
                        onClick={() => {
                          setEditingPatron(patron);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 rounded-lg", patron.isBlocked ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}
                        onClick={() => handleToggleBlock(patron)}
                      >
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
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
          
          {(!filteredPatrons || filteredPatrons.length === 0) && !isLoading && (
            <div className="p-32 text-center">
              <p className="text-slate-400 font-bold italic">No records matching system criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Editor */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] overflow-hidden p-0 gap-0 border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Identity Modification</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase tracking-widest text-[10px]">
              Manual system override for visitor credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePatron}>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Legal Name</Label>
                  <Input 
                    value={editingPatron?.name || ''} 
                    onChange={(e) => setEditingPatron({...editingPatron, name: e.target.value})}
                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age Reference</Label>
                    <Input 
                      type="number"
                      value={editingPatron?.age || ''} 
                      onChange={(e) => setEditingPatron({...editingPatron, age: parseInt(e.target.value)})}
                      className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender Identity</Label>
                    <Select 
                      value={editingPatron?.gender || ''} 
                      onValueChange={(val) => setEditingPatron({...editingPatron, gender: val})}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold">
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
            <DialogFooter className="p-8 bg-slate-50 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</Button>
              <Button type="submit" className="bg-primary rounded-xl px-8 shadow-lg font-black uppercase text-[10px] tracking-widest">Update Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
