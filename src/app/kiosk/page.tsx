
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  const enforcedDomain = settings?.enforcedDomain || "neu.edu.ph";

  useEffect(() => {
    if (settings) {
      if (!settings.allowRfidScan && settings.allowEmailLogin) {
        setActiveTab('email');
      } else if (settings.allowRfidScan) {
        setActiveTab('rfid');
      }
    }
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'rfid' && rfidInputRef.current) {
      rfidInputRef.current.focus();
    }
  }, [activeTab]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email?.endsWith(`@${enforcedDomain}`)) {
        await signOut(auth);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: `Only @${enforcedDomain} accounts are authorized for terminal access.`,
        });
        return;
      }

      if (user.email) {
        const patronsRef = collection(db, 'patrons');
        const q = query(patronsRef, where('email', '==', user.email), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          router.push(`/kiosk/purpose?isNew=true&authMethod=SSO Login&email=${encodeURIComponent(user.email)}`);
        } else {
          const patronDoc = snap.docs[0];
          const patronData = patronDoc.data();
          if (patronData.isBlocked) {
            router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
          } else {
            router.push(`/kiosk/purpose?patronId=${patronDoc.id}&authMethod=SSO Login`);
          }
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Google Auth Failed",
        description: error.message || "Failed to sign in with Google.",
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const patronsRef = collection(db, 'patrons');
      const authMethod = activeTab === 'rfid' ? 'RF-ID Login' : 'SSO Login';
      
      const enforcedPattern = settings?.rfidPattern || "^[0-9]{2}-[0-9]{5}-[0-9]{3}$";
      const regex = new RegExp(enforcedPattern);

      if (activeTab === 'rfid' && !regex.test(rfid)) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Format Required",
          description: "Example: 24-12345-123",
        });
        return;
      }

      if (activeTab === 'email' && !email.toLowerCase().endsWith(`@${enforcedDomain}`)) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: `Only @${enforcedDomain} accounts are allowed.`,
        });
        return;
      }

      const field = activeTab === 'rfid' ? 'schoolId' : 'email';
      const value = activeTab === 'rfid' ? rfid : email;

      const q = query(patronsRef, where(field, '==', value), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setIsLoading(false);
        const params = new URLSearchParams();
        params.set('isNew', 'true');
        params.set('authMethod', authMethod);
        if (activeTab === 'rfid') params.set('schoolId', rfid);
        if (activeTab === 'email') params.set('email', email);
        router.push(`/kiosk/purpose?${params.toString()}`);
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
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to reach the registry. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-slate-50 font-body overflow-hidden">
      {/* Institutional Background with frosted effect */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/library1/1920/1080"
          alt="University Background"
          fill
          className="object-cover opacity-10 grayscale"
          priority
          data-ai-hint="modern library"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-slate-500 hover:text-primary font-black text-[9px] uppercase tracking-[0.3em] px-4 h-10 rounded-full hover:bg-white/50 backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Abort Process
          </Button>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Node Secure: Terminal Alpha</span>
          </div>
        </div>

        <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3.5rem] overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-slate-200/50">
          <CardHeader className="text-center pt-16 pb-10 px-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl scale-110" />
                <div className="relative p-6 bg-primary rounded-[2.5rem] shadow-2xl shadow-primary/30">
                  <ShieldCheck className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter uppercase leading-none">Identity Hub</CardTitle>
            <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-4">
              Institutional Verification Protocol
            </CardDescription>
          </CardHeader>

          <CardContent className="p-12 pt-0 space-y-12">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-slate-100/50 p-2 rounded-[2.25rem] border border-slate-200/50">
                {settings?.allowRfidScan !== false && (
                  <TabsTrigger 
                    value="rfid" 
                    className="text-[10px] font-black uppercase tracking-widest rounded-[1.75rem] h-14 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all"
                  >
                    <Fingerprint className="h-4.5 w-4.5 mr-2" />
                    RFID Card
                  </TabsTrigger>
                )}
                {settings?.allowEmailLogin !== false && (
                  <TabsTrigger 
                    value="email" 
                    className="text-[10px] font-black uppercase tracking-widest rounded-[1.75rem] h-14 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all"
                  >
                    <Mail className="h-4.5 w-4.5 mr-2" />
                    Email SSO
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0 outline-none focus:ring-0">
                <form onSubmit={handleAuth} className="space-y-12">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-[3rem] scale-[0.98] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex flex-col items-center justify-center py-20 px-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 transition-all duration-500 group-focus-within:border-primary/30 group-focus-within:bg-white group-focus-within:shadow-2xl group-focus-within:shadow-primary/5">
                      <div className="relative mb-10">
                        <ContactRound className="h-20 w-20 text-slate-300 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
                        <div className="absolute -top-2 -right-2">
                          <Scan className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-3 mb-12">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Scanner Ready</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Place your identity card near the terminal sensor</p>
                      </div>
                      <div className="relative w-full max-w-xs">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-300 group-focus-within:text-primary">
                            <Fingerprint className="h-5 w-5" />
                         </div>
                         <Input 
                            ref={rfidInputRef}
                            placeholder="00-00000-000"
                            autoFocus 
                            autoComplete="off"
                            value={rfid}
                            onChange={(e) => setRfid(e.target.value)}
                            className="h-16 w-full pl-14 text-center text-2xl font-mono font-black border-none bg-white shadow-xl shadow-slate-100 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-4 transition-all"
                          />
                      </div>
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-18 text-[12px] font-black uppercase tracking-[0.4em] bg-primary hover:bg-primary/95 text-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all py-8">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (rfid ? "Process Identity" : "Verify Registry Status")}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0 outline-none focus:ring-0">
                <form onSubmit={handleAuth} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-3">Institutional SSO Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                        <Mail className="h-6 w-6" />
                      </div>
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-18 pl-16 rounded-[2rem] border-slate-200 bg-slate-50/50 font-bold text-lg focus:bg-white focus:border-primary/30 transition-all shadow-inner border-2"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-18 text-[12px] font-black uppercase tracking-[0.4em] bg-primary hover:bg-primary/95 text-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all py-8">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (email ? "Process SSO" : "Verify SSO Credentials")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative flex items-center gap-8 py-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Secure SSO Bridge</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-18 border-2 border-slate-200 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-5 hover:bg-slate-50 transition-all hover:scale-[1.01] hover:border-slate-300 group py-8"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              Sign in with institutional Account
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.6em] animate-pulse">
          Secure Institutional Handshake: NEU Node 01
        </p>
      </div>
    </div>
  );
}
