
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
  Label,
  BarChart3
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
import { format, isSameDay, startOfWeek, addDays } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Users, 
  ShieldCheck, 
  FileText,
  Printer,
  ChevronRight,
  Activity,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const db = useFirestore();
  const { user } = useUser();

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

  const patronsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'patrons'));
  }, [db, user]);

  const { data: rawVisits, isLoading: isVisitsLoading } = useCollection(visitsQuery);
  const { data: rawPatrons, isLoading: isPatronsLoading } = useCollection(patronsQuery);

  const analytics = useMemo(() => {
    if (!rawVisits || !selectedDate || !rawPatrons) return null;

    const filteredVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), selectedDate));
    
    const deptMap: Record<string, number> = {};
    const purposeMap: Record<string, number> = {};
    
    filteredVisits.forEach(v => {
      v.patronDepartments?.forEach((name: string) => {
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      purposeMap[v.purpose || 'Other'] = (purposeMap[v.purpose || 'Other'] || 0) + 1;
    });

    const deptRankingData = Object.entries(deptMap)
      .map(([name, count]) => ({ 
        name: config?.departments?.find((d: any) => d.name === name)?.code || name,
        fullName: name,
        count,
        color: config?.departments?.find((d: any) => d.name === name)?.color || '#006837'
      }))
      .sort((a, b) => b.count - a.count);

    const purposeData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));
    const mostEngagedDept = deptRankingData[0];
    const totalTodayHits = filteredVisits.length;
    const trafficShare = totalTodayHits > 0 && mostEngagedDept ? Math.round((mostEngagedDept.count / totalTodayHits) * 100) : 0;

    // Hourly Breakdown for the selected day
    const hourlyData = Array.from({ length: 13 }, (_, i) => {
      const hour = i + 8; // 8 AM to 8 PM
      const count = filteredVisits.filter(v => new Date(v.timestamp).getHours() === hour).length;
      return { hour: `${hour}:00`, count };
    });

    // Weekly Matrix Mockup (Logic: visits by day and time slot)
    const weekStart = startOfWeek(selectedDate);
    const matrixData = Array.from({ length: 7 }, (_, dayIdx) => {
      const currentDay = addDays(weekStart, dayIdx);
      const dayVisits = rawVisits.filter(v => isSameDay(new Date(v.timestamp), currentDay));
      
      const slots = [
        { label: 'Morning', start: 8, end: 11 },
        { label: 'Midday', start: 12, end: 14 },
        { label: 'Afternoon', start: 15, end: 17 },
        { label: 'Evening', start: 18, end: 20 },
      ];

      return {
        day: format(currentDay, 'EEEE'),
        slots: slots.map(slot => ({
          label: slot.label,
          count: dayVisits.filter(v => {
            const h = new Date(v.timestamp).getHours();
            return h >= slot.start && h <= slot.end;
          }).length
        }))
      };
    });

    return { 
      deptRankingData, 
      purposeData, 
      activePresence: filteredVisits.filter(v => v.status === 'granted').length,
      mostEngagedDept,
      trafficShare,
      registrySize: rawPatrons.length,
      totalToday: totalTodayHits,
      filteredVisits,
      hourlyData,
      matrixData,
      dateStr: format(selectedDate, 'PPP')
    };
  }, [rawVisits, rawPatrons, selectedDate, config]);

  const handleDownloadCSV = () => {
    if (!analytics?.filteredVisits || analytics.filteredVisits.length === 0) return;

    const headers = ["Timestamp", "Patron Name", "School ID", "Department", "Purpose", "Status"];
    const rows = analytics.filteredVisits.map(v => [
      format(new Date(v.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      `"${v.patronName?.replace(/"/g, '""') || ''}"`,
      v.schoolId || v.patronEmail || '',
      `"${v.patronDepartments?.join(', ') || ''}"`,
      `"${v.purpose || ''}"`,
      v.status || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NEU_Library_Audit_${format(selectedDate!, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isVisitsLoading || isPatronsLoading || !mounted) return (
    <div className="p-32 text-center">
      <p className="font-mono font-black text-primary/40 uppercase tracking-[0.5em] text-[11px] animate-pulse">Compiling Institutional Intelligence...</p>
    </div>
  );

  const CHART_COLORS = ['#006837', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

  return (
    <div className="space-y-6 animate-fade-in fluid-container bg-[#F8FAFC] p-8 font-body min-h-screen no-print">
      <header className="flex justify-between items-end pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none font-headline">Institutional Audit</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Strategic Performance & Human Behavior</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl font-black border-slate-200 text-[10px] px-6 uppercase tracking-widest bg-white shadow-sm">
                <FileText className="mr-2 h-3.5 w-3.5" />
                Preview Strategic Audit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[2.5rem] border-none shadow-2xl bg-white">
              <div className="p-12 space-y-12 report-container">
                <header className="flex justify-between items-start border-b border-slate-100 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xs">PP</div>
                      <h2 className="text-2xl font-black text-primary uppercase tracking-tighter font-headline leading-none">PatronPoint</h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Verification Record</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Generation Date</p>
                    <p className="text-sm font-black text-slate-900 uppercase font-headline">{analytics?.dateStr}</p>
                  </div>
                </header>

                <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Visitors Today</p>
                    <h3 className="text-4xl font-mono font-bold text-slate-900">{analytics?.totalToday}</h3>
                  </div>
                  <div className="col-span-2 space-y-1 border-l border-slate-100 pl-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Most Engaged Department (Unit Lead)</p>
                    <h3 className="text-xl font-black text-primary uppercase leading-tight font-headline">{analytics?.mostEngagedDept?.fullName || 'N/A'}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{analytics?.mostEngagedDept?.count} Hits / {analytics?.trafficShare}% Share</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 py-8 border-y border-slate-100">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Resource Demand (Visit Intent)</h4>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics?.purposeData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {analytics?.purposeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                            <Label value="INTENT" position="center" style={{ fontSize: '10px', fontWeight: '900', fill: '#0F172A', textTransform: 'uppercase' }} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hourly Engagement Matrix</h4>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.hourlyData}>
                          <XAxis dataKey="hour" hide />
                          <YAxis hide />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Identity Audit Log</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-white border-b border-slate-100">
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Time</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                          <th className="px-6 py-4 font-black uppercase tracking-widest text-slate-400">Department</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics?.filteredVisits.slice(0, 15).map((v) => (
                          <tr key={v.id}>
                            <td className="px-6 py-3 font-mono text-slate-500 font-bold">{format(new Date(v.timestamp), 'HH:mm')}</td>
                            <td className="px-6 py-3 font-black text-slate-900 uppercase tracking-tight font-headline">{v.patronName}</td>
                            <td className="px-6 py-3 uppercase text-slate-500 font-bold">{v.patronDepartments?.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t flex gap-4">
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest">Close Preview</Button>
                <Button onClick={handlePrint} className="bg-primary text-white rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Formal Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl font-black border-slate-200 text-[10px] px-6 uppercase tracking-widest bg-white shadow-sm">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {analytics?.dateStr}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Presence</p>
            <Users className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-mono font-bold text-slate-900 leading-none">{analytics?.activePresence}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Currently Inside</p>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm col-span-1 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck className="h-24 w-24" />
          </div>
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Most Engaged Department (Unit Lead)</p>
            <ShieldCheck className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-black text-primary uppercase leading-tight font-headline truncate">{analytics?.mostEngagedDept?.fullName || 'N/A'}</h3>
            <div className="flex gap-6 mt-3">
              <div className="space-y-1">
                <p className="text-[11px] font-mono font-bold text-slate-900">{analytics?.mostEngagedDept?.count || 0}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Registry Hits</p>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-6">
                <p className="text-[11px] font-mono font-bold text-slate-900">{analytics?.trafficShare}%</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Traffic Share</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-none rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Registered</p>
            <UserCheck className="h-4 w-4 text-primary/30" />
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-mono font-bold text-slate-900 leading-none">{analytics?.registrySize}</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mt-2">Institutional Identities</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border-none rounded-2xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Hourly Engagement Matrix</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">12-Hour Operational Pulse (8AM - 8PM)</p>
            </div>
            <Activity className="h-4 w-4 text-slate-300" />
          </div>
          <div className="p-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.hourlyData}>
                <XAxis dataKey="hour" fontSize={9} fontWeight={900} axisLine={false} tickLine={false} style={{ fill: '#64748b', textTransform: 'uppercase' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border-none rounded-2xl flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-50">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Visit Intent (Resource Demand)</h2>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Intent Analysis</p>
          </div>
          <div className="flex-1 min-h-[320px] p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.purposeData} innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value">
                  {analytics?.purposeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <Label value="INTENT" position="center" style={{ fontSize: '10px', fontWeight: '900', fill: '#0F172A', textTransform: 'uppercase' }} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="p-6 pt-0 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed max-w-[280px] mx-auto">
              This data represents 100% accurate facility demand based on mandatory visitor intent selection.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-none rounded-3xl p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest font-headline">Weekly Utilization Matrix (7x4 Grid)</h2>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Aggregated engagement by institutional time slots</p>
        </div>
        <div className="grid grid-cols-5 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-r">Week Day</div>
          <div className="bg-slate-50 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Morning</div>
          <div className="bg-slate-50 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Midday</div>
          <div className="bg-slate-50 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Afternoon</div>
          <div className="bg-slate-50 p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Evening</div>
          
          {analytics?.matrixData.map((row, i) => (
            <div key={i} className="contents group">
              <div className="bg-white p-4 text-[10px] font-black text-slate-700 uppercase tracking-tight border-r flex items-center justify-center font-headline group-hover:bg-slate-50 transition-colors">
                {row.day.slice(0, 3)}
              </div>
              {row.slots.map((slot, j) => (
                <div key={j} className="bg-white p-4 flex flex-col items-center justify-center gap-1 group-hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-mono font-bold text-slate-900">{slot.count}</span>
                  <div className={cn("h-1 w-full rounded-full", slot.count > 10 ? "bg-primary" : slot.count > 5 ? "bg-primary/40" : "bg-slate-100")} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-8 bg-primary rounded-[2rem] border-none shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-headline">Data Export Center</h2>
          <p className="text-[10px] font-black text-primary-foreground/60 uppercase tracking-widest">Strategic Verification Records for Accreditation</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleDownloadCSV} className="h-12 px-10 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-transform active:scale-95">
            <Download className="h-4 w-4 mr-3" />
            Download CSV Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

