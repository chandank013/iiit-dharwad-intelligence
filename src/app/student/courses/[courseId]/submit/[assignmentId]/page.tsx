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
  updateDoc,
  addDoc
} from 'firebase/firestore';
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
  Upload,
  Link as LinkIcon,
  FileArchive,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  const [qualityFeedback, setQualityFeedback] = useState<StudentSubmissionQualityWarningOutput | null>(null);

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
  }, [user, isUserLoading, router, currentSubmission]);

  const handleQualityCheck = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !assignment) {
      toast({ title: "Content Required", description: "Please enter your submission text to run a quality scan.", variant: "destructive" });
      return;
    }

    setIsCheckingQuality(true);
    setQualityFeedback(null); // Clear previous feedback

    try {
      const result = await studentSubmissionQualityWarning({
        assignmentDescription: assignment.description,
        submissionContent: trimmedContent,
      });
      
      if (result) {
        setQualityFeedback(result);
        toast({ 
          title: result.hasWarnings ? "Strategic Analysis Ready" : "Exceptional Work!", 
          description: result.hasWarnings ? "Review the suggestions to improve your grade." : "Your submission meets high academic standards."
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Assistant Busy", 
        description: error.message || "Could not complete analysis. Please try again in a moment.", 
        variant: "destructive" 
      });
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const handleFileSelect = () => {
    toast({ title: "File Selected", description: "Your document is ready for submission." });
    setContent("file_uploaded_simulated_path_123.zip");
  };

  const notifyProfessor = async () => {
    if (!firestore || !assignment || !user) return;
    const notifRef = collection(firestore, 'users', assignment.professorId, 'notifications');
    await addDoc(notifRef, {
      userId: assignment.professorId,
      title: "New Submission",
      message: `${user.displayName || 'A student'} submitted: ${assignment.title}`,
      type: 'submission',
      link: `/courses/${courseId}`,
      read: false,
      createdAt: serverTimestamp()
    });
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

    const action = currentSubmission 
      ? updateDoc(doc(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions', currentSubmission.id), submissionData)
      : addDoc(collection(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions'), submissionData);

    action.then(async () => {
      await notifyProfessor();
      toast({ title: currentSubmission ? "Resubmission Received" : "Submission Received" });
      router.push(`/student/courses/${courseId}`);
    }).finally(() => setIsSubmitting(false));
  };

  if (isUserLoading || isAssignmentLoading || !user || !assignment) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const deadlinePassed = assignment.deadline && new Date() > new Date(assignment.deadline);
  const isSubmitted = !!currentSubmission && currentSubmission.status !== 'returned';
  const isReturned = currentSubmission?.status === 'returned';
  const submissionType = assignment.submissionType || 'text';

  return (
    <div className="min-h-screen bg-background pb-10">
      <Navbar />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <Link href={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
            <Clock className="h-3 w-3" /> Due {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No Deadline'}
          </div>
        </div>

        {isReturned && (
          <Alert className="mb-6 border-rose-200 bg-rose-50 text-rose-700 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-2">
            <RotateCcw className="h-5 w-5 mt-0.5 text-rose-600" />
            <div className="ml-3">
              <AlertTitle className="font-bold text-base">Professor Requested Revision</AlertTitle>
              <AlertDescription className="text-sm font-medium opacity-90">
                Your submission has been sent back. Please improve your content based on feedback and re-submit.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 flex flex-col">
            <Card className="flex-1 border-border shadow-xl rounded-[2rem] overflow-hidden bg-card/50 flex flex-col h-[650px]">
              <CardHeader className="bg-muted/20 border-b border-border p-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
                      {submissionType === 'github' ? <Github className="h-5 w-5" /> : 
                       submissionType === 'drive' ? <LinkIcon className="h-5 w-5" /> :
                       submissionType === 'zip' ? <FileArchive className="h-5 w-5" /> :
                       <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <Badge variant="outline" className="font-bold uppercase tracking-widest text-[9px] border-primary/20 text-primary bg-primary/5 h-5 px-2">
                        {submissionType} REQUIRED
                      </Badge>
                      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Workspace Editor</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Status</div>
                    <Badge variant={isSubmitted ? "default" : "secondary"} className="h-5 font-bold uppercase text-[8px] px-2">
                      {isSubmitted ? 'Locked' : isReturned ? 'Revising' : 'Drafting'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                    Enter Submission Content
                  </Label>

                  {isSubmitted && !isReturned ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 rounded-2xl bg-accent/30 p-6 border border-border overflow-hidden flex flex-col">
                        <ScrollArea className="flex-1">
                          <p className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap italic">
                            {content}
                          </p>
                        </ScrollArea>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <Lock className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-tight">Work Submitted & Locked</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                      <div className="flex-1 min-h-[300px] mb-6">
                        {submissionType === 'github' || submissionType === 'drive' ? (
                          <div className="space-y-4">
                            <Input 
                              placeholder={submissionType === 'github' ? "https://github.com/username/repo" : "https://drive.google.com/..."}
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              className="h-14 rounded-xl bg-accent/30 border-none focus-visible:ring-primary/20 p-4 font-mono text-sm shadow-inner"
                              required
                            />
                          </div>
                        ) : submissionType === 'zip' || submissionType === 'file' ? (
                          <div 
                            className="h-full border-2 border-dashed border-border rounded-2xl bg-accent/10 flex flex-col items-center justify-center p-8 transition-colors hover:bg-accent/20 cursor-pointer"
                            onClick={handleFileSelect}
                          >
                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                              <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h4 className="font-bold text-sm">Select files from device</h4>
                            {content && (
                              <Badge className="mt-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                                ✓ {content}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Textarea 
                            placeholder="Type or paste your content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="h-full rounded-2xl bg-accent/30 border-none focus-visible:ring-primary/20 p-6 leading-relaxed text-sm resize-none shadow-inner"
                            required
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <Button 
                          type="button"
                          variant="secondary"
                          className="h-14 rounded-xl font-bold gap-2 shadow-sm border border-border"
                          onClick={handleQualityCheck}
                          disabled={isCheckingQuality || !content.trim()}
                        >
                          {isCheckingQuality ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                          AI Quality Scan
                        </Button>
                        <Button 
                          type="submit"
                          className="h-14 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20"
                          disabled={isSubmitting || !content.trim() || deadlinePassed}
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {currentSubmission ? 'Finalize Re-submission' : 'Submit Final Work'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="flex-1 border-border shadow-lg rounded-[2rem] overflow-hidden bg-card/50 flex flex-col h-[250px]">
              <CardHeader className="bg-primary/5 border-b border-border p-5 shrink-0">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-foreground/80">
                  <Info className="h-4 w-4 text-primary" /> Assignment Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                    {assignment.description}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className={cn(
              "flex-1 border-border shadow-lg rounded-[2rem] overflow-hidden flex flex-col h-[376px] transition-colors duration-500",
              qualityFeedback 
                ? (qualityFeedback.hasWarnings ? "bg-orange-500/5 border-orange-500/20" : "bg-emerald-500/5 border-emerald-500/20")
                : "bg-card/50 border-dashed border-2"
            )}>
              <CardHeader className={cn(
                "p-5 border-b shrink-0",
                qualityFeedback ? "border-current/10" : "bg-muted/20 border-border"
              )}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(
                    "text-xs font-bold flex items-center gap-2 uppercase tracking-widest",
                    qualityFeedback ? (qualityFeedback.hasWarnings ? "text-orange-600" : "text-emerald-600") : "text-muted-foreground"
                  )}>
                    {qualityFeedback ? (qualityFeedback.hasWarnings ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />) : <Sparkles className="h-4 w-4" />}
                    AI Quality Assistant
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {qualityFeedback ? (
                  <ScrollArea className="h-full p-6">
                    <div className="space-y-6">
                      <p className="text-xs font-bold leading-tight text-foreground/80">{qualityFeedback.summaryFeedback}</p>
                      
                      {qualityFeedback.potentialIssues && qualityFeedback.potentialIssues.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Critical Gaps</h5>
                          <div className="space-y-1.5">
                            {qualityFeedback.potentialIssues.map((issue, i) => (
                              <div key={i} className="flex gap-2 text-xs font-medium text-muted-foreground leading-snug">
                                <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {qualityFeedback.improvementIdeas && qualityFeedback.improvementIdeas.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-dashed border-current/10">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                            <Lightbulb className="h-3 w-3" /> Pro Ideas for Excellence
                          </h5>
                          <div className="space-y-2">
                            {qualityFeedback.improvementIdeas.map((idea, i) => (
                              <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs font-medium text-emerald-700 leading-normal">
                                {idea}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {qualityFeedback.detailedSuggestions && qualityFeedback.detailedSuggestions.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Quick Fixes</h5>
                          <div className="space-y-1.5">
                            {qualityFeedback.detailedSuggestions.map((suggestion, i) => (
                              <div key={i} className="flex gap-2 text-xs font-medium text-muted-foreground leading-snug">
                                <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="p-3 bg-muted/50 rounded-full mb-3 border border-border">
                      <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <h4 className="font-bold text-xs text-muted-foreground">Ready to Scan</h4>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed max-w-[180px]">
                      Get instant coaching and creative ideas to boost your submission quality.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
