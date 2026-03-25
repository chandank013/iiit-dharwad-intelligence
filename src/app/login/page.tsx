"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
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

      // Idempotent User Profile and Role Setup
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

      // Set user profile
      await setDoc(userRef, userData, { merge: true });

      // Set role sentinel
      await setDoc(roleRef, {
        id: uid,
        email: email,
        role: role,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: isSignUp ? "Account Created" : "Login Successful",
        description: `Welcome to IIIT Dharwad AIS.`,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary p-4 rounded-3xl text-primary-foreground shadow-xl">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary">IIIT Dharwad AIS</h1>
          <p className="text-muted-foreground font-medium">Academic Intelligence System</p>
        </div>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Register with your institute email to get started.' 
                : 'Enter your institute credentials to access your dashboard.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Institute Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@iiitdwd.ac.in"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1">
                  Students: 24bdsXXX@iiitdwd.ac.in | Professors: name@iiitdwd.ac.in
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 text-base font-semibold group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Continue'} 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                type="button" 
                className="w-full text-xs" 
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}