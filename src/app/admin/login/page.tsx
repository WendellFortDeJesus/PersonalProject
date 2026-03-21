
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [binaryBits, setBinaryBits] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsLoading(true);
          const user = result.user;
          if (user.email !== 'jcesperanza@neu.edu.ph') {
            await signOut(auth);
            setIsLoading(false);
            toast({
              variant: "destructive",
              title: "ACCESS RESTRICTED",
              description: "UNAUTHORIZED ACCOUNT. ONLY JCESPERANZA@NEU.EDU.PH IS PERMITTED.",
            });
            return;
          }
          router.push('/admin/dashboard');
        }
      } catch (error: any) {
        setIsLoading(false);
        console.error("AUTH REDIRECT ERROR:", error);
        if (error.code === 'auth/unauthorized-domain') {
          toast({
            variant: "destructive",
            title: "DOMAIN NOT AUTHORIZED",
            description: "PLEASE ADD THIS WORKSTATION URL TO 'AUTHORIZED DOMAINS' IN YOUR FIREBASE CONSOLE.",
          });
        } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-closure-redirect') {
          toast({
            variant: "destructive",
            title: "AUTHENTICATION FAILED",
            description: error.message || "FAILED TO FINALIZE SECURE SESSION.",
          });
        }
      }
    };
    handleRedirect();
  }, [auth, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username === 'jcesperanza@neu.edu.ph' && password === '12345') {
      try {
        await signInAnonymously(auth);
        setIsLoading(false);
        router.push('/admin/dashboard');
      } catch (error: any) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "SYSTEM AUTH ERROR",
          description: error.message || "FAILED TO ESTABLISH SECURE SESSION.",
        });
      }
    } else {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "AUTHENTICATION FAILED",
        description: "INVALID CREDENTIALS. ACCESS DENIED.",
      });
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      setIsLoading(false);
      console.error("SSO INITIATION ERROR:", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          variant: "destructive",
          title: "DOMAIN NOT WHITELISTED",
          description: "ADD THIS WORKSTATION DOMAIN TO 'AUTHORIZED DOMAINS' IN YOUR FIREBASE CONSOLE.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "SSO INITIALIZATION ERROR",
          description: "VERIFY THAT YOUR CURRENT DOMAIN IS WHITELISTED IN FIREBASE CONSOLE.",
        });
      }
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#0B1218] flex items-center justify-center p-4 font-body overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse:60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0B1218]/50 to-[#0B1218]" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-10 font-mono text-[10px] text-primary/40 leading-none select-none">
        {binaryBits.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in flex flex-col items-center">
        <Card className="w-full border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10 relative">
          <CardHeader className="text-center pt-10 pb-4 px-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/20 rounded-[1.5rem] text-primary shadow-[0_0_40px_rgba(53,88,114,0.4)] ring-1 ring-primary/40">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-black text-white tracking-tighter uppercase leading-none">STAFF TERMINAL</CardTitle>
            <CardDescription className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">
              AUTHORIZED PERSONNEL NODE ENTRY
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">IDENTITY UID</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="user@neu.edu.ph" 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-14 pl-14 w-full rounded-2xl border-none bg-black/60 font-bold text-base text-white focus:ring-1 focus:ring-primary/60 focus:bg-black/80 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">ACCESS TOKEN</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-14 pr-14 w-full rounded-2xl border-none bg-black/60 font-bold text-base text-white focus:ring-1 focus:ring-primary/60 focus:bg-black/80 transition-all shadow-inner"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button 
                type="submit"
                disabled={isLoading} 
                className="w-full h-16 text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl transition-all active:scale-[0.98] shadow-lg"
              >
                {isLoading ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : "AUTHORIZE ENTRY"}
              </Button>
            </form>

            <div className="relative flex items-center justify-center gap-4 py-1">
              <div className="h-px bg-white/10 flex-1 opacity-20" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">ALTERNATIVE GATEWAY</span>
              <div className="h-px bg-white/10 flex-1 opacity-20" />
            </div>

            <Button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-14 border-white/5 bg-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.15em] flex items-center justify-center gap-4 hover:bg-white/10 transition-all group"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              CONTINUE WITH GOOGLE
            </Button>

            <div className="pt-4 border-t border-white/5">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.push('/')}
                className="w-full h-12 text-slate-500 hover:text-white font-black text-[8px] uppercase tracking-[0.3em] rounded-xl hover:bg-white/5 transition-all group"
              >
                <ArrowLeft className="mr-3 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                RETURN TO KIOSK GATEWAY
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[7px] font-black text-slate-700 uppercase tracking-[0.5em] mt-2">
          INSTITUTIONAL ACCESS POINT NODE 01
        </p>
      </div>
    </div>
  );
}
