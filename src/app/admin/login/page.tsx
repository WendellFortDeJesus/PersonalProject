
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, User, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

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

    // Validate credentials using the generic institutional format
    if (username === 'username@neu.edu.ph' && password === '12345') {
      try {
        // Perform real Firebase sign-in to satisfy security rules
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kiosk Home
        </Button>

        <Card className="shadow-2xl border-none">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary rounded-xl shadow-lg">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline font-bold text-primary tracking-tight text-center">Staff Terminal</CardTitle>
            <CardDescription className="text-center">
              Authorized library personnel only
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="username@neu.edu.ph" 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-primary rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-primary rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <Button disabled={isLoading} className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Access Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
