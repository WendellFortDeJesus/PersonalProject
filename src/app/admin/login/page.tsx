"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    // Ensure the user is prompted to select an account
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Strict Domain Enforcement
      if (!user.email?.endsWith('@neu.edu.ph')) {
        await signOut(auth);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "Only @neu.edu.ph accounts are authorized for terminal access.",
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
          className="text-slate-400 hover:text-primary font-black text-[9px] uppercase tracking-widest px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kiosk Home
        </Button>

        <Card className="shadow-sm border-slate-100 rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-10 pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline font-bold text-slate-900 tracking-tight">Staff Terminal</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Authorized Personnel Node
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity UID</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                    <Input 
                      placeholder="user@neu.edu.ph" 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Token</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-slate-200 bg-white font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
              <Button disabled={isLoading} className="w-full h-14 text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl transition-all active:scale-[0.98]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authorize Entry"}
              </Button>
            </form>

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
