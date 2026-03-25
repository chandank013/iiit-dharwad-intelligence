"use client";

import { Navbar } from '@/components/layout/Navbar';
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { AIChatbot } from '@/components/ai-chatbot';
import { useAuth } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, loginAs } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-primary p-4 rounded-3xl text-primary-foreground shadow-xl">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-primary">IIIT Dharwad AIS</h1>
            <p className="text-muted-foreground font-medium">Academic Intelligence System</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border space-y-4">
            <h2 className="text-xl font-bold">Select Login Role</h2>
            <div className="grid gap-3">
              <Button onClick={() => loginAs('professor')} className="w-full h-12 text-base font-semibold justify-between group">
                I am a Professor <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={() => loginAs('student')} variant="outline" className="w-full h-12 text-base font-semibold justify-between group">
                I am a Student <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-4">By logging in, you agree to the Institute Academic Policies.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4">
        {user.role === 'professor' ? (
          <ProfessorDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>
      <AIChatbot />
      <footer className="py-6 border-t bg-muted/30 text-center text-xs text-muted-foreground">
        &copy; 2024 IIIT Dharwad Academic Intelligence System. All rights reserved.
      </footer>
    </div>
  );
}