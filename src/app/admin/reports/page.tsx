
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
  Label
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { format, isSameDay } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  FileText,
  Printer,
  Activity,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
    if (!db || !user) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !selectedDate) return null;

    const filteredVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), selectedDate));
    
    const deptMap: Record<string, { count: number; purposes: Record<string, number> }> = {};
    const globalPurposeMap: Record<string, number> = {};
    
    filteredVisits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        if (!deptMap[name]) deptMap[name] = { count: 0, purposes: {} };
        deptMap[name].count++;
        deptMap[name].purposes[v.purpose || 'Other'] = (deptMap[name].purposes[v.purpose || 'Other'] || 0) + 1;
      });
      globalPurposeMap[v.purpose || 'Other'] = (globalPurposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const summaryData = Object.entries(deptMap).map(([name, data]) => ({
      name,
      code: config?.departments?.find((d: any) => d.name === name)?.code || name,
      count: data.count,
      topPurpose: Object.entries(data.purposes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    })).sort((a, b) => b.count - a.count);

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const count = filteredVisits.filter(v => new Date(v.timestamp).getHours() === hour).length;
      return { hour: `${hour}:00`, count };
    });

    const purposeData = Object.entries(globalPurposeMap).map(([name, value]) => ({ name, value }));

    return { 
      summaryData,
      hourlyData,
      purposeData,
      totalToday: filteredVisits.length,
      dateStr: format(selectedDate, 'PPP'),
      filteredVisits: filteredVisits.slice(0, 50),
      topDept: summaryData[0]
    };
  }, [rawVisits, selectedDate, config]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Synchronizing Behavioral Audit...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-8 font-body min-h-screen no-print">
      <header className="flex justify-between items-end pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Strategic Audit</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Institutional engagement & Behavior Analysis</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl font-black border-slate-200 text-[10px] px-6 uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50">
                <FileText className="mr-2 h-3.5 w-3.5" />
                Preview Strategic Audit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl bg-white">
              <div id="printable-report" className="p-12 space-y-10 report-container">
                <header className="flex justify-between items-start border-b border-slate-100 pb-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-primary uppercase tracking-tighter font-headline leading-none">PatronPoint Library System</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Institutional Record</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Snapshot Date</p>
                    <p className="text-sm font-black text-slate-900 uppercase font-headline">{analytics?.dateStr}</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hourly Peak Performance</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.hourlyData ?? []}>
                          <XAxis dataKey="hour" hide />
                          <YAxis hide />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Visit Intent Snapshot</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={analytics?.purposeData ?? []} 
                            innerRadius={50} 
                            outerRadius={70} 
                            dataKey="value"
                            stroke="none"
                          >
                            {analytics?.purposeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            <Label 
                              value="INTENT" 
                              position="center" 
                              className="text-[10px] font-black uppercase text-slate-400"
                            />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                   <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Strategic Unit Analysis</h3>
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Most Active Department</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{analytics?.topDept?.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[24px] font-mono font-bold text-primary">{analytics?.topDept?.count}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Registry Hits</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Identity Audit Log</h3>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="border-b bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-black text-slate-400 uppercase">School ID / Email</th>
                        <th className="px-4 py-3 font-black text-slate-400 uppercase">Identity</th>
                        <th className="px-4 py-3 font-black text-slate-400 uppercase">Academic Unit</th>
                        <th className="px-4 py-3 font-black text-slate-400 uppercase">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics?.filteredVisits.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-2 font-mono font-bold text-slate-500">{v.schoolId || v.patronEmail}</td>
                          <td className="px-4 py-2 font-black text-slate-900 uppercase">{v.patronName}</td>
                          <td className="px-4 py-2 uppercase text-slate-500">{v.patronDepartments?.[0]}</td>
                          <td className="px-4 py-2 font-bold text-slate-400 uppercase">{v.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className="pt-8 border-t flex justify-between items-center opacity-40">
                  <p className="text-[8px] font-bold uppercase tracking-widest">System Generated Strategic Audit</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest font-mono">{new Date().toISOString()}</p>
                </footer>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t gap-4">
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Close</Button>
                <Button onClick={handlePrint} className="bg-accent text-accent-foreground rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg">
                  <Printer className="mr-2 h-4 w-4" />
                  Download PDF Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl font-black border-slate-200 text-[10px] px-6 uppercase tracking-widest bg-white shadow-sm">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {analytics?.dateStr ?? 'Select Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 p-6 bg-white border-none rounded-2xl shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Peak Performance Map (24-Hour Pulse)</h2>
            <Activity className="h-4 w-4 text-slate-300" />
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.hourlyData ?? []}>
                <XAxis dataKey="hour" hide />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-12 bg-white border-none rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Departmental Engagement Summary</h2>
            <Badge variant="outline" className="h-6 text-[8px] font-black uppercase tracking-widest">High-Density Snapshot</Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Unit</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Code</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit Volume</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dominant Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics?.summaryData.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-black text-slate-900 uppercase text-xs font-body">{row.name}</td>
                    <td className="px-8 py-4 font-mono font-bold text-primary text-[10px] tracking-widest">{row.code}</td>
                    <td className="px-8 py-4 font-mono font-bold text-slate-900">{row.count}</td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{row.topPurpose}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-8 bg-primary rounded-[2rem] border-none shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-headline leading-none">Formal Strategic Record</h2>
          <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">Generate audit-ready documentation for institutional accreditation</p>
        </div>
        <Button onClick={() => setIsPreviewOpen(true)} className="h-12 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-transform active:scale-95">
          <Printer className="h-4 w-4 mr-3" />
          Generate Strategic Audit
        </Button>
      </Card>
    </div>
  );
}
