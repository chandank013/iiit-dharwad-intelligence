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
  where,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  FolderRoot, 
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
  Eye,
  Edit2,
  Trash2,
  User,
  Users,
  CheckCircle2,
  FileJson,
  HardDrive,
  Github,
  AlertCircle,
  Megaphone,
  File as FileIcon,
  Link as LinkIcon,
  Download,
  Heart,
  MessageCircle,
  Paperclip,
  Share2
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
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// --- Data for Analytics (Baseline Zeroed) ---
const weeklyTrendData = [
  { name: 'Wk1', avg: 0 },
  { name: 'Wk2', avg: 0 },
  { name: 'Wk3', avg: 0 },
  { name: 'Wk4', avg: 0 },
  { name: 'Wk5', avg: 0 },
  { name: 'Wk6', avg: 0 },
];

const gradeDistributionData = [
  { name: 'A (90-100)', value: 0, color: '#10b981' },
  { name: 'B (75-89)', value: 0, color: '#3b82f6' },
  { name: 'C (60-74)', value: 0, color: '#f59e0b' },
  { name: 'D (< 60)', value: 0, color: '#ef4444' },
];

const assignmentAvgData = [
  { name: 'Task 1', avg: 0 },
  { name: 'Task 2', avg: 0 },
  { name: 'Task 3', avg: 0 },
];

const submissionBehaviourData = [
  { name: 'Day 1', count: 0 },
  { name: 'Day 2', count: 0 },
  { name: 'Day 3', count: 0 },
  { name: 'Day 4', count: 0 },
  { name: 'Day 5', count: 0 },
  { name: 'Due Day', count: 0 },
];

