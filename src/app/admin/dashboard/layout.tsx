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
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Access Management', href: '/admin/users' },
    { label: 'Analytics & Reports', href: '/admin/reports' },
    { label: 'System Settings', href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar variant="inset" collapsible="icon" className="border-r-0">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-headline font-black text-primary text-xl tracking-tighter">PatronPoint</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Enterprise Suite</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={`h-12 rounded-xl transition-all duration-200 ${
                      pathname === item.href 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white' 
                      : 'hover:bg-slate-100'
                    }`}
                  >
                    <Link href={item.href}>
                      <span className="font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12 rounded-xl transition-colors"
                >
                  <span className="font-bold">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-slate-50/50">
          <header className="flex h-20 shrink-0 items-center justify-between gap-2 border-b bg-white/80 backdrop-blur-md px-8 sticky top-0 z-50">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="h-10 w-10 hover:bg-slate-100 rounded-xl" />
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {menuItems.find(item => pathname === item.href)?.label || 'Admin Control'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="relative text-slate-400 hover:text-primary rounded-xl hover:bg-primary/5 transition-colors font-bold uppercase text-[10px] tracking-widest">
                  Alerts
                  <span className="ml-2 h-2 w-2 bg-red-500 rounded-full" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary rounded-xl hover:bg-primary/5 transition-colors font-bold uppercase text-[10px] tracking-widest">
                  Secure
                </Button>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-4 pl-2">
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-sm font-black text-slate-900 leading-none">Admin Staff</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Systems Manager</p>
                </div>
                <Avatar className="h-11 w-11 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src="https://picsum.photos/seed/admin/150/150" />
                  <AvatarFallback className="bg-primary/5 text-primary font-black">AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          
          <main className="p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}