"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, AlertCircle, Info, ScanLine, CornerDownLeft, Shield } from 'lucide-react';
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

      // Master Admin Protocol Check
      if ((activeTab === 'email' && email.toLowerCase() === MASTER_EMAIL) || (activeTab === 'rfid' && rfid === 'ADMIN-MASTER')) {
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
      
      <div className="relative z-10 w-full max-w-2xl animate-fade-in transition-all duration-500">
        <Card className="border-none shadow-[0_0_120px_rgba(0,0,0,0.9)] rounded-[4.5rem] overflow-hidden bg-[#121921] backdrop-blur-3xl ring-1 ring-white/5 h-[820px] flex flex-col">
          <CardHeader className="text-center pt-12 pb-6 px-8 space-y-4 shrink-0">
            <div className="flex justify-center">
              <div className="p-2.5 bg-[#355872]/20 rounded-xl ring-1 ring-[#355872]/40 shadow-[0_0_20px_rgba(53,88,114,0.3)]">
                <Shield className="h-6 w-6 text-[#7AAACE]" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-4xl font-headline font-black text-white tracking-tighter uppercase leading-none">IDENTITY HUB</CardTitle>
              <CardDescription className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-[0.4em]">
                INSTITUTIONAL ACCESS PROTOCOL
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-12 space-y-8 flex-1 flex flex-col no-scrollbar">
            {/* Tab Navigation */}
            <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner shrink-0">
              <div className="flex gap-1">
                {(['rfid', 'email', 'google'] as const).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)} 
                    className={cn(
                      "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300", 
                      activeTab === tab ? "bg-[#355872] text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
                    )}
                  >
                    {tab === 'rfid' ? 'RFID' : tab === 'email' ? 'EMAIL' : 'GOOGLE'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Central HUD Scanner */}
            <div className="flex flex-col items-center justify-center py-2 space-y-10 flex-1">
              <div className="relative w-44 h-44 flex items-center justify-center mb-2 shrink-0">
                <div className="absolute inset-0 rounded-full border border-[#355872]/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full border border-[#355872]/10" />
                <div className="relative p-10 bg-black/40 rounded-full ring-1 ring-[#355872]/20 shadow-inner overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-[#355872]/10 to-transparent" />
                   <Scan className="h-12 w-12 text-[#355872]/60 relative z-10" />
                </div>
                
                {/* Corner Frame Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#355872]/40 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#355872]/40 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#355872]/40 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#355872]/40 rounded-br-xl" />
              </div>

              <div className="text-center space-y-2 shrink-0">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">SCANNER ACTIVE</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">AWAITING IDENTITY CARD</p>
              </div>

              {/* Dynamic Input Forms */}
              <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
                {activeTab === 'rfid' ? (
                  <form onSubmit={handleAuth} className="space-y-6 w-full">
                    <div className="relative group">
                      <Input 
                        placeholder="00-00000-000" 
                        value={rfid} 
                        onChange={(e) => setRfid(e.target.value)} 
                        className="h-16 text-center text-xl font-mono font-bold border border-white/10 bg-black/40 rounded-2xl text-white focus:ring-1 focus:ring-white transition-all shadow-inner placeholder:text-slate-800" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-16 bg-[#355872] hover:bg-[#355872]/90 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "VERIFY IDENTITY"}
                    </Button>
                  </form>
                ) : activeTab === 'email' ? (
                  <form onSubmit={handleAuth} className="space-y-6 w-full">
                    <div className="space-y-4">
                      <Input 
                        placeholder={`username@${enforcedDomain}`} 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-16 rounded-2xl border border-white/10 bg-black/40 font-bold text-lg text-white px-8 focus:ring-1 focus:ring-white transition-all shadow-inner" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-16 bg-[#355872] text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "VERIFY IDENTITY"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6 w-full">
                    <Button 
                      onClick={handleGoogleLogin} 
                      disabled={isLoading} 
                      className="w-full h-16 bg-white text-[#0B1218] hover:bg-slate-100 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-[0.98]"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <>
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
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

            {/* Bottom Controls */}
            <div className="pt-4 shrink-0 flex flex-col items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="w-full h-14 text-slate-500 hover:text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                ABORT PROTOCOL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