const subjectStrengthData = [
  { subject: 'Algorithms', value: 0, fullMark: 150 },
  { subject: 'Databases', value: 0, fullMark: 150 },
  { subject: 'Web Dev', value: 0, fullMark: 150 },
  { subject: 'ML/AI', value: 0, fullMark: 150 },
  { subject: 'Networks', value: 0, fullMark: 150 },
  { subject: 'OS', value: 0, fullMark: 150 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Course Content State
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPostingContent, setIsPostingContent] = useState(false);
  const [contentFormData, setContentFormData] = useState({
    title: '',
    type: 'announcement',
    body: '',
    url: '',
  });

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

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'submissions'), orderBy('submittedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: submissions } = useCollection(submissionsQuery);

  const contentQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'content'), orderBy('postedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: courseContent } = useCollection(contentQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handlePostContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !courseId) return;

    setIsPostingContent(true);
    const contentData = {
      courseId,
      professorId: user.uid,
      title: contentFormData.title,
      contentType: contentFormData.type,
      content: contentFormData.body,
      attachmentUrl: contentFormData.type === 'file' || contentFormData.type === 'link' ? contentFormData.url : '',
      postedAt: serverTimestamp(),
      isPinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'courses', courseId as string, 'content'), contentData);
      toast({ title: "Content Shared", description: "Your post has been shared with the class." });
      setIsContentDialogOpen(false);
      setContentFormData({ title: '', type: 'announcement', body: '', url: '' });
    } catch (error) {
      toast({ title: "Failed to share", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsPostingContent(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!firestore || !courseId) return;
    try {
      await deleteDoc(doc(firestore, 'courses', courseId as string, 'content', contentId));
      toast({ title: "Post Deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
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
  ];

  const stats = [
    { label: 'Total Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Submissions', value: 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Avg. Score', value: '0%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const analyticsOverview = [
    { label: 'Class Average', value: '0%', change: '0% this week', trend: 'up', color: 'text-primary' },
    { label: 'Submission Rate', value: '0%', change: '0% this week', trend: 'up', color: 'text-emerald-500' },
    { label: 'Failing Students', value: '0', change: '0 this week', trend: 'down', color: 'text-rose-500' },
    { label: 'Avg AI Confidence', value: '0%', change: '0% this week', trend: 'up', color: 'text-purple-500' },
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
            <h2 className="text-lg font-bold tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
            <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
              ID: {course.joinCode}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search portal..." 
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
              {/* Performance Visuals */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-border">
                    <div>
                      <CardTitle className="text-lg font-bold">Weekly Performance Trend</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Class score progression is currently baseline.</p>
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
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} />
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
                      <h3 className="text-2xl font-bold leading-tight mb-4">Awaiting Data</h3>
                      <p className="text-sm opacity-90 leading-relaxed font-medium">
                        Insights will be generated once your students begin submitting their assignments.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Assignments & Submissions Tracker */}
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
                          <Progress value={0} className="h-1.5 bg-accent" />
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-sm text-muted-foreground">No active assignments.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="p-8 pb-4 border-b border-border">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" /> System Readiness
                    </CardTitle>
                  </CardHeader>
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Monitoring active sessions.</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tighter">Assignments</h1>
                <p className="text-muted-foreground text-sm font-medium">{assignments?.length || 0} active assignments</p>
              </div>
              {isProfessor && (
                <Link href={`/dashboard/professor/assignment/create`}>
                  <Button className="rounded-2xl px-8 h-12 gap-3 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20">
                    <Plus className="h-5 w-5" /> New Assignment
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-2 rounded-2xl border border-border shadow-sm">
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search assignments..." className="bg-transparent border-none h-11 pl-11 focus-visible:ring-0" />
              </div>
            </div>

            <div className="space-y-6">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <Card key={assignment.id} className="bg-card border-border hover:border-primary/30 transition-all group overflow-hidden rounded-3xl">
                    <CardContent className="p-8 flex flex-col lg:flex-row gap-8 items-start justify-between">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold tracking-tight">{assignment.title}</h3>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">Active</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold">{course.code}</Badge>
                          <Badge variant="outline" className="text-[10px] font-bold">{assignment.submissionType}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-24 text-center border-2 border-dashed border-border rounded-[2.5rem]">
                  <p className="text-muted-foreground font-medium">No assignments posted yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-accent/30">
                  <TableRow>
                    <TableHead className="px-6 py-5">Student</TableHead>
                    <TableHead className="px-6 py-5">Assignment</TableHead>
                    <TableHead className="px-6 py-5">Type</TableHead>
                    <TableHead className="px-6 py-5 text-center">Score</TableHead>
                    <TableHead className="px-6 py-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions && submissions.length > 0 ? (
                    submissions.map((sub) => (
                      <TableRow key={sub.id} className="border-border hover:bg-accent/10 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-bold">Student Name</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-xs text-muted-foreground">Assignment</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-xs uppercase font-medium">{sub.submissionType}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="text-sm font-bold text-emerald-500">0%</div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold">View</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">No submissions yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tighter">Class Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsOverview.map((item, i) => (
                <Card key={i} className="bg-card border-border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{item.label}</div>
                    <div className={cn("text-3xl font-bold tracking-tighter", item.color)}>{item.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tighter">Course Content</h1>
                <p className="text-muted-foreground text-sm font-medium">{courseContent?.length || 0} posts shared</p>
              </div>
              {isProfessor && (
                <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl px-8 h-12 gap-3 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                      <Plus className="h-5 w-5" /> Share Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold tracking-tight">Post Content</DialogTitle>
                      <DialogDescription className="text-sm font-medium">Share updates, lecture notes, or resources with the class.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePostContent} className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                        <Input 
                          id="title" 
                          placeholder="e.g. Lecture 1: Introduction to React" 
                          className="h-11 rounded-xl bg-accent/30 border-none focus-visible:ring-primary/20"
                          value={contentFormData.title}
                          onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Content Type</Label>
                        <Select 
                          value={contentFormData.type} 
                          onValueChange={(val) => setContentFormData({ ...contentFormData, type: val })}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-accent/30 border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="announcement">Announcement</SelectItem>
                            <SelectItem value="file">File (PDF / ZIP)</SelectItem>
                            <SelectItem value="link">External Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="body" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                        <Textarea 
                          id="body" 
                          placeholder="Write your message here..." 
                          className="min-h-[120px] rounded-2xl bg-accent/30 border-none focus-visible:ring-primary/20"
                          value={contentFormData.body}
                          onChange={(e) => setContentFormData({ ...contentFormData, body: e.target.value })}
                        />
                      </div>
                      {(contentFormData.type === 'file' || contentFormData.type === 'link') && (
                        <div className="space-y-2">
                          <Label htmlFor="url" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">URL</Label>
                          <Input 
                            id="url" 
                            placeholder="https://..." 
                            className="h-11 rounded-xl bg-accent/30 border-none focus-visible:ring-primary/20"
                            value={contentFormData.url}
                            onChange={(e) => setContentFormData({ ...contentFormData, url: e.target.value })}
                            required
                          />
                        </div>
                      )}
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          className="w-full h-12 rounded-xl font-bold shadow-lg" 
                          disabled={isPostingContent}
                        >
                          {isPostingContent ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Publish Now'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="max-w-4xl space-y-8 mx-auto lg:mx-0">
              {courseContent && courseContent.length > 0 ? (
                courseContent.map((post) => (
                  <Card key={post.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-10 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-2xl border transition-colors",
                            post.contentType === 'announcement' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            post.contentType === 'file' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}>
                            {post.contentType === 'announcement' && <Megaphone className="h-5 w-5" />}
                            {post.contentType === 'file' && <FileIcon className="h-5 w-5" />}
                            {post.contentType === 'link' && <LinkIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest mb-1",
                              post.contentType === 'announcement' ? "text-blue-500" :
                              post.contentType === 'file' ? "text-orange-500" :
                              "text-emerald-500"
                            )}>
                              {post.contentType}
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">{post.title}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {post.postedAt?.toDate().toLocaleDateString('en-CA')}
                          </div>
                          {isProfessor && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              onClick={() => handleDeleteContent(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl font-medium">
                        {post.content}
                      </p>

                      {post.contentType === 'file' && (
                        <div className="bg-accent/30 rounded-2xl p-6 border border-border flex items-center justify-between group/file">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-card rounded-xl border border-border flex items-center justify-center text-orange-500">
                              <FileIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold truncate max-w-[200px]">{post.attachmentUrl.split('/').pop()}</div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase">PDF • 2.4 MB</div>
                            </div>
                          </div>
                          <Button variant="outline" className="h-10 rounded-xl gap-2 font-bold border-border bg-card group-hover/file:bg-orange-500 group-hover/file:text-white transition-all">
                            <Download className="h-4 w-4" /> Download
                          </Button>
                        </div>
                      )}

                      {post.contentType === 'link' && (
                        <a 
                          href={post.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors group/link"
                        >
                          <div className="flex items-center gap-4 text-emerald-500">
                            <LinkIcon className="h-5 w-5" />
                            <span className="text-sm font-bold truncate">{post.attachmentUrl}</span>
                          </div>
                        </a>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="flex items-center gap-6">
                          <button className="flex items-center gap-2 text-muted-foreground hover:text-rose-500 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span className="text-[10px] font-bold">0</span>
                          </button>
                          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold">0 comments</span>
                          </button>
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground italic">
                          by {isProfessor ? 'You' : 'Dr. Rajesh Kumar'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-24 text-center space-y-6 bg-card/50 border-2 border-dashed border-border rounded-[3rem]">
                  <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-1 ring-primary/10">
                    <Share2 className="h-10 w-10 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">No content shared yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                      {isProfessor 
                        ? "Start sharing lecture notes, files, and important announcements with your students."
                        : "Your professor hasn't shared any content for this course yet."}
                    </p>
                  </div>
                </div>
              )}
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
