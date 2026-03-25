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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-white">
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
    <div className="flex min-h-screen bg-[#09090B] text-foreground overflow-hidden">
      {/* Dynamic Sidebar */}
      <aside className="w-64 bg-[#09090B] border-r border-border/50 flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-xs font-medium mb-10">
            <ChevronLeft className="h-3 w-3" /> BACK TO PORTAL
          </Link>
          
          <div className="space-y-6">
            <div className="px-2">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Course Menu</h3>
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                      activeTab === link.id 
                        ? "bg-primary/10 text-primary font-bold border border-primary/20" 
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
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Academic Tools</h3>
              <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
                  <Zap className="h-4 w-4" /> AI Tutor
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
                  <Calendar className="h-4 w-4" /> Schedule
                </button>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
            <div className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-1">PRO TIP</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">Submit Assignment 3 by Friday to maintain your 92% streak.</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4" /> Log out session
          </Button>
        </div>
      </aside>

      {/* Main Experience */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scrollbar-hide">
        {/* Sleek Header */}
        <header className="h-16 border-b border-border/40 flex items-center justify-between px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-tight">Academic Intelligence System</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder="Find in this course..." 
                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Avatar className="h-7 w-7 border border-primary/20">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(user.displayName || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-right leading-none">
                <div className="text-[11px] font-bold">{user.displayName?.split(' ')[0] || 'User'}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{isStudent ? 'Student' : 'Professor'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* Hero Banner Section */}
          <div className="relative rounded-3xl overflow-hidden bg-[#18181B] border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent" />
            <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold px-3">
                    {course.code}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground px-3">
                    {course.semester}
                  </Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white">{course.name}</h1>
                <p className="text-muted-foreground text-sm lg:text-base leading-relaxed line-clamp-2 opacity-80">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 pt-4 justify-center md:justify-start">
                  <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">Resume Learning</Button>
                  <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/5">View Syllabus</Button>
                </div>
              </div>
              
              <div className="hidden lg:grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Students</div>
                  <div className="text-2xl font-bold">124</div>
                  <div className="text-[9px] text-green-500 font-bold mt-1">+12% this week</div>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Avg Score</div>
                  <div className="text-2xl font-bold">88%</div>
                  <div className="text-[9px] text-primary font-bold mt-1">High Accuracy</div>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Tasks</div>
                  <div className="text-2xl font-bold">04</div>
                  <div className="text-[9px] text-orange-500 font-bold mt-1">Due soon</div>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">AI Confidence</div>
                  <div className="text-2xl font-bold">0.96</div>
                  <div className="text-[9px] text-blue-400 font-bold mt-1">Highly reliable</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* Left Content Area - Feed & Tasks */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* Active Assignments Card */}
              <Card className="bg-[#121214] border-white/5 shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Current Assignments</CardTitle>
                      <CardDescription className="text-[10px]">Active tasks for this course</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Manage all</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {assignments?.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-40 italic text-sm">
                      <CheckCircle2 className="h-8 w-8 mb-2" />
                      All caught up!
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {assignments?.map((assignment) => (
                        <div key={assignment.id} className="p-6 flex items-start justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-start gap-5">
                            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">DEC</span>
                              <span className="text-lg font-bold">20</span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold group-hover:text-primary transition-colors">{assignment.title}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> 11:59 PM
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                                  <FileText className="h-3 w-3" /> {assignment.submissionType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-red-500/20 text-red-400 text-[10px]">HIGH PRIORITY</Badge>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress and Course Feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-[#121214] border-white/5 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Syllabus Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Course Completion</span>
                        <span className="text-foreground">64%</span>
                      </div>
                      <Progress value={64} className="h-2 bg-white/5" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Module 1: Foundations', done: true },
                        { label: 'Module 2: Advanced Logic', done: true },
                        { label: 'Module 3: Optimization', done: false },
                        { label: 'Module 4: Final Project', done: false },
                      ].map((mod, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className={mod.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}>{mod.label}</span>
                          {mod.done ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#121214] border-white/5 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold">Recent Updates</CardTitle>
                    <Button variant="link" className="text-[10px] h-auto p-0 text-primary">View all</Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      { type: 'announcement', text: 'New reading material uploaded for Module 3', time: '2h ago' },
                      { type: 'grade', text: 'Assignment 2 grading complete', time: '5h ago' },
                      { type: 'discussion', text: 'Dr. Ramesh replied to your query', time: '1d ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                        <div className="flex-1 space-y-0.5">
                          <p className="text-[11px] font-medium text-foreground leading-snug">{item.text}</p>
                          <span className="text-[9px] text-muted-foreground uppercase">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Side Area - Analytics & AI Insights */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* AI Insights Panel - Sticky top below header */}
              <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Intelligence</span>
                  </div>
                  <CardTitle className="text-lg font-bold">Personalized Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[11px] leading-relaxed italic text-muted-foreground">
                    "Based on your recent lab submissions, your <strong>Time Complexity</strong> analysis is improving. Focus more on <strong>Network Latency</strong> impacts in the next module."
                  </div>
                  <div className="space-y-3">
                    {[
                      'Study: Distributed System Partitioning',
                      'Practice: Quorum-based consistency',
                      'Review: CAP Theorem applications'
                    ].map((tip, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                        <AlertCircle className="h-3.5 w-3.5 text-primary opacity-60 group-hover:opacity-100" />
                        <span className="text-[11px] group-hover:text-foreground transition-colors">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full text-xs font-bold gap-2 py-5" variant="secondary">
                    Open AI Tutor Companion <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Performance Charts */}
              <Card className="bg-[#121214] border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-60">Performance Radar</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 9 }} />
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

              <Card className="bg-[#121214] border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-60">Score Trending</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3A7CA5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3A7CA5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161922', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#3A7CA5' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#3A7CA5" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                      <Line type="monotone" dataKey="avg" stroke="#ffffff20" strokeWidth={1} strokeDasharray="5 5" dot={false} />
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

