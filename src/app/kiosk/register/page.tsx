"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, PURPOSES } from '@/lib/data';
import { ArrowLeft, Loader2, ShieldCheck, Lock, UserCheck } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const SCHOOL_ID_REGEX = /^\d{2}-\d{5}-\d{3}$/;

const formSchema = z.object({
  name: z.string().min(1, "Full legal name is required"),
  department: z.string().min(1, "Select your academic unit"),
  age: z.string().min(1, "Age index is required").refine((val) => !isNaN(parseInt(val)), "Age must be a numeric value"),
  purposeId: z.string().min(1, "Select your primary purpose of visit"),
  role: z.string().min(1, "Institutional role is required"),
  schoolId: z.string().min(1, "Verification requires valid School ID (24-12345-123)"),
  email: z.string().email("Invalid institutional email format"),
});

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSchoolId = searchParams.get('schoolId') || "";
  const initialEmail = searchParams.get('email') || "";
  const initialPurposeId = searchParams.get('purposeId') || "";
  const authMethod = searchParams.get('authMethod') || (initialSchoolId ? 'RF-ID Login' : 'SSO Login');
  const [isLoading, setIsLoading] = useState(false);
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
    if (initialPurposeId) {
      form.setValue('purposeId', initialPurposeId);
    }
  }, [initialPurposeId, form]);

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

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/library1/1920/1080";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Library Background" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-md" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-white hover:bg-white/10 font-bold uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white/95 backdrop-blur-xl border border-white/20 overflow-hidden">
          <CardHeader className="text-center pt-10 pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-2xl shadow-lg">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-black text-primary uppercase tracking-tight">Identity Registration</CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 uppercase tracking-tight mt-1">
              Step 2: Complete Your Profile
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[9px]">Full Legal Identity</FormLabel>
                        <FormControl>
                          <Input placeholder="JUAN DELA CRUZ" {...field} className="h-12 rounded-xl font-bold uppercase border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <UserCheck className="h-3 w-3" /> Verified Institutional Credentials
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="schoolId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary/50 font-black uppercase tracking-widest text-[8px]">School ID</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="24-12345-123" 
                                  {...field} 
                                  readOnly={isRfidAuth}
                                  className={cn(
                                    "h-11 rounded-xl font-bold border-slate-200",
                                    isRfidAuth ? "bg-white border-primary/20 text-primary shadow-sm" : "bg-white"
                                  )} 
                                />
                                {isRfidAuth && <Lock className="absolute right-3 top-3 h-4 w-4 text-primary/40" />}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-primary/50 font-black uppercase tracking-widest text-[8px]">Institutional Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder={`username@${settings?.enforcedDomain || 'neu.edu.ph'}`} 
                                  type="email" 
                                  {...field} 
                                  readOnly={!isRfidAuth}
                                  className={cn(
                                    "h-11 rounded-xl font-bold border-slate-200",
                                    !isRfidAuth ? "bg-white border-primary/20 text-primary shadow-sm" : "bg-white"
                                  )}
                                />
                                {!isRfidAuth && <Lock className="absolute right-3 top-3 h-4 w-4 text-primary/40" />}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[9px]">Institutional Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl font-bold">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Faculty">Faculty</SelectItem>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Visitor">Visitor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[9px]">Age Index</FormLabel>
                        <FormControl>
                          <Input type="text" inputMode="numeric" placeholder="20" {...field} className="h-12 rounded-xl font-bold border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purposeId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[9px]">Visit Purpose</FormLabel>
                        <div className="relative">
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!initialPurposeId}>
                            <FormControl>
                              <SelectTrigger className={cn(
                                "h-12 rounded-xl font-bold",
                                !!initialPurposeId && "bg-slate-50 border-slate-100 text-slate-500 pr-10"
                              )}>
                                <SelectValue placeholder="Select Intent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(settings?.purposes || PURPOSES).map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!!initialPurposeId && <Lock className="absolute right-3 top-3.5 h-4 w-4 text-slate-300" />}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[9px]">Academic Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl font-bold">
                              <SelectValue placeholder="Select Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept} className="text-[10px] font-bold">{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button disabled={isLoading} className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl bg-primary hover:bg-primary/90 mt-4 active:scale-[0.98] transition-all">
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Continue to Terminal Entry"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary text-white font-bold uppercase tracking-widest">Initialising Terminal...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}