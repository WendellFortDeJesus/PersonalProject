"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ContactRound, ArrowLeft, Loader2, Globe, Library } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
      const field = activeTab === 'rfid' ? 'schoolId' : 'email';
      const value = activeTab === 'rfid' ? rfid : email;

      const q = query(patronsRef, where(field, '==', value), limit(1));
      const querySnapshot = await getDocs(q).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'patrons',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw error;
      });

      if (querySnapshot.empty) {
        setIsLoading(false);
        if (activeTab === 'rfid' && rfid.length >= 3) {
          router.push(`/kiosk/register?schoolId=${encodeURIComponent(rfid)}`);
          return;
        }
        
        const isEmailValid = activeTab === 'email' && email.toLowerCase().endsWith('@neu.edu.ph');
        if (isEmailValid) {
          router.push(`/kiosk/register?email=${encodeURIComponent(email)}`);
          return;
        }

        toast({
          variant: "destructive",
          title: "Registration Required",
          description: "No profile found. Please register using the form.",
        });
        return;
      }

      const patronDoc = querySnapshot.docs[0];
      const patronData = patronDoc.data();

      if (patronData.isBlocked) {
        const visitData = {
          patronId: patronDoc.id,
          schoolId: patronData.schoolId,
          patronName: patronData.name,
          patronDepartments: patronData.departments,
          patronAge: patronData.age,
          patronGender: patronData.gender,
          purpose: "Restricted Attempt",
          timestamp: new Date().toISOString(),
          status: "blocked"
        };
        
        addDoc(collection(db, 'visits'), visitData).catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'visits',
            operation: 'create',
            requestResourceData: visitData,
          }));
        });

        router.push(`/kiosk/success?status=blocked&name=${encodeURIComponent(patronData.name)}`);
      } else {
        router.push(`/kiosk/purpose?patronId=${patronDoc.id}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Could not verify identity. Please try again.",
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
  const overlayOpacity = settings?.overlayOpacity ?? 0.85;
  const textColor = settings?.welcomeTextColor === 'black' ? 'text-slate-900' : 'text-white';

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src={backgroundUrl} 
          alt="Library Background" 
          fill 
          className="object-cover transition-opacity duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className={cn("group mb-2 hover:bg-white/10 font-headline uppercase tracking-[0.2em] text-[10px]", textColor)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Cancel Check-in
        </Button>

        <Card 
          className="shadow-2xl border-none overflow-hidden rounded-[2.5rem] border border-white/30 glass-overlay"
        >
          <div className="absolute top-8 left-10">
            <div className="flex items-center gap-2">
              <span className="font-headline font-black text-primary text-xs tracking-[0.3em] uppercase">NEU LIBRARY</span>
            </div>
          </div>
          
          <CardHeader className="text-center space-y-2 pb-2 pt-20">
            <CardTitle className="text-4xl font-headline font-black text-primary tracking-tight uppercase">Identity Terminal</CardTitle>
            <CardDescription className="text-lg font-semibold text-slate-700 tracking-tight">
              Verify your School ID to enter
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <Tabs defaultValue="rfid" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 h-16 bg-black/5 p-1.5 rounded-2xl">
                <TabsTrigger value="rfid" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all font-headline uppercase tracking-widest">
                  RFID Tap
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all font-headline uppercase tracking-widest">
                  SSO Login
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="rfid" className="mt-0">
                <form onSubmit={handleAuth} className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-primary/20 rounded-[3rem] bg-white/40 group transition-all hover:bg-white/60 hover:border-primary/40">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative p-10 bg-white rounded-full shadow-xl">
                        <ContactRound className="h-16 w-16 text-primary" />
                      </div>
                    </div>
                    <div className="mt-10 text-center space-y-2">
                      <p className="text-2xl font-headline font-black text-slate-800 uppercase tracking-tight">Scanner Ready</p>
                      <p className="text-base font-semibold text-slate-500 tracking-tight">Place your NEU School ID near the terminal</p>
                    </div>
                    
                    <div className="mt-8 w-full max-w-xs px-6 opacity-0 focus-within:opacity-100 transition-opacity">
                       <Input 
                        ref={rfidInputRef}
                        placeholder="Scanner input active..."
                        autoFocus 
                        autoComplete="off"
                        value={rfid}
                        onChange={(e) => setRfid(e.target.value)}
                        className="h-14 text-center text-2xl font-mono border-white/50 focus-visible:ring-primary rounded-xl bg-white/80 shadow-sm"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || rfid.length < 3} className="w-full h-16 text-lg font-headline font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Initiate Verification"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                <div className="space-y-8 py-2">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleSSO} 
                      disabled={isLoading} 
                      variant="outline"
                      className="w-full h-16 text-sm border-white/50 bg-white/40 hover:bg-white/60 flex items-center justify-center gap-4 rounded-2xl font-headline font-bold uppercase tracking-[0.2em] transition-all hover:border-primary/30 shadow-sm"
                    >
                      Sign in with NEU Email
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-headline font-black tracking-[0.4em] text-slate-400">
                      <span className="bg-transparent px-4 backdrop-blur-sm">Manual Lookup</span>
                    </div>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-headline font-black uppercase tracking-[0.3em] text-primary ml-1">Official University Email</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-5 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="j.doe@neu.edu.ph" 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-16 pl-14 rounded-2xl text-lg border-white/50 bg-white/40 focus-visible:ring-primary font-body"
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full h-16 text-lg font-headline font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                      {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Access System"}
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
