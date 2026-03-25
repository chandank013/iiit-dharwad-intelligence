"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MOCK_SUBMISSIONS, MOCK_ASSIGNMENTS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Share2, Download, ExternalLink, Trophy, Star, TrendingUp, Loader2, Sparkles } from 'lucide-react';

export default function PortfolioPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayUser = {
    name: user.displayName || user.email?.split('@')[0] || 'Student',
    avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="space-y-10">
          <Card className="border-white/5 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2rem]">
            <div className="h-48 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent relative">
              <div className="absolute top-6 right-8 flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold px-3">
                  Class of 2025
                </Badge>
              </div>
            </div>
            <CardContent className="relative pt-0 pb-10 px-10">
              <div className="flex flex-col md:flex-row items-end gap-8 -mt-16">
                <Avatar className="h-32 w-32 border-8 border-background shadow-2xl">
                  <AvatarImage src={displayUser.avatar} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {displayUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-4xl font-bold tracking-tighter">{displayUser.name}</h1>
                    <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
                    Computer Science & Engineering • IIIT Dharwad
                  </p>
                </div>
                <div className="flex gap-3 pb-4">
                  <Button className="gap-2 font-bold px-6 shadow-xl shadow-primary/20 rounded-full">
                    <Share2 className="h-4 w-4" /> Share Profile
                  </Button>
                  <Button variant="outline" className="gap-2 rounded-full border-white/10 font-bold px-6">
                    <Download className="h-4 w-4" /> CV Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <Card className="bg-card/50 border-white/5 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> Academic Standing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <Star className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold">Core Proficiency</span>
                    </div>
                    <span className="text-sm font-bold">Systems Architect</span>
                  </div>
                  <div className="space-y-4 px-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Growth Index</span>
                      <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +14.2%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">AIS Credential</span>
                      <span className="text-xs font-bold">48/120 Credits</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/5 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI-Verified Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['Docker', 'Kubernetes', 'Microservices', 'React', 'Go', 'TypeScript', 'NLP', 'System Design'].map(skill => (
                      <Badge key={skill} className="bg-primary/10 text-primary border-primary/20 font-bold py-1 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tighter">Academic Showcase</h2>
                <Badge variant="outline" className="border-white/10 font-bold uppercase text-[10px] tracking-widest px-3">
                  Verified Submissions
                </Badge>
              </div>
              
              <div className="grid gap-6">
                {MOCK_SUBMISSIONS.filter(s => s.status === 'graded').map((sub) => {
                  const assignment = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId);
                  return (
                    <Card key={sub.id} className="group hover:border-primary/40 transition-all border-white/5 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                      <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                          <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{assignment?.title}</CardTitle>
                            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                              Evaluated {new Date(sub.submittedAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">{sub.evaluation?.totalScore}%</div>
                              <div className="text-[10px] font-bold uppercase text-muted-foreground">AIS Score</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-8 italic text-sm text-muted-foreground leading-relaxed">
                          "{sub.evaluation?.writtenFeedback}"
                        </div>
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="sm" className="gap-2 font-bold rounded-lg border-white/10 hover:bg-white/5">
                            <ExternalLink className="h-4 w-4" /> Code Review
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold hover:bg-primary/10 rounded-lg">
                            Full Academic Report
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}