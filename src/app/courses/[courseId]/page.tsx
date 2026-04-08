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
  getDocs
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
  Info,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { aiSubmissionEvaluationAndPlagiarismDetection } from '@/ai/flows/ai-submission-evaluation-and-plagiarism-detection';

export default function CoursePortalPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isPostingContent, setIsPostingContent] = useState(false);
  const [contentFormData, setContentFormData] = useState({
    title: '',
    type: 'announcement',
    body: '',
    url: '',
  });

  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);

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

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'submissions'),
      where('professorId', '==', user.uid)
    );
  }, [firestore, user]);
  const { data: rawSubmissions } = useCollection(submissionsQuery);

  const courseSubmissions = useMemo(() => {
    if (!rawSubmissions || !courseId) return [];
    return rawSubmissions.filter(s => s.courseId === courseId);
  }, [rawSubmissions, courseId]);

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
      postedAt: serverTimestamp(),
      isPinned: false,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'courses', courseId as string, 'content'), contentData);
      toast({ title: "Content Shared" });
      setIsContentDialogOpen(false);
      setContentFormData({ title: '', type: 'announcement', body: '', url: '' });
    } finally {
      setIsPostingContent(false);
    }
  };

  const handleAIEvaluate = async (submission: any) => {
    if (!firestore || !courseId || isEvaluating) return;

    setIsEvaluating(submission.id);
    toast({ title: "AI Evaluation Started", description: "Analyzing submission based on rubric..." });

    try {
      // 1. Fetch assignment details
      const assignmentRef = doc(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId);
      const assignmentSnap = await getDocs(query(collection(firestore, 'courses', courseId as string, 'assignments'), where('id', '==', submission.assignmentId)));
      const assignmentData = assignmentSnap.docs[0]?.data();

      // 2. Fetch rubric criteria
      const rubricQuery = query(collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics'));
      const rubricSnap = await getDocs(rubricQuery);
      const rubricDoc = rubricSnap.docs[0];
      
      let rubricText = "No specific rubric defined.";
      if (rubricDoc) {
        const criteriaSnap = await getDocs(collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics', rubricDoc.id, 'criteria'));
        rubricText = criteriaSnap.docs.map(d => `- ${d.data().description} (Max: ${d.data().maxScore})`).join('\n');
      }

      // 3. Run AI Flow
      const evaluation = await aiSubmissionEvaluationAndPlagiarismDetection({
        assignmentDescription: assignmentData?.description || "No description",
        assignmentRubric: rubricText,
        submissionText: submission.content,
        allOtherSubmissionsText: courseSubmissions.filter(s => s.id !== submission.id).map(s => s.content)
      });

      // 4. Update submission with results
      const submissionRef = doc(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'submissions', submission.id);
      await updateDoc(submissionRef, {
        status: 'graded',
        evaluation: {
          totalScore: evaluation.totalScore,
          writtenFeedback: evaluation.writtenFeedback,
          weakAreas: evaluation.weakAreas,
          plagiarismDetected: evaluation.plagiarismDetected,
          plagiarismDetails: evaluation.plagiarismDetails,
          rubricScores: evaluation.rubricScores,
          evaluatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      toast({ title: "Evaluation Complete", description: `Score: ${evaluation.totalScore}% assigned.` });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Evaluation Failed", description: "AI could not process this submission.", variant: "destructive" });
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleDeleteContent = (contentId: string) => {
    if (!firestore || !courseId) return;
    deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'content', contentId));
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!firestore || !courseId) return;
    deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'assignments', assignmentId));
  };

  if (isUserLoading || isCourseLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found.</div>;

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
    { label: 'Submissions', value: courseSubmissions.length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Avg. Score', value: '0%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
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
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tighter">Course Overview</h1>
              <p className="text-muted-foreground text-sm font-medium">Monitoring progress for <span className="text-primary">{course.semester}</span> session.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-card border-border hover:border-primary/20 transition-all group overflow-hidden relative">
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
                <Button className="rounded-xl px-8 h-12 gap-3 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all hover:scale-[1.02]">
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-xl font-bold border-border" onClick={() => { setSelectedAssignment(assignment); setIsDetailsOpen(true); }}>
                          <Info className="h-4 w-4 mr-2" /> Details
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-24 text-center space-y-6 bg-card/50 border-2 border-dashed border-border rounded-[3rem]">
                  <h3 className="text-2xl font-bold tracking-tight">No assignments yet</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-4xl font-bold tracking-tighter">Submissions</h1>
            <Card className="border-border overflow-hidden rounded-3xl">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Student</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Assignment</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Date</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">Score</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-widest">AI Result</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSubmissions.length > 0 ? (
                    courseSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="group">
                        <TableCell className="font-bold">{sub.submitterId.substring(0, 8)}...</TableCell>
                        <TableCell className="text-sm font-medium">{sub.assignmentTitle || 'Assignment'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.submittedAt?.toDate().toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {sub.evaluation?.totalScore !== undefined ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                              {sub.evaluation.totalScore}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">PENDING</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.evaluation?.plagiarismDetected ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" /> Flagged
                            </Badge>
                          ) : sub.evaluation?.totalScore !== undefined ? (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" /> Clean
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-primary gap-2"
                            onClick={() => handleAIEvaluate(sub)}
                            disabled={isEvaluating === sub.id}
                          >
                            {isEvaluating === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            AI Evaluate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">No submissions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-10 space-y-10">
            <h1 className="text-4xl font-bold tracking-tighter">Analytics</h1>
            <div className="h-64 flex items-center justify-center text-muted-foreground border rounded-3xl bg-card">
              Initializing analytics engine...
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold tracking-tighter">Course Content</h1>
              <Button className="rounded-xl px-8" onClick={() => setIsContentDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" /> Share Content
              </Button>
            </div>
            <div className="grid gap-6">
              {courseContent && courseContent.map((post) => (
                <Card key={post.id} className="rounded-3xl border-border">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold">{post.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(post.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Share Content</DialogTitle></DialogHeader>
          <form onSubmit={handlePostContent} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={contentFormData.title} onChange={(e) => setContentFormData({...contentFormData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={contentFormData.body} onChange={(e) => setContentFormData({...contentFormData, body: e.target.value})} required />
            </div>
            <Button type="submit" className="w-full" disabled={isPostingContent}>
              {isPostingContent ? <Loader2 className="animate-spin" /> : 'Share with Class'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}