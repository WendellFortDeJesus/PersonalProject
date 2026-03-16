
"use client";

import React, { useState, useMemo } from 'react';
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
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Search, Trash2, Edit3, UserCircle, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/data';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patronToDelete, setPatronToDelete] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState('all');

  const db = useFirestore();
  const { toast } = useToast();

  const patronsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'patrons'), orderBy('name', 'asc'));
  }, [db]);

  const { data: patrons, isLoading } = useCollection(patronsQuery);

  const filteredPatrons = useMemo(() => {
    if (!patrons) return [];
    return patrons.filter(p => {
      const matchesSearch = (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.schoolId?.toLowerCase().includes(searchTerm.toLowerCase()));
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
        setIsEditSheetOpen(false);
        toast({ title: "Registry Updated", description: "User profile has been saved successfully." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
  };

  const toggleBlockStatus = async (patron: any) => {
    if (!db) return;
    const patronRef = doc(db, 'patrons', patron.id);
    const newStatus = !patron.isBlocked;
    
    updateDoc(patronRef, { isBlocked: newStatus })
      .then(() => {
        toast({ 
          title: newStatus ? "Identity Restricted" : "Identity Restored", 
          description: `${patron.name} access has been updated.` 
        });
      })
      .catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: patronRef.path,
          operation: 'update',
          requestResourceData: { isBlocked: newStatus }
        }));
      });
  };

  const handleDeletePatron = async () => {
    if (!db || !patronToDelete) return;
    const patronRef = doc(db, 'patrons', patronToDelete.id);

    deleteDoc(patronRef).then(() => {
      setIsDeleteDialogOpen(false);
      toast({ title: "Permanently Erased", description: "User record has been removed from the registry." });
    }).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: patronRef.path,
        operation: 'delete'
      }));
    });
  };

  if (isLoading) return (
    <div className="p-32 text-center h-[80vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
      <p className="font-mono font-black text-primary uppercase tracking-[0.4em] text-[10px]">Loading Registry...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in font-body bg-[#F8FAFC]">
      <header className="p-6 border-b bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline leading-none">User Management</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Institutional Identity Registry</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Name or ID..." 
              className="h-9 pl-9 rounded-xl border-slate-200 text-xs font-bold bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-9 w-full md:w-48 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {DEPARTMENTS.map(d => (
                <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="pl-8 h-12 font-black text-[9px] uppercase tracking-widest text-slate-500">Patron Identity</TableHead>
                <TableHead className="h-12 font-black text-[9px] uppercase tracking-widest text-slate-500">Department</TableHead>
                <TableHead className="h-12 font-black text-[9px] uppercase tracking-widest text-slate-500 text-center">Access Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron) => (
                <TableRow key={patron.id} className={cn("h-14 border-slate-50 transition-colors hover:bg-slate-50/30", patron.isBlocked && "bg-red-50/30")}>
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black tracking-tight uppercase text-primary">{patron.name}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{patron.schoolId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[9px] font-black px-3 py-1 rounded-full border border-slate-100 text-slate-500 bg-slate-50/50 uppercase">
                      {patron.departments?.[0] || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      onClick={() => toggleBlockStatus(patron)}
                      className={cn(
                        "cursor-pointer px-4 py-1 rounded-full font-black text-[8px] uppercase tracking-[0.2em] transition-all active:scale-95",
                        patron.isBlocked ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-green-100 text-green-700 border-green-200"
                      )}
                    >
                      {patron.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 rounded-full" onClick={() => { setEditingPatron(patron); setIsEditSheetOpen(true); }}>
                        <Edit3 className="h-4 w-4 text-slate-400 hover:text-primary transition-colors" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 rounded-full" onClick={() => { setPatronToDelete(patron); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600 transition-colors" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatrons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    No matching identities found in registry
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md p-0 border-none shadow-2xl overflow-hidden font-body">
          <SheetHeader className="p-10 bg-primary text-white">
            <SheetTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <UserCircle className="h-8 w-8" /> Identity Profile
            </SheetTitle>
          </SheetHeader>
          <div className="p-10 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Identity</Label>
                <Input value={editingPatron?.name || ''} onChange={(e) => setEditingPatron({ ...editingPatron, name: e.target.value.toUpperCase() })} className="h-12 font-black uppercase border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">School Registry ID (24-12345-123)</Label>
                <Input value={editingPatron?.schoolId || ''} onChange={(e) => setEditingPatron({ ...editingPatron, schoolId: e.target.value })} className="h-12 font-bold border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Academic Unit / College</Label>
                <Select value={editingPatron?.departments?.[0] || ''} onValueChange={(v) => setEditingPatron({ ...editingPatron, departments: [v] })}>
                  <SelectTrigger className="h-12 font-bold border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Role</Label>
                <Select value={editingPatron?.role || 'Student'} onValueChange={(v) => setEditingPatron({ ...editingPatron, role: v })}>
                  <SelectTrigger className="h-12 font-bold border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student" className="text-xs font-bold">Student</SelectItem>
                    <SelectItem value="Faculty" className="text-xs font-bold">Faculty</SelectItem>
                    <SelectItem value="Staff" className="text-xs font-bold">Staff</SelectItem>
                    <SelectItem value="Visitor" className="text-xs font-bold">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" onClick={() => setIsEditSheetOpen(false)} className="h-12 font-black uppercase text-[10px] tracking-widest flex-1 border-slate-200 rounded-xl">Cancel</Button>
            <Button onClick={handleSaveChanges} className="h-12 font-black uppercase text-[10px] tracking-widest bg-primary px-10 flex-1 rounded-xl shadow-lg">Commit Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden sm:max-w-sm">
          <DialogHeader className="p-10 bg-red-600 text-white text-center">
            <div className="mx-auto bg-white/20 p-4 rounded-full w-fit mb-4">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Permanently Remove?</DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center space-y-4">
            <p className="text-sm font-bold text-slate-600">Delete record for <span className="text-red-600 font-black">{patronToDelete?.name}</span>?</p>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed">This action will erase all associated history from the registry.</p>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="h-12 font-black uppercase text-[10px] tracking-widest border-slate-200 rounded-xl">Keep</Button>
            <Button onClick={handleDeletePatron} className="h-12 font-black uppercase text-[10px] tracking-widest bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-lg">Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
