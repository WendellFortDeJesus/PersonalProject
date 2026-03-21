
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Search, 
  Trash2, 
  Edit3, 
  UserCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldX, 
  UserPlus, 
  Filter,
  CalendarDays,
  Fingerprint,
  PenTool,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { DEPARTMENTS } from '@/lib/data';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatron, setEditingPatron] = useState<any>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patronToDelete, setPatronToDelete] = useState<any>(null);
  const [adminSignature, setAdminSignature] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const db = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const patronsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'patrons'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: patrons, isLoading } = useCollection(patronsQuery);

  const filteredPatrons = useMemo(() => {
    if (!patrons) return [];
    return patrons.filter(p => {
      const matchesSearch = (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.schoolId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = selectedDept === 'all' || p.departments?.includes(selectedDept);
      const matchesRole = selectedRole === 'all' || p.role === selectedRole;
      return matchesSearch && matchesDept && matchesRole;
    });
  }, [patrons, searchTerm, selectedDept, selectedRole]);

  const handleSaveChanges = async () => {
    if (!db || !editingPatron) return;
    setIsSaving(true);
    
    const patronRef = doc(db, 'patrons', editingPatron.id);
    const { id, ...updateData } = editingPatron;
    updateData.updatedAt = new Date().toISOString();
    
    try {
      const batch = writeBatch(db);
      batch.update(patronRef, updateData);
      
      // SYNC VISIT LOGS WITH PROFILE CHANGES
      const visitsQuery = query(collection(db, 'visits'), where('patronId', '==', editingPatron.id));
      const visitsSnap = await getDocs(visitsQuery);
      
      visitsSnap.docs.forEach((visitDoc) => {
        batch.update(visitDoc.ref, {
          patronName: updateData.name,
          patronDepartments: updateData.departments,
          patronRole: updateData.role,
          patronAge: updateData.age,
          schoolId: updateData.schoolId
        });
      });
      
      await batch.commit();
      setIsEditSheetOpen(false);
      setIsSaving(false);
      toast({ 
        title: "Registry & Reports Synchronized", 
        description: "Profile changes have been propagated across all institutional nodes." 
      });
    } catch (error) {
      setIsSaving(false);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: patronRef.path,
        operation: 'update',
        requestResourceData: updateData,
      }));
    }
  };

  const toggleBlockStatus = async (patron: any) => {
    if (!db) return;
    const patronRef = doc(db, 'patrons', patron.id);
    const newStatus = !patron.isBlocked;
    
    updateDoc(patronRef, { isBlocked: newStatus })
      .then(() => {
        toast({ 
          title: newStatus ? "Identity Blocked" : "Identity Restored", 
          description: `${patron.name} status has been updated in the registry.` 
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
    if (!db || !patronToDelete || !adminSignature.trim()) return;
    setIsDeleting(true);
    
    const patronRef = doc(db, 'patrons', patronToDelete.id);
    const visitsQuery = query(collection(db, 'visits'), where('patronId', '==', patronToDelete.id));

    try {
      const visitsSnap = await getDocs(visitsQuery);
      const batch = writeBatch(db);
      
      // BI-DIRECTIONAL CASCADE PURGE
      batch.delete(patronRef);
      visitsSnap.docs.forEach(docSnap => batch.delete(docSnap.ref));
      
      await batch.commit();
      setIsDeleteDialogOpen(false);
      setAdminSignature('');
      toast({ 
        title: "Linked Registry Purged", 
        description: `Identity and all associated activity logs erased by ${adminSignature}.` 
      });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: patronRef.path,
        operation: 'delete'
      }));
    } finally {
      setIsDeleting(false);
      setPatronToDelete(null);
    }
  };

  const availableRoles = settings?.roles || ['Student', 'Visitor'];
  const allPossibleRoles = Array.from(new Set(['Admin', ...availableRoles]));

  if (isLoading) return (
    <div className="p-32 text-center h-[80vh] flex flex-col items-center justify-center bg-slate-50/50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Fingerprint className="h-6 w-6 text-primary/40" />
        </div>
      </div>
      <p className="font-headline font-black text-primary uppercase tracking-[0.4em] text-[10px] animate-pulse">Establishing Identity Sync...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in font-body bg-slate-50/30">
      <header className="p-8 border-b bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0 shadow-sm sticky top-0 z-30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-primary/20">
              <UserCircle className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline leading-none">Identity Registry</h1>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Visitor Access Control</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search ID, Name, or Email..." 
              className="h-10 pl-10 rounded-xl border-slate-200 text-xs font-bold bg-slate-50 focus-visible:ring-primary shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none z-10" />
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-10 pl-10 rounded-xl bg-slate-50 border-slate-200 text-[10px] font-black uppercase tracking-widest">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Units</SelectItem>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d} className="text-[10px] font-bold uppercase">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 md:w-40">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-[10px] font-black uppercase tracking-widest">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Roles</SelectItem>
                  {allPossibleRoles.map(role => (
                    <SelectItem key={role} value={role} className="text-[10px] font-bold uppercase">{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8 pt-6">
        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="pl-8 h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Visitor Profile</TableHead>
                <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Institutional Unit</TableHead>
                <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-center">Status</TableHead>
                <TableHead className="h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 text-center">Joined Date</TableHead>
                <TableHead className="pr-8 text-right h-12 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Node Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron) => (
                <TableRow key={patron.id} className={cn(
                  "border-slate-50 transition-all hover:bg-slate-50/80 group",
                  patron.isBlocked && "bg-red-50/30 hover:bg-red-50/50"
                )}>
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-105 shadow-sm",
                        patron.isBlocked ? "bg-red-100 border-red-200 text-red-600" : "bg-primary/5 border-primary/10 text-primary"
                      )}>
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-black tracking-tight uppercase text-primary leading-tight">{patron.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{patron.schoolId}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-200" />
                          <span className="text-[9px] font-mono font-bold text-slate-400">{patron.email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                        {patron.departments?.[0] || 'Unit Unassigned'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{patron.role || 'Visitor'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button 
                      onClick={() => toggleBlockStatus(patron)}
                      className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm ring-1 ring-inset",
                        patron.isBlocked 
                          ? "bg-red-500 text-white ring-red-600/20" 
                          : "bg-green-50 text-green-700 ring-green-600/20"
                      )}
                    >
                      {patron.isBlocked ? (
                        <span className="flex items-center gap-2">
                          <ShieldX className="h-3 w-3" /> Restricted
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <CalendarDays className="h-3 w-3 text-slate-300 mb-1" />
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        {patron.createdAt ? format(new Date(patron.createdAt), 'MM/dd/yy') : '---'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-primary/5 rounded-lg transition-colors text-slate-400 hover:text-primary" 
                        onClick={() => { setEditingPatron(patron); setIsEditSheetOpen(true); }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" 
                        onClick={() => { setPatronToDelete(patron); setIsDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatrons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center bg-slate-50/20">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <UserPlus className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        No institutional identities match criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-lg p-0 border-none shadow-2xl overflow-hidden font-body flex flex-col">
          <SheetHeader className="p-10 bg-primary text-white shrink-0 relative">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-4 relative z-10">
              <UserCircle className="h-10 w-10 text-accent" /> Identity Profile
            </SheetTitle>
            <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] mt-2 relative z-10">Registry Modification Protocol</p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Full Legal Identity</Label>
                  <Input 
                    value={editingPatron?.name || ''} 
                    onChange={(e) => setEditingPatron({ ...editingPatron, name: e.target.value.toUpperCase() })} 
                    className="h-12 font-black uppercase border-none bg-white rounded-xl text-sm shadow-sm focus:ring-1 focus:ring-primary/20" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Registry ID</Label>
                    <Input value={editingPatron?.schoolId || ''} onChange={(e) => setEditingPatron({ ...editingPatron, schoolId: e.target.value })} className="h-12 font-bold border-none bg-white rounded-xl text-sm shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Age Index</Label>
                    <Input type="number" value={editingPatron?.age || ''} onChange={(e) => setEditingPatron({ ...editingPatron, age: Number(e.target.value) })} className="h-12 font-bold border-none bg-white rounded-xl text-sm shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Verified SSO Node</Label>
                  <Input value={editingPatron?.email || ''} onChange={(e) => setEditingPatron({ ...editingPatron, email: e.target.value })} className="h-12 font-bold border-none bg-white rounded-xl text-sm shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Institutional Role</Label>
                  <Select value={editingPatron?.role || 'Student'} onValueChange={(v) => setEditingPatron({ ...editingPatron, role: v })}>
                    <SelectTrigger className="h-12 font-bold border-none bg-white rounded-xl text-sm shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allPossibleRoles.map(role => (
                        <SelectItem key={role} value={role} className="text-xs font-bold uppercase">{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Academic Unit</Label>
                <Select value={editingPatron?.departments?.[0] || ''} onValueChange={(v) => setEditingPatron({ ...editingPatron, departments: [v] })}>
                  <SelectTrigger className="h-12 font-bold border-none bg-white rounded-xl text-sm shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="text-[10px] font-bold uppercase">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className={cn(
                "space-y-4 p-6 rounded-[2rem] border transition-all",
                editingPatron?.isBlocked ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Restrict Terminal Access</Label>
                  <Badge 
                    onClick={() => setEditingPatron({ ...editingPatron, isBlocked: !editingPatron.isBlocked })}
                    className={cn(
                      "cursor-pointer uppercase text-[8px] font-black tracking-widest px-4",
                      editingPatron?.isBlocked ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    )}
                  >
                    {editingPatron?.isBlocked ? 'Blocked' : 'Active'}
                  </Badge>
                </div>
                {editingPatron?.isBlocked && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="text-[9px] font-black uppercase text-red-400 tracking-[0.2em] ml-2">Restriction Log Reason</Label>
                    <Textarea 
                      placeholder="Specify institutional reason for restriction..."
                      value={editingPatron?.blockReason || ''}
                      onChange={(e) => setEditingPatron({ ...editingPatron, blockReason: e.target.value })}
                      className="min-h-[100px] border-none bg-white rounded-xl text-xs font-bold shadow-sm focus:ring-red-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <SheetFooter className="p-10 bg-slate-50 border-t gap-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsEditSheetOpen(false)} className="h-14 font-black uppercase text-[10px] tracking-widest flex-1 border-slate-200 rounded-2xl bg-white">Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving} className="h-14 font-black uppercase text-[10px] tracking-widest bg-primary text-white px-10 flex-1 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="p-0 border-none shadow-2xl rounded-[3.5rem] overflow-hidden sm:max-w-md bg-white">
          <DialogHeader className="p-12 bg-red-600 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Trash2 className="h-32 w-32" />
            </div>
            <div className="mx-auto bg-white/20 p-5 rounded-[1.5rem] w-fit mb-6 relative z-10">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-white relative z-10 leading-none">Registry Purge</DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Are you absolutely sure?</p>
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">{patronToDelete?.name}</h3>
              <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-2">!! THIS WILL ALSO ERASE ALL ASSOCIATED VISIT LOGS !!</p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-red-500 mb-2">
                <PenTool className="h-4 w-4" />
                <Label className="text-[10px] font-black uppercase tracking-widest">Administrative Signature Required</Label>
              </div>
              <Input 
                placeholder="Admin Name / Staff ID" 
                value={adminSignature}
                onChange={(e) => setAdminSignature(e.target.value)}
                className="h-12 rounded-xl border-slate-200 font-bold text-center text-sm shadow-inner"
              />
            </div>
          </div>
          <DialogFooter className="p-10 bg-slate-50 border-t grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setAdminSignature(''); }} className="h-14 font-black uppercase text-[10px] tracking-widest border-slate-200 rounded-2xl bg-white shadow-sm">Abort</Button>
            <Button 
              onClick={handleDeletePatron} 
              disabled={!adminSignature.trim() || isDeleting}
              className={cn(
                "h-14 font-black uppercase text-[10px] tracking-widest text-white rounded-2xl shadow-xl transition-all active:scale-[0.98]",
                adminSignature.trim() && !isDeleting ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-slate-300 cursor-not-allowed"
              )}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Erase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
