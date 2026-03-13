
"use client";

import { useState, Suspense, useMemo } from 'react';
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
import { DEPARTMENTS, GENDERS, PURPOSES } from '@/lib/data';
import { UserPlus, ArrowLeft, Loader2, Library, Check, ChevronDown } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  departments: z.array(z.string()).min(1, "Select at least one college department"),
  age: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(1, "Valid age required")),
  gender: z.string().min(1, "Select gender"),
  purposeId: z.string().min(1, "Select purpose of visit"),
});

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
  const { data: settings } = useDoc(settingsRef);

  // Filter for active departments
  const activeDepartments = useMemo(() => {
    if (!settings?.departments) return DEPARTMENTS;
    return settings.departments
      .filter((d: any) => typeof d === 'object' ? d.isActive : true)
      .map((d: any) => typeof d === 'object' ? d.name : d);
  }, [settings]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      departments: [],
      age: '' as any,
      gender: '',
      purposeId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const patronsRef = collection(db, 'patrons');
      const patronDoc = await addDoc(patronsRef, {
        schoolId,
        email,
        name: values.name,
        departments: values.departments,
        age: values.age,
        gender: values.gender,
        role: "Visitor",
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const visitsRef = collection(db, 'visits');
      const purpose = (settings?.purposes || PURPOSES).find((p: any) => p.id === values.purposeId)?.label || "Unknown";
      
      await addDoc(visitsRef, {
        patronId: patronDoc.id,
        schoolId,
        patronName: values.name,
        patronDepartments: values.departments,
        patronAge: values.age,
        patronGender: values.gender,
        purpose,
        timestamp: new Date().toISOString(),
        status: "granted"
      });

      router.push(`/kiosk/success?patronId=${patronDoc.id}&name=${encodeURIComponent(values.name)}`);
    } catch (err) {
      console.error(err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'patrons',
        operation: 'create',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/library1/1920/1080";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Layer */}
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
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Terminal
        </Button>

        <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/30 overflow-hidden">
          {/* NEU Logo Header */}
          <div className="absolute top-6 left-8">
            <div className="flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              <span className="font-headline font-bold text-primary text-xs tracking-widest">NEU LIBRARY</span>
            </div>
          </div>
          
          <CardHeader className="text-center pt-16">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">First-Time Registration</CardTitle>
            <CardDescription className="text-base font-medium text-slate-700">
              Create your library profile to continue. {schoolId ? `School ID: ${schoolId}` : `Email: ${email}`}
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
                        <FormLabel className="text-primary font-bold">Full Legal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" {...field} className="h-12 rounded-xl bg-white/50 border-white/50 focus:bg-white" />
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
                        <FormLabel className="text-primary font-bold">Age</FormLabel>
                        <FormControl>
                          <Input type="text" inputMode="numeric" placeholder="20" {...field} className="h-12 rounded-xl bg-white/50 border-white/50 focus:bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">Gender Identity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 border-white/50">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purposeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">Purpose of Visit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 border-white/50">
                              <SelectValue placeholder="Select Purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(settings?.purposes || PURPOSES).map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
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
                  name="departments"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-primary font-bold">Colleges / Departments (Multiselect)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full h-auto min-h-[48px] justify-between rounded-xl bg-white/50 border-white/50 hover:bg-white/60 text-left font-normal",
                                !field.value.length && "text-muted-foreground"
                              )}
                            >
                              <div className="flex flex-wrap gap-1 py-1">
                                {field.value.length > 0 ? (
                                  field.value.map((dept) => (
                                    <Badge key={dept} variant="secondary" className="rounded-md px-2 py-0 text-xs font-bold bg-primary/10 text-primary border-none">
                                      {dept}
                                    </Badge>
                                  ))
                                ) : (
                                  "Select academic units"
                                )}
                              </div>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 rounded-2xl border-none shadow-2xl" align="start">
                          <ScrollArea className="h-[300px] rounded-2xl">
                            <div className="p-4 space-y-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Academic Structure Registry</p>
                              {activeDepartments.map((dept: string) => (
                                <div
                                  key={dept}
                                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    const current = field.value;
                                    const next = current.includes(dept)
                                      ? current.filter((v) => v !== dept)
                                      : [...current, dept];
                                    field.onChange(next);
                                  }}
                                >
                                  <Checkbox
                                    checked={field.value.includes(dept)}
                                    onCheckedChange={() => {}} // Handled by div click
                                    className="rounded-md border-primary/20"
                                  />
                                  <label className="text-sm font-bold text-slate-700 cursor-pointer flex-1">
                                    {dept}
                                  </label>
                                  {field.value.includes(dept) && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] bg-primary hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Complete Registration & Check-in"}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading terminal...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}
