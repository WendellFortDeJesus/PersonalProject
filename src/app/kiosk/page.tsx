
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState<'rfid' | 'email' | 'google'>('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentHostname, setCurrentHostname] = useState('');
  const [binaryBits, setBinaryBits] = useState<string[]>([]);
  const hasProcessedRedirect = useRef(false);
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
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname);
    }
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  const processAuthResult = async () => {
    if (!auth || !db || hasProcessedRedirect.current) return;
    
    // Check if we are returning from a redirect
    setIsSyncing(true);
    try {
      const result = await getRedirectResult(auth);
      hasProcessedRedirect.current = true;
      
      if (result) {
        const user = result.user;
        const userEmail = user.email || "";

        // DOMAIN ENFORCEMENT POST-LOGIN (To avoid 403 on initiation)
        if (!userEmail.toLowerCase().endsWith(`@${enforcedDomain}`)) {
          toast({
            variant: "destructive",
            title: "ACCESS RESTRICTED",
            description: `ONLY @${enforcedDomain} ACCOUNTS ARE PERMITTED.`,
          });
          setIsSyncing(false);
          return;
        }

        const patronsRef = collection(db, 'patrons');
        const q = query(patronsRef, where('email', '==', userEmail.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          const params = new URLSearchParams();
          params.set('isNew', 'true');
          params.set('authMethod', 'SSO Login');
          params.set('email', userEmail.toLowerCase());
          params.set('name', user.displayName || "");
          router.push(`/kiosk/purpose?${params.toString()}`);
        } else {
          const patronDoc = querySnapshot.docs[0];
          const patronData = patronDoc.data();
          if (patronData.isBlocked) {
            router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
          } else {
            router.push(`/kiosk/purpose?patronId=${patronDoc.id}&authMethod=SSO Login`);
          }
        }
      } else {
        setIsSyncing(false);
      }
    } catch (error: any) {
      setIsSyncing(false);
      console.error("SSO Redirect Error:", error);
      
      let errorTitle = "SSO SYNC FAILED";
      let errorDesc = error.message || "COULD NOT VALIDATE IDENTITY.";

      if (error.code === 'auth/unauthorized-domain') {
        errorTitle = "GATEWAY BLOCKED";
        errorDesc = `Domain '${window.location.hostname}' is not whitelisted. Update your Firebase/Google Cloud settings.`;
      } else if (error.code === 'auth/internal-error' || error.message?.includes('403')) {
        errorTitle = "GOOGLE 403 FORBIDDEN";
        errorDesc = "The security handshake was rejected. Ensure JavaScript Origins are correctly set in Google Cloud Console.";
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDesc,
      });
    }
  };

  useEffect(() => {
    // Only attempt to process if we are likely returning from Google
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
       processAuthResult();
    }
    // Also run once on mount to catch standard redirects
    processAuthResult();
  }, [auth, db]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!db) return;
      const patronsRef = collection(db, 'patrons');
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
      const value = activeTab === 'rfid' ? rfid : email.toLowerCase();

      const q = query(patronsRef, where(field, '==', value), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setIsLoading(false);
        const params = new URLSearchParams();
        params.set('isNew', 'true');
        params.set('authMethod', authMethod);
        if (activeTab === 'rfid') params.set('schoolId', rfid);
        if (activeTab === 'email') params.set('email', email.toLowerCase());
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

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsLoading(true);
    
    const provider = new GoogleAuthProvider();
    // REMOVED 'hd' parameter to prevent 403 on initial request. 
    // Domain enforcement now happens after successful login.
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      setIsLoading(false);
      let errorDesc = error.message || "FAILED TO INITIATE SSO.";
      toast({
        variant: "destructive",
        title: "GATEWAY ERROR",
        description: errorDesc,
      });
    }
  };

  const resetGateway = () => {
    hasProcessedRedirect.current = false;
    window.location.reload();
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      {/* Syncing Overlay */}
      {(isSyncing || isLoading) && (
        <div className="absolute inset-0 z-[100] bg-[#0B1218]/95 backdrop-blur-2xl flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-t-2 border-primary animate-spin" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">Synchronizing Identity</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Establishing Secure Registry Handshake</p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
               <Button 
                variant="outline" 
                onClick={resetGateway}
                className="h-10 text-[9px] font-black text-white border-white/10 hover:bg-white/5 uppercase tracking-widest gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Gateway
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
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
                  "absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] bg-primary rounded-xl transition-all duration-300 ease-in-out",
                  activeTab === 'email' ? "translate-x-full" : activeTab === 'google' ? "translate-x-[200%]" : "translate-x-0"
                )} 
              />
              <button onClick={() => setActiveTab('rfid')} className={cn("relative z-10 flex-1 text-[8px] font-black uppercase tracking-widest transition-colors", activeTab === 'rfid' ? "text-white" : "text-slate-500")}>RFID</button>
              <button onClick={() => setActiveTab('email')} className={cn("relative z-10 flex-1 text-[8px] font-black uppercase tracking-widest transition-colors", activeTab === 'email' ? "text-white" : "text-slate-500")}>EMAIL</button>
              <button onClick={() => setActiveTab('google')} className={cn("relative z-10 flex-1 text-[8px] font-black uppercase tracking-widest transition-colors", activeTab === 'google' ? "text-white" : "text-slate-500")}>GOOGLE</button>
            </div>
            
            <div className="min-h-[200px]">
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
                        <span className="text-sm font-black text-white uppercase tracking-widest mb-1">SCANNER ACTIVE</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Awaiting Identity Card</span>
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
                  <Button type="submit" disabled={isLoading} className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY IDENTITY"}
                  </Button>
                </form>
              ) : activeTab === 'email' ? (
                <div className="space-y-8 animate-fade-in pt-4">
                  <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-2">
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
                    <Button type="submit" disabled={isLoading} className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY NODE"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in pt-8 text-center">
                   <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                      <div className="relative z-10 space-y-6">
                        <div className="flex justify-center">
                           <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                              <ShieldCheck className="h-10 w-10 text-primary" />
                           </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Institutional SSO</h3>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                            Authorized Identity Handshake for @{enforcedDomain} accounts
                          </p>
                        </div>
                        <Button 
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                          className="w-full h-16 bg-white text-primary hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-4 transition-all"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Authorize via Google SSO
                        </Button>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 justify-center px-4 opacity-40">
                      <Info className="h-3 w-3 text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Ensure pop-ups are allowed for this node</span>
                   </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="w-full h-12 text-slate-500 hover:text-red-400 font-black text-[9px] uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5 transition-all"
              >
                <ArrowLeft className="mr-2 h-3 w-3" />
                ABORT PROTOCOL
              </Button>

              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Identity Node Diagnostics</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-mono text-white/40 truncate">HOST: {currentHostname || 'Detecting...'}</p>
                  <p className="text-[7px] font-mono text-white/40 truncate">AUTH: {auth?.config?.authDomain || 'Initializing...'}</p>
                </div>
              </div>
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
