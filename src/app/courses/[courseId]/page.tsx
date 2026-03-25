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
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  PolarRadiusAxis
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const scoreData = [
  { name: 'Aug', score: 65 },
  { name: 'Sep', score: 72 },
  { name: 'Oct', score: 68 },
  { name: 'Nov', score: 78 },
  { name: 'Dec', score: 82 },
  { name: 'Jan', score: 84 },
];

const strengthData = [
  { subject: 'Algorithms', A: 80, fullMark: 100 },
  { subject: 'Databases', A: 90, fullMark: 100 },
  { subject: 'Web Dev', A: 70, fullMark: 100 },
  { subject: 'ML/AI', A: 60, fullMark: 100 },
  { subject: 'Networks', A: 85, fullMark: 100 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch Course Data
  const courseRef = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return doc(firestore, 'courses', courseId as string);
  }, [firestore, courseId]);
  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  // Fetch Assignments for this course
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'assignments'), orderBy('createdAt', 'desc'));
  }, [firestore, courseId]);
  const { data: assignments, isLoading: isAssignmentsLoading } = useCollection(assignmentsQuery);

  // Simple role check
  const isStudent = user?.email?.startsWith('24bds');

  if (isUserLoading || isCourseLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-white">
        Course not found.
      </div>
    );
  }

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: isStudent ? 'My Submissions' : 'Submissions', icon: FileText },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'portfolio', label: 'Portfolio', icon: FolderRoot },
    { id: 'content', label: 'Content', icon: MessageSquare },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-[#0F1117] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161922] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm mb-8">
            <ChevronLeft className="h-4 w-4" /> All Courses
          </Link>
          <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-xl mb-8 shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{course.code}</div>
            <div className="font-bold truncate">{course.name}</div>
          </div>
          
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === link.id 
                    ? "bg-primary text-white shadow-md" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-[#0F1117] border-b border-white/5 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
          <div className="text-xl font-bold">Dashboard</div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                placeholder="Search..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-muted-foreground hover:text-white transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                <Sun className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold leading-none">{user.displayName || 'User'}</div>
                  <div className="text-[10px] text-muted-foreground uppercase mt-1">{isStudent ? 'Student' : 'Professor'}</div>
                </div>
                <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{(user.displayName || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-headline font-bold">{course.name} Dashboard</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Hey, {user.displayName?.split(' ')[0] || 'User'} 👋 • {course.code} • {course.semester}
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#161922] border-white/5 shadow-xl">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Pending Assignments</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#161922] border-white/5 shadow-xl">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-xs text-muted-foreground">Total Submissions</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#161922] border-white/5 shadow-xl">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">84%</div>
                  <div className="text-xs text-muted-foreground">Average Score</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lists Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending List */}
            <Card className="bg-[#161922] border-white/5 shadow-xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Pending Tasks</CardTitle>
                <Link href="#" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {assignments?.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
                          {course.code}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase border-purple-500/30 text-purple-500">
                          {assignment.submissionType}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Due soon</span>
                    </div>
                    <div className="font-bold group-hover:text-primary transition-colors">{assignment.title}</div>
                  </div>
                ))}
                {!isAssignmentsLoading && assignments?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                    <CheckCircle2 className="h-8 w-8 opacity-20" />
                    No pending assignments.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card className="bg-[#161922] border-white/5 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Performance</CardTitle>
                <Link href="#" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { title: 'Web Dev Project', score: 88, status: 'Good feature engineering, improve model selection.' },
                    { title: 'DSA Assignment 3', score: 76, status: 'Time complexity analysis needs more depth.' },
                    { title: 'DBMS Lab', score: 91, status: 'Excellent query optimization!' },
                  ].map((grade, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="font-bold text-sm">{grade.title}</div>
                        <div className="text-primary font-bold">{grade.score}<span className="text-[10px] text-muted-foreground ml-0.5">/100</span></div>
                      </div>
                      <Progress value={grade.score} className="h-1.5 bg-white/5" />
                      <p className="text-[10px] text-muted-foreground italic truncate">{grade.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-[#161922] border-white/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Subject Strength</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={strengthData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                    <Radar
                      name="User"
                      dataKey="A"
                      stroke="#3A7CA5"
                      fill="#3A7CA5"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 bg-[#161922] border-white/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Score Progress</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161922', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: '#3A7CA5' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3A7CA5" strokeWidth={3} dot={{ fill: '#3A7CA5', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 bg-[#161922] border-white/5 shadow-xl">
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  'Machine Learning Model Selection',
                  'Time Complexity Analysis',
                  'Network Protocol Design',
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-primary opacity-60" />
                    {item}
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t border-white/5">
                  <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg p-3 text-[10px] font-bold flex items-center justify-between uppercase tracking-wider">
                    <span>Best Topic</span>
                    <span>Databases (90%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
