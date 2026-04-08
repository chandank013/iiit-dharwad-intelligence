
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
  getDoc,
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
  Lock,
  Upload
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
  const [contentFormData, setContentFormData] = useState({
    title: '',
    type: 'announcement',
    body: '',
    attachmentUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [isBulkEvaluating, setIsBulkEvaluating] = useState(false);

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
    if (!rawSubmissions || !courseId) return [];
    return rawSubmissions.filter(s => s.courseId === courseId);
  }, [rawSubmissions, courseId]);

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
      const avg = subs.length > 0 
        ? Math.round(subs.reduce((acc, s) => acc + (s.evaluation?.totalScore || 0), 0) / subs.length)
        : 0;
      return { 
        name: a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title, 
        average: avg 
      };
    }).reverse();

    return { distribution, performance };
  }, [courseSubmissions, assignments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-update type based on file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setContentFormData(prev => ({ ...prev, type: 'file' }));
      else if (ext === 'zip' || ext === 'rar') setContentFormData(prev => ({ ...prev, type: 'zip' }));
      else if (ext === 'ppt' || ext === 'pptx') setContentFormData(prev => ({ ...prev, type: 'ppt' }));
    }
  };

  const handlePostContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !courseId) return;

    setIsPostingContent(true);
    let attachmentUrl = contentFormData.attachmentUrl;

    // Handle local file upload (Simulated via Data URI for MVP/Prototype)
    if (selectedFile) {
      const reader = new FileReader();
      attachmentUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });
    }

    const contentData = {
      courseId,
      professorId: user.uid,
      title: contentFormData.title,
      contentType: contentFormData.type,
      content: contentFormData.body,
      attachmentUrl: attachmentUrl,
      postedAt: serverTimestamp(),
      isPinned: false,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'courses', courseId as string, 'content'), contentData);
      toast({ title: "Content Published" });
      setIsContentDialogOpen(false);
      setContentFormData({ title: '', type: 'announcement', body: '', attachmentUrl: '' });
      setSelectedFile(null);
    } finally {
      setIsPostingContent(false);
    }
  };

  const handleAddComment = (contentId: string) => {
    if (!firestore || !courseId || !user || !commentText.trim()) return;
    const commentsRef = collection(firestore, 'courses', courseId as string, 'content', contentId, 'comments');
    addDocumentNonBlocking(commentsRef, {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Professor',
      professorId: user.uid,
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  const handleAIEvaluate = async (submission: any) => {
    if (!firestore || !courseId) return;

    const assignment = assignments?.find(a => a.id === submission.assignmentId);
    if (assignment?.deadline && new Date() < new Date(assignment.deadline)) {
      toast({ 
        title: "Evaluation Locked", 
        description: "You can only evaluate submissions after the assignment deadline.", 
        variant: "destructive" 
      });
      return;
    }

    setIsEvaluating(submission.id);
    try {
      const assignmentRef = doc(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      const assignmentData = assignmentSnap.data();

      const rubricsRef = collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics');
      const rubricsSnap = await getDocs(rubricsRef);
      const rubricDoc = rubricsSnap.docs[0];
      
      let rubricText = "No specific rubric defined.";
      if (rubricDoc) {
        const criteriaSnap = await getDocs(collection(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'rubrics', rubricDoc.id, 'criteria'));
        rubricText = criteriaSnap.docs.map(d => `- ${d.data().description} (Max Points: ${d.data().maxScore})`).join('\n');
      }

      const evaluation = await aiSubmissionEvaluationAndPlagiarismDetection({
        assignmentDescription: assignmentData?.description || "No description",
        assignmentRubric: rubricText,
        submissionText: submission.content,
        allOtherSubmissionsText: courseSubmissions.filter(s => s.id !== submission.id).map(s => s.content)
      });

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
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleBulkEvaluate = async () => {
    const pending = courseSubmissions.filter(s => {
      const assignment = assignments?.find(a => a.id === s.assignmentId);
      const deadlinePassed = assignment?.deadline ? new Date() > new Date(assignment.deadline) : true;
      return s.status !== 'graded' && deadlinePassed;
    });

    if (pending.length === 0) {
      toast({ 
        title: "No Eligible Submissions", 
        description: "There are no ungraded submissions whose assignment deadlines have passed.", 
        variant: "destructive"
      });
      return;
    }

    setIsBulkEvaluating(true);
    toast({ title: "Bulk Evaluation Started", description: `Processing ${pending.length} eligible submissions...` });

    let successCount = 0;
    for (const sub of pending) {
      const success = await handleAIEvaluate(sub);
      if (success) successCount++;
    }

    setIsBulkEvaluating(false);
    toast({ 
      title: "Bulk Evaluation Finished", 
      description: `Successfully graded ${successCount} out of ${pending.length} submissions.` 
    });
  };

  const getStudentName = (uid: string) => {
    const foundUser = allUsers?.find(u => u.id === uid);
    if (!foundUser) return "Unknown Student";
    return `${foundUser.firstName} ${foundUser.lastName}`;
  };

  if (isUserLoading || isCourseLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found.</div>;

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'content', label: 'Content', icon: FolderOpen },
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
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{assignment.title}</h3>
                           <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                             {assignment.isGroupProject ? 'Group' : 'Individual'}
                           </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'assignments', assignment.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="rounded-xl font-bold">
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
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tighter">Submissions</h1>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-lg border">
                  <Lock className="h-3 w-3" /> Evaluation opens after deadline
                </p>
                <Button 
                  variant="secondary" 
                  className="rounded-xl px-6 gap-2 font-bold"
                  onClick={handleBulkEvaluate}
                  disabled={isBulkEvaluating}
                >
                  {isBulkEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                  Evaluate Eligible
                </Button>
              </div>
            </div>
            <Card className="border-border overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Student Name</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Task</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Type</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseSubmissions.length > 0 ? (
                    courseSubmissions.map((sub) => {
                      const assignment = assignments?.find(a => a.id === sub.assignmentId);
                      const deadlinePassed = assignment?.deadline ? new Date() > new Date(assignment.deadline) : true;
                      
                      return (
                        <TableRow key={sub.id} className="group">
                          <TableCell className="font-bold text-xs flex items-center gap-2">
                             <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px]">{getStudentName(sub.submitterId)[0]}</AvatarFallback></Avatar>
                             {getStudentName(sub.submitterId)}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{sub.assignmentTitle || 'Assignment'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest">
                              {assignment?.isGroupProject ? <><Users className="h-3 w-3 mr-1" /> Group</> : <><User className="h-3 w-3 mr-1" /> Individual</>}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.evaluation?.totalScore !== undefined ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                                {sub.evaluation.totalScore}% AI SCORING
                              </Badge>
                            ) : !deadlinePassed ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> AWAITING DEADLINE
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px] font-bold">READY FOR EVALUATION</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="font-bold text-primary gap-2 text-xs"
                              onClick={() => handleAIEvaluate(sub)}
                              disabled={isEvaluating === sub.id || !deadlinePassed}
                            >
                              {isEvaluating === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              {deadlinePassed ? 'AI Evaluation' : 'Locked'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs">No work submitted yet.</TableCell>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="border-border bg-card rounded-2xl shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-sm font-bold flex items-center gap-2">
                     <BarChart3 className="h-4 w-4 text-primary" /> Grade Distribution
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.distribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="range" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {analyticsData.distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
               </Card>

               <Card className="border-border bg-card rounded-2xl shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-sm font-bold flex items-center gap-2">
                     <TrendingUp className="h-4 w-4 text-primary" /> Performance Trend
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.performance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={9} width={80} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="p-10 space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tighter">Content</h1>
              <Button className="rounded-xl px-6 font-bold" onClick={() => setIsContentDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" /> New Entry
              </Button>
            </div>
            <div className="grid gap-6">
              {courseContent?.map((post) => (
                <Card key={post.id} className="rounded-2xl border-border hover:shadow-lg transition-all overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          {post.contentType === 'link' ? <LinkIcon className="h-5 w-5" /> : 
                           post.contentType === 'file' ? <FileIcon className="h-5 w-5" /> :
                           post.contentType === 'zip' ? <FileArchive className="h-5 w-5" /> :
                           <Megaphone className="h-5 w-5" />}
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest mb-1">{post.contentType}</Badge>
                          <h3 className="text-xl font-bold">{post.title}</h3>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'courses', courseId as string, 'content', post.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">{post.content}</p>
                    {post.attachmentUrl && (
                      <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                        <LinkIcon className="h-3 w-3" /> {post.attachmentUrl.startsWith('data:') ? 'View Attached File' : post.attachmentUrl}
                      </a>
                    )}
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <LikeButton postId={post.id} courseId={courseId as string} currentUserId={user.uid} initialLikes={post.likesCount} />
                      <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> Comments
                      </button>
                    </div>
                    {expandedPostId === post.id && (
                      <div className="mt-6 pt-6 border-t border-border space-y-6">
                        <div className="flex gap-4">
                          <Input placeholder="Comment as Professor..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="rounded-xl border-none bg-accent/30" />
                          <Button size="icon" className="rounded-xl" onClick={() => handleAddComment(post.id)}><Send className="h-4 w-4" /></Button>
                        </div>
                        <PostComments contentId={post.id} courseId={courseId as string} currentUserId={user.uid} isProfessor={true} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader><DialogTitle>Distribute Academic Content</DialogTitle></DialogHeader>
          <form onSubmit={handlePostContent} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Entry Title</Label>
                <Input value={contentFormData.title} onChange={(e) => setContentFormData({...contentFormData, title: e.target.value})} placeholder="e.g. Week 4 Lab Manual" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Content Type</Label>
                <Select value={contentFormData.type} onValueChange={(v) => setContentFormData({...contentFormData, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="link">URL / Link</SelectItem>
                    <SelectItem value="file">PDF / Document</SelectItem>
                    <SelectItem value="zip">ZIP / Archive</SelectItem>
                    <SelectItem value="ppt">Presentation (PPT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">External Link</Label>
                <Input value={contentFormData.attachmentUrl} onChange={(e) => setContentFormData({...contentFormData, attachmentUrl: e.target.value})} placeholder="https://..." disabled={!!selectedFile} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest">Local File Upload</Label>
                <div className="relative">
                  <Input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
                  <Label htmlFor="file-upload" className="flex items-center justify-center gap-2 h-10 border border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">{selectedFile ? selectedFile.name : 'Choose local file'}</span>
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest">Detailed Context</Label>
              <Textarea value={contentFormData.body} onChange={(e) => setContentFormData({...contentFormData, body: e.target.value})} placeholder="Explain the importance of this resource..." required className="min-h-[120px]" />
            </div>
            <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20" disabled={isPostingContent}>
              {isPostingContent ? <Loader2 className="animate-spin text-white" /> : 'Publish to Course'}
            </Button>
          </form>
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
    <button onClick={handleToggleLike} className={cn("flex items-center gap-2 transition-colors", isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}>
      <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500")} />
      <span className="text-[10px] font-bold">{initialLikes || 0}</span>
    </button>
  );
}

function PostComments({ contentId, courseId, currentUserId, isProfessor }: { contentId: string, courseId: string, currentUserId: string, isProfessor?: boolean }) {
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
              {(comment.authorId === currentUserId || isProfessor) && (
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(comment.id)}>
                  <Trash2 className="h-3 w-3" />
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
