
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

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Keep focus on RFID input if the RFID tab is active for "instant" scanner capture
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
      // Validation for RFID or university email domain
      const isRfidValid = activeTab === 'rfid' && rfid.length >= 5;
      const isEmailValid = activeTab === 'email' && email.toLowerCase().endsWith('@neu.edu.ph');

      if (isRfidValid || isEmailValid) {
        router.push('/kiosk/purpose');
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: activeTab === 'email' 
            ? "Access restricted to @neu.edu.ph domain accounts only."
            : "Invalid RFID scan. Please try tapping your NEU ID again.",
        });
        if (activeTab === 'rfid') setRfid('');
      }
    }, 1200);
  };

  const handleSSO = () => {
    setIsLoading(true);
    // Simulate Google SSO restricted to domain
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "SSO Verified",
        description: "Authenticated with university email domain.",
      });
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
          Cancel Check-in
        </Button>

        <Card className="shadow-xl border-none overflow-hidden rounded-[1.5rem]">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center space-y-2 pb-2 pt-8">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Identity Terminal</CardTitle>
            <CardDescription className="text-base font-medium">
              Identify yourself to access the library
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="rfid" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                  <ContactRound className="mr-2 h-4 w-4" />
                  RFID Tap
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                  <Globe className="mr-2 h-4 w-4" />
                  SSO Login
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0">
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/20 rounded-[2rem] bg-primary/5 transition-colors">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative p-8 bg-white rounded-full shadow-lg">
                        <ContactRound className="h-16 w-16 text-primary" />
                      </div>
                    </div>
                    <div className="mt-8 text-center space-y-1">
                      <p className="text-lg font-bold text-slate-700">Ready to Scan</p>
                      <p className="text-sm font-medium text-muted-foreground">Place your NEU ID near the reader</p>
                    </div>
                    
                    <div className="mt-6 w-full max-w-xs px-4">
                       <Input 
                        ref={rfidInputRef}
                        placeholder="Scanner input active..."
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-14 text-center text-xl font-mono border-slate-200 focus-visible:ring-primary rounded-xl bg-white/50"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || rfid.length < 5} className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg transition-all">
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Verify RFID Scan"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleSSO} 
                      disabled={isLoading} 
                      variant="outline"
                      className="w-full h-16 text-lg border-2 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-3 rounded-2xl font-bold transition-all hover:border-primary/30 shadow-sm"
                    >
                      <div className="relative w-6 h-6">
                         <Image 
                          src="https://picsum.photos/seed/google/40/40" 
                          fill
                          alt="Google Logo" 
                          className="rounded-full"
                        />
                      </div>
                      Sign in with NEU Email
                    </Button>
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Restricted to @neu.edu.ph accounts
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-400 font-bold">Or Manual Entry</span>
                    </div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-primary px-1">University Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="yourname@neu.edu.ph" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 pl-12 rounded-xl text-lg border-slate-200 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg transition-all">
                      {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Proceed with Email"}
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
