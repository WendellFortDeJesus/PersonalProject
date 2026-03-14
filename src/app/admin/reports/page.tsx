
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
  FileDown,
  TrendingUp,
  Target
} from 'lucide-react';
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
    if (!db || !user || isUserLoading) return null;
    return query(collection(db, 'visits'), orderBy('timestamp', 'desc'));
  }, [db, user, isUserLoading]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !selectedDate) return null;

    const filteredVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), selectedDate));
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    let rfidCount = 0;
    let ssoCount = 0;
    
    filteredVisits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
      if (v.authMethod === 'School ID Login') rfidCount++;
      else ssoCount++;
    });

    const deptData = Object.entries(deptMap).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);

    const intentData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const topMethod = rfidCount >= ssoCount ? 'SCHOOL ID' : 'SSO LOGIN';

    return { 
      deptData,
      intentData,
      topMethod,
      totalToday: filteredVisits.length,
      dateStr: format(selectedDate, 'PPP'),
      filteredVisits: filteredVisits.slice(0, 50),
      topDept: deptData[0]
    };
  }, [rawVisits, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || isUserLoading || (user && isVisitsLoading)) return (
    <div className="p-32 text-center bg-white h-screen">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p className="font-mono font-black text-primary uppercase tracking-[0.5em] text-[11px]">Compiling Audit...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-8 font-body min-h-screen no-print">
      <header className="flex justify-between items-end pb-8 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Audit Terminal</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Institutional Engagement Snapshot</p>
        </div>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl font-black border-slate-200 text-[10px] px-8 uppercase tracking-widest bg-white shadow-sm">
                <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                {analytics?.dateStr ?? 'Select Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-primary text-white hover:bg-primary/90 rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-lg">
                <FileText className="mr-3 h-4 w-4" />
                Preview Strategic Audit
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
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">{analytics?.dateStr}</Badge>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Unit Engagement Intensity</h3>
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
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Facility Intent Matrix</h3>
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
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-b pb-2">Audit Identity Log</h3>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="border-b-2 border-slate-900 bg-slate-50">
                      <tr>
                        <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Registry Detail</th>
                        <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Student Identity</th>
                        <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Academic Unit</th>
                        <th className="px-4 py-4 font-black text-slate-900 uppercase tracking-widest">Visit Intent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analytics?.filteredVisits.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">{v.schoolId || v.patronEmail}</td>
                          <td className="px-4 py-3 font-black text-slate-900 uppercase">{v.patronName}</td>
                          <td className="px-4 py-3 uppercase text-slate-500 font-bold">{v.patronDepartments?.[0]}</td>
                          <td className="px-4 py-3 font-bold text-primary uppercase">{v.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className="pt-12 border-t flex justify-between items-center opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-lg" />
                    <p className="text-[9px] font-black uppercase tracking-widest">PatronPoint Systems Engine</p>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest font-mono">NEU Library Accreditation Standard</p>
                </footer>
              </div>
              <DialogFooter className="p-10 bg-slate-50 border-t gap-6">
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-12">Cancel</Button>
                <Button onClick={handlePrint} className="bg-accent text-accent-foreground rounded-xl px-12 font-black uppercase text-[10px] tracking-widest shadow-xl h-12">
                  <Printer className="mr-3 h-4 w-4" />
                  Print Formal PDF Audit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Bento Reports Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-white border-none shadow-sm rounded-2xl border-t-4 border-primary">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative Today</p>
          <h2 className="text-4xl font-mono font-black text-slate-900">{analytics?.totalToday ?? 0}</h2>
          <p className="text-[9px] font-bold text-primary uppercase mt-4">Verified Registry Entries</p>
        </Card>
        <Card className="p-8 bg-white border-none shadow-sm rounded-2xl border-t-4 border-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Entry Method</p>
          <h2 className="text-2xl font-headline font-black text-blue-600 uppercase tracking-tighter">{analytics?.topMethod ?? 'N/A'}</h2>
          <p className="text-[9px] font-bold text-blue-400 uppercase mt-4">System Engagement Mode</p>
        </Card>
        <Card className="p-8 bg-primary text-white border-none shadow-xl rounded-2xl">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Institutional Lead</p>
              <h2 className="text-xl font-black uppercase tracking-tighter">{analytics?.topDept?.name ?? 'N/A'}</h2>
              <p className="text-[9px] font-bold text-accent uppercase mt-2">Highest Unit Engagement</p>
            </div>
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
        </Card>
      </div>

      {/* Audit Data Grid */}
      <Card className="p-10 bg-primary rounded-[3rem] border-none shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 mt-12">
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-headline leading-none">Formal Strategic Snapshot</h2>
          <p className="text-[11px] font-black text-primary-foreground/60 uppercase tracking-widest">Export verified institutional documentation for university verification</p>
        </div>
        <Button onClick={() => setIsPreviewOpen(true)} className="h-16 px-12 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-transform active:scale-95">
          <FileDown className="h-5 w-5 mr-4" />
          Download PDF Strategic Report
        </Button>
      </Card>
    </div>
  );
}
