
"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LogOut, ShieldCheck, LayoutDashboard, Users, FileBarChart, Settings, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboardLayout(props: { children: React.ReactNode; params: Promise<any> }) {
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const tickerQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(10));
  }, [db]);
  const { data: tickerVisits } = useCollection(tickerQuery);

  const navItems = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Analytics & Reports", href: "/admin/reports", icon: FileBarChart },
    { title: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 font-body">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-200 shadow-xl">
          <SidebarHeader className="p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
              <div className="p-2 bg-primary rounded-lg shadow-sm">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-black text-primary text-lg tracking-tighter uppercase leading-none">PatronPoint</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 leading-none">Command Center</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-6 bg-white">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className={cn(
                          "h-11 rounded-xl transition-all duration-200",
                          pathname === item.href ? "bg-primary text-white shadow-lg" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-white" : "text-primary")} />
                          <span className="font-bold text-[10px] uppercase tracking-widest">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-100 bg-white">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-10 rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">LOGOUT</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#F8FAFC]">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-white px-8 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 hover:bg-slate-100 rounded-lg text-primary" />
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <h2 className="text-[10px] font-black text-slate-900 tracking-[0.3em] uppercase font-headline">
                {navItems.find(i => i.href === pathname)?.title || 'Admin Terminal'}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[9px] font-black text-slate-900 leading-none uppercase tracking-tighter">SECURE NODE</p>
                <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">jcesperanza@neu.edu.ph</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/10 ring-2 ring-primary/5">
                <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">AD</AvatarFallback>
              </Avatar>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {props.children}
          </main>

          <footer className="h-8 bg-primary flex items-center overflow-hidden shrink-0 no-print">
            <div className="flex animate-marquee whitespace-nowrap gap-12 px-6 items-center">
              <span className="text-[8px] font-black text-accent uppercase tracking-widest border-r border-white/20 pr-12 h-3 flex items-center">LIVE IDENTITY FEED:</span>
              {tickerVisits?.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-white uppercase tracking-tight">
                    {v.patronName}
                  </span>
                  <span className="text-[8px] font-medium text-white/40 font-mono">[{v.schoolId || 'SSO'}]</span>
                  <span className="text-[8px] font-black text-accent uppercase tracking-tighter">({v.purpose})</span>
                  <span className="text-white/20">|</span>
                </div>
              ))}
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
