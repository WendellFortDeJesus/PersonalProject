
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function KioskAuthPage() {
  const [email, setEmail] = useState('');
  const [rfid, setRfid] = useState('');
  const [activeTab, setActiveTab] = useState('rfid');
  const [isLoading, setIsLoading] = useState(false);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

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

          <CardContent className="p-10 pt-0">
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
                  <Button disabled={isLoading} className="w-full h-14 text-[11px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-none">
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
                  <Button disabled={isLoading} className="w-full h-14 text-[11px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-none">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
