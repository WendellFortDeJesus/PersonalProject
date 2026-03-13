
"use client";

import { useState, Suspense, useMemo, useEffect } from 'react';
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const createFormSchema = (requireAge: boolean) => {
  return z.object({
    name: z.string().min(1, "Name is required"),
    department: z.string().min(1, "Select your department"),
    age: requireAge 
      ? z.string().min(1, "Age is required").refine((val) => !isNaN(parseInt(val)), "Age must be a number")
      : z.string().optional(),
    purposeId: z.string().min(1, "Select purpose of visit"),
  });
};

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId') || "";
  const email = searchParams.get('email') || "";
  const [isLoading, setIsLoading] = useState(false);
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const requireAge = settings?.requireAge ?? true;

  const formSchema = useMemo(() => createFormSchema(requireAge), [requireAge]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      department: '',
      age: '',
      purposeId: '',
    },
  });

  useEffect(() => {
    if (!isSettingsLoading) {
      form.trigger();
    }
  }, [isSettingsLoading, form]);

  const activeDepartments = useMemo(() => {
    if (!settings?.departments || settings.departments.length === 0) return DEPARTMENTS;
    return settings.departments
      .filter((d: any) => d.isActive)
      .map((d: any) => d.name);
  }, [settings]);

  const onSubmit = async (values: any) => {
    if (!db) return;
    setIsLoading(true);
    try {
      const patronData = {
        schoolId,
        email,
        name: values.name.toUpperCase(),
        departments: [values.department],
        age: values.age ? Number(values.age) : 0,
        role: "Visitor",
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

      const purpose = (settings?.purposes || PURPOSES).find((p: any) => p.id === values.purposeId)?.label || "Unknown";
      const visitData = {
        patronId: patronDoc.id,
        schoolId,
        patronName: values.name.toUpperCase(),
        patronDepartments: [values.department],
        patronAge: values.age ? Number(values.age) : 0,
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

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/library1/1920/1080";
  const overlayOpacity = settings?.overlayOpacity ?? 0.7;
  const textColor = settings?.welcomeTextColor === 'black' ? 'text-black' : 'text-white';

  if (isSettingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
          <p className="text-white font-bold uppercase tracking-widest text-[10px]">Synchronizing Terminal...</p>
        </div>
      </div>
    );
  }

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
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/kiosk')}
          className={cn("hover:bg-white/10", textColor)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Terminal
        </Button>

        <Card 
          className="shadow-2xl border-none rounded-[2.5rem] border border-white/30 overflow-hidden"
          style={{ backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})`, backdropFilter: 'blur(20px)' }}
        >
          <div className="absolute top-6 left-8 flex items-center gap-2">
            <span className="font-headline font-bold text-primary text-xs tracking-widest uppercase">NEU University Library</span>
          </div>
          
          <CardHeader className="text-center pt-16">
            <CardTitle className="text-3xl font-headline font-bold text-primary uppercase tracking-tight">Identity Registration</CardTitle>
            <CardDescription className="text-base font-bold text-slate-700 uppercase tracking-tight mt-2">
              Create your library profile. {schoolId ? `School ID: ${schoolId}` : `Email: ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[10px]">Full Legal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="JUAN DELA CRUZ" {...field} className="h-14 rounded-xl bg-white/50 border-white/50 focus:bg-white font-bold uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[10px]">Age {!requireAge && "(Optional)"}</FormLabel>
                        <FormControl>
                          <Input type="text" inputMode="numeric" placeholder="20" {...field} className="h-14 rounded-xl bg-white/50 border-white/50 focus:bg-white font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purposeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-black uppercase tracking-widest text-[10px]">Purpose of Visit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-xl bg-white/50 border-white/50 font-bold">
                              <SelectValue placeholder="Select Purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(settings?.purposes || PURPOSES).map((p: any) => (
                              <SelectItem key={p.id} value={p.id} className="font-bold">{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary font-black uppercase tracking-widest text-[10px]">Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-xl bg-white/50 border-white/50 font-bold text-left overflow-hidden">
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {activeDepartments.map((dept: string) => (
                            <SelectItem key={dept} value={dept} className="font-bold text-xs">{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} className="w-full h-18 text-xl font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 py-6">
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Verify and Check-in"}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary font-bold text-white uppercase tracking-widest">Initialising Terminal...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}
