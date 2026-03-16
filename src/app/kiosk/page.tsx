"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2, ShieldAlert, Cpu, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

// Institutional ID format: 24-12345-123
const SCHOOL_ID_REGEX = /^\d{2}-\d{5}-\d{3}$/;

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (settings && !settings.allowRfidScan && activeTab === 'rfid') {
      setActiveTab('email');
    }
  }, [settings, activeTab]);

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

    try {
      const patronsRef = collection(db, 'patrons');
      const authMethod = activeTab === 'rfid' ? 'RF-ID Login' : 'SSO Login';
      
      if (activeTab === 'rfid') {
        if (!SCHOOL_ID_REGEX.test(rfid)) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Invalid ID Format",
            description: "Format required: 2 digits, dash, 5 digits, dash, 3 digits (e.g., 24-12345-123)",
          });
          return;
        }
      }

      const enforcedDomain = settings?.enforcedDomain || "neu.edu.ph";
      if (activeTab === 'email') {
        if (!email.toLowerCase().endsWith(`@${enforcedDomain}`)) {
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: `Authentication only allowed for @${enforcedDomain} institutional accounts.`,
          });
          return;
        }
      }

      const field = activeTab === 'rfid' ? 'schoolId' : 'email';
      const value = activeTab === 'rfid' ? rfid : email;

      const q = query(patronsRef, where(field, '==', value), limit(1));
      const querySnapshot = await getDocs(q).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'patrons',
          operation: 'list',
        }));
        throw error;
      });

      if (querySnapshot.empty) {
        setIsLoading(false);
        const params = new URLSearchParams();
        params.set('authMethod', authMethod);
        if (activeTab === 'rfid') params.set('schoolId', rfid);
        if (activeTab === 'email') params.set('email', email);
        
        router.push(`/kiosk/register?${params.toString()}`);
        return;
      }

      const patronDoc = querySnapshot.docs[0];
      const patronData = patronDoc.data();

      if (patronData.isBlocked) {
        router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
      } else {
        router.push(`/kiosk/purpose?patronId=${patronDoc.id}&authMethod=${authMethod}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Node Sync Error",
        description: "Communication with institutional registry failed. Retrying connection...",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/kiosk-bg/1920/1080";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Kiosk Background" 
          fill 
          className="object-cover scale-110"
          priority
          data-ai-hint="futuristic library"
        />
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="flex justify-between items-center px-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/10 font-headline uppercase tracking-[0.3em] text-[10px] h-10 px-6 border border-white/20 backdrop-blur-md rounded-2xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Abort Entry
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Secure Terminal Alpha</span>
          </div>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden rounded-[3rem] border border-white/20 bg-white/95 backdrop-blur-2xl transition-all">
          <div className="absolute top-10 right-10 flex gap-2">
             <Cpu className="h-4 w-4 text-slate-200" />
             <Lock className="h-4 w-4 text-slate-200" />
          </div>
          
          <CardHeader className="text-center space-y-2 pb-6 pt-16">
            <CardTitle className="text-5xl font-headline font-black text-primary tracking-tighter uppercase">Identity Hub</CardTitle>
            <CardDescription className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              Verify Institutional Credentials
            </CardDescription>
          </CardHeader>

          <CardContent className="p-12 pt-4">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 h-18 bg-slate-100 p-2 rounded-2xl border border-slate-200/50">
                <TabsTrigger 
                  value="rfid" 
                  disabled={settings && !settings.allowRfidScan}
                  className="text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all font-headline uppercase tracking-widest"
                >
                  RF-ID Terminal
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  disabled={settings && !settings.allowEmailLogin}
                  className="text-[11px] font-black data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl transition-all font-headline uppercase tracking-widest"
                >
                  Institutional SSO
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0 outline-none">
                {settings && !settings.allowRfidScan ? (
                  <div className="py-20 text-center space-y-6">
                    <ShieldAlert className="h-16 w-16 text-red-500 mx-auto opacity-50" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Hardware Scanner Restricted</p>
                  </div>
                ) : (
                  <form onSubmit={handleAuth} className="space-y-10">
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/20 rounded-[3.5rem] bg-slate-50/50 group transition-all hover:bg-white hover:border-primary/40 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                      <div className="relative p-12 bg-white rounded-full shadow-2xl border border-slate-100 mb-8 animate-pulse">
                        <ContactRound className="h-20 w-20 text-primary" />
                      </div>
                      <div className="text-center space-y-3 px-10">
                        <p className="text-3xl font-headline font-black text-primary uppercase tracking-tight">Scanner Active</p>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Place your identity card <br /> on the proximity sensor</p>
                      </div>
                      <div className="mt-10 w-full max-w-xs px-6 relative">
                         <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full" />
                         <Input 
                          ref={rfidInputRef}
                          placeholder="00-00000-000"
                          autoFocus 
                          autoComplete="off"
                          value={rfid}
                          onChange={(e) => setRfid(e.target.value)}
                          className="h-16 text-center text-3xl font-mono font-black border-slate-200 focus-visible:ring-primary rounded-2xl bg-white shadow-xl placeholder:opacity-20"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-20 text-xl font-headline font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/95 rounded-3xl shadow-2xl shadow-primary/30 py-8 transition-all hover:scale-[1.02]">
                      {isLoading ? <Loader2 className="mr-2 h-8 w-8 animate-spin" /> : "Initiate Verification"}
                    </Button>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="email" className="mt-0 outline-none">
                {settings && !settings.allowEmailLogin ? (
                  <div className="py-20 text-center space-y-6">
                    <ShieldAlert className="h-16 w-16 text-red-500 mx-auto opacity-50" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Cloud Identity Restricted</p>
                  </div>
                ) : (
                  <form onSubmit={handleAuth} className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-headline font-black uppercase tracking-[0.4em] text-primary ml-2">Official Credentials</label>
                      <div className="relative">
                        <div className="absolute left-6 top-6 z-10">
                           <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <Input 
                          placeholder={`staff@${settings?.enforcedDomain || 'neu.edu.ph'}`} 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-20 pl-16 rounded-[2rem] text-xl font-bold border-slate-200 bg-white focus-visible:ring-primary shadow-xl"
                        />
                      </div>
                      <div className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest text-center">
                          Network strictly enforces @{settings?.enforcedDomain || 'neu.edu.ph'} verification
                        </p>
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-20 text-xl font-headline font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/95 rounded-[2rem] shadow-2xl shadow-primary/30 py-8 transition-all hover:scale-[1.02]">
                      {isLoading ? <Loader2 className="mr-2 h-8 w-8 animate-spin" /> : "Access System Hub"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <div className="h-2 bg-accent/30" />
        </Card>
      </div>
    </div>
  );
}
