
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, HelpCircle } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] font-body overflow-hidden">
      {/* Background with technical grid/circuit patterns */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center justify-between px-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-primary font-black text-[9px] uppercase tracking-[0.2em] px-0 h-auto"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Abort Process
          </Button>
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Terminal Node Alpha</span>
          </div>
        </div>

        <Card className="border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-slate-200/50">
          <CardHeader className="text-center pt-12 pb-8 px-12 space-y-4">
            <div className="flex justify-center mb-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-5 bg-slate-900 rounded-[2rem] shadow-xl">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tighter uppercase leading-none">Identity Hub</CardTitle>
              <CardDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">
                Institutional Verification Protocol
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-12 space-y-10">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 bg-slate-100/80 p-1.5 rounded-full h-14 border border-slate-200/50">
                {settings?.allowRfidScan !== false && (
                  <TabsTrigger 
                    value="rfid" 
                    className="text-[9px] font-black uppercase tracking-widest rounded-full h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all flex items-center gap-2"
                  >
                    <Fingerprint className="h-4 w-4" />
                    RFID Card
                  </TabsTrigger>
                )}
                {settings?.allowEmailLogin !== false && (
                  <TabsTrigger 
                    value="email" 
                    className="text-[9px] font-black uppercase tracking-widest rounded-full h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md transition-all flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email SSO
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-10">
                  <div className="text-center space-y-8">
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Scanner Ready</p>
                    
                    {/* Scanner Visual */}
                    <div className="relative flex items-center justify-center py-4">
                      <div className="absolute h-48 w-48 rounded-full border border-primary/5 animate-[ping_3s_infinite]" />
                      <div className="absolute h-40 w-40 rounded-full border border-primary/10 animate-[ping_2s_infinite]" />
                      <div className="relative h-32 w-32 rounded-full bg-gradient-to-b from-primary to-primary/80 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                        <Scan className="h-12 w-12 text-white animate-pulse" />
                        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Hold Card to Sensor</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Waiting for proximity...</p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <Input 
                        ref={rfidInputRef}
                        placeholder="00-00000-000"
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-14 w-full text-center text-xl font-mono font-black border-none bg-slate-50/50 rounded-2xl focus-visible:ring-primary transition-all"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/95 text-white rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (rfid ? "Process Identity" : "Continue")}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3">Institutional Identity</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 pl-14 rounded-2xl border-slate-200 bg-slate-50/50 font-black text-lg focus:bg-white focus:border-primary/30 transition-all shadow-inner border-2"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/95 text-white rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (email ? "Process SSO" : "Continue")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative flex items-center gap-6 py-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.4em]">Secure SSO Bridge</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-16 border-2 border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-slate-50 transition-all group"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 grayscale group-hover:grayscale-0 transition-all" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Institutional Login
            </Button>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <Button variant="link" className="text-[8px] font-bold text-slate-300 uppercase tracking-widest p-0 h-auto hover:text-primary">Need Help?</Button>
               <span className="text-[7px] font-black text-slate-200 uppercase tracking-widest">Institutional Access Only</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 animate-pulse">Node 01: Secure Handshake Active</p>
        </div>
      </div>
    </div>
  );
}

