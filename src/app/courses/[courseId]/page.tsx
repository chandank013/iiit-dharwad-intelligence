
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
  collectionGroup,
  getDocs,
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
  Megaphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Link as LinkIcon,
  FileArchive,
  File as FileIcon,
  MessageCircle,
  Heart,
  Send,
  Users,
  User,
  AlertCircle,
  Upload,
  Download,
  RotateCcw,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { aiSubmissionEvaluationAndPlagiarismDetection } from '@/ai/flows/ai-submission-evaluation-and-plagiarism-detection';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [isBulkEvaluating, setIsBulkEvaluating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'content' } | null>(null);
  const [itemToReturn, setItemToReturn] = useState<any | null>(null);

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

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'submissions'),
      where('professorId', '==', user.uid)
    );
  }, [firestore, user]);
  const { data: rawSubmissions } = useCollection(submissionsQuery);

  const courseSubmissions = useMemo(() => {
    if (!rawSubmissions || !courseId || !allUsers) return [];
    return rawSubmissions
      .filter(s => s.courseId === courseId)
      .filter(s => {
        const student = allUsers.find(u => u.id === s.submitterId);
        const fullName = student ? `${student.firstName} ${student.lastName}` : "";
        return !fullName.toLowerCase().includes("chandan kumar");
      });
  }, [rawSubmissions, courseId, allUsers]);

  const analyticsData = useMemo(() => {
    if (!courseSubmissions || !assignments) return { distribution: [], performance: [] };
    const graded = courseSubmissions.filter(s => s.status === 'graded');
    const distribution = [
      { range: '0-50', count: 0, color: '#ef4444' },
      { range: '50-75', count: 0, color: '#f59e0b' },
      { range: '75-90', count: 0, color: '#10b981' },
      { range: '90-100', count: 0, color: '#3b82f6' },
    ];
    graded.forEach(s => {
      const score = s.evaluation?.totalScore || 0;
      if (score < 50) distribution[0].count++;
      else if (score < 75) distribution[1].count++;
      else if (score < 90) distribution[2].count++;
      else distribution[3].count++;
    });
    const performance = assignments.map(a => {
      const subs = graded.filter(s => s.assignmentId === a.id);
      const avg = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + (s.evaluation?.totalScore || 0), 0) / subs.length) : 0;
      return { name: a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title, average: avg };
    }).reverse();
    return { distribution, performance };
  }, [courseSubmissions, assignments]);

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
        evaluation: { ...evaluation, evaluatedAt: serverTimestamp() },
        updatedAt: serverTimestamp()
      });
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
    return foundUser ? `${foundUser.firstName} ${foundUser.lastName}` : "Unknown Student";
  };

  if (isUserLoading || isCourseLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
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
            {['dashboard', 'assignments', 'submissions', 'analytics', 'content'].map((id) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-semibold capitalize", activeTab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}
              >
                {id === 'dashboard' ? <LayoutDashboard className="h-4 w-4" /> : id === 'assignments' ? <BookOpen className="h-4 w-4" /> : id === 'submissions' ? <FileText className="h-4 w-4" /> : id === 'analytics' ? <TrendingUp className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                {id}
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
                { label: 'Graded', value: courseSubmissions.filter(s => s.status === 'graded').length, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
              <Button variant="secondary" onClick={handleBulkEvaluate} disabled={isBulkEvaluating}>
                {isBulkEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary mr-2" />}
                Evaluate All
              </Button>
            </div>
            <Card className="border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSubmissions.map((sub) => {
                    const assignment = assignments?.find(a => a.id === sub.assignmentId);
                    const deadlinePassed = assignment?.deadline ? new Date() > new Date(assignment.deadline) : true;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-bold text-xs flex items-center gap-2">
                          <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px]">{getStudentName(sub.submitterId)[0]}</AvatarFallback></Avatar>
                          {getStudentName(sub.submitterId)}
                        </TableCell>
                        <TableCell className="text-xs">{sub.assignmentTitle}</TableCell>
                        <TableCell>
                          {sub.evaluation?.totalScore !== undefined ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500">{sub.evaluation.totalScore}% SCORE</Badge>
                          ) : sub.status === 'returned' ? (
                            <Badge variant="secondary" className="text-rose-500">RETURNED</Badge>
                          ) : !deadlinePassed ? (
                            <Badge variant="outline" className="text-amber-500">EARLY SUBMISSION</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">READY</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!deadlinePassed && sub.status === 'submitted' && (
                            <Button variant="ghost" size="sm" onClick={() => setItemToReturn(sub)} className="text-rose-500 mr-2"><RotateCcw className="h-3 w-3 mr-1" /> Return</Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleAIEvaluate(sub)} disabled={isEvaluating === sub.id || !deadlinePassed || sub.status === 'returned'} className="text-primary"><Sparkles className="h-3 w-3 mr-1" /> AI Eval</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      <AlertDialog open={!!itemToReturn} onOpenChange={(open) => !open && setItemToReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Return for Revision?</AlertDialogTitle><AlertDialogDescription>Student can re-submit before the deadline.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleReturnForRevision}>Confirm Return</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
