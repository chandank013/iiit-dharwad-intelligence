"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, LayoutDashboard, UserCircle, LogOut, ChevronDown, Repeat } from 'lucide-react';

export function Navbar() {
  const { user, loginAs, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground group-hover:scale-110 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-primary">IIIT Dharwad AIS</span>
          </Link>
          <div className="hidden md:flex ml-8 items-center gap-6 text-sm font-medium">
            <Link href="/dashboard" className="text-foreground transition-colors hover:text-primary flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/courses" className="text-muted-foreground transition-colors hover:text-primary">Courses</Link>
            {user.role === 'student' && (
              <Link href="/portfolio" className="text-muted-foreground transition-colors hover:text-primary">Portfolio</Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => loginAs(user.role === 'professor' ? 'student' : 'professor')} className="hidden sm:flex items-center gap-2">
            <Repeat className="h-4 w-4" /> Switch to {user.role === 'professor' ? 'Student' : 'Professor'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2 h-10 px-2 rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-none gap-1">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user.role}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}