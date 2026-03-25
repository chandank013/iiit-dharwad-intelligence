"use client";

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Trophy, 
  FolderRoot, 
  MessageSquare, 
  LogOut, 
  Search, 
  Bell, 
  Sun, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Zap,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const performanceData = [
  { name: 'Week 1', score: 65, avg: 60 },
  { name: 'Week 2', score: 72, avg: 62 },
  { name: 'Week 3', score: 68, avg: 65 },
  { name: 'Week 4', score: 78, avg: 68 },
  { name: 'Week 5', score: 82, avg: 70 },
  { name: 'Week 6', score: 84, avg: 72 },
];

const skillData = [
  { subject: 'Code Quality', A: 85, fullMark: 100 },
  { subject: 'Complexity', A: 70, fullMark: 100 },
  { subject: 'Documentation', A: 90, fullMark: 100 },
  { subject: 'Logic', A: 75, fullMark: 100 },
  { subject: 'UI/UX', A: 60, fullMark: 100 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return doc(firestore, 'courses', courseId as string);
  }, [firestore, courseId]);
  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'assignments'), orderBy('createdAt', 'desc'));
  }, [firestore, courseId]);
  const { data: assignments, isLoading: isAssignmentsLoading } = useCollection(assignmentsQuery);

  const isStudent = user?.email?.startsWith('24bds');

  if (isUserLoading || isCourseLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Course not found.
      </div>
    );
  }

  const sidebarLinks = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'resources', label: 'Course Library', icon: FolderRoot },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'grades', label: 'Gradebook', icon: Trophy },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 flex flex-col shrink-0 bg-card/20 backdrop-blur-xl">
        <div className="p-6">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all text-[10px] font-bold uppercase tracking-widest mb-10 group">
            <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> BACK TO CATALOG
          </Link>
          
          <div className="space-y-8">
            <div className="px-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 opacity-50 px-3">Main Menu</h3>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs transition-all font-bold",
                      activeTab === link.id 
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <link.icon className={cn("h-4 w-4", activeTab === link.id ? "text-primary" : "text-muted-foreground")} />
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="px-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 opacity-50 px-3">Intelligence</h3>
              <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all font-bold">
                  <Zap className="h-4 w-4" /> AI Companion
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all font-bold">
                  <Calendar className="h-4 w-4" /> Course Timeline
                </button>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mb-6">
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> AIS Tip
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Complete Module 3 to unlock your midterm prediction.</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[10px] font-bold uppercase tracking-widest" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4" /> Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Experience */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-background">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold tracking-tight uppercase tracking-[0.2em] opacity-80">Academic Intelligence System</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden lg:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Query course knowledge base..." 
                className="bg-card/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[11px] w-64 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium"
              />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right leading-none">
                <div className="text-[11px] font-bold">{user.displayName?.split(' ')[0] || 'User'}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 opacity-60 font-bold">{isStudent ? 'Student' : 'Professor'}</div>
              </div>
              <Avatar className="h-8 w-8 border border-white/10 ring-2 ring-primary/10">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{(user.displayName || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          {/* Banner */}
          <div className="relative rounded-[2.5rem] overflow-hidden bg-card/30 border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
            <div className="relative p-12 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold px-4 py-1 rounded-full text-[10px] tracking-widest">
                    {course.code}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground font-bold px-4 py-1 rounded-full text-[10px] tracking-widest">
                    {course.semester}
                  </Badge>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-none">{course.name}</h1>
                <p className="text-muted-foreground text-sm lg:text-base leading-relaxed opacity-70 max-w-xl">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <Button className="rounded-full px-8 font-bold shadow-xl shadow-primary/20 h-12">Resume Journey</Button>
                  <Button variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5 font-bold h-12">Portal Docs</Button>
                </div>
              </div>
              
              <div className="hidden lg:grid grid-cols-2 gap-4 shrink-0">
                {[
                  { label: 'Active Learners', val: '124', detail: '+5% Growth', color: 'text-green-500' },
                  { label: 'System Accuracy', val: '94%', detail: 'High Confidence', color: 'text-primary' },
                  { label: 'Critical Tasks', val: '04', detail: 'Deadline Alert', color: 'text-orange-500' },
                  { label: 'AI Index', val: '0.96', detail: 'Optimal Performance', color: 'text-blue-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.02] backdrop-blur-md p-6 rounded-3xl border border-white/5 w-44 hover:bg-white/[0.04] transition-colors">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-50">{stat.label}</div>
                    <div className="text-3xl font-bold tracking-tighter">{stat.val}</div>
                    <div className={cn("text-[9px] font-bold mt-1 tracking-widest uppercase", stat.color)}>{stat.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Task Hub */}
              <Card className="bg-card/30 border-white/5 shadow-2xl rounded-[2rem] overflow-hidden backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Academic Pipeline</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Current assignments and labs</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">Manage all</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {assignments?.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                      <CheckCircle2 className="h-12 w-12 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Pipeline Clear</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {assignments?.map((assignment) => (
                        <div key={assignment.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center group-hover:border-primary/40 transition-colors">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">DEC</span>
                              <span className="text-xl font-bold tracking-tighter">20</span>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{assignment.title}</h4>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                  <Clock className="h-3 w-3" /> 23:59 IST
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                  <FileText className="h-3 w-3" /> {assignment.submissionType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="border-orange-500/20 text-orange-500 text-[9px] font-bold uppercase px-3 py-1 rounded-full">HIGH PRIORITY</Badge>
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground group-hover:text-foreground hover:bg-white/5 rounded-xl">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Module Progress Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-card/30 border-white/5 shadow-2xl rounded-[2rem] backdrop-blur-xl">
                  <CardHeader className="py-6 px-8">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5" /> Syllabus Mastery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Course Velocity</span>
                        <span className="text-primary">64% Mastery</span>
                      </div>
                      <Progress value={64} className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" />
                      </Progress>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'M1: Architecture Foundations', done: true },
                        { label: 'M2: Distributed Systems Logic', done: true },
                        { label: 'M3: Network Optimization', done: false },
                        { label: 'M4: Final AIS Integration', done: false },
                      ].map((mod, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className={cn("text-[11px] font-bold", mod.done ? "text-muted-foreground line-through opacity-50" : "text-foreground")}>{mod.label}</span>
                          {mod.done ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-muted-foreground opacity-30" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/30 border-white/5 shadow-2xl rounded-[2rem] backdrop-blur-xl">
                  <CardHeader className="py-6 px-8 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5" /> Intelligence Feed
                    </CardTitle>
                    <Button variant="link" className="text-[10px] h-auto p-0 text-primary font-bold uppercase tracking-widest">View Archive</Button>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-6">
                    {[
                      { type: 'Update', text: 'New Module 3 Resources Released', time: '2h ago', urgent: true },
                      { type: 'Grade', text: 'Assignment 2 Evaluation Finalized', time: '5h ago', urgent: false },
                      { type: 'Peer', text: '3 New Discussion Replies', time: '1d ago', urgent: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all cursor-pointer">
                        <div className={cn("h-2 w-2 mt-2 rounded-full shrink-0", item.urgent ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                        <div className="flex-1 space-y-1">
                          <p className="text-[11px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{item.text}</p>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* AI Insights Card */}
              <Card className="bg-gradient-to-br from-primary/20 via-card to-card border-primary/20 shadow-2xl relative overflow-hidden rounded-[2.5rem] backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="h-24 w-24 text-primary" />
                </div>
                <CardHeader className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">AI Intelligence</span>
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tighter">Growth Insights</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-[12px] leading-relaxed italic text-muted-foreground font-medium shadow-inner">
                    "System telemetry indicates your <strong>Concurrent Logic</strong> scores are peaking. Recommended focus: <strong>Asynchronous Error Handling</strong> in the upcoming lab."
                  </div>
                  <div className="space-y-3">
                    {[
                      'Study: Fault-Tolerant Patterns',
                      'Practice: Consensus Algorithms',
                      'Review: Logical Clock Synchrony'
                    ].map((tip, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all cursor-pointer group">
                        <AlertCircle className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[11px] font-bold group-hover:text-foreground transition-colors">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="px-8 pb-8 pt-0">
                  <Button className="w-full text-xs font-bold gap-2 py-6 rounded-2xl" variant="secondary shadow-lg">
                    Launch AI Tutor Session <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Performance Charts */}
              <Card className="bg-card/30 border-white/5 shadow-2xl rounded-[2rem] backdrop-blur-xl overflow-hidden">
                <CardHeader className="py-6 px-8">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Cognitive Radar</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#3A7CA5"
                        fill="#3A7CA5"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/30 border-white/5 shadow-2xl rounded-[2rem] backdrop-blur-xl overflow-hidden">
                <CardHeader className="py-6 px-8">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Velocity Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[220px] p-0 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3A7CA5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3A7CA5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#3A7CA5' }}
                        cursor={{ stroke: '#3A7CA5', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#3A7CA5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      <Line type="monotone" dataKey="avg" stroke="#ffffff10" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}