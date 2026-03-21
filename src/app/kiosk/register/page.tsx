
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';
import { ArrowLeft, Loader2, ShieldCheck, Lock, UserCheck, Fingerprint, Database, GraduationCap } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const SCHOOL_ID_REGEX = /^\d{2}-\d{5}-\d{3}$/;

const formSchema = z.object({
  name: z.string().min(1, "Full legal name is required"),
  department: z.string().min(1, "Select your college/department"),
  age: z.string().min(1, "Age index is required").refine((val) => !isNaN(parseInt(val)), "Age must be a numeric value"),
  purposeId: z.string().min(1, "Select your primary purpose of visit"),
  role: z.string().min(1, "Institutional role is required"),
  schoolId: z.string().min(1, "Verification requires valid School ID (24-12345-123)"),
  email: z.string().email("Invalid institutional email format"),
});

const CornerBrackets = () => (
  <>
    <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary/40 rounded-tl-[2rem] pointer-events-none z-30" />
    <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary/40 rounded-tr-[2rem] pointer-events-none z-30" />
    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary/40 rounded-bl-[2rem] pointer-events-none z-30" />
    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary/40 rounded-br-[2rem] pointer-events-none z-30" />
  </>
);

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSchoolId = searchParams.get('schoolId') || "";
  const initialEmail = searchParams.get('email') || "";
  const initialPurposeId = searchParams.get('purposeId') || "";
  const authMethod = searchParams.get('authMethod') || (initialSchoolId ? 'RF-ID Login' : 'SSO Login');
  const [isLoading, setIsLoading] = useState(false);
  const [binaryBits, setBinaryBits] = useState<string[]>([]);
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const isRfidAuth = authMethod === 'RF-ID Login';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      department: '',
      age: '',
      purposeId: initialPurposeId,
      role: 'Student',
      schoolId: initialSchoolId,
      email: initialEmail,
    },
  });

  useEffect(() => {
    // Generate decorative binary bits for the atmospheric background
    const bits = Array.from({ length: 60 }, () => Math.random() > 0.5 ? '1' : '0');
    setBinaryBits(bits);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!db) return;

    const enforcedDomain = settings?.enforcedDomain || "neu.edu.ph";
    
    if (!values.email.toLowerCase().endsWith(`@${enforcedDomain}`)) {
      form.setError('email', { message: `Verification requires a valid @${enforcedDomain} email` });
      return;
    }

    if (!SCHOOL_ID_REGEX.test(values.schoolId)) {
      form.setError('schoolId', { message: "Format must be 24-12345-123" });
      return;
    }

    setIsLoading(true);
    try {
      const patronData = {
        schoolId: values.schoolId,
        email: values.email,
        name: values.name.toUpperCase(),
        departments: [values.department],
        age: Number(values.age),
        role: values.role,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const patronDoc = await addDoc(collection(db, 'patrons'), patronData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'patrons',
          operation: 'create',
          requestResourceData: patronData,
        }));
        throw error;
      });

      const purpose = (settings?.purposes || PURPOSES).find((p: any) => p.id === values.purposeId)?.label || "Other";
      const visitData = {
        patronId: patronDoc.id,
        schoolId: values.schoolId,
        patronEmail: values.email,
        authMethod,
        patronName: values.name.toUpperCase(),
        patronDepartments: [values.department],
        patronAge: Number(values.age),
        patronRole: values.role,
        purpose,
        timestamp: new Date().toISOString(),
        status: "granted"
      };
      
      await addDoc(collection(db, 'visits'), visitData).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'visits',
          operation: 'create',
          requestResourceData: visitData,
        }));
        throw error;
      });

      router.push(`/kiosk/success?patronId=${patronDoc.id}&name=${encodeURIComponent(values.name)}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    params.set('isNew', 'true');
    params.set('authMethod', authMethod);
    if (initialEmail) params.set('email', initialEmail);
    if (initialSchoolId) params.set('schoolId', initialSchoolId);
    router.push(`/kiosk/purpose?${params.toString()}`);
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden no-scrollbar">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      {/* Floating Binary Bits Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {binaryBits.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-6 animate-fade-in px-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-slate-500 hover:text-white font-black uppercase tracking-[0.4em] text-[10px] h-10 px-0 transition-colors"
        >
          <ArrowLeft className="mr-3 h-4 w-4" />
          Abort Registration Protocol
        </Button>

        <Card className="relative border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CornerBrackets />
          <CardHeader className="text-center pt-12 pb-6 px-12 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="relative p-5 bg-primary/20 rounded-[2rem] ring-1 ring-primary/40 shadow-[0_0_30px_rgba(53,88,114,0.3)]">
                <Database className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-4xl font-headline font-black text-white tracking-tighter uppercase leading-none">Identity Record</CardTitle>
              <CardDescription className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                Registry Node Initialization
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-12 overflow-y-auto max-h-[75vh] no-scrollbar">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                {/* Section 1: Personal Identity */}
                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group transition-all hover:bg-black/50 hover:border-white/10">
                   <div className="flex items-center gap-3 mb-2">
                    <Fingerprint className="h-5 w-5 text-primary shadow-[0_0_10px_rgba(53,88,114,0.5)]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Personal Identity Node</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Full Legal Identity</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="JUAN DELA CRUZ" 
                            {...field} 
                            className="h-16 rounded-2xl border-none bg-black/40 font-black text-xl text-white focus:bg-black/60 focus:ring-1 focus:ring-primary/60 focus:shadow-[0_0_20px_rgba(53,88,114,0.4)] transition-all shadow-inner uppercase" 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2" />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Bio-Metric Age</FormLabel>
                          <FormControl>
                            <Input type="text" inputMode="numeric" placeholder="20" {...field} className="h-16 rounded-2xl border-none bg-black/40 font-black text-xl text-white focus:bg-black/60 focus:ring-1 focus:ring-primary/60 transition-all shadow-inner" />
                          </FormControl>
                          <FormMessage className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Registry Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-16 rounded-2xl border-none bg-black/40 font-black text-xl text-white focus:ring-1 focus:ring-primary/60 shadow-inner">
                                <SelectValue placeholder="Select Role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0B1218] border-white/10 text-white">
                              <SelectItem value="Student" className="focus:bg-primary/20 focus:text-white">Student</SelectItem>
                              <SelectItem value="Faculty" className="focus:bg-primary/20 focus:text-white">Faculty</SelectItem>
                              <SelectItem value="Staff" className="focus:bg-primary/20 focus:text-white">Staff</SelectItem>
                              <SelectItem value="Visitor" className="focus:bg-primary/20 focus:text-white">Visitor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 2: Institutional Verification */}
                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group transition-all hover:bg-black/50 hover:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary shadow-[0_0_10px_rgba(53,88,114,0.5)]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Credential Verification Node</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="schoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Registry ID</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="24-12345-123" 
                                {...field} 
                                readOnly={isRfidAuth}
                                className={cn(
                                  "h-16 rounded-2xl border-none bg-black/40 font-mono font-bold text-lg shadow-inner focus:ring-1 focus:ring-primary/60 transition-all",
                                  isRfidAuth ? "text-primary/70 border-l-4 border-primary/50" : "text-white"
                                )} 
                              />
                              {isRfidAuth && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-[9px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Verified SSO Node</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder={`user@${settings?.enforcedDomain || 'neu.edu.ph'}`} 
                                type="email" 
                                {...field} 
                                readOnly={!isRfidAuth}
                                className={cn(
                                  "h-16 rounded-2xl border-none bg-black/40 font-mono font-bold text-lg shadow-inner focus:ring-1 focus:ring-primary/60 transition-all",
                                  !isRfidAuth ? "text-primary/70 border-l-4 border-primary/50" : "text-white"
                                )}
                              />
                              {!isRfidAuth && <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-[9px] font-black uppercase tracking-widest ml-2" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 3: Academic Mapping */}
                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group transition-all hover:bg-black/50 hover:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="h-5 w-5 text-primary shadow-[0_0_10px_rgba(53,88,114,0.5)]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Academic Mapping Node</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">College / Department Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 rounded-2xl border-none bg-black/40 font-black text-lg text-white focus:ring-1 focus:ring-primary/60 shadow-inner transition-all">
                              <SelectValue placeholder="Select Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px] bg-[#0B1218] border-white/10 text-white">
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept} className="text-[10px] font-black uppercase tracking-tighter focus:bg-primary/20 focus:text-white">{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purposeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Node Activity Intent</FormLabel>
                        <div className="relative">
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!initialPurposeId}>
                            <FormControl>
                              <SelectTrigger className={cn(
                                "h-16 rounded-2xl border-none bg-black/40 font-black text-lg text-white shadow-inner focus:ring-1 focus:ring-primary/60 transition-all",
                                !!initialPurposeId && "opacity-80 border-l-4 border-primary/50"
                              )}>
                                <SelectValue placeholder="Select Intent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#0B1218] border-white/10 text-white">
                              {(settings?.purposes || PURPOSES).map((p: any) => (
                                <SelectItem key={p.id} value={p.id} className="focus:bg-primary/20 focus:text-white">{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!!initialPurposeId && <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />}
                        </div>
                        <FormMessage className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button disabled={isLoading} className="w-full h-24 text-[12px] font-black uppercase tracking-[0.5em] bg-primary hover:bg-primary/90 text-white rounded-[2.5rem] shadow-[0_0_40px_rgba(53,88,114,0.4)] hover:shadow-[0_0_60px_rgba(53,88,114,0.6)] active:scale-[0.98] transition-all relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                    <span className="flex items-center gap-4">
                      <UserCheck className="h-5 w-5" />
                      Authorize Terminal Entry
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 pt-4">
           <span className="text-[9px] font-black text-primary/30 uppercase tracking-[0.6em]">Institutional Data Segment: Node Alpha Restricted</span>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B1218] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Initializing Protocol Node...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}
