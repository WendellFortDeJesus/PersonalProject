
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, AlertCircle, Info, ScanLine, CornerDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { cn } from '@/lib/utils';

const MASTER_EMAIL = 'jcesperanza@neu.edu.ph';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState<'rfid' | 'email' | 'google'>('rfid');
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!db) return;

      if (activeTab === 'email' && email.toLowerCase() === MASTER_EMAIL) {
        router.push(`/kiosk/success?status=admin&name=${encodeURIComponent("JOSEPH CAESAR ESPERANZA")}`);
        return;
      }

      const field = activeTab === 'rfid' ? 'schoolId' : 'email';
      const value = activeTab === 'rfid' ? rfid : email.toLowerCase();

      const q = query(collection(db, 'patrons'), where(field, '==', value), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const params = new URLSearchParams();
        params.set('isNew', 'true');
        params.set(field, value);
        params.set('authMethod', activeTab === 'rfid' ? 'RF-ID Login' : 'SSO Login');
        router.push(`/kiosk/purpose?${params.toString()}`);
      } else {
        const patronData = querySnapshot.docs[0].data();
        if (patronData.isBlocked) {
          router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
        } else {
          router.push(`/kiosk/purpose?patronId=${querySnapshot.docs[0].id}&authMethod=${activeTab === 'rfid' ? 'RF-ID Login' : 'SSO Login'}`);
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "CONNECTION ERROR", description: "FAILED TO REACH THE REGISTRY." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = (result.user.email || "").toLowerCase();

      if (userEmail === MASTER_EMAIL) {
        router.push(`/kiosk/success?status=admin&name=${encodeURIComponent(result.user.displayName || "JOSEPH CAESAR ESPERANZA")}`);
        return;
      }

      const q = query(collection(db, 'patrons'), where('email', '==', userEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const params = new URLSearchParams();
        params.set('isNew', 'true');
        params.set('email', userEmail);
        params.set('name', result.user.displayName || "");
        params.set('authMethod', 'SSO Login');
        router.push(`/kiosk/purpose?${params.toString()}`);
      } else {
        const patronData = querySnapshot.docs[0].data();
        if (patronData.isBlocked) {
          router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
        } else {
          router.push(`/kiosk/purpose?patronId=${querySnapshot.docs[0].id}&authMethod=SSO Login`);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "PROTOCOL ERROR", description: "FAILED TO START SSO." });
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden p-6">
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Card className="border-none shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-[4.5rem] overflow-hidden bg-[#121921] backdrop-blur-3xl ring-1 ring-white/5 h-[850px] flex flex-col">
          <CardHeader className="text-center pt-16 pb-8 px-8 space-y-6 shrink-0">
            <div className="flex justify-center">
              <div className="p-5 bg-[#355872]/20 rounded-3xl ring-1 ring-[#355872]/40 shadow-[0_0_30px_rgba(53,88,114,0.3)]">
                <ShieldCheck className="h-8 w-8 text-[#7AAACE]" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-5xl font-headline font-black text-white tracking-tighter uppercase leading-none">IDENTITY HUB</CardTitle>
              <CardDescription className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.4em]">
                INSTITUTIONAL ACCESS PROTOCOL
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-12 space-y-10 flex-1 flex flex-col no-scrollbar overflow-y-auto">
            {/* Nav Tabs */}
            <div className="bg-black/30 p-2 rounded-[2rem] border border-white/5 shadow-inner shrink-0">
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('rfid')} 
                  className={cn(
                    "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
                    activeTab === 'rfid' ? "bg-[#355872] text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  RFID
                </button>
                <button 
                  onClick={() => setActiveTab('email')} 
                  className={cn(
                    "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
                    activeTab === 'email' ? "bg-[#355872] text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  EMAIL
                </button>
                <button 
                  onClick={() => setActiveTab('google')} 
                  className={cn(
                    "flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", 
                    activeTab === 'google' ? "bg-[#355872] text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  GOOGLE
                </button>
              </div>
            </div>
            
            {/* Visual Node */}
            <div className="flex flex-col items-center justify-center py-6 space-y-10 flex-1">
              <div className="relative w-56 h-56 flex items-center justify-center mb-4 shrink-0">
                <div className="absolute inset-0 rounded-full border border-[#355872]/20 animate-pulse" />
                <div className="absolute inset-6 rounded-full border border-[#355872]/10" />
                <div className="relative p-14 bg-black/40 rounded-full ring-1 ring-[#355872]/30 shadow-inner overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-[#355872]/10 to-transparent" />
                   <Scan className="h-14 w-14 text-[#355872]/60 relative z-10" />
                </div>
                
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#355872]/30 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#355872]/30 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#355872]/30 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#355872]/30 rounded-br-2xl" />
              </div>

              <div className="text-center space-y-2 shrink-0">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">SCANNER ACTIVE</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">AWAITING IDENTITY CARD</p>
              </div>

              {/* Data Input Section */}
              <div className="w-full space-y-6 flex-1 flex flex-col justify-end">
                {activeTab === 'rfid' ? (
                  <form onSubmit={handleAuth} className="space-y-6 w-full">
                    <div className="relative">
                      <Input 
                        placeholder="00-00000-000" 
                        value={rfid} 
                        onChange={(e) => setRfid(e.target.value)} 
                        className="h-20 text-center text-2xl font-mono font-black border-none bg-black/40 rounded-[1.5rem] text-white focus:ring-1 focus:ring-[#355872]/50 transition-all shadow-inner placeholder:text-slate-800" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-20 bg-[#355872] hover:bg-[#355872]/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl shadow-black/20 transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "VERIFY IDENTITY"}
                    </Button>
                  </form>
                ) : activeTab === 'email' ? (
                  <form onSubmit={handleAuth} className="space-y-6 w-full">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">INSTITUTIONAL NODE</p>
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-20 rounded-[1.5rem] border-none bg-black/40 font-bold text-lg text-white px-10 focus:ring-1 focus:ring-[#355872]/50 transition-all shadow-inner" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-20 bg-[#355872] text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-lg transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "VERIFY NODE"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4 w-full">
                    <Button 
                      onClick={handleGoogleLogin} 
                      disabled={isLoading} 
                      className="w-full h-20 bg-white text-[#0B1218] hover:bg-slate-100 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] flex items-center justify-center gap-6 shadow-xl transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <>
                          <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Authorize via Google SSO
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="space-y-6 pt-8 border-t border-white/5 shrink-0">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="w-full h-16 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-4"
              >
                <ArrowLeft className="h-4 w-4" />
                ABORT PROTOCOL
              </Button>

              <div className="p-5 bg-yellow-500/5 rounded-[1.5rem] border border-yellow-500/10 flex gap-4">
                <Info className="h-4 w-4 text-yellow-500/40 shrink-0 mt-0.5" />
                <p className="text-[8px] font-bold text-yellow-500/40 uppercase leading-relaxed tracking-[0.15em]">
                  IF AUTHENTICATION FAILS, VERIFY THAT YOUR BROWSER IS NOT BLOCKING POPUPS AND THAT THE ORIGIN ABOVE IS WHITELISTED.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
