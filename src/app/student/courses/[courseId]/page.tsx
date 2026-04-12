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
  serverTimestamp,
  collectionGroup,
  increment,
  addDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  ChevronLeft, 
  Clock, 
  TrendingUp, 
  Loader2, 
  FolderOpen,
  ArrowRight,
  Megaphone,
  File as FileIcon,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  FileArchive,
  AlertTriangle,
  Download,
  FileText,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  XCircle,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Input } from '@/components/ui/input';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { aiQuizEvaluator } from '@/ai/flows/ai-quiz-evaluator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AIChatbot } from '@/components/ai-chatbot';

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const [isUnsubmitReminderOpen, setIsUnsubmitReminderOpen] = useState(false);

  const isChandan = user?.displayName?.toLowerCase().includes('chandan') || user?.email?.toLowerCase().includes('chandan');

  useEffect(() => {
    if (!isUserLoading && user && !user.email?.startsWith('24bds')) {
      router.push(`/courses/${courseId}`);
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

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'submissions'),
      where('submitterId', '==', user.uid)
    );
  }, [firestore, user]);
  const { data: rawSubmissions } = useCollection(submissionsQuery);

  const mySubmissions = useMemo(() => {
    if (!rawSubmissions || !courseId) return [];
    if (isChandan) return [];
    return rawSubmissions.filter(s => s.courseId === courseId && s.status !== 'returned');
  }, [rawSubmissions, courseId, isChandan]);

  const submittedAssignmentIds = useMemo(() => {
    return new Set(mySubmissions.map(s => s.assignmentId));
  }, [mySubmissions]);

  const quizSubmissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'quiz_submissions'), where('studentId', '==', user.uid));
  }, [firestore, user, courseId]);
  const { data: quizSubmissions } = useCollection(quizSubmissionsQuery);

  const completedQuizIds = useMemo(() => {
    return new Set(quizSubmissions?.map(s => s.quizId));
  }, [quizSubmissions]);

  const handleStartQuiz = (quiz: any) => {
    const isCompleted = completedQuizIds.has(quiz.id);
    const deadlinePassed = quiz.deadline && new Date() > new Date(quiz.deadline);
    
    if (isCompleted) {
      const sub = quizSubmissions?.find(s => s.quizId === quiz.id);
      setActiveQuiz(quiz);
      setQuizResult(sub?.evaluation || { score: sub?.score, feedback: "Attempt previously submitted." });
      return;
    }

    if (deadlinePassed) {
      toast({ title: "Assessment Expired", description: "This quiz is no longer accepting submissions.", variant: "destructive" });
      return;
    }

    setActiveQuiz(quiz);
    setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizResult(null);
  };

  const handleSubmitQuiz = async () => {
    if (!firestore || !user || !courseId || !activeQuiz) return;
    if (quizAnswers.includes(-1)) {
      toast({ title: "Incomplete Quiz", description: "Please answer all questions.", variant: "destructive" });
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const evaluation = await aiQuizEvaluator({
        quizTitle: activeQuiz.title,
        questions: activeQuiz.questions,
        studentAnswers: quizAnswers
      });

      const submissionData = {
        quizId: activeQuiz.id,
        studentId: user.uid,
        studentName: user.displayName || 'Anonymous',
        score: evaluation.score,
        evaluation,
        submittedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'courses', courseId as string, 'quiz_submissions'), submissionData);
      setQuizResult(evaluation);
      toast({ title: "Quiz Evaluated!" });
    } catch (e) {
      toast({ title: "Evaluation Failed", variant: "destructive" });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleUnsubmit = async (sub: any) => {
    if (!firestore || !courseId) return;
    try {
      const subRef = doc(firestore, 'courses', courseId as string, 'assignments', sub.assignmentId, 'submissions', sub.id);
      await deleteDocumentNonBlocking(subRef);
      toast({ title: "Work Unsubmitted", description: "You can now make changes and submit again." });
    } catch (error) {
      toast({ title: "Action Failed", variant: "destructive" });
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
    addDocumentNonBlocking(commentsRef, {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  const contentContextString = useMemo(() => {
    if (!courseContent || courseContent.length === 0) return "No content posted yet.";
    return courseContent.map(c => `Title: ${c.title}. Type: ${c.contentType}. Body: ${c.body}`).join(' | ');
  }, [courseContent]);

  if (isUserLoading || isCourseLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!course) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Course not found.</div>;

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'quizzes', label: 'AI Quizzes', icon: HelpCircle },
    { id: 'submissions', label: 'My Submissions', icon: FileText },
    { id: 'content', label: 'Course Feed', icon: FolderOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-card z-30">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest mb-8 group">
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
                onClick={() => {
                  setActiveTab(link.id);
                  setExpandedPostId(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all font-semibold",
                  activeTab === link.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
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

      <main className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.name}</h1>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span>Welcome, {user.displayName?.split(' ')[0] || 'Student'}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{course.semester}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-border p-6 flex items-center gap-6 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {assignments?.filter(a => !submittedAssignmentIds.has(a.id)).length || 0}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tasks Pending</div>
                  </div>
                </Card>
                <Card className="border-border p-6 flex items-center gap-6 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {submittedAssignmentIds.size}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assignments Done</div>
                  </div>
                </Card>
                <Card className="border-border p-6 flex items-center gap-6 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {completedQuizIds.size} / {quizzes?.length || 0}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Quizzes Done</div>
                  </div>
                </Card>
                <Card className="border-border p-6 flex items-center gap-6 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-muted-foreground border border-border">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {quizSubmissions && quizSubmissions.length > 0 
                        ? `${Math.round(quizSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / quizSubmissions.length)}%` 
                        : '0%'}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assessment Avg</div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-border overflow-hidden rounded-2xl shadow-sm">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Assignment Queue
                    </CardTitle>
                    <button onClick={() => setActiveTab('assignments')} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {assignments && assignments.length > 0 ? (
                        assignments.slice(0, 5).map((task, i) => {
                          const isSubmitted = submittedAssignmentIds.has(task.id);
                          const deadlinePassed = task.deadline && new Date() > new Date(task.deadline);
                          return (
                            <div key={i} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => !deadlinePassed && router.push(`/student/courses/${courseId}/submit/${task.id}`)}>
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                  {task.title}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSubmitted ? (
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                                ) : deadlinePassed ? (
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Missing</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Pending</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">No upcoming tasks.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border overflow-hidden rounded-2xl shadow-sm">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-orange-500" /> Quiz Queue
                    </CardTitle>
                    <button onClick={() => setActiveTab('quizzes')} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {quizzes && quizzes.length > 0 ? (
                        quizzes.slice(0, 5).map((quiz, i) => {
                          const isDone = completedQuizIds.has(quiz.id);
                          const deadlinePassed = quiz.deadline && new Date() > new Date(quiz.deadline);
                          const isMissing = !isDone && deadlinePassed;
                          
                          return (
                            <div key={i} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => handleStartQuiz(quiz)}>
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                  {quiz.title}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {quiz.deadline ? `Due: ${new Date(quiz.deadline).toLocaleDateString()}` : 'No Deadline'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isDone ? (
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
                                ) : isMissing ? (
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Missing</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Pending</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">No assessments available.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-bold tracking-tight">Active Assignments</h1>
              <div className="grid gap-6">
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const isSubmitted = submittedAssignmentIds.has(assignment.id);
                    const deadlinePassed = assignment.deadline && new Date() > new Date(assignment.deadline);
                    return (
                      <Card key={assignment.id} className={cn("border-border overflow-hidden shadow-sm", (isSubmitted || deadlinePassed) && "opacity-60")}>
                        <CardContent className="p-8 flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold">{assignment.title}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              <span className={cn("flex items-center gap-1.5", deadlinePassed ? "text-rose-500" : "text-orange-500")}>
                                <Clock className="h-3.5 w-3.5" /> {deadlinePassed ? 'Deadline Passed' : 'Due'}: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isSubmitted && (
                               <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-4 py-2 gap-2 uppercase text-[10px]">
                                 <CheckCircle2 className="h-4 w-4" /> Submitted
                               </Badge>
                            )}
                            
                            {!isSubmitted && !deadlinePassed && (
                              <Link href={`/student/courses/${courseId}/submit/${assignment.id}`}>
                                <Button className="rounded-xl font-bold gap-2 h-11 px-6 shadow-lg shadow-primary/20">
                                  Start Work <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}

                            {isSubmitted && !deadlinePassed && (
                              <Button 
                                variant="outline" 
                                className="rounded-xl font-bold gap-2 h-11 px-6"
                                onClick={() => setIsUnsubmitReminderOpen(true)}
                              >
                                Resubmit <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}

                            {deadlinePassed && !isSubmitted && (
                              <Badge variant="destructive" className="font-bold px-4 py-2 uppercase text-[10px] gap-2">
                                <AlertTriangle className="h-4 w-4" /> Missing
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card">No coursework assigned.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h1 className="text-3xl font-bold tracking-tight">AI Assessments</h1>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {quizzes && quizzes.length > 0 ? (
                  quizzes.map((quiz) => {
                    const isCompleted = completedQuizIds.has(quiz.id);
                    const sub = quizSubmissions?.find(s => s.quizId === quiz.id);
                    const deadlinePassed = quiz.deadline && new Date() > new Date(quiz.deadline);
                    const isLocked = deadlinePassed && !isCompleted;

                    return (
                      <Card key={quiz.id} className={cn("border-border hover:border-primary/20 transition-all flex flex-col shadow-sm", isLocked && "opacity-60")}>
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1.5">
                              <Badge variant={isCompleted ? "outline" : deadlinePassed ? "destructive" : "secondary"} className="uppercase text-[9px] font-bold">
                                {isCompleted ? "Completed" : deadlinePassed ? "Expired" : "Active"}
                              </Badge>
                              {quiz.deadline && (
                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", deadlinePassed ? "text-rose-500" : "text-muted-foreground")}>
                                  Due: {new Date(quiz.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {isCompleted && <div className="text-xl font-bold text-primary">{sub?.score}%</div>}
                          </div>
                          <CardTitle className="text-lg font-bold leading-tight line-clamp-2 mt-2">{quiz.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 mt-auto">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-4 tracking-widest">{quiz.questions.length} AI questions</p>
                          <Button 
                            className="w-full rounded-xl font-bold gap-2 h-11" 
                            variant={isCompleted ? "outline" : isLocked ? "ghost" : "default"}
                            onClick={() => handleStartQuiz(quiz)}
                            disabled={isLocked}
                          >
                            {isCompleted ? <RotateCcw className="h-4 w-4" /> : isLocked ? <AlertTriangle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isCompleted ? "View Results" : isLocked ? "Closed" : "Start Quiz"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-card">No AI assessments published yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-bold tracking-tight">My Submission History</h1>
              <div className="grid gap-6">
                {mySubmissions.length > 0 ? (
                  mySubmissions.map((sub) => {
                    const assignment = assignments?.find(a => a.id === sub.assignmentId);
                    const deadlinePassed = assignment?.deadline && new Date() > new Date(assignment.deadline);
                    return (
                      <Card key={sub.id} className="border-border overflow-hidden group hover:border-primary/20 transition-all shadow-sm">
                        <CardContent className="p-8 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{sub.assignmentTitle}</h3>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> Submitted: {sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() : 'Processing'}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {sub.status === 'graded' ? (
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-primary">{sub.evaluation?.totalScore}%</div>
                                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">AI Evaluated</div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-bold uppercase text-[9px]">Evaluation Pending</Badge>
                                  {!deadlinePassed && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-[10px] text-rose-500 hover:text-rose-600 font-bold gap-1 px-2 border border-rose-100 hover:bg-rose-50" 
                                      onClick={() => handleUnsubmit(sub)}
                                    >
                                      <XCircle className="h-3 w-3" /> Unsubmit
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {sub.status === 'graded' && sub.evaluation?.writtenFeedback && (
                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5" /> Feedback from AI
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{sub.evaluation.writtenFeedback}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-card/30">
                    <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto mb-4">
                      <FileText className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-bold">No submissions recorded</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                      {isChandan ? "Submissions for this account are strictly restricted." : "Begin working on your assignments to see them appear here."}
                    </p>
                    <Button onClick={() => setActiveTab('assignments')} variant="outline" className="font-bold rounded-xl h-11 px-8">Browse Assignments</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="p-10 space-y-10 animate-in fade-in duration-500 relative">
              <h1 className="text-3xl font-bold tracking-tighter">Course Feed</h1>
              <div className="max-w-4xl space-y-8">
                {courseContent && courseContent.length > 0 ? (
                  courseContent.map((post) => (
                    <Card key={post.id} className="rounded-[2rem] border-border overflow-hidden shadow-sm">
                      <CardContent className="p-10 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                              {post.contentType === 'link' ? <LinkIcon className="h-5 w-5" /> : 
                               post.contentType === 'zip' ? <FileArchive className="h-5 w-5" /> :
                               post.contentType === 'file' ? <FileIcon className="h-5 w-5" /> :
                               <Megaphone className="h-5 w-5" />}
                            </div>
                            <div>
                              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1 border-primary/20">{post.contentType}</Badge>
                              <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{post.body}</p>
                        {post.attachmentUrl && (
                          <div className="flex items-center gap-4 bg-accent/30 p-4 rounded-2xl border border-border/50">
                            <button onClick={() => handleViewContent(post.attachmentUrl)} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                              <LinkIcon className="h-3.5 w-3.5" /> Open Preview
                            </button>
                            <a href={post.attachmentUrl} download={post.title} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline">
                              <Download className="h-3.5 w-3.5" /> Save File
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-6 border-t border-border">
                          <LikeButton postId={post.id} courseId={courseId as string} currentUserId={user.uid} initialLikes={post.likesCount} />
                          <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors uppercase tracking-widest">
                            <MessageCircle className="h-4 w-4" /> Discussion
                          </button>
                        </div>
                        {expandedPostId === post.id && (
                          <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in slide-in-from-top-2">
                            <div className="flex gap-4">
                              <Input placeholder="Add to the conversation..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="rounded-xl border-none bg-accent/30 h-11" onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)} />
                              <Button size="icon" className="rounded-xl h-11 w-11 shadow-lg shadow-primary/20" onClick={() => handleAddComment(post.id)}><Send className="h-4 w-4" /></Button>
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
                  <div className="p-12 text-center text-muted-foreground italic border-2 border-dashed rounded-3xl bg-card/30">The academic feed is currently silent.</div>
                )}
              </div>
              <AIChatbot customContext={contentContextString} placeholder="Ask about these course resources..." />
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!activeQuiz} onOpenChange={(open) => !open && setActiveQuiz(null)}>
        <DialogContent className="max-w-4xl rounded-[2rem] overflow-hidden p-0 gap-0 shadow-2xl">
          <DialogHeader className="p-10 bg-primary text-primary-foreground border-none">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <HelpCircle className="h-7 w-7" /> {activeQuiz?.title}
              </DialogTitle>
              {completedQuizIds.has(activeQuiz?.id) && <Badge variant="secondary" className="bg-white/20 text-white border-none uppercase text-[10px] font-bold">Review Mode</Badge>}
            </div>
          </DialogHeader>
          <div className="p-10 max-h-[70vh] overflow-y-auto bg-background/50 backdrop-blur-md">
            {!quizResult ? (
              <div className="space-y-12">
                {activeQuiz?.questions.map((q: any, i: number) => (
                  <div key={i} className="space-y-6 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                    <h3 className="font-bold text-xl flex gap-4">
                      <span className="text-primary opacity-30 font-headline tabular-nums">0{i + 1}</span>
                      <span className="leading-tight">{q.question}</span>
                    </h3>
                    <RadioGroup 
                      value={quizAnswers[i]?.toString()} 
                      onValueChange={(val) => {
                        const newAnswers = [...quizAnswers];
                        newAnswers[i] = parseInt(val);
                        setQuizAnswers(newAnswers);
                      }}
                      className="grid gap-3"
                    >
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center space-x-3 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                          <RadioGroupItem value={optIdx.toString()} id={`q${i}-opt${optIdx}`} className="h-5 w-5 border-primary/20" />
                          <Label htmlFor={`q${i}-opt${optIdx}`} className="flex-1 cursor-pointer font-bold text-sm text-foreground/80 group-hover:text-primary transition-colors">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 text-center flex flex-col justify-center space-y-2 p-8 rounded-[2rem] bg-primary/5 border border-primary/10">
                    <div className="text-6xl font-headline font-bold text-primary tabular-nums tracking-tighter">{quizResult.score}%</div>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Assessment Outcome</p>
                  </div>
                  <div className="lg:col-span-2 p-8 bg-card rounded-[2rem] border border-border shadow-sm flex flex-col justify-center">
                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <TrendingUp className="h-3.5 w-3.5" /> AI Performance Summary
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground font-medium">{quizResult.feedback}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-2">Key Strengths</h5>
                    <div className="space-y-2">
                      {quizResult.strengths?.map((s: string, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-start gap-3 border border-emerald-100">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest ml-2">Focus Areas</h5>
                    <div className="space-y-2">
                      {quizResult.improvementAreas?.map((s: string, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-orange-50 text-orange-700 text-xs font-bold flex items-start gap-3 border border-orange-100">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-8 border-t border-border bg-muted/30">
            {!quizResult ? (
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={isSubmittingQuiz || quizAnswers.includes(-1)}
                className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSubmittingQuiz ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Send className="h-5 w-5 mr-3" />}
                Finalize Assessment
              </Button>
            ) : (
              <Button onClick={() => setActiveQuiz(null)} className="w-full h-16 rounded-2xl font-bold text-lg shadow-lg">Return to Course Feed</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnsubmitReminderOpen} onOpenChange={setIsUnsubmitReminderOpen}>
        <DialogContent className="rounded-[2rem] max-w-md">
          <DialogHeader>
            <div className="mx-auto p-3 bg-primary/10 rounded-2xl text-primary w-fit mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Unsubmit Required</DialogTitle>
            <DialogTitle className="text-center font-medium py-4">
              To resubmit this assignment, you must first <span className="font-bold text-foreground">unsubmit</span> your current work from the <span className="font-bold text-primary italic">My Submission History</span> tab.
            </DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 p-6 rounded-2xl border border-border space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Steps to resubmit:</p>
            <ol className="text-xs space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                Go to <span className="font-bold">My Submission History</span> tab.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                Click <span className="font-bold text-rose-500">Unsubmit</span> next to the task.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                Return here to <span className="font-bold text-primary">Start Work</span> again.
              </li>
            </ol>
          </div>
          <DialogFooter className="pt-6">
            <Button onClick={() => setIsUnsubmitReminderOpen(false)} className="w-full rounded-xl font-bold h-12">Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

  const handleToggleLike = () => {
    if (!firestore || !likeRef) return;
    const parentRef = doc(firestore, 'courses', courseId, 'content', postId);
    if (isLiked) {
      deleteDocumentNonBlocking(likeRef);
      updateDocumentNonBlocking(parentRef, { 
        likesCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } else {
      setDocumentNonBlocking(likeRef, { uid: currentUserId, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(parentRef, { 
        likesCount: increment(1),
        updatedAt: serverTimestamp()
      });
    }
  };

  return (
    <button onClick={handleToggleLike} className={cn("flex items-center gap-2 transition-all hover:scale-110", isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}>
      <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500")} />
      <span className="text-[10px] font-bold tabular-nums">{initialLikes || 0}</span>
    </button>
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
        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
          <Avatar className="h-8 w-8 shadow-sm border border-primary/10"><AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">{comment.authorName?.[0]}</AvatarFallback></Avatar>
          <div className="bg-accent/30 p-4 rounded-2xl flex-1 relative group border border-transparent hover:border-border transition-colors">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-tight text-foreground/70">
                {comment.authorName}
                {comment.professorId && <Badge variant="outline" className="text-[7px] border-primary/20 text-primary h-3 px-1 uppercase tracking-[0.1em]">Staff</Badge>}
              </span>
              {comment.authorId === currentUserId && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteComment(comment.id)}><Trash2 className="h-3 w-3 text-rose-500" /></Button>}
            </div>
            <p className="text-sm text-muted-foreground/90 font-medium">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
