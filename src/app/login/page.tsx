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
import { GraduationCap, ArrowRight, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        title: isSignUp ? "Account Created" : "Login Successful",
        description: `Welcome back to IIIT Dharwad Portal.`,
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
    <div className="min-h-screen bg-[#F6FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500 relative z-10">
        <Card className="shadow-2xl border-white/5 bg-card/50 backdrop-blur-xl rounded-[1.5rem] overflow-hidden">
          <CardHeader className="flex flex-col items-center gap-1 text-center p-6">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-lg border border-primary/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-headline font-bold text-foreground tracking-tighter">IIIT Dharwad</h1>
              <CardTitle className="text-base font-bold">{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
              <CardDescription className="text-xs font-medium">
                {isSignUp ? 'Use your institute email to get started.' : 'Access your academic portal.'}
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4 px-8">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="h-10 pl-10 bg-background/50 border-white/10 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Institute Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@iiitdwd.ac.in"
                    className="h-10 pl-10 bg-background/50 border-white/10 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-10 pl-10 bg-background/50 border-white/10 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-8">
              <Button type="submit" className="w-full h-11 font-bold group shadow-lg rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isSignUp ? 'Sign Up' : 'Continue'} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
              <button 
                type="button" 
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors" 
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}