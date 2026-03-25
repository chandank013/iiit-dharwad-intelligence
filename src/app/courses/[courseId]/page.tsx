
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
  MoreVertical,
  Filter,
  Eye,
  Edit2,
  Trash2,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  Github,
  HardDrive,
  FileJson,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const weeklyTrendData = [
  { name: 'Wk 1', avg: 0 },
  { name: 'Wk 2', avg: 0 },
  { name: 'Wk 3', avg: 0 },
  { name: 'Wk 4', avg: 0 },
  { name: 'Wk 5', avg: 0 },
  { name: 'Wk 6', avg: 0 },
];

const assignmentAvgData = [
  { name: 'A1', avg: 0 },
  { name: 'A2', avg: 0 },
  { name: 'A3', avg: 0 },
  { name: 'A4', avg: 0 },
  { name: 'A5', avg: 0 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

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

  // Submissions Query
  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'submissions'), orderBy('submittedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: submissions } = useCollection(submissionsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

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

  const isProfessor = user?.uid === course.professorId;

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
    { label: 'Total Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Submissions', value: submissions?.length || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Avg. Score', value: '0%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const submissionStats = [
    { label: 'Total', value: submissions?.length || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending', value: 0, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'AI Graded', value: 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Flagged', value: 0, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-card z-30">
        <div className="p-8">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest mb-10 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Link>
          
          <div className="mb-10 p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold truncate leading-tight">{course.name}</div>
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
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-4 w-4", activeTab === link.id ? "text-primary" : "text-muted-foreground")} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-10 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold tracking-tight capitalize">{activeTab}</h2>
            <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
              ID: {course.joinCode}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search resources..." 
                className="bg-accent/50 border border-border rounded-full py-2.5 pl-11 pr-6 text-sm w-[360px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-background" />
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tighter">Course Overview</h1>
                <p className="text-muted-foreground text-sm font-medium">Monitoring progress for <span className="text-primary">{course.semester}</span> session.</p>
              </div>
              {isProfessor && (
                <Link href={`/dashboard/professor/assignment/create`}>
                  <Button className="rounded-full px-6 h-11 gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    <Plus className="h-4 w-4" /> Create Assignment
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-card border-border hover:border-primary/20 transition-all group overflow-hidden relative">
                  <div className={cn("absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10", stat.bg)} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-5">
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
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
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-border">
                    <div>
                      <CardTitle className="text-lg font-bold">Weekly Performance Trend</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Average class score progression over the last 6 weeks.</p>
                    </div>
                    <Badge variant="outline" className="border-border text-xs font-bold text-primary px-3">Live Feed</Badge>
                  </CardHeader>
                  <CardContent className="h-[360px] p-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 700 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 700 }}
                          domain={[0, 100]}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: 'hsl(var(--primary))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={4} 
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5, stroke: 'hsl(var(--background))' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-card border-border">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Class Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px] p-8 pt-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assignmentAvgData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            cursor={{ fill: 'currentColor', opacity: 0.05 }}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }}
                          />
                          <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={28}>
                            {assignmentAvgData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={'hsl(var(--primary) / 0.4)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground shadow-2xl border-none p-8 flex flex-col justify-between overflow-hidden relative">
                    <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-primary-foreground/10 rotate-12" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 fill-current" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Insights</span>
                      </div>
                      <h3 className="text-2xl font-bold leading-tight mb-4">Ready for Submissions</h3>
                      <p className="text-sm opacity-90 leading-relaxed font-medium">
                        No student submissions have been recorded for this course yet. Once students begin submitting, you'll see analytics here.
                      </p>
                    </div>
                    <Button variant="secondary" className="w-fit gap-2 font-bold rounded-full relative z-10" disabled>
                      Awaiting Data <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Card>
                </div>
              </div>

              {/* Right: Assignments & Submissions Tracker */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <Card className="bg-card border-border">
                  <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Assignments</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    {assignments && assignments.length > 0 ? (
                      assignments.slice(0, 3).map((task, i) => (
                        <div key={i} className="space-y-3 group cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold group-hover:text-primary transition-colors">{task.title}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Active</div>
                          </div>
                          <Progress value={0} className="h-1.5 bg-accent">
                            <div className={cn("h-full transition-all bg-primary")} />
                          </Progress>
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground/60">
                            <span>0% Completion</span>
                            <span>0 / {enrollments?.length || 0} Students</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">No assignments yet</p>
                        {isProfessor && (
                          <Link href={`/dashboard/professor/assignment/create`}>
                            <Button variant="link" className="text-xs font-bold text-primary p-0">Create one now</Button>
                          </Link>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full border-border rounded-xl font-bold text-xs h-12 hover:bg-accent transition-all"
                      onClick={() => setActiveTab('assignments')}
                    >
                      View All Assignments
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="p-8 pb-4 border-b border-border">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <div className="divide-y divide-border">
                    <div className="p-10 text-center">
                      <p className="text-sm font-medium text-muted-foreground">No recent activity found.</p>
                    </div>
                  </div>
                  <CardContent className="p-6 bg-accent/10">
                    <Button variant="link" className="w-full text-xs font-bold text-primary group uppercase tracking-widest h-auto p-0" disabled>
                      No Activity Log <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Assignments Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tighter">Assignments</h1>
                <p className="text-muted-foreground text-sm font-medium">0 active · 0 closed</p>
              </div>
              {isProfessor && (
                <Link href={`/dashboard/professor/assignment/create`}>
                  <Button className="rounded-2xl px-8 h-12 gap-3 font-bold bg-[#6366F1] hover:bg-[#5558E3] text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="h-5 w-5" /> New Assignment
                  </Button>
                </Link>
              )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-2 rounded-2xl border border-border shadow-sm">
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search assignments..." 
                  className="bg-transparent border-none h-11 pl-11 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-accent/30 rounded-xl">
                {['All', 'Active', 'Closed', 'Group', 'Individual'].map((filter) => (
                  <Button
                    key={filter}
                    variant="ghost"
                    size="sm"
                    onClick={() => setAssignmentFilter(filter.toLowerCase())}
                    className={cn(
                      "px-4 h-9 rounded-lg text-xs font-bold transition-all",
                      assignmentFilter === filter.toLowerCase() 
                        ? "bg-white dark:bg-background text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Assignments List / Empty State */}
            <div className="space-y-6">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <Card key={assignment.id} className="bg-card border-border hover:border-primary/30 transition-all group relative overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                        <div className="space-y-4 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold tracking-tight">{assignment.title}</h3>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                              Active
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-full bg-blue-500/5 text-blue-500 border-blue-500/10 px-3 py-1 text-[10px] font-bold">
                              {course.code}
                            </Badge>
                            <Badge variant="outline" className="rounded-full bg-purple-500/5 text-purple-500 border-purple-500/10 px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                              {assignment.isGroupProject ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              {assignment.isGroupProject ? 'group' : 'individual'}
                            </Badge>
                            <Badge variant="outline" className="rounded-full bg-amber-500/5 text-amber-500 border-amber-500/10 px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                              <Clock className="h-3 w-3" /> 2d left
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-4">
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submissions</div>
                              <div className="flex items-center gap-3">
                                <Progress value={0} className="h-1.5 flex-1 bg-accent" />
                                <span className="text-xs font-bold tabular-nums">0/0</span>
                              </div>
                            </div>
                            <div className="space-y-1 text-center sm:text-left">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Score</div>
                              <div className="text-lg font-bold text-emerald-500">0%</div>
                            </div>
                            <div className="space-y-1 text-center sm:text-left">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Marks</div>
                              <div className="text-lg font-bold">100</div>
                            </div>
                            <div className="space-y-1 flex items-center justify-center sm:justify-start">
                              <Badge variant="outline" className="h-7 gap-1.5 text-muted-foreground border-border px-3 rounded-full text-[10px] font-bold">
                                <TrendingUp className="h-3 w-3" /> Leaderboard
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-auto lg:self-start">
                          <Button variant="outline" size="sm" className="flex-1 lg:flex-none h-10 rounded-xl gap-2 text-primary border-primary/20 hover:bg-primary/10 font-bold px-4">
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          {isProfessor && (
                            <>
                              <Button variant="outline" size="sm" className="flex-1 lg:flex-none h-10 rounded-xl gap-2 border-border hover:bg-accent font-bold px-4">
                                <Edit2 className="h-4 w-4" /> Edit
                              </Button>
                              <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl border-border text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-24 text-center space-y-6 bg-card/50 border-2 border-dashed border-border rounded-[2.5rem] animate-in zoom-in-95 duration-700">
                  <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-1 ring-primary/10">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">No assignments yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                      {isProfessor 
                        ? "Start your academic cycle by launching your first assignment. You can use AI to help you generate rubrics and instructions."
                        : "Your professor hasn't posted any assignments for this course yet. Check back soon for updates."}
                    </p>
                  </div>
                  {isProfessor && (
                    <Link href={`/dashboard/professor/assignment/create`}>
                      <Button className="font-bold px-10 h-12 rounded-full shadow-xl shadow-primary/20">
                        Launch First Assignment
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Submissions Header */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
              <p className="text-muted-foreground text-sm font-medium">{submissions?.length || 0} total submissions</p>
            </div>

            {/* Submissions Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {submissionStats.map((stat, i) => (
                <Card key={i} className="bg-card border-border shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className={cn("text-[10px] font-bold uppercase tracking-widest", stat.color)}>{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Submissions Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-2 rounded-2xl border border-border shadow-sm">
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search by name or roll..." 
                  className="bg-transparent border-none h-11 pl-11 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select defaultValue="all-assignments">
                  <SelectTrigger className="w-[180px] bg-accent/30 border-none rounded-xl h-11 text-xs font-bold">
                    <SelectValue placeholder="All Assignments" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="all-assignments">All Assignments</SelectItem>
                    {assignments?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all-status">
                  <SelectTrigger className="w-[140px] bg-accent/30 border-none rounded-xl h-11 text-xs font-bold">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    <SelectItem value="all-status">All Status</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-accent/30">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Student</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Assignment</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5 text-center">AI Score</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Confidence</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Flag</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5">Time</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions && submissions.length > 0 ? (
                    submissions.map((sub) => (
                      <TableRow key={sub.id} className="border-border hover:bg-accent/10 group transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {sub.submitterId.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-bold">Student Name</div>
                              <div className="text-[10px] font-medium text-muted-foreground tabular-nums uppercase">21BCS000</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-xs font-medium text-muted-foreground">
                            {assignments?.find(a => a.id === sub.assignmentId)?.title || 'Assignment'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            {sub.submissionType === 'github' ? <Github className="h-3.5 w-3.5" /> : 
                             sub.submissionType === 'zip' ? <FileJson className="h-3.5 w-3.5" /> : 
                             <HardDrive className="h-3.5 w-3.5" />}
                            <span className="uppercase">{sub.submissionType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="text-sm font-bold text-emerald-500">0%</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="w-[80px] space-y-1">
                            <Progress value={0} className="h-1 bg-accent" />
                            <div className="text-[8px] font-bold text-muted-foreground text-right">0%</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className="bg-blue-500/10 text-blue-500 border-none px-2 py-0.5 text-[10px] font-bold rounded-lg">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-xs text-muted-foreground">—</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Just now</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-[10px] font-bold text-primary hover:bg-primary/10">
                              <Eye className="h-3 w-3" /> View
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/10">
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-[300px] text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="bg-accent/50 p-4 rounded-full">
                            <Users className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold">No submissions yet</p>
                            <p className="text-xs text-muted-foreground">Once students submit their work, it will appear here for evaluation.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* Floating AI Helper */}
      <button className="fixed bottom-10 right-10 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-4 border-background/10">
        <Sparkles className="h-7 w-7 fill-current group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
