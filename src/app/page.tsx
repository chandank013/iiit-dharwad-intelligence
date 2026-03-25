"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { AIChatbot } from '@/components/ai-chatbot';
import { useAuth } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
