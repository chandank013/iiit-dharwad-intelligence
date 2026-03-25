"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { GraduationCap, LayoutDashboard, ChevronDown, LogOut, User as UserIcon, Mail, IdCard } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  if (isUserLoading || !user) return null;

  const isStudent = user.email?.startsWith('24bds');
  const role = isStudent ? 'Student' : 'Professor';
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];
  
  // Prefix "Dr." for professors as seen in reference
  const nameDisplay = !isStudent ? `Dr. ${firstName}` : firstName;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
          <div className="flex items-center gap-2 border-r pr-4 border-border/50">
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full hover:bg-accent/50 transition-all outline-none group border border-transparent hover:border-border">
                <Avatar className="h-8 w-8 shadow-sm border border-primary/10">
                  <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {displayName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-xs font-bold tracking-tight">{nameDisplay}</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{role}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <IdCard className="h-3 w-3" /> User Identity
                  </div>
                  <div className="text-sm font-bold truncate">{displayName}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                    <Mail className="h-3 w-3" /> {user.email}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl focus:bg-primary/5 focus:text-primary group" asChild>
                <Link href="/portfolio" className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground group-focus:text-primary" />
                  <span className="text-xs font-bold">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="p-3 cursor-pointer rounded-xl focus:bg-destructive/10 focus:text-destructive group" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 text-muted-foreground group-focus:text-destructive" />
                <span className="text-xs font-bold">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
