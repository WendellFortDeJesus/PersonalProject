
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
      {/* Institutional Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/library1/1920/1080"
          alt="University Background"
          fill
          className="object-cover opacity-10 grayscale"
          priority
          data-ai-hint="modern library"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-slate-500 hover:text-primary font-black text-[9px] uppercase tracking-[0.3em] px-4 h-10 rounded-full hover:bg-white/50 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Abort Process
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Node Secure</span>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-slate-200/50">
          <CardHeader className="text-center pt-16 pb-8 px-12">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-primary rounded-[2rem] shadow-xl shadow-primary/20">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter uppercase leading-none">Identity Hub</CardTitle>
            <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">
              Institutional Verification Required
            </CardDescription>
          </CardHeader>

          <CardContent className="p-12 pt-0 space-y-10">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 bg-slate-100/50 p-1.5 rounded-[1.75rem]">
                {settings?.allowRfidScan !== false && (
                  <TabsTrigger 
                    value="rfid" 
                    className="text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] h-12 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" />
                    RFID Card
                  </TabsTrigger>
                )}
                {settings?.allowEmailLogin !== false && (
                  <TabsTrigger 
                    value="email" 
                    className="text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] h-12 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email SSO
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-10">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] scale-[0.98] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center py-16 px-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 transition-all group-focus-within:border-primary/20 group-focus-within:bg-white">
                      <div className="relative mb-8">
                        <ContactRound className="h-16 w-16 text-slate-200 group-focus-within:text-primary transition-colors" />
                        <div className="absolute -top-1 -right-1">
                          <Scan className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2 mb-10">
                        <p className="text-sm font-black text-primary uppercase tracking-tight">Scan Identity Card</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Place card near the terminal sensor</p>
                      </div>
                      <Input 
                        ref={rfidInputRef}
                        placeholder="00-00000-000"
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-16 w-full max-w-xs text-center text-2xl font-mono font-black border-none bg-white shadow-xl shadow-slate-100 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (rfid ? "Continue to Gateway" : "Verify Institutional Identity")}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Institutional SSO Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-5 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder={`user@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 pl-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-base focus:bg-white focus:border-primary/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (email ? "Continue to Gateway" : "Verify SSO Credentials")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative flex items-center gap-6 py-4">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Global SSO</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-16 border-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-slate-50 transition-all hover:scale-[1.01] group"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google Account
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-slate-300 text-[8px] font-black uppercase tracking-[0.5em] animate-pulse">
          Secure Institutional Handshake in Progress
        </p>
      </div>
    </div>
  );
}
