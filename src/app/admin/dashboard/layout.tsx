
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const menuItems = [
    { label: 'Control Center', href: '/admin/dashboard' },
    { label: 'Master Registry', href: '/admin/users' },
    { label: 'Audit Suite', href: '/admin/reports' },
    { label: 'System Engine', href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-200">
          <SidebarHeader className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-headline font-black text-primary text-xl tracking-tighter">PatronPoint</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1 leading-none">Enterprise BI</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-6">
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={`h-11 rounded-xl transition-all duration-200 ${
                      pathname === item.href 
                      ? 'bg-primary text-white shadow-md hover:bg-primary/95 hover:text-white' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Link href={item.href}>
                      <span className="font-bold text-[11px] uppercase tracking-widest">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-slate-100">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-11 rounded-xl transition-colors"
                >
                  <span className="font-bold text-[10px] uppercase tracking-widest">Terminate Session</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-slate-50/30">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-white px-8 sticky top-0 z-50">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="h-9 w-9 hover:bg-slate-100 rounded-lg" />
              <div className="h-6 w-px bg-slate-200" />
              <h2 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase">
                {menuItems.find(item => pathname === item.href)?.label || 'System Control'}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-900 leading-none uppercase">Admin Operator</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">Systems Manager</p>
              </div>
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">AD</AvatarFallback>
              </Avatar>
            </div>
          </header>
          
          <main className="p-6 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
