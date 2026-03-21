
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
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { ShieldCheck, LayoutDashboard, FileBarChart, LogOut, Users, Settings, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout(props: { children: React.ReactNode, params: Promise<any> }) {
  // Explicitly unwrap params to comply with Next.js 15 asynchronous request APIs
  use(props.params);
  const { children } = props;

  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  // Hide navigation on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const navItems = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Analytics & Reports", href: "/admin/reports", icon: FileBarChart },
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const currentTitle = navItems.find(i => i.href === pathname)?.title || 'Admin Terminal';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 font-body overflow-x-hidden">
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
                  
                  <div className="my-4 border-t border-slate-100" />
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className="h-11 rounded-xl transition-all duration-200 hover:bg-accent hover:text-accent-foreground text-slate-600"
                    >
                      <Link href="/" className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-primary" />
                        <span className="font-bold text-[10px] uppercase tracking-widest text-primary">Open Kiosk</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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

        <SidebarInset className="bg-[#F8FAFC] flex flex-col h-screen">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-white px-8 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 hover:bg-slate-100 rounded-lg text-primary" />
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <h2 className="text-[10px] font-black text-slate-900 tracking-[0.3em] uppercase font-headline">
                {currentTitle}
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
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
