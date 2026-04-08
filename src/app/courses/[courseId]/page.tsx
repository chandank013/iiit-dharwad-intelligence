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
  getDoc
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
  XCircle,
  BarChart3
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
      setContentFormData({ title: '', type: 'announcement', body: '' });
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
      const assignmentSnap = await getDoc(assignmentRef);
      const assignmentData = assignmentSnap.data();

      // 2. Fetch rubric criteria
      const rubricsRef = collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics');
      const rubricsSnap = await getDocs(rubricsRef);
      const rubricDoc = rubricsSnap.docs[0];
      
      let rubricText = "No specific rubric defined.";
      if (rubricDoc) {
        const criteriaSnap = await getDocs(collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics', rubricDoc.id, 'criteria'));
        rubricText = criteriaSnap.docs.map(d => `- ${d.data().description} (Max Points: ${d.data().maxScore})`).join('\n');
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
      const isUnavailable = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('busy');
      toast({ 
        title: "Evaluation Failed", 
        description: isUnavailable ? "AI service is currently busy. Please try again in a moment." : "AI could not process this submission.", 
        variant: "destructive" 
      });
    } finally {
      setIsEvaluating(null);
    }
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
    { id: 'content', label: 'Course Feed', icon: FolderOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-72 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-card z-30">
        <div className="p-8">
          <Link href="/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest mb-10 group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Link>
          
          <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold truncate leading-tight">{course.name}</div>
          </div>

          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-semibold",
                  activeTab === link.id 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen flex flex-col relative">
        <header className="h-20 border-b border-border flex items-center justify-between px-10 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold tracking-tight capitalize">{activeTab}</h2>
            <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
              {course.joinCode}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tighter">Course Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Students', value: enrollments?.length || 0, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Assignments', value: assignments?.length || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Submissions', value: courseSubmissions.length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Graded', value: courseSubmissions.filter(s => s.status === 'graded').length, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((stat, i) => (
                <Card key={i} className="bg-card border-border hover:border-primary/20 transition-all">
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tighter">Assignments</h1>
              <Link href={`/dashboard/professor/assignment/create?courseId=${courseId}`}>
                <Button className="rounded-xl px-6 gap-2 font-bold shadow-lg">
                  <Plus className="h-5 w-5" /> New Task
                </Button>
              </Link>
            </div>
            <div className="grid gap-6">
              {assignments?.map((assignment) => (
                <Card key={assignment.id} className="bg-card border-border group hover:border-primary/30 transition-all rounded-2xl overflow-hidden">
                  <CardContent className="p-8 flex items-center justify-between">
                    <div className="flex items-start gap-5">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{assignment.title}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'assignments', assignment.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="rounded-xl font-bold" onClick={() => { setSelectedAssignment(assignment); setIsDetailsOpen(true); }}>
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
            <Card className="border-border overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Student ID</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Task</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSubmissions.length > 0 ? (
                    courseSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="group">
                        <TableCell className="font-bold text-xs">{sub.submitterId.substring(0, 8)}...</TableCell>
                        <TableCell className="text-xs font-medium">{sub.assignmentTitle || 'Assignment'}</TableCell>
                        <TableCell>
                          {sub.evaluation?.totalScore !== undefined ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                              {sub.evaluation.totalScore}% AI SCORING
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] font-bold">AWAITING EVALUATION</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-primary gap-2 text-xs"
                            onClick={() => handleAIEvaluate(sub)}
                            disabled={isEvaluating === sub.id}
                          >
                            {isEvaluating === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            AI Evaluation
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs">No work submitted yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tighter">Analytics Engine</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="border-border bg-primary/5 rounded-2xl">
                 <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Academic Progress</CardTitle></CardHeader>
                 <CardContent className="h-48 flex items-center justify-center italic text-muted-foreground text-xs">
                    Synthesizing class data...
                 </CardContent>
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tighter">Course Feed</h1>
              <Button className="rounded-xl px-6 font-bold" onClick={() => setIsContentDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" /> New Post
              </Button>
            </div>
            <div className="grid gap-6">
              {courseContent?.map((post) => (
                <Card key={post.id} className="rounded-2xl border-border hover:shadow-lg transition-all">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold">{post.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'content', post.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Create Course Update</DialogTitle></DialogHeader>
          <form onSubmit={handlePostContent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Post Title</Label>
              <Input value={contentFormData.title} onChange={(e) => setContentFormData({...contentFormData, title: e.target.value})} placeholder="e.g. Lab Update" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Message</Label>
              <Textarea value={contentFormData.body} onChange={(e) => setContentFormData({...contentFormData, body: e.target.value})} placeholder="Detailed update for the class..." required />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={isPostingContent}>
              {isPostingContent ? <Loader2 className="animate-spin" /> : 'Broadcast to Class'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}