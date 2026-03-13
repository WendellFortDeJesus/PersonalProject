
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Keep focus on RFID input if the RFID tab is active
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
    
    // Simulate API call for both RFID and Email
    setTimeout(() => {
      setIsLoading(false);
      // Mock validation
      if ((activeTab === 'email' && email.includes('@')) || (activeTab === 'rfid' && rfid.length > 5)) {
        router.push('/kiosk/purpose');
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Please provide a valid NEU School ID or Email.",
        });
      }
    }, 1500);
  };

  const handleSSO = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/kiosk/purpose');
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
          Back to Start
        </Button>

        <Card className="shadow-xl border-none">
          <CardHeader className="text-center space-y-2 pb-2">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Identity Check</CardTitle>
            <CardDescription className="text-base">
              Tap your NEU School ID or use University Email
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100 p-1">
                <TabsTrigger value="rfid" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <ContactRound className="mr-2 h-4 w-4" />
                  RFID ID Tap
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <Mail className="mr-2 h-4 w-4" />
                  SSO Login
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
                    <p className="mt-6 text-sm font-medium text-muted-foreground">Tap your NEU ID card against the reader</p>
                    
                    <div className="mt-4 w-full max-w-xs px-4">
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">RFID Scanner Input</label>
                       <Input 
                        ref={rfidInputRef}
                        placeholder="Waiting for tap..."
                        autoFocus 
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-12 text-center text-lg font-mono border-slate-200 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || rfid.length < 5} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Identification"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email">
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleSSO} 
                      disabled={isLoading} 
                      variant="outline"
                      className="w-full h-16 text-lg border-2 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 rounded-xl"
                    >
                      <div className="relative w-6 h-6 overflow-hidden rounded-full border">
                         <Image 
                          src="https://picsum.photos/seed/google/40/40" 
                          fill
                          alt="Google Logo" 
                          className="object-cover"
                        />
                      </div>
                      Sign in with NEU Email
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 font-bold">Or Manual Entry</span>
                    </div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary px-1">University Email (@neu.edu.ph)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="name@neu.edu.ph" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 pl-12 rounded-xl text-lg border-secondary/20 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90">
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Continue to Purpose"}
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
