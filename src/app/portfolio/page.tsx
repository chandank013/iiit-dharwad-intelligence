"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MOCK_USERS, MOCK_SUBMISSIONS, MOCK_ASSIGNMENTS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Share2, Download, ExternalLink, Trophy, Star, TrendingUp } from 'lucide-react';

export default function PortfolioPage() {
  const student = MOCK_USERS[1];

  return (
    <div className="min-h-screen bg-[#F6FAFC]">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="border-none shadow-xl overflow-hidden">
            <div className="h-32 bg-primary relative" />
            <CardContent className="relative pt-0 pb-6 px-8">
              <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-2">
                  <h1 className="text-2xl font-headline font-bold">{student.name}</h1>
                  <p className="text-muted-foreground">Computer Science & Engineering • 2021-25</p>
                </div>
                <div className="flex gap-2 pb-2">
                  <Button className="gap-2">
                    <Share2 className="h-4 w-4" /> Share Profile
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> CV Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                        <Star className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Core Competency</span>
                    </div>
                    <span className="text-sm font-bold">Backend Dev</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-100 text-green-700">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Growth Index</span>
                    </div>
                    <span className="text-sm font-bold">+12% YoY</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Credits Earned</span>
                    </div>
                    <span className="text-sm font-bold">48/120</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Skills (AI Detected)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary">Docker</Badge>
                    <Badge className="bg-primary">Microservices</Badge>
                    <Badge className="bg-primary">React</Badge>
                    <Badge className="bg-primary">TypeScript</Badge>
                    <Badge className="bg-primary">NLP</Badge>
                    <Badge variant="secondary">Go</Badge>
                    <Badge variant="secondary">SQL</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-headline font-bold">Completed Assignments</h2>
              <div className="space-y-4">
                {MOCK_SUBMISSIONS.filter(s => s.status === 'graded').map((sub) => {
                  const assignment = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId);
                  return (
                    <Card key={sub.id} className="hover:border-primary transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{assignment?.title}</CardTitle>
                          <CardDescription>Submitted on {new Date(sub.submittedAt).toLocaleDateString()}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{sub.evaluation?.totalScore}%</div>
                          <Badge variant="outline">Graded by AI</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 italic">
                          "{sub.evaluation?.writtenFeedback}"
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-3 w-3" /> View Project
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 text-primary">
                            Full Report
                          </Button>
                        </div>
                      </CardContent>
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