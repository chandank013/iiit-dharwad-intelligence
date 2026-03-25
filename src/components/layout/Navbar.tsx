
"use client";

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  if (isUserLoading || !user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isStudent = user.email?.startsWith('24bds');
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-primary">IIIT Dharwad</span>
          </Link>
          <div className="hidden md:flex ml-8 items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground transition-colors hover:text-primary flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/courses" className="text-muted-foreground transition-colors hover:text-primary">Courses</Link>
            {isStudent && (
              <Link href="/portfolio" className="text-muted-foreground transition-colors hover:text-primary">Portfolio</Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-border">
            <Avatar className="h-8 w-8 shadow-sm">
              <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold hidden lg:inline-block tracking-tight">{displayName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-destructive gap-2 h-9"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Log out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
