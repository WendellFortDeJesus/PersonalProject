
"use client";

import { useState } from 'react';
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
  Search, 
  Edit3, 
  UserX, 
  UserCheck, 
  Loader2,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { DEPARTMENTS, GENDERS } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
          title: patron.isBlocked ? "Access Restored" : "User Blocked",
          description: `${patron.name} has been ${patron.isBlocked ? 'granted' : 'revoked'} library access.`,
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
        toast({
          title: "Profile Updated",
          description: `${editingPatron.name}'s details have been corrected.`,
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

  const isNewVisitor = (createdAt: string) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    return now.getTime() - createdDate.getTime() < 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Visitor Master Directory</h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage library profiles and access status</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by School ID or Name..." 
            className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-primary shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200">
          <Filter className="h-4 w-4" />
          Filter Options
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="pl-6 font-bold text-slate-700">VISITOR PROFILE</TableHead>
                <TableHead className="font-bold text-slate-700">DEPARTMENT / OFFICE</TableHead>
                <TableHead className="font-bold text-slate-700">DEMOGRAPHICS</TableHead>
                <TableHead className="font-bold text-slate-700">REGISTRATION DATE</TableHead>
                <TableHead className="text-right pr-6 font-bold text-slate-700">ACCESS CONTROL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrons?.map((patron) => (
                <TableRow key={patron.id} className="hover:bg-slate-50/30 transition-colors border-slate-50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://picsum.photos/seed/${patron.id}/100/100`} />
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {patron.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isNewVisitor(patron.createdAt) && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[8px] text-white font-bold items-center justify-center">NEW</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{patron.name}</span>
                          {patron.isBlocked && (
                            <Badge variant="destructive" className="h-4 text-[9px] px-1.5 font-bold uppercase tracking-widest">Blocked</Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{patron.schoolId}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {patron.departments?.map((dept: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-slate-600 font-bold">
                      {patron.age} Yrs • {patron.gender}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-400">
                      {patron.createdAt ? format(new Date(patron.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => {
                          setEditingPatron(patron);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${patron.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                        onClick={() => handleToggleBlock(patron)}
                      >
                        {patron.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {isLoading && (
            <div className="p-20 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-slate-400 font-bold">Fetching Patron Registry...</p>
            </div>
          )}

          {(!filteredPatrons || filteredPatrons.length === 0) && !isLoading && (
            <div className="p-20 text-center space-y-4">
              <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto border border-slate-100">
                <Search className="h-12 w-12 text-slate-200 mx-auto" />
              </div>
              <p className="text-slate-400 font-bold text-lg">No results found matching "{searchTerm}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl overflow-hidden p-0 gap-0 border-none">
          <DialogHeader className="p-8 bg-primary text-white">
            <DialogTitle className="text-2xl font-bold">Edit Visitor Profile</DialogTitle>
            <DialogDescription className="text-white/60 font-medium">
              Correct student data or academic information manually
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePatron}>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Full Legal Name</Label>
                  <Input 
                    value={editingPatron?.name || ''} 
                    onChange={(e) => setEditingPatron({...editingPatron, name: e.target.value})}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Age</Label>
                    <Input 
                      type="number"
                      value={editingPatron?.age || ''} 
                      onChange={(e) => setEditingPatron({...editingPatron, age: parseInt(e.target.value)})}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Gender</Label>
                    <Select 
                      value={editingPatron?.gender || ''} 
                      onValueChange={(val) => setEditingPatron({...editingPatron, gender: val})}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Primary College / Department</Label>
                  <Select 
                    value={editingPatron?.departments?.[0] || ''} 
                    onValueChange={(val) => setEditingPatron({...editingPatron, departments: [val]})}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50 flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="bg-primary rounded-xl px-8 shadow-lg font-bold">Apply System Correction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
