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
  limit
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
  GraduationCap,
  History,
  Plus,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  { name: 'Wk1', avg: 65 },
  { name: 'Wk2', avg: 72 },
  { name: 'Wk3', avg: 68 },
  { name: 'Wk4', avg: 74 },
  { name: 'Wk5', avg: 71 },
  { name: 'Wk6', avg: 82 },
];

const assignmentAvgData = [
  { name: 'Web Dev', avg: 85 },
  { name: 'DSA-3', avg: 70 },
  { name: 'ML Proj', avg: 65 },
  { name: 'OS Lab', avg: 88 },
  { name: 'DBMS', avg: 76 },
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
  const { data: assignments, isLoading: isAssignmentsLoading } = useCollection(assignmentsQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'course_enrollments'), where('courseId', '==', courseId));
  }, [firestore, courseId]);
  const { data: enrollments } = useCollection(enrollmentsQuery);

  const isStudent = user?.email?.startsWith('24bds');

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

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'content', label: 'Content', icon: FolderRoot },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
  ];

  return (
    <div className="flex min-h-screen bg-[#09090b] text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-white/5 flex flex-col shrink-0 bg-[#0d0d0f]">
        <div className="p-6">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider mb-10 opacity-70">
            <ChevronLeft className="h-4 w-4" /> All Courses
          </Link>
          
          <div className="mb-10">
            <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 group cursor-pointer hover:bg-primary/30 transition-all">
              <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
              <div className="text-sm font-bold text-white truncate">{course.name}</div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-medium",
                  activeTab === link.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <link.icon className={cn("h-4 w-4", activeTab === link.id ? "text-primary" : "text-muted-foreground")} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search..." 
                className="bg-[#161618] border border-white/5 rounded-full py-2.5 pl-11 pr-6 text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-[#09090b]" />
              </button>
              <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Sparkles className="h-4 w-4 text-primary" />
              </button>
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right leading-none hidden sm:block">
                  <div className="text-sm font-bold text-white">{user.displayName || 'User'}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-bold opacity-60">Professor</div>
                </div>
                <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-primary/5">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{(user.displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-10 space-y-10">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{course.name} Dashboard</h1>
            <p className="text-muted-foreground text-sm font-medium">Good morning, Dr. {user.displayName?.split(' ')[0]} • {course.code} • {course.semester}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Total Submissions', value: '85', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Pending Review', value: '8', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Avg Class Score', value: '74%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((stat, i) => (
              <Card key={i} className="bg-[#161618] border-white/5 hover:bg-[#1c1c1e] transition-colors group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Center Content: Assignments & Recent Submissions */}
          <div className="grid grid-cols-12 gap-8">
            {/* Assignments List */}
            <Card className="col-span-12 lg:col-span-7 bg-[#161618] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-0">
                <CardTitle className="text-lg font-bold text-white">Assignments</CardTitle>
                <Link href={`/dashboard/professor/assignment/create`}>
                  <Button size="sm" className="gap-2 rounded-full px-4 h-9 font-bold bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> New
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {[
                  { title: 'Web Dev Project', type: 'Group', due: '2 days', avg: '81%', completed: 26, total: 32 },
                  { title: 'DSA Assignment 3', type: 'Individual', due: '5 days', avg: '72%', completed: 45, total: 48 },
                  { title: 'ML Project', type: 'Group', due: '1 day', avg: '68%', completed: 12, total: 20 },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-md font-bold text-white group-hover:text-primary transition-colors">{item.title}</h4>
                        <Badge variant="outline" className="mt-2 bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2 py-0">
                          {item.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Due in {item.due}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg: {item.avg}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-end text-[10px] font-bold text-muted-foreground">
                        {item.completed}/{item.total}
                      </div>
                      <Progress value={(item.completed/item.total)*100} className="h-1.5 bg-white/5">
                        <div className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all" />
                      </Progress>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="col-span-12 lg:col-span-5 bg-[#161618] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-0">
                <CardTitle className="text-lg font-bold text-white">Recent Submissions</CardTitle>
                <Button variant="link" className="text-[11px] font-bold text-primary p-0 h-auto uppercase tracking-widest">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {[
                  { name: 'Arjun Sharma', project: 'Web Dev Project', score: '88%', status: 'graded', color: 'text-emerald-500' },
                  { name: 'Priya Nair', project: 'DSA Assignment 3', score: '76%', status: 'graded', color: 'text-primary' },
                  { name: 'Rahul Verma', project: 'Web Dev Project', score: '92%', status: 'graded', color: 'text-emerald-500', warning: true },
                  { name: 'Sneha Patil', project: 'ML Project', score: 'Pending', status: 'pending', color: 'text-amber-500' },
                  { name: 'Kiran Reddy', project: 'DSA Assignment 3', score: '61%', status: 'graded', color: 'text-amber-500' },
                ].map((sub, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarFallback className="text-[10px] font-bold bg-white/10 text-white">{sub.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-bold text-white">{sub.name}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">{sub.project}</div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {sub.warning && <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />}
                      <span className={cn("text-xs font-bold", sub.status === 'pending' ? "bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full" : sub.color)}>
                        {sub.score}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Content: Charts */}
          <div className="grid grid-cols-12 gap-8">
            {/* Weekly Average Trend */}
            <Card className="col-span-12 lg:col-span-7 bg-[#161618] border-white/5">
              <CardHeader className="p-8">
                <CardTitle className="text-md font-bold text-white">Weekly Average Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] px-4 pb-8">
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
                      contentStyle={{ backgroundColor: '#161618', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ color: '#3A7CA5', fontWeight: 700 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      stroke="#3A7CA5" 
                      strokeWidth={3} 
                      dot={{ fill: '#3A7CA5', strokeWidth: 2, r: 4, stroke: '#161618' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Assignment Averages */}
            <Card className="col-span-12 lg:col-span-5 bg-[#161618] border-white/5">
              <CardHeader className="p-8">
                <CardTitle className="text-md font-bold text-white">Assignment Averages</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] px-4 pb-8">
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
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      domain={[0, 100]}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#161618', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ color: '#3A7CA5', fontWeight: 700 }}
                    />
                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={40}>
                      {assignmentAvgData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg > 80 ? '#3A7CA5' : '#3A7CA580'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating AI Assistant Trigger */}
      <button className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <Zap className="h-7 w-7 fill-current" />
      </button>
    </div>
  );
}
