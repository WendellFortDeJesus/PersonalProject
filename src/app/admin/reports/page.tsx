
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  FileText,
  Printer,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: config } = useDoc(configRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user, isUserLoading]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits) return null;

    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    const authMap: Record<string, number> = {};
    
    rawVisits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
      const method = v.authMethod || (v.schoolId ? 'RF-ID Login' : 'SSO Login');
      authMap[method] = (authMap[method] || 0) + 1;
    });

    const deptData = Object.entries(deptMap).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    const intentData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const topAuth = Object.entries(authMap).sort((a, b) => b[1] - a[1])[0];

    return { 
      deptData,
      intentData,
      totalAllTime: rawVisits.length,
      recentVisits: rawVisits.slice(0, 50),
      topDept: deptData[0],
      topAuth: topAuth ? topAuth[0] : 'N/A'
    };
  }, [rawVisits]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="p-32 text-center bg-white h-screen">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="font-mono font-black text-primary uppercase tracking-[0.5em] text-[11px]">Compiling Visual Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-8 font-body min-h-screen no-print">
      <header className="flex justify-between items-end pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Visual Intelligence</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Cumulative Institutional Behavior</p>
        </div>
        
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-primary text-white hover:bg-primary/90 rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-lg">
              <FileText className="mr-3 h-4 w-4" />
              Preview Official Audit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl bg-white">
            <div id="printable-report" className="p-16 space-y-12 report-container bg-white">
              <header className="flex justify-between items-start border-b-2 border-slate-900 pb-10">
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-primary uppercase tracking-tighter font-headline leading-none">PatronPoint Strategic Audit</h2>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Institutional Record</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Generation Timestamp</p>
                  <p className="text-xs font-mono font-bold text-slate-900">{new Date().toISOString()}</p>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-16">
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Departmental Impact Matrix</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.deptData ?? []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                        <Bar dataKey="count" fill="#006837" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Visit Intent Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={analytics?.intentData ?? []} 
                          innerRadius={60} 
                          outerRadius={90} 
                          dataKey="value"
                          stroke="none"
                        >
                          {analytics?.intentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Verified Identity Registry</h3>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="border-b-2 border-slate-900 bg-slate-50">
                    <tr>
                      <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Student Identity & Detail</th>
                      <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Login Method</th>
                      <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Visit Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analytics?.recentVisits.map((v) => {
                      const isExternal = v.patronDepartments?.[0]?.toUpperCase().includes('VISITOR');
                      const method = v.authMethod || (v.schoolId ? 'RF-ID Login' : 'SSO Login');
                      const detail = method === 'RF-ID Login' ? (v.schoolId || 'ID NOT READ') : (v.patronEmail || 'EMAIL NOT READ');
                      return (
                        <tr key={v.id}>
                          <td className={cn("px-4 py-3", isExternal && "bg-yellow-50/50")}>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 uppercase">{v.patronName}</span>
                              <span className="font-mono font-bold text-slate-400 mt-0.5">{detail}</span>
                            </div>
                          </td>
                          <td className={cn("px-4 py-3 uppercase text-slate-500 font-bold", isExternal && "bg-yellow-50/50")}>{method.toUpperCase()}</td>
                          <td className={cn("px-4 py-3 font-bold text-primary uppercase", isExternal && "bg-yellow-50/50")}>{v.purpose}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="pt-12 border-t flex justify-between items-center opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary rounded-lg" />
                  <p className="text-[9px] font-black uppercase tracking-widest">PatronPoint Systems Engine</p>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest font-mono">System Generated Verification</p>
              </footer>
            </div>
            <DialogFooter className="p-10 bg-slate-50 border-t gap-6">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Cancel</Button>
              <Button onClick={handlePrint} className="bg-accent text-accent-foreground rounded-xl px-12 font-black uppercase text-[10px] tracking-widest shadow-xl h-12">
                <Printer className="mr-3 h-4 w-4" />
                Download Official PDF Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total All-Time Engagement</h2>
            <p className="text-3xl font-mono font-bold text-slate-900 leading-none">{analytics?.totalAllTime ?? 0}</p>
          </div>
          <FileText className="h-8 w-8 text-primary/10" />
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between border-l-4 border-accent">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Entry Protocol</h2>
            <p className="text-xl font-headline font-black text-primary uppercase leading-none">{analytics?.topAuth || 'N/A'}</p>
            <p className="text-[9px] font-bold text-accent uppercase mt-2">Dominant Access Method</p>
          </div>
          <CreditCard className="h-6 w-6 text-accent" />
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between border-l-4 border-primary">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept Champion</h2>
            <p className="text-xl font-headline font-black text-primary uppercase truncate max-w-[200px] leading-none">{analytics?.topDept?.name || 'N/A'}</p>
            <p className="text-[9px] font-bold text-primary uppercase mt-2">Highest Unit Engagement</p>
          </div>
          <TrendingUp className="h-6 w-6 text-primary" />
        </Card>
      </div>

      {/* Dual Chart Grid - Visual Intelligence Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 bg-white border-none shadow-sm rounded-2xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Department Engagement</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Students per College</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary/40" />
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.deptData ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#006837" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 bg-white border-none shadow-sm rounded-2xl flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Visit Intent</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Behavioral Breakdown</p>
            </div>
            <PieIcon className="h-5 w-5 text-accent/40" />
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intent</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={analytics?.intentData ?? []} 
                  innerRadius={70} 
                  outerRadius={100} 
                  dataKey="value"
                  stroke="none"
                  paddingAngle={5}
                >
                  {analytics?.intentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Formal Report Preview Table */}
      <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-[10px] font-black text-primary uppercase tracking-widest font-headline">Cumulative Summary</h2>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">Institutional Snapshot</Badge>
        </div>
        <div className="overflow-auto max-h-[300px]">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest">Academic Unit</th>
                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-right">Engagement Count</th>
                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-right">Impact Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.deptData.map((dept, i) => {
                const isExternal = dept.name.toUpperCase().includes('VISITOR');
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-bold uppercase",
                        isExternal ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" : "text-slate-900"
                      )}>
                        {dept.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600 text-right">{dept.count}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary text-right">
                      {((dept.count / (analytics?.totalAllTime || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Export Module */}
      <Card className="p-10 bg-primary rounded-[3rem] border-none shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 mt-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-headline leading-none">Formal Strategic Snapshot</h2>
          <p className="text-[11px] font-black text-primary-foreground/60 uppercase tracking-widest">Generate high-density institutional records for university verification</p>
        </div>
        <Button onClick={() => setIsPreviewOpen(true)} className="h-16 px-12 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-transform active:scale-95">
          <FileText className="h-5 w-5 mr-4" />
          Download Official PDF Report
        </Button>
      </Card>
    </div>
  );
}
