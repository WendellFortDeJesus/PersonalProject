
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, Search } from 'lucide-react';
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
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden no-scrollbar">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      {/* Floating Binary Bits Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {Math.random() > 0.5 ? '1' : '0'}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 animate-fade-in px-4">
        <div className="flex items-center justify-between px-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-slate-500 hover:text-white font-black text-[9px] uppercase tracking-[0.4em] px-0 h-auto transition-colors"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Abort Protocol
          </Button>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Node 01: Active</span>
          </div>
        </div>

        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardHeader className="text-center pt-12 pb-8 px-12 space-y-3">
            <div className="flex justify-center mb-2">
              <div className="relative p-5 bg-primary/20 rounded-[2rem] ring-1 ring-primary/40 shadow-[0_0_30px_rgba(53,88,114,0.3)]">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-4xl font-headline font-black text-white tracking-tighter uppercase leading-none">Identity Hub</CardTitle>
              <CardDescription className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                Institutional Access Protocol
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-12 space-y-8">
            {/* Segmented Controller Slider */}
            <div className="relative bg-black/40 p-1.5 rounded-full h-14 border border-white/10 flex items-center">
              <div 
                className={cn(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-lg transition-all duration-300 ease-in-out",
                  activeTab === 'email' ? "translate-x-full" : "translate-x-0"
                )} 
              />
              <button 
                onClick={() => setActiveTab('rfid')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                  activeTab === 'rfid' ? "text-primary" : "text-slate-500"
                )}
              >
                <Fingerprint className="h-4 w-4" />
                RFID Login
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors",
                  activeTab === 'email' ? "text-primary" : "text-slate-500"
                )}
              >
                <Mail className="h-4 w-4" />
                Email SSO
              </button>
            </div>
            
            <div className="min-h-[320px]">
              {activeTab === 'rfid' ? (
                <form onSubmit={handleAuth} className="space-y-10 animate-fade-in">
                  <div className="text-center space-y-10">
                    <div className="relative flex items-center justify-center py-4">
                      {/* Lidar Scanner Visual */}
                      <div className="absolute h-56 w-56 rounded-full border border-primary/20 animate-ping opacity-20" />
                      <div className="absolute h-44 w-44 rounded-full border border-primary/10" />
                      
                      <div className="relative h-36 w-36 rounded-full bg-black/60 flex items-center justify-center shadow-[inset_0_0_40px_rgba(53,88,114,0.4)] border border-white/10 overflow-hidden">
                        <Scan className="h-14 w-14 text-primary animate-pulse" />
                        
                        {/* Red Laser Sweep */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_#ef4444] animate-[scan_3s_ease-in-out_infinite] opacity-80" />
                        
                        <style jsx global>{`
                          @keyframes scan {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(144px); }
                          }
                        `}</style>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">Scanner Waiting</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hold Card near Sensor</span>
                      </div>

                      <div className="max-w-xs mx-auto">
                        <Input 
                          ref={rfidInputRef}
                          placeholder="00-00000-000"
                          autoFocus 
                          autoComplete="off"
                          value={rfid}
                          onChange={(e) => setRfid(e.target.value)}
                          className="h-16 w-full text-center text-2xl font-mono font-black border-none bg-black/40 rounded-2xl text-white focus-visible:ring-primary shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-18 text-[11px] font-black uppercase tracking-[0.4em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl active:scale-[0.98] transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="space-y-10 animate-fade-in pt-10">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Identity Verification</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600 group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 pl-16 rounded-2xl border-none bg-black/40 font-black text-xl text-white focus:bg-black/60 focus:ring-primary transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button disabled={isLoading} className="w-full h-18 text-[11px] font-black uppercase tracking-[0.4em] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl active:scale-[0.98] transition-all">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                    </Button>
                    
                    <div className="relative flex items-center gap-6 py-4">
                      <div className="h-px bg-white/5 flex-1" />
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Alternative Node</span>
                      <div className="h-px bg-white/5 flex-1" />
                    </div>

                    <Button 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      variant="outline" 
                      className="w-full h-18 border-white/10 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-4 hover:bg-white/10 transition-all group"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google SSO
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
               <button className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-primary transition-colors">Access Assistance Node</button>
               <span className="text-[7px] font-black text-primary/40 uppercase tracking-[0.4em]">Institutional Clearance Restricted</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
