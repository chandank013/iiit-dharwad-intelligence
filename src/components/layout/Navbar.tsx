
"use client";

import Link from 'next/link';
import { useUser } from '@/firebase';
import { GraduationCap, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) return null;

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
          <div className="flex items-center gap-3 pr-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
