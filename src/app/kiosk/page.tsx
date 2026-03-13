"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_PATRONS } from '@/lib/data';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'rfid' && rfidInputRef.current && document.activeElement !== rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      const patron = MOCK_PATRONS.find(p => 
        (activeTab === 'rfid' && p.rfid === rfid) || 
        (activeTab === 'email' && p.email === email)
      );

      if (!patron) {
        if (activeTab === 'rfid' && rfid.length >= 3) {
          router.push(`/kiosk/register?rfid=${encodeURIComponent(rfid)}`);
          return;
        }
        
        const isEmailValid = activeTab === 'email' && email.toLowerCase().endsWith('@neu.edu.ph');
        if (isEmailValid) {
          router.push(`/kiosk/register?email=${encodeURIComponent(email)}`);
          return;
        }

        toast({
          variant: "destructive",
          title: "Registration Required",
          description: "This ID is not in our system. If you are an NEU student/staff, please register using the form.",
        });
        return;
      }

      if (patron.status === 'blocked') {
        router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patron.name)}`);
      } else {
        router.push(`/kiosk/purpose?patronId=${patron.id}`);
      }
    }, 1200);
  };

  const handleSSO = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(true);
      // Simulate OAuth redirect or discovery
      const mockEmail = "new.user@neu.edu.ph";
      const existing = MOCK_PATRONS.find(p => p.email === mockEmail);
      if (existing) {
        router.push(`/kiosk/purpose?patronId=${existing.id}`);
      } else {
        router.push(`/kiosk/register?email=${encodeURIComponent(mockEmail)}`);
      }
    }, 1000);
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
          Cancel Check-in
        </Button>

        <Card className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] bg-white">
          <div className="h-3 bg-primary w-full" />
          <CardHeader className="text-center space-y-2 pb-2 pt-10">
            <CardTitle className="text-4xl font-headline font-bold text-primary tracking-tight">Identity Terminal</CardTitle>
            <CardDescription className="text-lg font-medium text-slate-500">
              Verify your credentials to enter
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 h-16 bg-slate-100/80 p-1.5 rounded-2xl">
                <TabsTrigger value="rfid" className="text-base font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all">
                  <ContactRound className="mr-2 h-5 w-5" />
                  RFID Tap
                </TabsTrigger>
                <TabsTrigger value="email" className="text-base font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all">
                  <Globe className="mr-2 h-5 w-5" />
                  SSO Login
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0">
                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/10 rounded-[3rem] bg-primary/5 group transition-all hover:bg-primary/10 hover:border-primary/20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative p-10 bg-white rounded-full shadow-xl">
                        <ContactRound className="h-20 w-20 text-primary" />
                      </div>
                    </div>
                    <div className="mt-10 text-center space-y-2">
                      <p className="text-2xl font-bold text-slate-800">Scanner Ready</p>
                      <p className="text-base font-medium text-slate-400">Place your NEU ID near the terminal</p>
                    </div>
                    
                    <div className="mt-8 w-full max-w-xs px-6 opacity-0 focus-within:opacity-100 transition-opacity">
                       <Input 
                        ref={rfidInputRef}
                        placeholder="Scanner input active..."
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-14 text-center text-2xl font-mono border-slate-200 focus-visible:ring-primary rounded-xl bg-white shadow-sm"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || rfid.length < 3} className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Initiate Verification"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <div className="space-y-8 py-2">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleSSO} 
                      disabled={isLoading} 
                      variant="outline"
                      className="w-full h-16 text-lg border-2 border-slate-100 hover:bg-slate-50 flex items-center justify-center gap-4 rounded-2xl font-bold transition-all hover:border-primary/30 shadow-sm"
                    >
                      <div className="relative w-8 h-8">
                         <Image 
                          src="https://picsum.photos/seed/google/80/80" 
                          fill
                          alt="Google Logo" 
                          className="rounded-full"
                          data-ai-hint="google logo"
                        />
                      </div>
                      Sign in with NEU Email
                    </Button>
                    <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      UNIVERSITY DOMAIN LOCK ACTIVE
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Manual Lookup</span>
                    </div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary ml-1">Official University Email</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="j.doe@neu.edu.ph" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-16 pl-14 rounded-2xl text-lg border-slate-100 bg-slate-50/50 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                      {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Access System"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
