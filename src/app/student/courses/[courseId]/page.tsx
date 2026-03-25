"use client";

import { useMemo, useState, useEffect } from 'react';
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
  FileCheck, 
  Trophy, 
  User as UserIcon, 
  FolderRoot, 
  ChevronLeft,
  Clock,
  TrendingUp,
  Loader2,
  Search,
  Bell,
  Sparkles,
  ArrowRight,
  Target,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';

const scoreProgressData = [
  { name: 'Aug', score: 65 },
  { name: 'Sep', score: 68 },
  { name: 'Oct', score: 75 },
  { name: 'Nov', score: 72 },
  { name: 'Dec', score: 82 },
  { name: 'Jan', score: 80 },
];

const subjectStrengthData = [
  { subject: 'Algorithms', A: 85, fullMark: 100 },
  { subject: 'Databases', A: 90, fullMark: 100 },
  { subject: 'Web Dev', A: 95, fullMark: 100 },
  { subject: 'ML/AI', A: 65, fullMark: 100 },
  { subject: 'Networks', A: 70, fullMark: 100 },
  { subject: 'OS', A: 75, fullMark: 100 },
];

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Security Guard: Prevent non-students or non-enrolled students (ideally)
  useEffect(() => {
    if (!isUserLoading && user && !user.email?.startsWith('24bds')) {
      router.push(`/courses/${courseId}`); // Send professors to their portal
    }
  }, [user, isUserLoading, router, courseId]);

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

  if (isUserLoading || isCourseLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">Course not found.</div>;

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'My Submissions', icon: FileCheck },
    { id: 'content', label: 'Content', icon: FolderRoot },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 flex flex-col fixed inset-y-0 left-0 bg-[#0F1219] z-30">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mb-8 group">
            <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> All Courses
          </Link>

          <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold truncate leading-tight">{course.name}</div>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all font-semibold",
                  activeTab === link.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 sticky top-0 z-20 bg-[#0B0E14]/80 backdrop-blur-xl">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">Dashboard</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input placeholder="Search..." className="h-9 w-64 bg-slate-900/50 border-slate-800 text-xs pl-9 focus-visible:ring-primary/20" />
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-500 hover:text-white transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-[#0B0E14]" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl">
          {/* Welcome Section */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">{course.name} Dashboard</h1>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <span>Hey, {user.displayName?.split(' ')[0] || 'Student'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span>{course.code}</span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span>{course.semester}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#141820] border-slate-800/50 p-6 flex items-center gap-6">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">3</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending</div>
              </div>
            </Card>
            <Card className="bg-[#141820] border-slate-800/50 p-6 flex items-center gap-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submitted</div>
              </div>
            </Card>
            <Card className="bg-[#141820] border-slate-800/50 p-6 flex items-center gap-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">84%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Score</div>
              </div>
            </Card>
          </div>

          {/* Middle Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-[#141820] border-slate-800/50 overflow-hidden">
              <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-800/30">
                <CardTitle className="text-sm font-bold text-white">Pending</CardTitle>
                <Link href="#" className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase">View all <ArrowRight className="h-3 w-3" /></Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800/30">
                  {assignments && assignments.length > 0 ? (
                    assignments.slice(0, 3).map((task, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                        <div className="space-y-2">
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{task.title}</div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20">{course.name}</Badge>
                            <Badge variant="outline" className="text-[8px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">{task.isGroup ? 'Group' : 'Individual'}</Badge>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/10">
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-500">No pending assignments.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#141820] border-slate-800/50 overflow-hidden">
              <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-slate-800/30">
                <CardTitle className="text-sm font-bold text-white">Recent Grades</CardTitle>
                <Link href="#" className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase">View all <ArrowRight className="h-3 w-3" /></Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800/30">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">ML Assignment 2</div>
                        <div className="text-[10px] text-slate-500 font-medium">Good feature engineering, improve model selection.</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-500">88<span className="text-[10px] text-slate-500">/100</span></div>
                    </div>
                    <Progress value={88} className="h-1 bg-slate-800" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">DSA Assignment 3</div>
                        <div className="text-[10px] text-slate-500 font-medium">Time complexity analysis needs more depth.</div>
                      </div>
                      <div className="text-sm font-bold text-amber-500">76<span className="text-[10px] text-slate-500">/100</span></div>
                    </div>
                    <Progress value={76} className="h-1 bg-slate-800" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">DBMS Lab</div>
                        <div className="text-[10px] text-slate-500 font-medium">Excellent query optimization!</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-500">91<span className="text-[10px] text-slate-500">/100</span></div>
                    </div>
                    <Progress value={91} className="h-1 bg-slate-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-[#141820] border-slate-800/50 p-6 space-y-6">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest">Score Progress</CardTitle>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 9, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748B', fontSize: 9, fontWeight: 700 }}
                      domain={[50, 100]}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0EA5E9" 
                      strokeWidth={3} 
                      dot={{ fill: '#0EA5E9', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-[#141820] border-slate-800/50 p-6 space-y-6">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-widest">Subject Strength</CardTitle>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectStrengthData}>
                    <PolarGrid stroke="#1F2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 8, fontWeight: 700 }} />
                    <Radar
                      name="Strength"
                      dataKey="A"
                      stroke="#0EA5E9"
                      fill="#0EA5E9"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-[#141820] border-slate-800/50 p-6 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
                <Target className="h-4 w-4 text-orange-500" /> Improve
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold text-slate-300">Machine Learning Model Selection</span>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold text-slate-300">Time Complexity Analysis</span>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold text-slate-300">Network Protocol Design</span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500">Best: Databases (90%)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}