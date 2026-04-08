"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useMemoFirebase 
} from '@/firebase';
import { 
  doc, 
  collection, 
  serverTimestamp 
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
  Clock 
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

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, router]);

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
    const submissionsCol = collection(firestore, 'courses', courseId as string, 'assignments', assignmentId as string, 'submissions');
    
    const submissionData = {
      courseId: courseId as string,
      assignmentId,
      assignmentTitle: assignment.title,
      submitterId: user.uid,
      submissionNumber: 1,
      submissionType: assignment.submissionType || 'text',
      content: content,
      submittedAt: serverTimestamp(),
      isLate: assignment.deadline ? new Date() > new Date(assignment.deadline) : false,
      aiQualityWarning: qualityFeedback?.summaryFeedback || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      professorId: assignment.professorId,
      status: 'submitted'
    };

    addDocumentNonBlocking(submissionsCol, submissionData);
    toast({ title: "Submission Received" });
    router.push(`/student/courses/${courseId}`);
  };

  if (isUserLoading || isAssignmentLoading || !user || !assignment) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

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
              <h1 className="text-4xl font-bold tracking-tighter">Submit Assignment</h1>
              <p className="text-muted-foreground font-medium">{assignment.title}</p>
            </div>

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
                      Finalize Submission
                    </Button>
                  </div>
                </form>
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