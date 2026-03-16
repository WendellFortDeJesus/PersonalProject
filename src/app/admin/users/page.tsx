
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
  DialogTitle,
  DialogDescription
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
import { Switch } from '@/components/ui/switch';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { ShieldAlert, Trash2, Edit3, Search, Filter, AlertTriangle, UserCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/data';

export default function UserManagementPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patronToDelete, setPatronToDelete] = useState<any>(null);
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
      toast({ title: "Permanently Erased", description: "User record has been removed from the institutional registry." });
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
    <div className="flex flex-col h-full animate-fade-in font-body">
      <header className="p-8 border-b bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline">User Management</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Density Identity Control</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Name or ID..." 
              className="h-10 pl-10 rounded-xl border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-10 w-full md:w-60 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
              <SelectValue placeholder="All Academic Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Academic Units</SelectItem>
              {DEPARTMENTS.map(d => (
                <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-white">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-slate-50/50 sticky top-0 z-20 border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-10 h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[25%]">Name & Registry ID</TableHead>
              <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[10%] text-center">Age</TableHead>
              <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[20%]">Department / College</TableHead>
              <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[20%]">Registry Contact</TableHead>
              <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[10%] text-center">Status</TableHead>
              <TableHead className="h-12 pr-10 text-right font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 w-[15%]">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatrons?.map((patron) => (
              <TableRow 
                key={patron.id} 
                className={cn(
                  "group transition-colors h-14 border-slate-50",
                  patron.isBlocked ? "bg-red-50/30" : "hover:bg-slate-50/80"
                )}
              >
                <TableCell className="pl-10 py-1">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", patron.isBlocked ? "bg-red-500" : "bg-green-500")} />
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[11px] font-black tracking-tight uppercase truncate max-w-[200px]", 
                        patron.isBlocked ? "text-red-700" : "text-slate-900"
                      )}>
                        {patron.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                        ID: {patron.schoolId || 'UNREGISTERED'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center py-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{patron.age || 'N/A'}</span>
                </TableCell>
                <TableCell className="py-1">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-100 text-slate-500 bg-slate-50/50 truncate block max-w-[180px]">
                    {patron.departments?.[0] || 'Unassigned'}
                  </span>
                </TableCell>
                <TableCell className="py-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 truncate block max-w-[180px]">
                    {patron.email}
                  </span>
                </TableCell>
                <TableCell className="text-center py-1">
                   <Badge 
                    onClick={() => toggleBlockStatus(patron)}
                    className={cn(
                      "cursor-pointer px-3 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest transition-all",
                      patron.isBlocked ? "bg-red-600 text-white" : "bg-green-100 text-green-700 border-green-200"
                    )}
                  >
                    {patron.isBlocked ? 'Blocked' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-10 py-1">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 border-slate-200 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                      onClick={() => { setEditingPatron(patron); setIsEditSheetOpen(true); }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={() => { setPatronToDelete(patron); setIsDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredPatrons.length === 0 && (
          <div className="p-32 text-center space-y-4">
            <Search className="h-12 w-12 text-slate-100 mx-auto" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No user records found matching your search</p>
          </div>
        )}
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-md p-0 border-none shadow-2xl overflow-hidden font-body">
          <SheetHeader className="p-10 bg-primary text-white">
            <SheetTitle className="text-2xl font-black uppercase tracking-tighter font-headline flex items-center gap-3 text-white">
              <UserCircle className="h-6 w-6" /> Profile Registry
            </SheetTitle>
          </SheetHeader>
          <div className="p-10 space-y-8 h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Legal Identity</Label>
                <Input 
                  value={editingPatron?.name || ''} 
                  onChange={(e) => setEditingPatron({ ...editingPatron, name: e.target.value.toUpperCase() })}
                  className="h-12 rounded-xl font-bold uppercase bg-slate-50 border-slate-100" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Institutional Role</Label>
                <Select 
                  value={editingPatron?.role || 'Student'} 
                  onValueChange={(v) => setEditingPatron({ ...editingPatron, role: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Academic Unit</Label>
                <Select 
                  value={editingPatron?.departments?.[0] || ''} 
                  onValueChange={(v) => setEditingPatron({ ...editingPatron, departments: [v] })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter className="p-8 bg-slate-50 gap-3 border-t">
            <Button variant="ghost" onClick={() => setIsEditSheetOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12 flex-1">Cancel</Button>
            <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg flex-1">Save Corrections</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden font-body">
          <DialogHeader className="p-10 bg-red-600 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter font-headline flex items-center gap-3 text-white">
              <AlertTriangle className="h-6 w-6" /> Institutional Audit
            </AlertTitle>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 space-y-3">
              <p className="text-sm font-bold text-red-900 leading-relaxed">
                You are about to permanently remove <span className="underline font-black">{patronToDelete?.name}</span> from the active institutional registry.
              </p>
              <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest leading-relaxed">
                Warning: This action will purge all historical identity markers for this user and cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 gap-3 border-t">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Cancel Action</Button>
            <Button onClick={handleDeletePatron} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-10 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg">Confirm Removal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
