
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
    // Generate binary decoration bits only on client to prevent hydration mismatch
    setBinaryBits(Array.from({ length: 40 }, () => Math.random() > 0.5 ? '1' : '0'));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate credentials using the secure institutional identity
    if (username === 'jcesperanza@neu.edu.ph' && password === '12345') {
      try {
        await signInAnonymously(auth);
        setIsLoading(false);
        router.push('/admin/dashboard');
      } catch (error: any) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "System Auth Error",
          description: error.message || "Failed to establish secure session.",
        });
      }
    } else {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid credentials. Please contact IT support.",
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email !== 'jcesperanza@neu.edu.ph') {
        await signOut(auth);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "This account is not authorized for administrative terminal access. Only jcesperanza@neu.edu.ph is permitted.",
        });
        return;
      }

      router.push('/admin/dashboard');
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Google Auth Failed",
        description: error.message || "Failed to sign in with Google.",
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B1218] flex items-center justify-center p-4 font-body overflow-x-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2633_1px,transparent_1px),linear-gradient(to_bottom,#1a2633_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse:60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
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

      <div className="relative z-10 w-full max-w-xl space-y-8 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest px-0 hover:bg-transparent transition-colors group"
        >
          <ArrowLeft className="mr-3 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Kiosk Home
        </Button>

        <Card className="border-none shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl ring-1 ring-white/10 relative">
          {/* Card Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20 rounded-tl-[3rem] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20 rounded-br-[3rem] pointer-events-none" />
          
          <CardHeader className="text-center pt-16 pb-8">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-primary/20 rounded-[2rem] text-primary shadow-[0_0_40px_rgba(53,88,114,0.4)] ring-1 ring-primary/40">
                <ShieldCheck className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-4xl font-headline font-black text-white tracking-tighter uppercase leading-none">Staff Terminal</CardTitle>
            <CardDescription className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
              Authorized Personnel Node Entry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 pt-6 space-y-10">
            <form onSubmit={handleLogin} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identity UID</label>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="user@neu.edu.ph" 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-16 pl-14 rounded-2xl border-none bg-black/40 font-bold text-lg text-white focus:ring-2 focus:ring-primary/40 focus:bg-black/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Access Token</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-16 pl-14 pr-14 rounded-2xl border-none bg-black/40 font-bold text-lg text-white focus:ring-2 focus:ring-primary/40 focus:bg-black/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button 
                disabled={isLoading} 
                className="w-full h-20 text-[14px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary to-secondary hover:brightness-110 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(53,88,114,0.4)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Authorize Entry"}
              </Button>
            </form>

            <div className="relative flex items-center gap-8 py-4">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Alternative</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-20 border-white/10 bg-white/5 rounded-2xl text-[12px] font-bold text-white uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-white/10 transition-all shadow-sm group"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
          Institutional Access Point Node 01
        </p>
      </div>
    </div>
  );
}
