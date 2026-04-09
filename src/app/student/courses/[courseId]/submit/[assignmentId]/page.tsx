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
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    if (currentSubmission && !content) {
      setContent(currentSubmission.content);
    }
  }, [user, isUserLoading, router, currentSubmission, content]);

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
  const isSubmitted = !!currentSubmission;
  const isReturned = currentSubmission?.status === 'returned';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <Link href={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter">
                {isSubmitted ? (isReturned ? 'Revise Work' : 'Work Submitted') : 'Submit Assignment'}
              </h1>
              <p className="text-muted-foreground font-medium">{assignment.title}</p>
            </div>

            {isSubmitted && !isReturned && (
              <Alert className="bg-primary/5 border-primary/20 text-primary rounded-[2rem] p-6 shadow-sm">
                <Lock className="h-5 w-5" />
                <AlertTitle className="font-bold mb-1">Already Submitted</AlertTitle>
                <AlertDescription className="text-xs font-medium opacity-80">
                  You have already submitted this assignment. To make changes, please unsubmit it from your submission history first.
                </AlertDescription>
              </Alert>
            )}

            {isReturned && (
              <Card className="border-rose-200 bg-rose-50 text-rose-700 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
                <RotateCcw className="h-6 w-6 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold">Returned for Revision</h4>
                  <p className="text-sm opacity-90">Your professor has sent this back for improvements. You can modify your work and re-submit it below.</p>
                </div>
              </Card>
            )}

            <Card className="border-border shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {assignment.submissionType === 'github' ? <Github className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline" className="font-bold uppercase tracking-widest text-[10px] border-primary/20 text-primary">
                      {assignment.submissionType} REQUIRED
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Clock className="h-3 w-3" /> Due {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No Deadline'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {isSubmitted && !isReturned ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Work</Label>
                      <div className="min-h-[200px] rounded-2xl bg-accent/30 p-6 leading-relaxed text-muted-foreground whitespace-pre-wrap border border-border/50 font-medium italic">
                        {content}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between items-center">
                      <p className="text-xs text-muted-foreground font-medium italic">Changes are locked until work is unsubmitted.</p>
                      <Button variant="outline" onClick={() => router.push(`/student/courses/${courseId}`)} className="rounded-xl font-bold">Return to Course</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Submission Content
                      </Label>
                      <Textarea 
                        placeholder="Type or paste your submission here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] rounded-2xl bg-accent/30 border-none focus-visible:ring-primary/20 p-6 leading-relaxed"
                        required
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button 
                        type="button"
                        variant="secondary"
                        className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-sm"
                        onClick={handleQualityCheck}
                        disabled={isCheckingQuality || !content.trim()}
                      >
                        {isCheckingQuality ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        Check Quality
                      </Button>
                      <Button 
                        type="submit"
                        className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-xl shadow-primary/20"
                        disabled={isSubmitting || !content.trim()}
                      >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        {currentSubmission ? 'Finalize Resubmission' : 'Finalize Submission'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {qualityFeedback && (
              <Card className={cn("border-none shadow-lg rounded-3xl", qualityFeedback.hasWarnings ? "bg-orange-500/10" : "bg-emerald-500/10")}>
                <CardHeader className="p-8 pb-4">
                  <CardTitle className={cn("text-lg font-bold flex items-center gap-2", qualityFeedback.hasWarnings ? "text-orange-600" : "text-emerald-600")}>
                    {qualityFeedback.hasWarnings ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    AI Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <p className="text-sm font-medium leading-relaxed opacity-80">{qualityFeedback.summaryFeedback}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
