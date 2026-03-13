"use client";

import { useState } from 'react';
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
  Ban
} from 'lucide-react';
import { MOCK_PATRONS, Patron } from '@/lib/data';
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

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Patron[]>(MOCK_PATRONS);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'active' ? 'blocked' : 'active';
        toast({
          title: newStatus === 'active' ? "Access Restored" : "User Blocked",
          description: `${u.name}'s library privileges have been ${newStatus === 'active' ? 'reactivated' : 'revoked'}.`,
          variant: newStatus === 'active' ? 'default' : 'destructive',
        });
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rfid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Access Control</h1>
          <p className="text-muted-foreground">Manage patron statuses and global blocklist</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl shadow-lg">
          <UserPlus className="h-4 w-4" />
          Register Patron
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b border-slate-50 pb-6 pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Name, RFID, or University ID..." 
                className="pl-12 border-slate-100 rounded-xl h-11 bg-slate-50/50 focus-visible:ring-primary shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl border-slate-200">
                <Filter className="h-4 w-4" />
                Filter Roles
              </Button>
              <Badge variant="outline" className="h-11 px-4 border-slate-100 text-slate-500 font-bold">
                {users.filter(u => u.status === 'blocked').length} Blocked Users
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="w-[300px] pl-6 font-bold text-slate-700">PATRON IDENTITY</TableHead>
                <TableHead className="font-bold text-slate-700">COLLEGE DEPARTMENTS</TableHead>
                <TableHead className="font-bold text-slate-700">RFID SCANNER ID</TableHead>
                <TableHead className="font-bold text-slate-700">ACCESS STATUS</TableHead>
                <TableHead className="text-right pr-6 font-bold text-slate-700">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://picsum.photos/seed/${user.id}/150/150`} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{user.name}</span>
                        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{user.role}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.departments.map((dept, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] whitespace-nowrap">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-mono shadow-sm">
                      {user.rfid || 'UNASSIGNED'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'active' 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {user.status === 'active' ? (
                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                      ) : (
                        <Ban className="w-3 h-3 mr-1.5" />
                      )}
                      {user.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                        <DropdownMenuLabel className="text-xs font-bold text-slate-400">PATRON MANAGEMENT</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-lg cursor-pointer py-2">View Visit Logs</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer py-2">Edit Credentials</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100 my-1" />
                        <DropdownMenuItem 
                          onClick={() => toggleStatus(user.id)}
                          className={`rounded-lg cursor-pointer py-2 font-bold ${
                            user.status === 'active' ? 'text-destructive' : 'text-green-600'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <><UserX className="h-4 w-4 mr-2" /> Block Privileges</>
                          ) : (
                            <><UserCheck className="h-4 w-4 mr-2" /> Revoke Block</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-400">No results match your query</p>
              <p className="text-sm text-slate-400">Check for spelling or try a different ID</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
