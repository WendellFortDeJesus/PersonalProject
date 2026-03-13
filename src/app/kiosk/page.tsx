"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'system_config', 'settings');
  }, [db]);
  const { data: settings } = useDoc(settingsRef);

  // Live Occupancy Logic
  const visitsQuery = useMemoFirebase(() => {
    if (!db) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return query(collection(db, 'visits'), where('timestamp', '>=', today.toISOString()));
  }, [db]);
  const { data: visits } = useCollection(visitsQuery);

  const occupancy = useMemo(() => {
    if (!visits) return 0;
    return visits.filter(v => v.status === 'granted').length;
  }, [visits]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'rfid' && rfidInputRef.current && document.activeElement !== rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const patronsRef = collection(db, 'patrons');
      const authMethod = activeTab === 'rfid' ? 'School ID Login' : 'SSO Login';
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
        if (activeTab === 'rfid' && rfid.length >= 3) {
          router.push(`/kiosk/register?schoolId=${encodeURIComponent(rfid)}&authMethod=${authMethod}`);
          return;
        }
        
        const isEmailValid = activeTab === 'email' && email.toLowerCase().endsWith('@neu.edu.ph');
        if (isEmailValid) {
          router.push(`/kiosk/register?email=${encodeURIComponent(email)}&authMethod=${authMethod}`);
          return;
        }

        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "Please register your school credentials at the terminal.",
        });
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
      console.error(err);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Communication with server failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = () => {
    setEmail('sso.test@neu.edu.ph');
    setActiveTab('email');
  };

  const backgroundUrl = settings?.themeImageUrl || "https://picsum.photos/seed/library1/1920/1080";
  const textColor = settings?.welcomeTextColor === 'black' ? 'text-slate-900' : 'text-white';
  const isAtCapacity = occupancy >= (settings?.capacityLimit || 200);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Library Background" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-2 px-2">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className={cn("hover:bg-white/10 font-headline uppercase tracking-[0.2em] text-[10px]", textColor)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Terminal
          </Button>
          
          <div className={cn("px-4 py-2 rounded-full glass-overlay border border-white/20 flex items-center gap-3")}>
             <div className={cn("w-2 h-2 rounded-full", isAtCapacity ? "bg-red-500 animate-pulse" : "bg-green-500")} />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">
               Occupancy: {occupancy} / {settings?.capacityLimit || 200}
             </span>
          </div>
        </div>

        <Card 
          className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] border border-white/30 glass-overlay"
        >
          <div className="absolute top-8 left-10">
            <span className="font-headline font-black text-primary text-xs tracking-[0.3em] uppercase">PatronPoint</span>
          </div>
          
          <CardHeader className="text-center space-y-2 pb-2 pt-20">
            <CardTitle className="text-4xl font-headline font-black text-primary tracking-tight uppercase">Identity Hub</CardTitle>
            <CardDescription className="text-lg font-semibold text-slate-700 tracking-tight">
              Verify your institutional access
            </CardDescription>
          </CardHeader>

          <CardContent className="p-10 pt-6">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 h-16 bg-black/5 p-1.5 rounded-2xl">
                <TabsTrigger value="rfid" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl transition-all font-headline uppercase tracking-widest">
                  Quick Scan
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl transition-all font-headline uppercase tracking-widest">
                  SSO Login
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0">
                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/20 rounded-[3rem] bg-white/40 group transition-all">
                    <div className="relative p-10 bg-white rounded-full shadow-xl">
                      <ContactRound className="h-16 w-16 text-primary" />
                    </div>
                    <div className="mt-10 text-center space-y-2">
                      <p className="text-2xl font-headline font-black text-slate-800 uppercase tracking-tight">Scanner Active</p>
                      <p className="text-base font-semibold text-slate-500 tracking-tight">Tap your NEU School ID card</p>
                    </div>
                    
                    <div className="mt-8 w-full max-w-xs px-6 opacity-0 focus-within:opacity-100 transition-opacity">
                       <Input 
                        ref={rfidInputRef}
                        placeholder="..."
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-14 text-center text-2xl font-mono border-white/50 focus-visible:ring-primary rounded-xl bg-white/80"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || rfid.length < 3 || isAtCapacity} className="w-full h-18 text-lg font-headline font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl shadow-xl py-6">
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : isAtCapacity ? "Capacity Reached" : "Initiate Check-in"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <div className="space-y-8 py-2">
                  <Button 
                    onClick={handleSSO} 
                    disabled={isLoading || isAtCapacity} 
                    variant="outline"
                    className="w-full h-16 text-sm border-white/50 bg-white/40 hover:bg-white/60 flex items-center justify-center gap-4 rounded-2xl font-headline font-bold uppercase tracking-[0.2em] shadow-sm"
                  >
                    Login with Institutional Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-headline font-black tracking-[0.4em] text-slate-400">
                      <span className="bg-transparent px-4">Manual Identity Lookup</span>
                    </div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-headline font-black uppercase tracking-[0.3em] text-primary ml-1">Official Email</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="student@neu.edu.ph" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-16 pl-14 rounded-2xl text-lg border-white/50 bg-white/40 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading || isAtCapacity} className="w-full h-18 text-lg font-headline font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl shadow-xl py-6">
                      {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : isAtCapacity ? "Capacity Reached" : "Access Hub"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}