"use client";

import React, { useState, useMemo, use } from 'react';
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
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { ShieldAlert, Trash2, Edit3, Search, Filter, AlertTriangle } from 'lucide-react';

export default function AccessManagementPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patronToDelete, setPatronToDelete] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const db = useFirestore();
  const { toast } = useToast();

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  const patronsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'patrons'), where('isArchived', '==', false), orderBy('name', 'asc'));
  }, [db]);

  const { data: patrons, isLoading } = useCollection(patronsQuery);

  const filteredPatrons = useMemo(() => {
    if (!patrons) return [];
    return patrons.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.schoolId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'all' || p.departments?.includes(selectedDept);
      return matchesSearch && matchesDept;
    });
  }, [patrons, searchTerm, selectedDept]);

  const handleSaveChanges = async () => {
    if (!db || !editingPatron) return;
    const patronRef = doc(db, 'patrons', editingPatron.id);
    const { id, ...updateData } = editingPatron;
    updateData.updatedAt = new Date().toISOString();
    
    updateDoc(patronRef, updateData)
      .then(() => {
        setIsEditDialogOpen(false);
        toast({ title: "Registry Updated", description: "Identity profile has been saved." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
  };

  const handleDeletePatron = async () => {
    if (!db || !patronToDelete) return;
    
    if (config?.requireDeleteReason && !deleteReason) {
      toast({ variant: "destructive", title: "Action Denied", description: "A reason for deletion is required." });
      return;
    }

    const patronRef = doc(db, 'patrons', patronToDelete.id);

    if (config?.hardDelete) {
      deleteDoc(patronRef).then(() => {
        setIsDeleteDialogOpen(false);
        toast({ title: "Permanently Erased", description: "Record has been removed from the server." });
      }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'delete'
        }));
      });
    } else {
      const update = { 
        isArchived: true, 
        archiveReason: deleteReason, 
        updatedAt: new Date().toISOString() 
      };
      updateDoc(patronRef, update).then(() => {
        setIsDeleteDialogOpen(false);
        toast({ title: "Record Archived", description: "Student is now hidden from active registry." });
      }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: update
        }));
      });
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-slate-50/50 font-body">
      <aside className="w-80 border-r bg-white p-8 space-y-10 overflow-y-auto shrink-0 hidden lg:block shadow-sm">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] font-headline">Segmentation</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Identity Filtering</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Search className="h-3 w-3" /> Master Search
              </Label>
              <Input 
                placeholder="Name, ID or Email..." 
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Filter className="h-3 w-3" /> Academic Unit
              </Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Units</SelectItem>
                  {config?.departments?.map((d: any) => (
                    <SelectItem key={d.id} value={d.name}>{d.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white border-l">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-white sticky top-0 z-20 shadow-sm">
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="pl-10 h-14 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[25%]">Identity Name & Detail</TableHead>
              <TableHead className="h-14 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[8%]">Age</TableHead>
              <TableHead className="h-14 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[20%]">Department</TableHead>
              <TableHead className="h-14 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[20%]">Registry Detail</TableHead>
              <TableHead className="h-14 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[12%]">Method</TableHead>
              <TableHead className="h-14 pr-10 text-right font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatrons?.map((patron) => {
              const email = patron.email || 'EMAIL NOT READ';
              
              return (
                <TableRow 
                  key={patron.id} 
                  className={cn(
                    "group transition-colors h-11 border-slate-50",
                    patron.isBlocked ? "bg-red-50/50 hover:bg-red-100/50" : "hover:bg-slate-50/80"
                  )}
                >
                  <TableCell className="pl-10 py-1">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full", patron.isBlocked ? "bg-red-500" : "bg-green-500")} />
                      <span className={cn(
                        "text-xs font-bold tracking-tight uppercase truncate max-w-[180px]", 
                        patron.isBlocked ? "text-red-700" : "text-slate-900"
                      )}>
                        {patron.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{patron.age}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-100 text-slate-500 bg-slate-50/50 truncate block max-w-[140px]">
                      {patron.departments?.[0]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase truncate block max-w-[160px]">
                      {email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-5 border-slate-200 text-slate-400">
                      {patron.schoolId ? 'RF-ID' : 'SSO'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 border-primary/20 text-primary hover:bg-primary/5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                        onClick={() => { setEditingPatron(patron); setIsEditDialogOpen(true); }}
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                        onClick={() => { setPatronToDelete(patron); setIsDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-10 bg-primary text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter font-headline flex items-center gap-3">
              <Edit3 className="h-6 w-6" /> Profile Management
            </DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Identity</Label>
                <Input 
                  value={editingPatron?.name || ''} 
                  onChange={(e) => setEditingPatron({ ...editingPatron, name: e.target.value.toUpperCase() })}
                  className="h-12 rounded-xl font-bold uppercase bg-slate-50 border-slate-100" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">School ID / RFID</Label>
                  <Input 
                    value={editingPatron?.schoolId || ''} 
                    onChange={(e) => setEditingPatron({ ...editingPatron, schoolId: e.target.value })}
                    className="h-12 rounded-xl font-bold bg-slate-50 border-slate-100" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Age Index</Label>
                  <Input 
                    type="number" 
                    value={editingPatron?.age || ''} 
                    onChange={(e) => setEditingPatron({ ...editingPatron, age: Number(e.target.value) })}
                    className="h-12 rounded-xl font-bold bg-slate-50 border-slate-100" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registry Contact (Email)</Label>
                <Input 
                  value={editingPatron?.email || ''} 
                  onChange={(e) => setEditingPatron({ ...editingPatron, email: e.target.value })}
                  className="h-12 rounded-xl font-mono font-bold bg-slate-50 border-slate-100" 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 gap-3 border-t">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Cancel</Button>
            <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-10 bg-red-600 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter font-headline flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" /> Safety Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-3">
              <p className="text-sm font-bold text-red-900 leading-relaxed">
                You are about to remove <span className="underline">{patronToDelete?.name}</span> from the active institutional registry.
              </p>
            </div>

            {config?.requireDeleteReason && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reason for Deletion</Label>
                <Select value={deleteReason} onValueChange={setDeleteReason}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Duplicate Entry">Duplicate Entry</SelectItem>
                    <SelectItem value="Test Data">Test Data / Simulation</SelectItem>
                    <SelectItem value="Incorrect Identity Method">Incorrect Identity Method</SelectItem>
                    <SelectItem value="System Error">Terminal System Error</SelectItem>
                    <SelectItem value="Graduated/Left">Institutional Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="p-8 bg-slate-50 gap-3 border-t">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Cancel</Button>
            <Button onClick={handleDeletePatron} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg">Confirm Removal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}