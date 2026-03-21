
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email) {
        // Search for user in patrons
        const patronsRef = collection(db, 'patrons');
        const q = query(patronsRef, where('email', '==', user.email), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          router.push(`/kiosk/register?authMethod=SSO Login&email=${encodeURIComponent(user.email)}`);
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

      const enforcedDomain = settings?.enforcedDomain || "neu.edu.ph";
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
      const querySnapshot = await getDocs(q).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'patrons',
          operation: 'list',
        }));
        throw error;
      });

      if (querySnapshot.empty) {
        setIsLoading(false);
        const params = new URLSearchParams();
        params.set('authMethod', authMethod);
        if (activeTab === 'rfid') params.set('schoolId', rfid);
        if (activeTab === 'email') params.set('email', email);
        router.push(`/kiosk/register?${params.toString()}`);
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-body">
      <div className="w-full max-w-xl space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="text-slate-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-12 pb-6">
            <CardTitle className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Identity Hub</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Verification Required
            </CardDescription>
          </CardHeader>

          <CardContent className="p-10 pt-0 space-y-8">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-50 p-1 rounded-xl">
                {settings?.allowRfidScan !== false && (
                  <TabsTrigger value="rfid" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:shadow-sm">RFID Card</TabsTrigger>
                )}
                {settings?.allowEmailLogin !== false && (
                  <TabsTrigger value="email" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:shadow-sm">Email SSO</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-12 border border-slate-100 rounded-3xl bg-slate-50/30">
                    <ContactRound className="h-12 w-12 text-slate-200 mb-6" />
                    <div className="text-center space-y-2 mb-8">
                      <p className="text-sm font-bold text-slate-700">Scan Identity Card</p>
                      <p className="text-[11px] text-slate-400">Place card near the terminal sensor</p>
                    </div>
                    <Input 
                      ref={rfidInputRef}
                      placeholder="00-00000-000"
                      autoFocus 
                      autoComplete="off"
                      value={rfid}
                      onChange={(e) => setRfid(e.target.value)}
                      className="h-14 w-64 text-center text-xl font-mono font-bold border-slate-200 rounded-xl bg-white shadow-none"
                    />
                  </div>
                  <Button disabled={isLoading} className="w-full h-14 text-[11px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0 outline-none">
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Institutional Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                      <Input 
                        placeholder={`user@${settings?.enforcedDomain || 'neu.edu.ph'}`} 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 pl-12 rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full h-14 text-[11px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OR</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-14 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
