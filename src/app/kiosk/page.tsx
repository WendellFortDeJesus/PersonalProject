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
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
    // Generate binary bits only on the client to avoid hydration mismatch
    setBinaryBits(Array.from({ length: 60 }, () => Math.random() > 0.5 ? '1' : '0'));
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
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      {/* Floating Binary Bits Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {binaryBits.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-6xl space-y-6 animate-fade-in px-8">
        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[4rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardHeader className="text-center pt-16 pb-10 px-16 space-y-4">
            <div className="flex justify-center mb-2">
              <div className="relative p-6 bg-primary/20 rounded-[2.5rem] ring-1 ring-primary/40 shadow-[0_0_40px_rgba(53,88,114,0.4)]">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-5xl font-headline font-black text-white tracking-tighter uppercase leading-none">IDENTITY HUB</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                Institutional Access Protocol
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-16 pb-16 space-y-12">
            {/* Segmented Control */}
            <div className="relative bg-black/40 p-3 rounded-full h-24 border border-white/10 flex items-center shadow-inner">
              <div 
                className={cn(
                  "absolute top-3 bottom-3 w-[calc(50%-12px)] bg-primary rounded-full shadow-[0_0_30px_rgba(53,88,114,0.5)] transition-all duration-300 ease-in-out",
                  activeTab === 'email' ? "translate-x-full" : "translate-x-0"
                )} 
              />
              <button 
                onClick={() => setActiveTab('rfid')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-6 text-xl font-bold transition-colors duration-300",
                  activeTab === 'rfid' ? "text-white" : "text-slate-500 hover:text-slate-400"
                )}
              >
                <Fingerprint className="h-7 w-7" />
                RFID Login
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-6 text-xl font-bold transition-colors duration-300",
                  activeTab === 'email' ? "text-white" : "text-slate-500 hover:text-slate-400"
                )}
              >
                <Mail className="h-7 w-7" />
                Email SSO
              </button>
            </div>
            
            <div className="min-h-[400px]">
              {activeTab === 'rfid' ? (
                <form onSubmit={handleAuth} className="space-y-12 animate-fade-in">
                  <div className="text-center space-y-12">
                    <div className="relative flex items-center justify-center py-6">
                      <div className="absolute h-80 w-80 rounded-full border border-primary/20 animate-[ping_3s_infinite] opacity-10" />
                      <div className="absolute h-64 w-64 rounded-full border border-primary/10 animate-[pulse_2s_infinite]" />
                      <div className="absolute h-56 w-56 rounded-full border-t-2 border-primary/40 animate-[spin_10s_linear_infinite]" />
                      
                      <div className="relative h-48 w-48 rounded-full bg-black/60 flex items-center justify-center shadow-[inset_0_0_60px_rgba(53,88,114,0.4)] border border-white/10 overflow-hidden">
                        <Scan className="h-20 w-20 text-primary animate-pulse" />
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_15px_hsl(var(--primary))] animate-[scan_3s_ease-in-out_infinite] opacity-90 z-20" />
                        
                        <style jsx global>{`
                          @keyframes scan {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(192px); }
                          }
                        `}</style>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-white mb-1">Terminal Scanner Active</span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Awaiting identity card proximity</span>
                      </div>

                      <div className="max-w-md mx-auto">
                        <Input 
                          ref={rfidInputRef}
                          placeholder="00-00000-000"
                          autoFocus 
                          autoComplete="off"
                          value={rfid}
                          onChange={(e) => setRfid(e.target.value)}
                          className="h-20 w-full text-center text-4xl font-mono font-bold border-none bg-black/40 rounded-3xl text-white focus-visible:ring-2 focus-visible:ring-primary/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] placeholder:text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Button disabled={isLoading} className="w-full h-20 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-3xl shadow-[0_0_40px_rgba(53,88,114,0.4)] active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify Identity"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push('/')}
                      className="w-full h-20 text-slate-500 hover:text-red-400 font-bold text-sm bg-white/5 rounded-3xl border border-white/5 transition-all hover:bg-red-500/10"
                    >
                      <ArrowLeft className="mr-3 h-4 w-4" />
                      Abort Protocol
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="space-y-12 animate-fade-in pt-6">
                  <div className="space-y-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-6">Identity Verification Protocol</label>
                    <div className="relative group">
                      <Mail className="absolute left-8 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-600 group-focus-within:text-primary transition-colors duration-300" />
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-20 pl-20 rounded-3xl border-none bg-black/40 font-bold text-2xl text-white focus:bg-black/60 focus:ring-2 focus:ring-primary/30 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Button disabled={isLoading} className="w-full h-20 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-3xl shadow-[0_0_40px_rgba(53,88,114,0.4)] active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify SSO Node"}
                    </Button>
                    
                    <div className="relative flex items-center gap-8 py-4">
                      <div className="h-px bg-white/5 flex-1" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Alternative Gateway</span>
                      <div className="h-px bg-white/5 flex-1" />
                    </div>

                    <Button 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      variant="outline" 
                      className="w-full h-20 border-white/10 bg-white/5 rounded-3xl text-sm font-bold text-white flex items-center justify-center gap-6 hover:bg-white/10 transition-all group shadow-2xl"
                    >
                      <svg viewBox="0 0 24 24" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google SSO
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push('/')}
                      className="w-full h-20 text-slate-500 hover:text-red-400 font-bold text-sm bg-white/5 rounded-3xl border border-white/5 transition-all hover:bg-red-500/10"
                    >
                      <ArrowLeft className="mr-3 h-4 w-4" />
                      Abort Protocol
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex flex-col items-center gap-8 pt-8 border-t border-white/5">
               <div className="flex items-center gap-4 opacity-40">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Institutional Data Clearance: Node Alpha Only</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
