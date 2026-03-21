
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Fingerprint, Scan, AlertCircle, Info } from 'lucide-react';
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
        router.push(`/kiosk/purpose?${params.toString()}`);
      } else {
        const patronData = querySnapshot.docs[0].data();
        if (patronData.isBlocked) {
          router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
        } else {
          router.push(`/kiosk/purpose?patronId=${querySnapshot.docs[0].id}`);
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
        router.push(`/kiosk/purpose?${params.toString()}`);
      } else {
        const patronData = querySnapshot.docs[0].data();
        if (patronData.isBlocked) {
          router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
        } else {
          router.push(`/kiosk/purpose?patronId=${querySnapshot.docs[0].id}`);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "PROTOCOL ERROR", description: "FAILED TO START SSO." });
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#0B1218] font-body overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="relative z-10 w-full max-w-lg space-y-6 animate-fade-in px-4">
        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10">
          <CardHeader className="text-center pt-10 pb-6 px-8">
            <div className="flex justify-center mb-1">
              <div className="p-4 bg-primary/20 rounded-2xl ring-1 ring-primary/40"><ShieldCheck className="h-8 w-8 text-primary" /></div>
            </div>
            <CardTitle className="text-3xl font-headline font-black text-white tracking-tighter uppercase">IDENTITY HUB</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-10 space-y-8">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button onClick={() => setActiveTab('rfid')} className={cn("flex-1 h-12 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all", activeTab === 'rfid' ? "bg-primary text-white" : "text-slate-500")}>RFID</button>
              <button onClick={() => setActiveTab('email')} className={cn("flex-1 h-12 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all", activeTab === 'email' ? "bg-primary text-white" : "text-slate-500")}>EMAIL</button>
              <button onClick={() => setActiveTab('google')} className={cn("flex-1 h-12 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all", activeTab === 'google' ? "bg-primary text-white" : "text-slate-500")}>GOOGLE</button>
            </div>
            
            <div className="min-h-[220px]">
              {activeTab === 'rfid' ? (
                <form onSubmit={handleAuth} className="space-y-8">
                  <Input placeholder="00-00000-000" value={rfid} onChange={(e) => setRfid(e.target.value)} className="h-14 text-center text-xl font-mono font-black border-none bg-black/40 rounded-2xl text-white" />
                  <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase rounded-2xl">VERIFY IDENTITY</Button>
                </form>
              ) : activeTab === 'email' ? (
                <form onSubmit={handleAuth} className="space-y-6">
                  <Input placeholder={`username@${enforcedDomain}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl border-none bg-black/40 font-bold text-white px-8" />
                  <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-white font-black uppercase rounded-2xl">VERIFY NODE</Button>
                </form>
              ) : (
                <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-16 bg-white text-primary hover:bg-slate-50 font-black uppercase rounded-2xl flex items-center justify-center gap-4">
                  <ShieldCheck className="h-5 w-5" /> Authorize via Google SSO
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
