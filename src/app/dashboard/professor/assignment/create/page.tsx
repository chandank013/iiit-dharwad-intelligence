
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { professorAIRubricGenerator } from '@/ai/flows/professor-ai-rubric-generator';
import { Sparkles, Trash2, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';

export default function CreateAssignmentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const courseId = searchParams.get('courseId');

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionType, setSubmissionType] = useState('github');
  const [isGroupProject, setIsGroupProject] = useState(false);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [enableLeaderboard, setEnableLeaderboard] = useState(true);
  
  const [rubric, setRubric] = useState<{ criterion: string; description: string; maxPoints: number }[]>([]);

  const handleGenerateRubric = async () => {
    if (!description || description.length < 20) {
      toast({ title: "Detailed Description Required", description: "Please provide a more detailed assignment description for the AI.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await professorAIRubricGenerator({ description });
      setRubric(result.rubric);
      toast({ title: "Rubric Generated", description: "AI has suggested a rubric based on your description." });
    } catch (error) {
      toast({ title: "Generation Failed", description: "Could not generate rubric. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addRubricItem = () => {
    setRubric([...rubric, { criterion: '', description: '', maxPoints: 10 }]);
  };

  const removeRubricItem = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  const updateRubricItem = (index: number, field: string, value: any) => {
    const newRubric = [...rubric];
    (newRubric[index] as any)[field] = value;
    setRubric(newRubric);
  };

  const handlePublish = (isDraft: boolean = false) => {
    if (!firestore || !user || !courseId) {
      toast({ title: "Error", description: "Missing course context or authentication.", variant: "destructive" });
      return;
    }

    if (!title || !description || (!isDraft && !deadline)) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setPublishing(true);

    const assignmentRef = doc(collection(firestore, 'courses', courseId, 'assignments'));
    const assignmentId = assignmentRef.id;

    const assignmentData = {
      id: assignmentId,
      courseId,
      title,
      description,
      deadline: deadline || null,
      submissionType,
      isGroupProject,
      lateSubmissionPolicy: "none",
      allowResubmissions: allowResubmission,
      maxResubmissions: 3,
      enableLeaderboard,
      professorId: user.uid,
      status: isDraft ? 'draft' : 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(assignmentRef, assignmentData, { merge: true });

    if (rubric.length > 0) {
      const rubricRef = doc(collection(firestore, 'courses', courseId, 'assignments', assignmentId, 'rubrics'));
      const rubricId = rubricRef.id;

      const rubricData = {
        id: rubricId,
        assignmentId,
        professorId: user.uid,
        name: `Rubric for ${title}`,
        description: `Grading criteria for ${title}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(rubricRef, rubricData, { merge: true });

      rubric.forEach((item, i) => {
        const criterionRef = doc(collection(firestore, 'courses', courseId, 'assignments', assignmentId, 'rubrics', rubricId, 'criteria'));
        const criterionData = {
          id: criterionRef.id,
          rubricId,
          professorId: user.uid,
          description: `${item.criterion}: ${item.description}`,
          maxScore: item.maxPoints,
          order: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        setDocumentNonBlocking(criterionRef, criterionData, { merge: true });
      });
    }

    toast({ 
      title: isDraft ? "Draft Saved" : "Assignment Published", 
      description: `Successfully initiated the ${isDraft ? 'save' : 'publish'} of your assignment.` 
    });

    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-[#F6FAFC]">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Link href={courseId ? `/courses/${courseId}` : "/courses"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Course
        </Link>
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-headline font-bold">Create Assignment</h1>
            <p className="text-muted-foreground">Configure grading policies, submission types, and AI-assisted rubrics.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Assignment Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Lab 4: Memory Management" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the learning objectives, tasks, and constraints..."
                      className="min-h-[200px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Grading Rubric</CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={handleGenerateRubric}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI Suggest Rubric
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rubric.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                      No criteria added. Use AI generator or add manually.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rubric.map((item, index) => (
                        <div key={index} className="flex gap-4 p-4 border rounded-lg bg-white shadow-sm animate-in fade-in slide-in-from-top-2">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Criterion Name"
                              value={item.criterion}
                              onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)}
                              className="font-bold"
                            />
                            <Textarea
                              placeholder="Guideline for grading..."
                              value={item.description}
                              onChange={(e) => updateRubricItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="w-24 space-y-3">
                            <Input
                              type="number"
                              placeholder="Points"
                              value={item.maxPoints}
                              onChange={(e) => updateRubricItem(index, 'maxPoints', parseInt(e.target.value) || 0)}
                            />
                            <Button variant="ghost" size="icon" className="text-destructive w-full" onClick={() => removeRubricItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full gap-2" onClick={addRubricItem}>
                    <Plus className="h-4 w-4" /> Add Criterion Manually
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submission Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Submission Type</Label>
                    <Select value={submissionType} onValueChange={setSubmissionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub Link</SelectItem>
                        <SelectItem value="zip">ZIP Archive</SelectItem>
                        <SelectItem value="text">Raw Text/Draft</SelectItem>
                        <SelectItem value="file">PDF Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input 
                      id="deadline" 
                      type="datetime-local" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Group Project</Label>
                      <p className="text-[10px] text-muted-foreground">Enable peer contribution tracking</p>
                    </div>
                    <Switch checked={isGroupProject} onCheckedChange={setIsGroupProject} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Resubmission</Label>
                    </div>
                    <Switch checked={allowResubmission} onCheckedChange={setAllowResubmission} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Leaderboard</Label>
                      <p className="text-[10px] text-muted-foreground">Show anonymous rankings</p>
                    </div>
                    <Switch checked={enableLeaderboard} onCheckedChange={setEnableLeaderboard} />
                  </div>
                </CardContent>
              </Card>

              <Button 
                className="w-full h-12 text-lg font-bold shadow-lg" 
                onClick={() => handlePublish(false)}
                disabled={publishing}
              >
                {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Publish Assignment'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handlePublish(true)}
                disabled={publishing}
              >
                {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Draft'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
