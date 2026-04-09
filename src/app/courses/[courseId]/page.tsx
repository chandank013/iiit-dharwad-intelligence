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
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
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
  Megaphone,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Link as LinkIcon,
  File as FileIcon,
  MessageCircle,
  Heart,
  Send,
  Users,
  Upload,
  Download,
  RotateCcw,
  Settings2,
  MoreVertical,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { aiSubmissionEvaluationAndPlagiarismDetection } from '@/ai/flows/ai-submission-evaluation-and-plagiarism-detection';
import { aiQuizGenerator } from '@/ai/flows/ai-quiz-generator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
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
} from 'recharts';

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPostingContent, setIsPostingContent] = useState(false);
  const [contentFormData, setContentFormData] = useState({ title: '', type: 'announcement', body: '', attachmentUrl: '' });
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [isBulkEvaluating, setIsBulkEvaluating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'content' | 'assignment' | 'quiz' } | null>(null);
  const [itemToReturn, setItemToReturn] = useState<any | null>(null);
  
  const [courseSubmissions, setCourseSubmissions] = useState<any[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

  // Quiz Generation State
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDeadline, setQuizDeadline] = useState('');
  const [generatedQuiz, setQuizPreview] = useState<any>(null);

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

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);
  const { data: allUsers } = useCollection(usersQuery);

  const contentQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'content'), orderBy('postedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: courseContent } = useCollection(contentQuery);

  const quizzesQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'quizzes'), orderBy('createdAt', 'desc'));
  }, [firestore, courseId]);
  const { data: quizzes } = useCollection(quizzesQuery);

  useEffect(() => {
    async function fetchSubmissions() {
      if (!firestore || !assignments || assignments.length === 0) {
        setCourseSubmissions([]);
        return;
      }

      setIsSubmissionsLoading(true);
      try {
        const submissionPromises = assignments.map(async (assignment) => {
          const subsRef = collection(firestore, 'courses', courseId as string, 'assignments', assignment.id, 'submissions');
          const subsSnap = await getDocs(subsRef);
          return subsSnap.docs.map(d => ({
            ...d.data(),
            id: d.id,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title
          }));
        });

        const results = await Promise.all(submissionPromises);
        const flattened = results.flat()
          .filter(s => {
            if (!allUsers) return true;
            const student = allUsers.find(u => u.id === s.submitterId);
            const fullName = `${student?.firstName || ''} ${student?.lastName || ''}`.toLowerCase();
            return !fullName.includes("chandan kumar");
          });
        
        setCourseSubmissions(flattened);
      } catch (err) {
        console.error("Error fetching course submissions:", err);
      } finally {
        setIsSubmissionsLoading(false);
      }
    }

    fetchSubmissions();
  }, [firestore, assignments, courseId, allUsers]);

  const analyticsData = useMemo(() => {
    if (!courseSubmissions || !assignments) return { distribution: [], performance: [] };
    const graded = courseSubmissions.filter(s => s.status === 'graded');
    const distribution = [
      { name: '0-50', value: 0, color: '#ef4444' },
      { name: '50-75', value: 0, color: '#f59e0b' },
      { name: '75-90', value: 0, color: '#10b981' },
      { name: '90-100', value: 0, color: '#3b82f6' },
    ];
    graded.forEach(s => {
      const score = s.evaluation?.totalScore || 0;
      if (score < 50) distribution[0].value++;
      else if (score < 75) distribution[1].value++;
      else if (score < 90) distribution[2].value++;
      else distribution[3].value++;
    });
    const performance = assignments.map(a => {
      const subs = graded.filter(s => s.assignmentId === a.id);
      const avg = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + (s.evaluation?.totalScore || 0), 0) / subs.length) : 0;
      return { name: a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title, average: avg };
    }).reverse();
    return { distribution: distribution.filter(d => d.value > 0), performance };
  }, [courseSubmissions, assignments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setContentFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
      toast({ title: "File Attached", description: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleAIEvaluate = async (submission: any) => {
    if (!firestore || !courseId) return;
    const assignment = assignments?.find(a => a.id === submission.assignmentId);
    if (assignment?.deadline && new Date() < new Date(assignment.deadline)) {
      toast({ title: "Evaluation Locked", description: "You can only evaluate after the deadline.", variant: "destructive" });
      return;
    }
    setIsEvaluating(submission.id);
    try {
      const evaluation = await aiSubmissionEvaluationAndPlagiarismDetection({
        assignmentDescription: assignment?.description || "No description",
        assignmentRubric: "General Academic Integrity",
        submissionText: submission.content,
        allOtherSubmissionsText: courseSubmissions.filter(s => s.id !== submission.id).map(s => s.content)
      });
      const submissionRef = doc(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'submissions', submission.id);
      await updateDoc(submissionRef, {
        status: 'graded',
        evaluation: { ...evaluation, evaluatedAt: new Date() },
        updatedAt: serverTimestamp()
      });
      toast({ title: "Evaluation Complete" });
      return true;
    } catch (error) {
      toast({ title: "Evaluation Failed", variant: "destructive" });
      return false;
    } finally { setIsEvaluating(null); }
  };

  const handleBulkEvaluate = async () => {
    const pending = courseSubmissions.filter(s => {
      const assignment = assignments?.find(a => a.id === s.assignmentId);
      const deadlinePassed = assignment?.deadline ? new Date() > new Date(assignment.deadline) : true;
      return s.status !== 'graded' && deadlinePassed;
    });
    if (pending.length === 0) {
      toast({ title: "No Eligible Submissions", variant: "destructive" });
      return;
    }
    setIsBulkEvaluating(true);
    for (const sub of pending) { await handleAIEvaluate(sub); }
    setIsBulkEvaluating(false);
    toast({ title: "Bulk Evaluation Finished" });
  };

  const handlePostContent = async () => {
    if (!firestore || !courseId || !user || !contentFormData.title) return;
    setIsPostingContent(true);
    try {
      const contentRef = collection(firestore, 'courses', courseId as string, 'content');
      await addDoc(contentRef, {
        ...contentFormData,
        courseId,
        professorId: user.uid,
        postedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likesCount: 0,
        isPinned: false
      });
      setIsContentDialogOpen(false);
      setContentFormData({ title: '', type: 'announcement', body: '', attachmentUrl: '' });
      toast({ title: "Content Published" });
    } catch (e) {
      toast({ title: "Failed to Post", variant: "destructive" });
    } finally {
      setIsPostingContent(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    try {
      const quiz = await aiQuizGenerator({ content: quizTopic });
      setQuizPreview(quiz);
      toast({ title: "Quiz Generated Successfully" });
    } catch (err) {
      toast({ title: "AI Generation Failed", variant: "destructive" });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!firestore || !courseId || !generatedQuiz) return;
    try {
      const quizRef = collection(firestore, 'courses', courseId as string, 'quizzes');
      await addDoc(quizRef, {
        ...generatedQuiz,
        deadline: quizDeadline || null,
        createdAt: serverTimestamp(),
        isActive: true
      });
      setIsQuizDialogOpen(false);
      setQuizPreview(null);
      setQuizTopic('');
      setQuizDeadline('');
      toast({ title: "Quiz Published to Students" });
    } catch (e) {
      toast({ title: "Failed to Publish", variant: "destructive" });
    }
  };

  const handleViewContent = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } catch (err) {
        toast({ title: "View Error", description: "Could not open document.", variant: "destructive" });
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const handleAddComment = (contentId: string) => {
    if (!firestore || !courseId || !user || !commentText.trim()) return;
    const commentsRef = collection(firestore, 'courses', courseId as string, 'content', contentId, 'comments');
    addDoc(commentsRef, {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || 'Professor',
      professorId: user.uid,
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || !firestore || !courseId) return;
    try {
      if (itemToDelete.type === 'content') {
        await deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'content', itemToDelete.id));
      } else if (itemToDelete.type === 'quiz') {
        await deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'quizzes', itemToDelete.id));
      }
      toast({ title: "Item Deleted" });
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleReturnForRevision = async () => {
    if (!itemToReturn || !firestore || !courseId) return;
    try {
      const submissionRef = doc(firestore, 'courses', courseId as string, 'assignments', itemToReturn.assignmentId, 'submissions', itemToReturn.id);
      await updateDoc(submissionRef, { status: 'returned', updatedAt: serverTimestamp() });
      toast({ title: "Submission Returned" });
    } catch (error) { toast({ title: "Failed to Return", variant: "destructive" }); }
    finally { setItemToReturn(null); }
  };

  const getStudentName = (uid: string) => {
    const foundUser = allUsers?.find(u => u.id === uid);
    return foundUser ? `${foundUser.firstName} ${foundUser.lastName || ""}` : "Unknown Student";
  };

  if (isUserLoading || isCourseLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found.</div>;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-72 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-card z-30">
        <div className="p-8">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest mb-10 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Link>
          <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold truncate leading-tight">{course.name}</div>
          </div>
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'assignments', icon: BookOpen },
              { id: 'submissions', icon: FileText },
              { id: 'quizzes', icon: HelpCircle },
              { id: 'analytics', icon: TrendingUp },
              { id: 'content', icon: FolderOpen }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-semibold capitalize",
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.id}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen flex flex-col">
        <header className="h-20 border-b border-border flex items-center justify-between px-10 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <h2 className="text-lg font-bold tracking-tight capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4"><ThemeToggle /></div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="p-10 space-y-10">
            <h1 className="text-3xl font-bold tracking-tighter">Course Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Submissions', value: courseSubmissions.length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Quizzes', value: quizzes?.length || 0, icon: HelpCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              ].map((stat, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.bg)}><stat.icon className={cn("h-6 w-6", stat.color)} /></div>
                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</div><div className="text-2xl font-bold">{stat.value}</div></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">Assignments</h1>
                <p className="text-muted-foreground">Manage tasks and grading criteria.</p>
              </div>
              <Link href={`/dashboard/professor/assignment/create?courseId=${courseId}`}>
                <Button className="gap-2 font-bold shadow-xl shadow-primary/20">
                  <Plus className="h-4 w-4" /> Create New
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const subCount = courseSubmissions.filter(s => s.assignmentId === assignment.id).length;
                  return (
                    <Card key={assignment.id} className="border-border group hover:border-primary/20 transition-all">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{assignment.title}</h3>
                              {assignment.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}</span>
                              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {subCount} Submissions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/professor/assignment/edit/${assignment.id}?courseId=${courseId}`}>
                            <Button variant="outline" size="sm" className="font-bold gap-2">
                              <Settings2 className="h-4 w-4" /> Manage
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-card">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">No assignments yet</h3>
                  <p className="text-muted-foreground text-sm">Launch your first task for this course.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
                <p className="text-muted-foreground">AI-assisted evaluation and plagiarism detection.</p>
              </div>
              <Button variant="secondary" onClick={handleBulkEvaluate} disabled={isBulkEvaluating} className="font-bold shadow-lg">
                {isBulkEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}
                Bulk AI Eval
              </Button>
            </div>
            <Card className="border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSubmissions.length > 0 ? (
                    courseSubmissions.map((sub) => {
                      const assignment = assignments?.find(a => a.id === sub.assignmentId);
                      const deadlinePassed = assignment?.deadline ? new Date() > new Date(assignment.deadline) : true;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-bold text-xs">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{getStudentName(sub.submitterId)[0]}</AvatarFallback></Avatar>
                              {getStudentName(sub.submitterId)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{sub.assignmentTitle}</TableCell>
                          <TableCell>
                            {sub.evaluation?.totalScore !== undefined ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{sub.evaluation.totalScore}% AI Grade</Badge>
                            ) : sub.status === 'returned' ? (
                              <Badge variant="secondary" className="text-rose-500">Returned</Badge>
                            ) : !deadlinePassed ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/20">Early</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Ready</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!deadlinePassed && sub.status === 'submitted' && (
                                <Button variant="ghost" size="sm" onClick={() => setItemToReturn(sub)} className="text-rose-500 hover:text-rose-600">
                                  <RotateCcw className="h-3 w-3 mr-1" /> Return
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAIEvaluate(sub)} 
                                disabled={isEvaluating === sub.id || !deadlinePassed || sub.status === 'returned'} 
                                className="text-primary hover:text-primary/80"
                              >
                                {isEvaluating === sub.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                AI Eval
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground italic">No submissions yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="p-10 space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">AI Quiz Lab</h1>
                <p className="text-muted-foreground">Generate and manage automated assessments.</p>
              </div>
              <Button onClick={() => setIsQuizDialogOpen(true)} className="gap-2 font-bold shadow-xl shadow-primary/20">
                <Sparkles className="h-4 w-4" /> Generate with AI
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes && quizzes.length > 0 ? (
                quizzes.map((quiz) => {
                  const deadlinePassed = quiz.deadline && new Date() > new Date(quiz.deadline);
                  return (
                    <Card key={quiz.id} className="border-border hover:border-primary/20 transition-all flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1.5">
                            <Badge variant="secondary" className="w-fit">AI Generated</Badge>
                            {quiz.deadline && (
                              <Badge variant={deadlinePassed ? "destructive" : "outline"} className="text-[10px] w-fit">
                                {deadlinePassed ? "Expired" : `Due: ${new Date(quiz.deadline).toLocaleDateString()}`}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-rose-500 font-bold" onClick={() => setItemToDelete({ id: quiz.id, type: 'quiz' })}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Quiz
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-xl font-bold leading-tight mt-4">{quiz.title}</CardTitle>
                        <CardDescription>{quiz.questions.length} Questions • Instant Grading</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Clock className="h-3 w-3" /> Created {new Date(quiz.createdAt?.seconds * 1000).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-card">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">No quizzes available</h3>
                  <p className="text-muted-foreground text-sm">Use AI to generate a challenging quiz for your students.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-10 space-y-10">
            <h1 className="text-3xl font-bold tracking-tighter">Performance Insights</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 space-y-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Grade Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of AI-evaluated scores.</CardDescription>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  {analyticsData.distribution.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 space-y-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Assignment Averages
                  </CardTitle>
                  <CardDescription>Comparison across all tasks.</CardDescription>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.performance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                      <YAxis domain={[0, 100]} fontSize={10} fontWeight="bold" />
                      <Tooltip />
                      <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-10 space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">Resources & Feed</h1>
                <p className="text-muted-foreground">Share announcements, files, and links with students.</p>
              </div>
              <Button onClick={() => setIsContentDialogOpen(true)} size="icon" className="rounded-full h-12 w-12 shadow-xl">
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-6">
              {courseContent && courseContent.length > 0 ? (
                courseContent.map((post) => (
                  <Card key={post.id} className="rounded-3xl border-border overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                            {post.type === 'link' ? <LinkIcon className="h-5 w-5" /> : 
                             post.type === 'video' ? <ExternalLink className="h-5 w-5" /> :
                             post.type === 'file' ? <FileIcon className="h-5 w-5" /> :
                             <Megaphone className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20">{post.type}</Badge>
                              {post.isPinned && <Badge className="text-[10px] font-bold uppercase">Pinned</Badge>}
                            </div>
                            <h3 className="text-xl font-bold">{post.title}</h3>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem className="text-rose-500 font-bold" onClick={() => setItemToDelete({ id: post.id, type: 'content' })}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.body || post.content}</p>
                      
                      {post.attachmentUrl && (
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleViewContent(post.attachmentUrl)} 
                            className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" /> View Content
                          </button>
                          <a 
                            href={post.attachmentUrl} 
                            download={post.title} 
                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline"
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="flex items-center gap-2 text-rose-500 font-bold">
                           <Heart className="h-4 w-4 fill-rose-500" />
                           <span className="text-xs">{post.likesCount || 0}</span>
                        </div>
                        <button 
                          onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} 
                          className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors uppercase"
                        >
                          <MessageCircle className="h-4 w-4" /> Discussion
                        </button>
                      </div>
                      {expandedPostId === post.id && (
                        <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in slide-in-from-top-2">
                          <div className="flex gap-4">
                            <Input 
                              placeholder="Write a comment..." 
                              value={commentText} 
                              onChange={(e) => setCommentText(e.target.value)} 
                              className="rounded-xl border-none bg-accent/30"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <Button size="icon" className="rounded-xl" onClick={() => handleAddComment(post.id)}><Send className="h-4 w-4" /></Button>
                          </div>
                          <div className="space-y-4">
                            <PostComments contentId={post.id} courseId={courseId as string} currentUserId={user.uid} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-card">
                  <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">The feed is empty</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">Share announcements or documents with your students to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Post Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content Type</Label>
                <Select value={contentFormData.type} onValueChange={(v) => setContentFormData({ ...contentFormData, type: v })}>
                  <SelectTrigger className="rounded-xl h-12 bg-accent/30 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="file">File/Handout</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                    <SelectItem value="video">Embedded Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                <Input 
                  placeholder="e.g. Exam Schedule" 
                  value={contentFormData.title} 
                  onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                  className="rounded-xl h-12 bg-accent/30 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description/Body</Label>
              <Textarea 
                placeholder="Details about your update..." 
                value={contentFormData.body} 
                onChange={(e) => setContentFormData({ ...contentFormData, body: e.target.value })}
                className="min-h-[150px] rounded-xl bg-accent/30 border-none p-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attachment</Label>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  className="hidden" 
                  id="content-file-upload" 
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  type="button"
                  className="w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 rounded-xl font-bold"
                  onClick={() => document.getElementById('content-file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> 
                  {contentFormData.attachmentUrl ? "Change Selected File" : "Select from Device"}
                </Button>
              </div>
              {contentFormData.attachmentUrl && (
                <p className="text-[10px] text-primary font-bold animate-pulse">✓ File successfully attached and ready to post.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsContentDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handlePostContent} disabled={isPostingContent} className="rounded-xl font-bold px-8 shadow-lg">
              {isPostingContent ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Publish Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> AI Quiz Builder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!generatedQuiz ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Context / Topic</Label>
                  <Textarea 
                    placeholder="Paste textbook content or describe the quiz topic here..." 
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    className="min-h-[200px] rounded-2xl bg-accent/30 border-none p-6 leading-relaxed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deadline (Optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={quizDeadline} 
                    onChange={(e) => setQuizDeadline(e.target.value)}
                    className="rounded-xl bg-accent/30 border-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-bold gap-2"
                    onClick={() => document.getElementById('quiz-file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" /> Upload Material
                  </Button>
                  <input type="file" id="quiz-file-upload" className="hidden" accept=".pdf" />
                  <Button 
                    className="flex-1 rounded-xl h-12 font-bold gap-2 shadow-lg"
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz || !quizTopic.trim()}
                  >
                    {isGeneratingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Quiz
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <h3 className="font-bold text-lg mb-4 text-primary">Preview: {generatedQuiz.title}</h3>
                  <div className="space-y-4">
                    {generatedQuiz.questions.map((q: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="font-bold mb-1">{i + 1}. {q.question}</p>
                        <p className="text-muted-foreground italic">Correct: {q.options[q.correctAnswerIndex]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setQuizPreview(null)} className="rounded-xl font-bold">Start Over</Button>
                  <Button onClick={handlePublishQuiz} className="rounded-xl font-bold px-8 shadow-lg">Publish Quiz</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently remove the item from the course.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="rounded-xl font-bold bg-rose-500 hover:bg-rose-600">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToReturn} onOpenChange={(open) => !open && setItemToReturn(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Return for Revision?</AlertDialogTitle>
            <AlertDialogDescription>The student will be able to modify their submission and re-submit it before the deadline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnForRevision} className="rounded-xl font-bold">Confirm Return</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PostComments({ contentId, courseId, currentUserId }: { contentId: string, courseId: string, currentUserId: string }) {
  const firestore = useFirestore();
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', courseId, 'content', contentId, 'comments'), orderBy('createdAt', 'desc'));
  }, [firestore, contentId, courseId]);
  const { data: comments } = useCollection(commentsQuery);

  const handleDeleteComment = (commentId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'courses', courseId, 'content', contentId, 'comments', commentId));
  };

  return (
    <div className="space-y-4">
      {comments?.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] font-bold">{comment.authorName?.[0]}</AvatarFallback></Avatar>
          <div className="bg-accent/30 p-4 rounded-2xl flex-1 relative group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold flex items-center gap-2">
                {comment.authorName}
                {comment.professorId && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">STAFF</Badge>}
              </span>
              {comment.authorId === currentUserId && (
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(comment.id)}>
                  <Trash2 className="h-3 w-3 text-rose-500" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}