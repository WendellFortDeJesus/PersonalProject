
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock validation
      if ((email && email.includes('@')) || (rfid.length > 5)) {
        router.push('/kiosk/purpose');
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Please provide a valid University Email or Scan your ID card.",
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="group text-muted-foreground hover:text-primary mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Start
        </Button>

        <Card className="shadow-xl border-none">
          <CardHeader className="text-center space-y-2 pb-2">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Identity Check</CardTitle>
            <CardDescription className="text-base">
              Securely sign in to start your visit session
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="rfid" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 p-1">
                <TabsTrigger value="rfid" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <ContactRound className="mr-2 h-4 w-4" />
                  RFID Scan
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Address
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid">
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-secondary/30 rounded-2xl bg-secondary/5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
                      <div className="relative p-6 bg-white rounded-full shadow-lg">
                        <ContactRound className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <p className="mt-6 text-sm font-medium text-muted-foreground">Tap your RFID card against the reader</p>
                    <Input 
                      className="opacity-0 h-0 w-0 p-0 absolute" 
                      autoFocus 
                      value={rfid}
                      onChange={(e) => {
                        setRfid(e.target.value);
                        if(e.target.value.length > 5) handleAuth(e as any);
                      }}
                    />
                  </div>
                  <Button disabled={isLoading} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify Identity"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email">
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-primary px-1">University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. name@university.edu" 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-12 rounded-xl text-lg border-secondary/20 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Continue"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
