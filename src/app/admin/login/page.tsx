"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-primary font-black text-[9px] uppercase tracking-widest px-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kiosk Home
        </Button>

        <Card className="shadow-2xl shadow-slate-200/80 border-slate-100 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-12 pb-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-[1.5rem] text-primary shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Staff Terminal</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">
              Authorized Personnel Node Entry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-8">
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Identity UID</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="user@neu.edu.ph" 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/30 font-bold text-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Token</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 pr-12 rounded-2xl border-slate-200 bg-slate-50/30 font-bold text-sm focus-visible:ring-primary focus-visible:border-primary transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button 
                disabled={isLoading} 
                className="w-full h-16 text-[12px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authorize Entry"}
              </Button>
            </form>

            <div className="relative flex items-center gap-6 py-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">OR</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline" 
              className="w-full h-16 border-slate-200 bg-white rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Institutional Access Point Node 01
        </p>
      </div>
    </div>
  );
}
