
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState<'rfid' | 'email'>('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const [binaryBits, setBinaryBits] = useState<string[]>([]);
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
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

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

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && db) {
          setIsLoading(true);
          const user = result.user;
          
          if (!user.email?.endsWith(`@${enforcedDomain}`)) {
            await signOut(auth);
            setIsLoading(false);
            toast({
              variant: "destructive",
              title: "ACCESS RESTRICTED",
              description: `ONLY @${enforcedDomain} ACCOUNTS ARE AUTHORIZED FOR TERMINAL ACCESS.`,
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
        }
      } catch (error: any) {
        setIsLoading(false);
        console.error("KIOSK SSO ERROR:", error);
        if (error.code === 'auth/unauthorized-domain') {
          toast({
            variant: "destructive",
            title: "DOMAIN NOT AUTHORIZED",
            description: "PLEASE ADD THIS WORKSTATION URL TO 'AUTHORIZED DOMAINS' IN YOUR FIREBASE CONSOLE.",
          });
        } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-closure-redirect') {
          toast({
            variant: "destructive",
            title: "AUTHENTICATION ERROR",
            description: error.message || "FAILED TO FINALIZE GOOGLE SSO SESSION.",
          });
        }
      }
    };
    handleRedirect();
  }, [auth, db, enforcedDomain, router, toast]);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      setIsLoading(false);
      console.error("SSO INITIATION ERROR:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "DOMAIN NOT WHITELISTED",
          description: "ADD THIS WORKSTATION URL TO 'AUTHORIZED DOMAINS' IN YOUR FIREBASE AUTH CONSOLE.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "SSO INITIATION FAILED",
          description: "VERIFY YOUR AUTHORIZED DOMAINS IN FIREBASE CONSOLE.",
        });
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const patronsRef = collection(db!, 'patrons');
      const authMethod = activeTab === 'rfid' ? 'RF-ID Login' : 'SSO Login';
      
      const enforcedPattern = settings?.rfidPattern || "^[0-9]{2}-[0-9]{5}-[0-9]{3}$";
      const regex = new RegExp(enforcedPattern);

      if (activeTab === 'rfid' && !regex.test(rfid)) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "FORMAT REQUIRED",
          description: "EXAMPLE: 24-12345-123",
        });
        return;
      }

      if (activeTab === 'email' && !email.toLowerCase().endsWith(`@${enforcedDomain}`)) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "ACCESS RESTRICTED",
          description: `ONLY @${enforcedDomain} ACCOUNTS ARE ALLOWED.`,
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
        title: "CONNECTION ERROR",
        description: "FAILED TO REACH THE REGISTRY. PLEASE TRY AGAIN.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-8 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {binaryBits.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6 animate-fade-in px-4">
        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardHeader className="text-center pt-10 pb-6 px-8 space-y-2">
            <div className="flex justify-center mb-1">
              <div className="relative p-4 bg-primary/20 rounded-2xl ring-1 ring-primary/40 shadow-[0_0_30px_rgba(53,88,114,0.3)]">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-white tracking-tighter uppercase leading-none">IDENTITY HUB</CardTitle>
              <CardDescription className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                INSTITUTIONAL ACCESS PROTOCOL
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 space-y-8">
            <div className="relative bg-black/40 p-1.5 rounded-2xl h-14 border border-white/10 flex items-center shadow-inner">
              <div 
                className={cn(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-xl transition-all duration-300 ease-in-out",
                  activeTab === 'email' ? "translate-x-full" : "translate-x-0"
                )} 
              />
              <button 
                type="button"
                onClick={() => setActiveTab('rfid')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors duration-300",
                  activeTab === 'rfid' ? "text-white" : "text-slate-500 hover:text-slate-400"
                )}
              >
                <Fingerprint className="h-4 w-4" />
                RFID LOGIN
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('email')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors duration-300",
                  activeTab === 'email' ? "text-white" : "text-slate-500 hover:text-slate-400"
                )}
              >
                <Mail className="h-4 w-4" />
                EMAIL SSO
              </button>
            </div>
            
            <div className="min-h-[300px]">
              {activeTab === 'rfid' ? (
                <form onSubmit={handleAuth} className="space-y-8 animate-fade-in">
                  <div className="text-center space-y-8">
                    <div className="relative flex items-center justify-center py-4">
                      <div className="absolute h-40 w-40 rounded-full border border-primary/20 animate-[ping_3s_infinite] opacity-10" />
                      <div className="relative h-32 w-32 rounded-full bg-black/60 flex items-center justify-center shadow-[inset_0_0_40px_rgba(53,88,114,0.4)] border border-white/10 overflow-hidden">
                        <Scan className="h-12 w-12 text-primary animate-pulse" />
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_hsl(var(--primary))] animate-[scan_3s_ease-in-out_infinite] opacity-90 z-20" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-white uppercase tracking-widest mb-1">TERMINAL SCANNER ACTIVE</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Awaiting identity card proximity</span>
                      </div>

                      <div className="max-w-xs mx-auto">
                        <Input 
                          ref={rfidInputRef}
                          placeholder="00-00000-000"
                          autoFocus 
                          autoComplete="off"
                          value={rfid}
                          onChange={(e) => setRfid(e.target.value)}
                          className="h-14 w-full text-center text-xl font-mono font-black border-none bg-black/40 rounded-2xl text-white focus-visible:ring-1 focus-visible:ring-primary/50 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button type="submit" disabled={isLoading} className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY IDENTITY"}
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => router.push('/')}
                      className="w-full h-12 text-slate-500 hover:text-red-400 font-black text-[9px] uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5 transition-all"
                    >
                      <ArrowLeft className="mr-2 h-3 w-3" />
                      ABORT PROTOCOL
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="space-y-8 animate-fade-in pt-4">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">VERIFICATION NODE</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-16 rounded-2xl border-none bg-black/40 font-bold text-base text-white focus:bg-black/60 focus:ring-1 focus:ring-primary/30 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button type="submit" disabled={isLoading} className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY NODE"}
                    </Button>
                    
                    <div className="relative flex items-center gap-4 py-2">
                      <div className="h-px bg-white/5 flex-1 opacity-20" />
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ALTERNATIVE</span>
                      <div className="h-px bg-white/5 flex-1 opacity-20" />
                    </div>

                    <Button 
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      variant="outline" 
                      className="w-full h-14 border-white/10 bg-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      GOOGLE SSO
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => router.push('/')}
                      className="w-full h-12 text-slate-500 hover:text-red-400 font-black text-[9px] uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5 transition-all"
                    >
                      <ArrowLeft className="mr-2 h-3 w-3" />
                      ABORT PROTOCOL
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
               <span className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">INSTITUTIONAL DATA CLEARANCE: NODE ALPHA ONLY</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(128px); }
        }
      `}</style>
    </div>
  );
}
