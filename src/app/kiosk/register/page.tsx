
"use client";

import { useState, Suspense } from 'react';
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
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import placeholderData from '@/app/lib/placeholder-images.json';

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

  const welcomeImage = placeholderData.placeholderImages.find(img => img.id === 'registration-welcome');

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
      // 1. Save Patron Profile
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

      // 2. Log Initial Visit
      const visitsRef = collection(db, 'visits');
      const purpose = PURPOSES.find(p => p.id === values.purposeId)?.label || "Unknown";
      
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/kiosk')}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Terminal
        </Button>

        <Card className="shadow-2xl border-none rounded-[2.5rem] bg-white overflow-hidden">
          {welcomeImage && (
            <div className="relative h-48 w-full">
              <Image 
                src={welcomeImage.imageUrl} 
                alt={welcomeImage.description}
                fill
                className="object-cover"
                data-ai-hint={welcomeImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            </div>
          )}
          <CardHeader className="text-center pt-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">First-Time Registration</CardTitle>
            <CardDescription className="text-base font-medium">
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
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" {...field} className="h-12 rounded-xl" />
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
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="text" inputMode="numeric" placeholder="20" {...field} className="h-12 rounded-xl" />
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
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl">
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
                        <FormLabel>Purpose of Visit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select Purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PURPOSES.map((p) => (
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
                    <FormItem>
                      <FormLabel>College / Department</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange([value])} 
                        defaultValue={field.value?.[0]}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button disabled={isLoading} className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]">
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
