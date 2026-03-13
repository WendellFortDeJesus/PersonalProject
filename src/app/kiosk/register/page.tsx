"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DEPARTMENTS, GENDERS, PURPOSES } from '@/lib/data';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';

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
  const schoolId = searchParams.get('schoolId');
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);

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
    // Simulate database save to Users Table
    setTimeout(() => {
      setIsLoading(false);
      const queryParams = new URLSearchParams({
        name: values.name,
        departments: JSON.stringify(values.departments),
        purposeId: values.purposeId
      });
      router.push(`/kiosk/success?${queryParams.toString()}`);
    }, 1500);
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
          <div className="h-3 bg-primary w-full" />
          <CardHeader className="text-center pt-10">
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
          <CardContent className="p-10">
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
                          <Input type="number" placeholder="20" {...field} className="h-12 rounded-xl" />
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
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-base font-bold">College / Department (Select all that apply)</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        {DEPARTMENTS.map((dept) => (
                          <FormField
                            key={dept}
                            control={form.control}
                            name="departments"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={dept}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(dept)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, dept])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== dept
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                                    {dept}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
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
