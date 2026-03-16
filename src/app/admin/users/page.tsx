
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
import { Search, Trash2, Edit3, UserCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
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
    // Sorted by createdAt descending so new visitors appear first
    return query(collection(db, 'patrons'), orderBy('createdAt', 'desc'));
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
      <header className="p-8 border-b bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-primary uppercase tracking-tighter font-headline leading-none">User Management</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Institutional Identity Registry</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Name or Registry ID..." 
              className="h-11 pl-11 rounded-2xl border-slate-200 text-sm font-bold bg-slate-50 focus-visible:ring-primary shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-11 w-full md:w-56 rounded-2xl bg-slate-50 border-slate-200 text-sm font-bold">
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

      <div className="flex-1 overflow-auto p-8 pt-0">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 h-10">
                <TableHead className="pl-10 h-10 font-black text-[10px] uppercase tracking-widest text-slate-500">Patron Identity</TableHead>
                <TableHead className="h-10 font-black text-[10px] uppercase tracking-widest text-slate-500">Institutional Unit</TableHead>
                <TableHead className="h-10 font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">Access Authority</TableHead>
                <TableHead className="pr-10 text-right font-black text-[10px] uppercase tracking-widest text-slate-500">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron) => (
                <TableRow key={patron.id} className={cn("h-10 border-slate-50 transition-colors hover:bg-slate-50/50", patron.isBlocked && "bg-red-50/30")}>
                  <TableCell className="pl-10 py-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black tracking-tight uppercase text-primary leading-tight">{patron.name}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{patron.schoolId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-[9px] font-black px-4 py-1 rounded-full border border-slate-100 text-slate-500 bg-slate-50 uppercase tracking-tighter">
                      {patron.departments?.[0] || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <Badge 
                      onClick={() => toggleBlockStatus(patron)}
                      className={cn(
                        "cursor-pointer px-5 py-0.5 rounded-full font-black text-[8px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm",
                        patron.isBlocked ? "bg-red-600 text-white shadow-red-200" : "bg-green-100 text-green-700 border-green-200"
                      )}
                    >
                      {patron.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/5 rounded-full transition-colors" onClick={() => { setEditingPatron(patron); setIsEditSheetOpen(true); }}>
                        <Edit3 className="h-4 w-4 text-slate-400 hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 rounded-full transition-colors" onClick={() => { setPatronToDelete(patron); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatrons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    No matching identities found in institutional registry
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-lg p-0 border-none shadow-2xl overflow-hidden font-body">
          <SheetHeader className="p-10 bg-primary text-white">
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
              <UserCircle className="h-10 w-10" /> Identity Profile
            </SheetTitle>
          </SheetHeader>
          <div className="p-10 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Full Legal Identity</Label>
                <Input value={editingPatron?.name || ''} onChange={(e) => setEditingPatron({ ...editingPatron, name: e.target.value.toUpperCase() })} className="h-14 font-black uppercase border-slate-200 rounded-2xl text-base shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">School Registry ID (24-12345-123)</Label>
                <Input value={editingPatron?.schoolId || ''} onChange={(e) => setEditingPatron({ ...editingPatron, schoolId: e.target.value })} className="h-14 font-bold border-slate-200 rounded-2xl text-base shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Institutional Unit</Label>
                <Select value={editingPatron?.departments?.[0] || ''} onValueChange={(v) => setEditingPatron({ ...editingPatron, departments: [v] })}>
                  <SelectTrigger className="h-14 font-bold border-slate-200 rounded-2xl text-base shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Registry Role</Label>
                <Select value={editingPatron?.role || 'Student'} onValueChange={(v) => setEditingPatron({ ...editingPatron, role: v })}>
                  <SelectTrigger className="h-14 font-bold border-slate-200 rounded-2xl text-base shadow-sm"><SelectValue /></SelectTrigger>
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
          <SheetFooter className="p-10 bg-slate-50 border-t gap-4">
            <Button variant="ghost" onClick={() => setIsEditSheetOpen(false)} className="h-14 font-black uppercase text-[10px] tracking-widest flex-1 border-slate-200 rounded-2xl">Cancel</Button>
            <Button onClick={handleSaveChanges} className="h-14 font-black uppercase text-[10px] tracking-widest bg-primary px-10 flex-1 rounded-2xl shadow-xl shadow-primary/20">Commit Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-[3.5rem] overflow-hidden sm:max-w-md">
          <DialogHeader className="p-12 bg-red-600 text-white text-center">
            <div className="mx-auto bg-white/20 p-5 rounded-full w-fit mb-6">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white">Permanently Erase?</DialogTitle>
          </DialogHeader>
          <div className="p-12 text-center space-y-6">
            <p className="text-base font-bold text-slate-600">This action will permanently erase the identity record for <span className="text-red-600 font-black">{patronToDelete?.name}</span>.</p>
            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest leading-relaxed">System history will be invalidated. This cannot be undone.</p>
          </div>
          <DialogFooter className="p-10 bg-slate-50 border-t grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="h-14 font-black uppercase text-[10px] tracking-widest border-slate-200 rounded-2xl">Abort</Button>
            <Button onClick={handleDeletePatron} className="h-14 font-black uppercase text-[10px] tracking-widest bg-red-600 text-white hover:bg-red-700 rounded-2xl shadow-xl shadow-red-100">Confirm Deletion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
