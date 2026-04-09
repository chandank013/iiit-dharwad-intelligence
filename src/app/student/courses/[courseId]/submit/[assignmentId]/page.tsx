"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  useCollection
} from '@/firebase';
import { 
  doc, 
  collection, 
  serverTimestamp,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { 
  studentSubmissionQualityWarning,
  type StudentSubmissionQualityWarningOutput 
} from '@/ai/flows/student-submission-quality-warning';
import { 
  Loader2, 
  ArrowLeft, 
  Sparkles, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Github, 
  FileText, 
  Clock,
  RotateCcw,
  Lock,
  Info,
  ChevronRight,
  TextQuote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SubmitAssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [qualityFeedback, setQualityQualityFeedback] = useState<StudentSubmissionQualityWarningOutput | null>(null);

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return doc(firestore, 'courses', courseId as string);
  }, [firestore, courseId]);
  const { data: course } = useDoc(courseRef);

  const assignmentRef = useMemoFirebase(() => {
    if (!firestore || !courseId || !assignmentId) return null;
    return doc(firestore, 'courses', courseId as string, 'assignments', assignmentId as string);
  }, [firestore, courseId, assignmentId]);
  const { data: assignment, isLoading: isAssignmentLoading } = useDoc(assignmentRef);

  const existingSubmissionQuery = useMemoFirebase(() => {
    if (!firestore || !user || !assignmentId) return null;
    return query(
      collection(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions'),
      where('submitterId', '==', user.uid)
    );
  }, [firestore, user, courseId, assignmentId]);
  const { data: submissions } = useCollection(existingSubmissionQuery);
  const currentSubmission = submissions?.[0];

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
    if (currentSubmission && !content && currentSubmission.status === 'returned') {
      setContent(currentSubmission.content);
    } else if (currentSubmission && !content) {
      setContent(currentSubmission.content);
    }
  }, [user, isUserLoading, router, currentSubmission]);

  const handleQualityCheck = async () => {
    if (!content.trim() || !assignment) return;
    setIsCheckingQuality(true);
    try {
      const result = await studentSubmissionQualityWarning({
        assignmentDescription: assignment.description,
        submissionContent: content,
      });
      setQualityQualityFeedback(result);
      toast({ title: result.hasWarnings ? "Review AI Suggestions" : "Looking Good!" });
    } catch (error) {
      toast({ title: "Analysis Failed", variant: "destructive" });
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !assignmentId || !content.trim() || !assignment) return;

    setIsSubmitting(true);
    
    const submissionData = {
      courseId: courseId as string,
      assignmentId,
      assignmentTitle: assignment.title,
      submitterId: user.uid,
      submissionNumber: currentSubmission ? (currentSubmission.submissionNumber + 1) : 1,
      submissionType: assignment.submissionType || 'text',
      content: content,
      submittedAt: serverTimestamp(),
      isLate: assignment.deadline ? new Date() > new Date(assignment.deadline) : false,
      aiQualityWarning: qualityFeedback?.summaryFeedback || '',
      createdAt: currentSubmission ? currentSubmission.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      professorId: assignment.professorId,
      status: 'submitted' 
    };

    if (currentSubmission) {
      const subRef = doc(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions', currentSubmission.id);
      updateDoc(subRef, submissionData).then(() => {
        toast({ title: "Resubmission Received" });
        router.push(`/student/courses/${courseId}`);
      }).finally(() => setIsSubmitting(false));
    } else {
      const submissionsCol = collection(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions');
      addDocumentNonBlocking(submissionsCol, submissionData).then(() => {
        toast({ title: "Submission Received" });
        router.push(`/student/courses/${courseId}`);
      }).finally(() => setIsSubmitting(false));
    }
  };

  if (isUserLoading || isAssignmentLoading || !user || !assignment) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const deadlinePassed = assignment.deadline && new Date() > new Date(assignment.deadline);
  const isSubmitted = !!currentSubmission && currentSubmission.status !== 'returned';
  const isReturned = currentSubmission?.status === 'returned';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <Link href={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
              <Clock className="h-3 w-3" /> Due {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No Deadline'}
            </div>
            {deadlinePassed && !isSubmitted && <Badge variant="destructive" className="font-bold">LATE</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Editor Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter text-foreground">
                {isSubmitted ? (isReturned ? 'Revise Work' : 'Work Submitted') : 'Submit Assignment'}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TextQuote className="h-4 w-4 opacity-50" />
                <p className="font-medium text-lg">{assignment.title}</p>
              </div>
            </div>

            {isSubmitted && !isReturned && (
              <Alert className="bg-primary/5 border-primary/20 text-primary rounded-[2rem] p-8 shadow-sm">
                <Lock className="h-6 w-6 mt-1" />
                <div className="ml-4">
                  <AlertTitle className="font-bold text-lg mb-1">Already Submitted</AlertTitle>
                  <AlertDescription className="text-sm font-medium opacity-80 leading-relaxed">
                    You have already submitted this assignment. To make changes, please unsubmit it from your <Link href={`/student/courses/${courseId}`} className="underline font-bold hover:opacity-100">submission history</Link> first.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {isReturned && (
              <Card className="border-rose-200 bg-rose-50 text-rose-700 rounded-[2rem] p-8 flex items-start gap-5 shadow-sm border-2 animate-in slide-in-from-top-2">
                <div className="p-3 bg-rose-500/10 rounded-2xl">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">Professor Requested Revision</h4>
                  <p className="text-sm opacity-90 leading-relaxed font-medium">Your submission has been sent back for improvements. Your previous content is loaded below for editing. Please check the course feed or discussion for specific feedback.</p>
                </div>
              </Card>
            )}

            <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-muted/30 border-b border-border p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                      {assignment.submissionType === 'github' ? <Github className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <div>
                      <Badge variant="outline" className="font-bold uppercase tracking-widest text-[10px] border-primary/20 text-primary bg-primary/5 h-6 px-3">
                        {assignment.submissionType} REQUIRED
                      </Badge>
                      <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Workspace Editor</CardTitle>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                    <Badge variant={isSubmitted ? "default" : "secondary"} className="h-6 font-bold uppercase text-[9px]">
                      {isSubmitted ? 'Locked' : 'Drafting'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                {isSubmitted && !isReturned ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Finalized Content</Label>
                      <div className="min-h-[300px] rounded-[2rem] bg-accent/30 p-8 leading-relaxed text-muted-foreground whitespace-pre-wrap border border-border font-medium italic shadow-inner">
                        {content}
                      </div>
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <p className="text-xs text-muted-foreground font-medium italic flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Editing is currently disabled for this task.
                      </p>
                      <Button variant="outline" onClick={() => router.push(`/student/courses/${courseId}`)} className="rounded-xl font-bold h-12 px-8">Return to Dashboard</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Enter Submission Content
                        </Label>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                          {content.length} characters
                        </span>
                      </div>
                      <Textarea 
                        placeholder={assignment.submissionType === 'github' ? "Paste your repository URL here..." : "Type or paste your content here..."}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[400px] rounded-[2rem] bg-accent/30 border-none focus-visible:ring-primary/20 p-8 leading-relaxed text-lg resize-none shadow-inner"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      <Button 
                        type="button"
                        variant="secondary"
                        className="h-16 rounded-[1.25rem] font-bold gap-3 shadow-sm hover:bg-secondary/80 transition-all border border-border"
                        onClick={handleQualityCheck}
                        disabled={isCheckingQuality || !content.trim()}
                      >
                        {isCheckingQuality ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-primary" />}
                        AI Quality Scan
                      </Button>
                      <Button 
                        type="submit"
                        className="h-16 rounded-[1.25rem] font-bold gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform"
                        disabled={isSubmitting || !content.trim()}
                      >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        {currentSubmission ? 'Finalize Re-submission' : 'Submit Final Work'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area: Instructions and AI Feedback */}
          <div className="lg:col-span-4 space-y-8 sticky top-24">
            <Card className="rounded-[2rem] border-border shadow-lg overflow-hidden bg-card/50">
              <CardHeader className="bg-primary/5 border-b border-border p-6">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Assignment Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px] p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>

            {qualityFeedback ? (
              <Card className={cn(
                "rounded-[2rem] border-none shadow-2xl animate-in zoom-in-95 duration-300",
                qualityFeedback.hasWarnings ? "bg-orange-500/10" : "bg-emerald-500/10"
              )}>
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className={cn(
                      "text-sm font-bold flex items-center gap-2",
                      qualityFeedback.hasWarnings ? "text-orange-600" : "text-emerald-600"
                    )}>
                      {qualityFeedback.hasWarnings ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                      AI Assistant Scan
                    </CardTitle>
                    <div className={cn(
                      "h-2 w-2 rounded-full animate-ping",
                      qualityFeedback.hasWarnings ? "bg-orange-500" : "bg-emerald-500"
                    )} />
                  </div>
                  <Badge variant="outline" className={cn(
                    "font-bold uppercase text-[9px] border-current",
                    qualityFeedback.hasWarnings ? "text-orange-600" : "text-emerald-600"
                  )}>
                    {qualityFeedback.hasWarnings ? 'Action Required' : 'Ready to Send'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-bold leading-tight text-foreground/80">{qualityFeedback.summaryFeedback}</p>
                    
                    {qualityFeedback.potentialIssues && qualityFeedback.potentialIssues.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spotted Weaknesses</h5>
                        <div className="space-y-2">
                          {qualityFeedback.potentialIssues.map((issue, i) => (
                            <div key={i} className="flex gap-2 text-xs font-medium text-muted-foreground">
                              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {qualityFeedback.detailedSuggestions && qualityFeedback.detailedSuggestions.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How to Improve</h5>
                        <div className="space-y-2">
                          {qualityFeedback.detailedSuggestions.map((suggestion, i) => (
                            <div key={i} className="flex gap-2 text-xs font-medium text-muted-foreground">
                              <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[2rem] border-dashed border-2 border-border bg-transparent p-8 text-center">
                <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4 border border-border">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h4 className="font-bold text-sm text-muted-foreground">AI Quality Assistant</h4>
                <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
                  Click the <strong>AI Quality Scan</strong> button to get instant feedback on your draft before you finalize it.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
