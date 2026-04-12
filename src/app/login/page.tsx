"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, ArrowRight, Loader2, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!email.endsWith('@iiitdwd.ac.in')) {
      toast({
        title: "Invalid Email",
        description: "Please use your IIIT Dharwad email address (@iiitdwd.ac.in).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;
      const isStudent = email.startsWith('24bds');
      const role = isStudent ? 'Student' : 'Professor';
      const roleCollection = isStudent ? 'student_roles' : 'professor_roles';

      if (!firestore) return;

      const userRef = doc(firestore, 'users', uid);
      const roleRef = doc(firestore, roleCollection, uid);

      const userData = {
        id: uid,
        firstName: name.split(' ')[0] || firebaseUser.displayName?.split(' ')[0] || email.split('@')[0],
        lastName: name.split(' ').slice(1).join(' ') || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: email,
        role: role,
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, userData, { merge: true });
      await setDoc(roleRef, {
        id: uid,
        email: email,
        role: role,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: isSignUp ? "Account Created" : "Welcome Back",
        description: isSignUp ? "Your academic profile is ready." : "Authenticated successfully.",
      });
      
      router.push('/');
    } catch (error: any) {
      console.error(error);
      let message = "An error occurred during authentication.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid credentials. Please check your email and password.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try logging in instead.";
      }
      
      toast({
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cinematic Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700 relative z-10">
        <Card className="shadow-2xl border-white/5 dark:bg-card/40 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-col items-center gap-2 text-center p-10 pb-6">
            <div className="bg-primary/10 p-4 rounded-3xl text-primary shadow-inner border border-primary/20 ring-1 ring-primary/10">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">IIIT Dharwad</h1>
              <CardDescription className="text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground uppercase tracking-[0.2em] pt-1">
                <Sparkles className="h-3 w-3 text-primary" /> AIS Platform
              </CardDescription>
            </div>
          </CardHeader>
          
          <div className="px-10 pb-2">
            <CardTitle className="text-xl font-bold">{isSignUp ? 'Create your profile' : 'Welcome back'}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {isSignUp ? 'Join the digital academic portal today.' : 'Please enter your credentials to continue.'}
            </p>
          </div>

          <form onSubmit={handleAuth}>
            <CardContent className="space-y-5 px-10 pt-6">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Identity Name</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      placeholder="e.g. Chandan Kumar"
                      className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus-visible:ring-primary/20 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Institute Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="roll@iiitdwd.ac.in"
                    className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus-visible:ring-primary/20 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secure Password</Label>
                  {!isSignUp && <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot?</button>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus-visible:ring-primary/20 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 p-10 pt-4">
              <Button type="submit" className="w-full h-14 font-bold group shadow-xl shadow-primary/20 rounded-2xl text-lg transition-all active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isSignUp ? 'Initialize Profile' : 'Enter Portal'} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
              <div className="text-center">
                <button 
                  type="button" 
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest" 
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Already enrolled? Sign in' : "New to AIS? Request account"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-50">
          Academic Integrity & Information System • IIIT Dharwad
        </p>
      </div>
    </div>
  );
}