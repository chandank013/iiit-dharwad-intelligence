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
  orderBy,
  where
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  FolderRoot, 
  MessageSquare, 
  LogOut, 
  Search, 
  Bell, 
  ChevronLeft,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Plus,
  GraduationCap,
  History,
  Zap,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase';

const weeklyTrendData = [
  { name: 'Wk 1', avg: 65 },
  { name: 'Wk 2', avg: 72 },
  { name: 'Wk 3', avg: 68 },
  { name: 'Wk 4', avg: 74 },
  { name: 'Wk 5', avg: 71 },
  { name: 'Wk 6', avg: 82 },
];

const assignmentAvgData = [
  { name: 'Lab 1', avg: 85 },
  { name: 'Quiz 1', avg: 70 },
  { name: 'Proj A', avg: 65 },
  { name: 'Lab 2', avg: 88 },
  { name: 'Midterm', avg: 76 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
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
  const { data: assignments } = useCollection(assignmentsQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'course_enrollments'), where('courseId', '==', courseId));
  }, [firestore, courseId]);
  const { data: enrollments } = useCollection(enrollmentsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || isCourseLoading || !user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        Course not found.
      </div>
    );
  }

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'content', label: 'Course Content', icon: FolderRoot },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  const stats = [
    { label: 'Total Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Submissions', value: '128', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Avg. Score', value: '76%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="flex min-h-screen bg-[#09090b] text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col fixed inset-y-0 left-0 bg-[#0c0c0e] z-30">
        <div className="p-8">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Link>
          
          <div className="mb-10 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-white/5">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold text-white truncate leading-tight">{course.name}</div>
          </div>

          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-medium border border-transparent",
                  activeTab === link.id 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <link.icon className={cn("h-4 w-4", activeTab === link.id ? "text-primary" : "text-muted-foreground")} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold tracking-tight text-white capitalize">{activeTab}</h2>
            <Badge variant="outline" className="border-white/10 text-muted-foreground font-mono text-[10px]">
              ID: {course.joinCode}
            </Badge>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search resources..." 
                className="bg-[#141416] border border-white/10 rounded-full py-2.5 pl-11 pr-6 text-sm w-[360px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-[#09090b]" />
              </button>
              <div className="flex items-center gap-3 border-l border-white/10 pl-6 ml-2">
                <div className="text-right leading-none hidden sm:block">
                  <div className="text-sm font-bold text-white">{user.displayName || 'User'}</div>
                  <div className="text-[10px] text-primary uppercase tracking-widest mt-1 font-bold">Professor</div>
                </div>
                <Avatar className="h-10 w-10 border border-white/10 ring-4 ring-primary/5">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{(user.displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-10 space-y-10">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter text-white">Course Overview</h1>
              <p className="text-muted-foreground text-sm font-medium">Monitoring progress for <span className="text-primary">{course.semester}</span> session.</p>
            </div>
            <Link href={`/dashboard/professor/assignment/create`}>
              <Button className="rounded-full px-6 h-11 gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                <Plus className="h-4 w-4" /> Create Assignment
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="bg-[#141416] border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
                <div className={cn("absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10", stat.bg)} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-5">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left: Performance Visuals */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <Card className="bg-[#141416] border-white/5 overflow-hidden">
                <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-white/5">
                  <div>
                    <CardTitle className="text-lg font-bold text-white">Weekly Performance Trend</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Average class score progression over the last 6 weeks.</p>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-xs font-bold text-primary px-3">Live Feed</Badge>
                </CardHeader>
                <CardContent className="h-[360px] p-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                        domain={[50, 100]}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#141416', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#3b82f6' }}
                        cursor={{ stroke: '#ffffff10', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg" 
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#09090b' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#60a5fa' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-[#141416] border-white/5">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Class Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px] p-8 pt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={assignmentAvgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ backgroundColor: '#141416', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={28}>
                          {assignmentAvgData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avg > 80 ? '#3b82f6' : '#3b82f660'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground shadow-2xl border-none p-8 flex flex-col justify-between overflow-hidden relative">
                  <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 fill-current" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">AI Insights</span>
                    </div>
                    <h3 className="text-2xl font-bold leading-tight mb-4">Class Engagement is Up 12%</h3>
                    <p className="text-sm opacity-90 leading-relaxed font-medium">
                      Based on recent submissions, student retention of the "Systems Design" module has significantly improved compared to previous batches.
                    </p>
                  </div>
                  <Button variant="secondary" className="w-fit gap-2 font-bold rounded-full relative z-10">
                    Generate Report <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              </div>
            </div>

            {/* Right: Assignments & Submissions Tracker */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              <Card className="bg-[#141416] border-white/5">
                <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Assignments</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {[
                    { title: 'Database Design', due: 'Tomorrow', progress: 85, color: 'bg-primary' },
                    { title: 'REST API Implementation', due: 'Oct 24', progress: 42, color: 'bg-emerald-500' },
                    { title: 'Frontend Components', due: 'Oct 28', progress: 15, color: 'bg-amber-500' },
                  ].map((task, i) => (
                    <div key={i} className="space-y-3 group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Due: {task.due}</div>
                      </div>
                      <Progress value={task.progress} className="h-1.5 bg-white/5">
                        <div className={cn("h-full transition-all", task.color)} />
                      </Progress>
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60">
                        <span>{task.progress}% Completion</span>
                        <span>{Math.round(task.progress * 0.4)} / 40 Students</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-white/10 rounded-xl font-bold text-xs h-12 hover:bg-white/5 transition-all">
                    View All Assignments
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#141416] border-white/5 overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-white/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-white/5">
                  {[
                    { name: 'Arjun S.', action: 'submitted', time: '12m ago', score: null },
                    { name: 'Priya K.', action: 'graded', time: '45m ago', score: '92%' },
                    { name: 'Rahul V.', action: 'submitted', time: '1h ago', score: null },
                    { name: 'Sneha P.', action: 'graded', time: '3h ago', score: '78%' },
                  ].map((activity, i) => (
                    <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white uppercase group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {activity.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{activity.name}</div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{activity.action} • {activity.time}</div>
                        </div>
                      </div>
                      {activity.score ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2.5">
                          {activity.score}
                        </Badge>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
                <CardContent className="p-6 bg-white/[0.02]">
                  <Button variant="link" className="w-full text-xs font-bold text-primary group uppercase tracking-widest h-auto p-0">
                    Full Submission Log <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Helper */}
      <button className="fixed bottom-10 right-10 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-4 border-white/10">
        <Sparkles className="h-7 w-7 fill-current group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
