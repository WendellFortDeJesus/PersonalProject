
"use client";

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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();
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

  // Live Ticker Data
  const tickerQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(5));
  }, [db]);
  const { data: tickerVisits } = useCollection(tickerQuery);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 font-body">
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-200">
          <SidebarHeader className="p-8 border-b border-slate-100 bg-white">
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-black text-primary text-xl tracking-tighter uppercase leading-none">PatronPoint</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1 leading-none">Terminal v2.0</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-8 bg-white">
            <SidebarMenu className="gap-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={`h-14 rounded-2xl transition-all duration-300 ${
                      pathname === item.href 
                      ? 'bg-primary text-white shadow-xl scale-[1.02]' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Link href={item.href}>
                      <span className="font-black text-[10px] uppercase tracking-[0.2em] ml-2">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-8 border-t border-slate-100 bg-white">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-12 rounded-xl transition-colors"
                >
                  <span className="font-black text-[10px] uppercase tracking-widest ml-2">Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#F8FAFC]">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-white px-8 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="h-10 w-10 hover:bg-slate-100 rounded-xl" />
              <div className="h-6 w-px bg-slate-200" />
              <h2 className="text-[11px] font-black text-slate-900 tracking-[0.4em] uppercase font-headline">
                {menuItems.find(item => pathname === item.href)?.label || 'System'}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-900 leading-none uppercase tracking-tighter">SECURE ACCESS</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">Institutional Admin</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/20 p-0.5">
                <AvatarImage src="https://picsum.photos/seed/admin/100/100" className="rounded-full" />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">AD</AvatarFallback>
              </Avatar>
            </div>
          </header>
          
          <main className="p-0 overflow-y-auto h-[calc(100vh-104px)]">
            {children}
          </main>

          <footer className="h-10 bg-primary flex items-center overflow-hidden shrink-0 shadow-inner">
            <div className="flex animate-marquee whitespace-nowrap gap-16 px-8 items-center">
              <span className="text-[9px] font-black text-accent uppercase tracking-[0.4em] border-r border-white/20 pr-16 h-4 flex items-center">Live Identity Ticker:</span>
              {tickerVisits?.map((v, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">{v.patronName}</span>
                  <span className="text-[9px] font-bold text-white/40 font-mono">[{v.authMethod === 'School ID Login' ? v.schoolId : 'SSO'}]</span>
                  <span className="text-[9px] font-black text-accent uppercase tracking-tighter">({v.patronDepartments?.[0]})</span>
                  <span className="text-white/20 mx-4">|</span>
                </div>
              ))}
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
