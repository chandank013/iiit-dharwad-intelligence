"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
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
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  FolderOpen, 
  ChevronLeft,
  Clock,
  Plus,
  GraduationCap,
  Loader2,
  Trash2,
  Users,
  Megaphone,
  File as FileIcon,
  Link as LinkIcon,
  Download,
  Heart,
  MessageCircle,
  Send,
  Upload,
  X,
  Share2,
  Settings,
  Calendar,
  Info
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
  ResponsiveContainer
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// --- Baseline Analytics Data ---
const weeklyTrendData = [
  { name: 'Wk1', avg: 0 },
  { name: 'Wk2', avg: 0 },
  { name: 'Wk3', avg: 0 },
  { name: 'Wk4', avg: 0 },
  { name: 'Wk5', avg: 0 },
  { name: 'Wk6', avg: 0 },
];

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPostingContent, setIsPostingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contentFormData, setContentFormData] = useState({
    title: '',
    type: 'announcement',
    body: '',
    url: '',
  });

  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Security Guard: Prevent students from entering the portal
  useEffect(() => {
    if (!isUserLoading && user && user.email?.startsWith('24bds')) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

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

  const contentQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'content'), orderBy('postedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: courseContent } = useCollection(contentQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePostContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !courseId) return;

    setIsPostingContent(true);
    let finalAttachmentUrl = contentFormData.url;

    if (contentFormData.type === 'file' && selectedFile) {
      finalAttachmentUrl = URL.createObjectURL(selectedFile);
    }

    const contentData = {
      courseId,
      professorId: user.uid,
      title: contentFormData.title,
      contentType: contentFormData.type,
      content: contentFormData.body,
      attachmentUrl: finalAttachmentUrl,
      fileName: selectedFile?.name || '',
      postedAt: serverTimestamp(),
      isPinned: false,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'courses', courseId as string, 'content'), contentData);
      toast({ title: "Content Shared", description: "Your post has been shared with the class." });
      setIsContentDialogOpen(false);
      setContentFormData({ title: '', type: 'announcement', body: '', url: '' });
      setSelectedFile(null);
    } catch (error) {
      toast({ title: "Failed to share", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsPostingContent(false);
    }
  };

  const handleDeleteContent = (contentId: string) => {
    if (!firestore || !courseId) return;
    const contentRef = doc(firestore, 'courses', courseId as string, 'content', contentId);
    deleteDocumentNonBlocking(contentRef);
    toast({ title: "Post Deleted" });
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!firestore || !courseId) return;
    const assignmentRef = doc(firestore, 'courses', courseId as string, 'assignments', assignmentId);
    deleteDocumentNonBlocking(assignmentRef);
    toast({ title: "Assignment Deleted", description: "The task has been removed from the portal." });
  };

  const handleAddComment = (contentId: string) => {
    if (!firestore || !courseId || !user || !commentText.trim()) return;
    const commentsRef = collection(firestore, 'courses', courseId as string, 'content', contentId, 'comments');
    addDocumentNonBlocking(commentsRef, {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    });
    setCommentText('');
    toast({ title: "Comment added" });
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
    { id: 'content', label: 'Course Content', icon: FolderOpen },
  ];

  const stats = [
    { label: 'Total Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Submissions', value: 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Avg. Score', value: '0%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
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
      </aside>

      <main className="flex-1 ml-72 min-h-screen flex flex-col relative">
        <header className="h-20 border-b border-border flex items-center justify-between px-10 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
            <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
              ID: {course.joinCode}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tighter">Course Overview</h1>
                <p className="text-muted-foreground text-sm font-medium">Monitoring progress for <span className="text-primary">{course.semester}</span> session.</p>
              </div>
            </div>

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

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-border">
                    <div>
                      <CardTitle className="text-lg font-bold">Weekly Performance Trend</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Class average progression currently at 0% baseline.</p>
                    </div>
                    <Badge variant="outline" className="border-border text-xs font-bold text-primary px-3">Syncing</Badge>
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
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-8">
                <Card className="bg-card border-border">
                  <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Assignments</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    {assignments && assignments.length > 0 ? (
                      assignments.slice(0, 3).map((task, i) => (
                        <div key={i} className="space-y-3 group cursor-pointer" onClick={() => { setSelectedAssignment(task); setIsDetailsOpen(true); }}>
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tighter">Assignments</h1>
                <p className="text-muted-foreground text-sm font-medium">{assignments?.length || 0} active tasks</p>
              </div>
              <Link href={`/dashboard/professor/assignment/create?courseId=${courseId}`}>
                <Button className="rounded-xl px-8 h-12 gap-3 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                  <Plus className="h-5 w-5" /> New Assignment
                </Button>
              </Link>
            </div>
            <div className="grid gap-6">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <Card key={assignment.id} className="bg-card border-border hover:border-primary/40 transition-all rounded-3xl overflow-hidden group">
                    <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{assignment.title}</h3>
                          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No deadline'}</span>
                            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {assignment.submissionType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          className="rounded-xl font-bold border-border h-11 px-6 hover:bg-accent transition-colors"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4 mr-2" /> Details
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="rounded-xl font-bold h-11 px-4 shadow-sm hover:bg-accent">
                              <Settings className="h-4 w-4 mr-2" /> Manage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()} 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer p-3 rounded-xl font-bold"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Task
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{assignment.title}" and all associated rubrics. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                  >
                                    Confirm Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-24 text-center space-y-6 bg-card/50 border-2 border-dashed border-border rounded-[3rem]">
                  <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-1 ring-primary/10">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">No assignments yet</h3>
                    <p className="text-muted-foreground text-sm font-medium">Create your first task for students to begin evaluation.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assignment Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
            <DialogHeader className="bg-primary/5 p-8 border-b border-border text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight leading-none">{selectedAssignment?.title}</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Assignment ID: {selectedAssignment?.id}</DialogDescription>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-3 rounded-xl border border-border flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-[8px] font-bold text-muted-foreground uppercase">Deadline</div>
                    <div className="text-xs font-bold">{selectedAssignment?.deadline ? new Date(selectedAssignment.deadline).toLocaleDateString() : 'None'}</div>
                  </div>
                </div>
                <div className="bg-background/50 p-3 rounded-xl border border-border flex items-center gap-3">
                  <Upload className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-[8px] font-bold text-muted-foreground uppercase">Format</div>
                    <div className="text-xs font-bold uppercase">{selectedAssignment?.submissionType}</div>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Description & Instructions</Label>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap bg-accent/30 p-4 rounded-2xl">
                  {selectedAssignment?.description || 'No description provided.'}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-bold">Policy: {selectedAssignment?.lateSubmissionPolicy || 'Standard'}</span>
                </div>
                <Badge className="bg-secondary/20 text-secondary border-none font-bold">
                  {selectedAssignment?.allowResubmissions ? 'Resubmissions Allowed' : 'Final Submit Only'}
                </Badge>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0">
              <Button className="w-full h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary/20" onClick={() => setIsDetailsOpen(false)}>
                Back to Portal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tighter">Submissions</h1>
              <p className="text-muted-foreground text-sm font-medium">Central management for student evaluation</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 border-border bg-card">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Received</div>
                <div className="text-2xl font-bold">0</div>
              </Card>
              <Card className="p-4 border-border bg-card">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Review</div>
                <div className="text-2xl font-bold text-orange-500">0</div>
              </Card>
              <Card className="p-4 border-border bg-card">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">AI Graded</div>
                <div className="text-2xl font-bold text-blue-500">0</div>
              </Card>
              <Card className="p-4 border-border bg-card">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Flagged</div>
                <div className="text-2xl font-bold text-rose-500">0</div>
              </Card>
            </div>

            <Card className="border-border overflow-hidden rounded-3xl">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Student</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Assignment</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">AI Score</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-medium italic">
                      No submissions found for this course.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tighter">Class Analytics</h1>
              <p className="text-muted-foreground text-sm font-medium">Performance benchmarks and insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 border-border bg-card relative overflow-hidden group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Class Average</div>
                  <div className="text-3xl font-bold text-primary">0%</div>
                  <div className="text-[10px] font-bold text-muted-foreground">0% this week</div>
                </div>
              </Card>
              <Card className="p-6 border-border bg-card relative overflow-hidden group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submission Rate</div>
                  <div className="text-3xl font-bold text-emerald-500">0%</div>
                  <div className="text-[10px] font-bold text-muted-foreground">0% this week</div>
                </div>
              </Card>
              <Card className="p-6 border-border bg-card relative overflow-hidden group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Failing Students</div>
                  <div className="text-3xl font-bold text-rose-500">0</div>
                  <div className="text-[10px] font-bold text-muted-foreground">0 this week</div>
                </div>
              </Card>
              <Card className="p-6 border-border bg-card relative overflow-hidden group">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg AI Confidence</div>
                  <div className="text-3xl font-bold text-blue-500">0%</div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 border-border bg-card rounded-3xl">
                <CardTitle className="text-lg font-bold mb-6">Engagement Overview</CardTitle>
                <div className="h-64 flex items-center justify-center text-muted-foreground italic text-sm">
                  Insufficient data for visualization.
                </div>
              </Card>
              <Card className="p-8 border-border bg-card rounded-3xl">
                <CardTitle className="text-lg font-bold mb-6">Conceptual Strength</CardTitle>
                <div className="h-64 flex items-center justify-center text-muted-foreground italic text-sm">
                  Insufficient data for visualization.
                </div>
              </Card>
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
                        onValueChange={(val) => {
                          setContentFormData({ ...contentFormData, type: val });
                          setSelectedFile(null);
                        }}
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
                    
                    {contentFormData.type === 'file' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select File from Laptop (Up to 5GB)</Label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-32 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors"
                        >
                          {selectedFile ? (
                            <div className="flex items-center gap-2 text-primary font-bold">
                              <FileIcon className="h-5 w-5" />
                              <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 rounded-full" 
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground">Click to upload PDF or ZIP</span>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept=".pdf,.zip"
                        />
                      </div>
                    )}

                    {contentFormData.type === 'link' && (
                      <div className="space-y-2">
                        <Label htmlFor="url" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resource URL</Label>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the post
                                  and remove all its data from the course feed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteContent(post.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  Delete Post
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl font-medium">
                        {post.content}
                      </p>

                      {post.attachmentUrl && (
                        <div className="flex items-center gap-3">
                          <Button variant="outline" className="h-10 px-4 rounded-xl gap-2 font-bold text-xs" asChild>
                            <a href={post.attachmentUrl} download={post.fileName || 'attachment'} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5" /> 
                              {post.contentType === 'file' ? (post.fileName || 'Download Resource') : 'Visit Link'}
                            </a>
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="flex items-center gap-6">
                          <LikeButton 
                            postId={post.id} 
                            courseId={courseId as string} 
                            currentUserId={user.uid} 
                            initialLikes={post.likesCount} 
                          />
                          <button 
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/comment"
                          >
                            <MessageCircle className="h-4 w-4 group-hover/comment:fill-primary/20 transition-all" />
                            <span className="text-[10px] font-bold">Comments</span>
                          </button>
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground italic">
                          by {post.professorId === user.uid ? 'You' : 'Professor'}
                        </div>
                      </div>

                      {expandedPostId === post.id && (
                        <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex gap-4">
                            <Input 
                              placeholder="Write a comment..." 
                              className="h-11 rounded-xl bg-accent/30 border-none focus-visible:ring-primary/20"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                            />
                            <Button 
                              size="icon" 
                              className="h-11 w-11 shrink-0 rounded-xl"
                              onClick={() => handleAddComment(post.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>

                          <PostComments contentId={post.id} courseId={courseId as string} isProfessor={true} currentUserId={user.uid} />
                        </div>
                      )}
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LikeButton({ postId, courseId, currentUserId, initialLikes }: { postId: string, courseId: string, currentUserId: string, initialLikes: number }) {
  const firestore = useFirestore();
  const likeRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId, 'content', postId, 'likes', currentUserId);
  }, [firestore, courseId, postId, currentUserId]);
  
  const { data: likeData } = useDoc(likeRef);
  const isLiked = !!likeData;

  const handleToggleLike = async () => {
    if (!firestore) return;
    const postRef = doc(firestore, 'courses', courseId, 'content', postId);
    
    if (isLiked) {
      await deleteDoc(likeRef!);
      await updateDoc(postRef, { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef!, { uid: currentUserId, createdAt: serverTimestamp() });
      await updateDoc(postRef, { likesCount: increment(1) });
    }
  };

  return (
    <button 
      onClick={handleToggleLike}
      className={cn(
        "flex items-center gap-2 transition-colors group/like",
        isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
      )}
    >
      <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-rose-500")} />
      <span className="text-[10px] font-bold">{initialLikes || 0}</span>
    </button>
  );
}

function PostComments({ contentId, courseId, isProfessor, currentUserId }: { contentId: string, courseId: string, isProfessor: boolean, currentUserId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'courses', courseId, 'content', contentId, 'comments'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, contentId, courseId]);

  const { data: comments } = useCollection(commentsQuery);

  const handleDeleteComment = (commentId: string) => {
    if (!firestore) return;
    const commentRef = doc(firestore, 'courses', courseId, 'content', contentId, 'comments', commentId);
    deleteDocumentNonBlocking(commentRef);
    toast({ title: "Comment deleted" });
  };

  return (
    <div className="space-y-4">
      {comments && comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {comment.authorName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="bg-accent/30 p-4 rounded-2xl rounded-tl-none flex-1 relative group/comment-item">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground">{comment.authorName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {comment.createdAt?.toDate().toLocaleDateString()}
                </span>
                {(isProfessor || comment.authorId === currentUserId) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover/comment-item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{comment.text}</p>
          </div>
        </div>
      ))}
      {(!comments || comments.length === 0) && (
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">
          No comments yet. Start the conversation.
        </p>
      )}
    </div>
  );
}
