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
import { aiAssignmentGenerator } from '@/ai/flows/ai-assignment-generator';
import { Sparkles, Trash2, Plus, Loader2, ArrowLeft, BrainCircuit, Upload, Send, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function CreateAssignmentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const courseId = searchParams.get('courseId');

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiContext, setAiAiContext] = useState('');
  const [aiFileDataUri, setAiFileDataUri] = useState<string | null>(null);
  const [aiFileName, setAiFileName] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionType, setSubmissionType] = useState('github');
  const [isGroupProject, setIsGroupProject] = useState(false);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [enableLeaderboard, setEnableLeaderboard] = useState(true);
  
  const [rubric, setRubric] = useState<{ criterion: string; description: string; maxPoints: number }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Invalid Format", description: "Only PDF files are supported for AI context.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "PDF must be under 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAiFileDataUri(reader.result as string);
      setAiFileName(file.name);
      toast({ title: "PDF Attached", description: `${file.name} is ready for processing.` });
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (!aiContext.trim() && !aiFileDataUri) {
      toast({ title: "Context Required", description: "Please provide a topic or upload a file for the AI.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await aiAssignmentGenerator({ 
        context: aiContext || "Generate an assignment based on the provided document.",
        fileDataUri: aiFileDataUri || undefined,
        difficulty: 'intermediate'
      });
      
      setTitle(result.title);
      setDescription(result.description);
      setRubric(result.rubric);

      // Automatically set the suggested deadline
      if (result.suggestedDurationDays) {
        const date = new Date();
        date.setDate(date.getDate() + result.suggestedDurationDays);
        date.setHours(23, 59, 0, 0); // End of day
        
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        setDeadline(formattedDate);
      }

      setIsAiMode(false);
      toast({ 
        title: "Assignment Drafted by AI", 
        description: `Suggested rubric and a ${result.suggestedDurationDays}-day timeline applied.` 
      });
    } catch (err) {
      toast({ title: "AI Assistant Busy", description: "Could not generate assignment. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRubric = async () => {
    if (!description || description.length < 20) {
      toast({ 
        title: "Detailed Description Required", 
        description: "Please provide a more detailed assignment description (at least 20 chars) for the AI.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await professorAIRubricGenerator({ description });
      if (result && result.rubric) {
        setRubric(result.rubric);
        toast({ title: "Rubric Generated", description: "AI has successfully suggested a rubric based on your description." });
      }
    } catch (error: any) {
      toast({ 
        title: "Generation Failed", 
        description: error.message || "Could not generate rubric. The AI service may be busy.", 
        variant: "destructive" 
      });
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold">New Assignment</h1>
              <p className="text-muted-foreground">Configure grading policies and submission parameters.</p>
            </div>
            <Button 
              variant={isAiMode ? "secondary" : "outline"} 
              className="gap-2 font-bold"
              onClick={() => setIsAiMode(!isAiMode)}
            >
              <BrainCircuit className={isAiMode ? "text-primary" : "text-muted-foreground"} size={18} />
              {isAiMode ? "Back to Editor" : "Generate with AI"}
            </Button>
          </div>

          {isAiMode ? (
            <Card className="border-primary/20 bg-primary/5 shadow-xl animate-in zoom-in-95 duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Sparkles size={20} />
                    </div>
                    <Badge className="font-bold">AI Assistant</Badge>
                  </div>
                  {aiFileName && (
                    <Badge variant="outline" className="gap-1.5 border-emerald-500/20 text-emerald-600 bg-emerald-50">
                      <FileCheck className="h-3 w-3" /> {aiFileName}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">Content-to-Assignment</CardTitle>
                <CardDescription>Provide context or a PDF. AI will generate the title, instructions, rubric, and estimate the deadline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Material / Description</Label>
                  <Textarea 
                    placeholder="e.g. Paste a textbook chapter about memory management, or describe a lab task..."
                    className="min-h-[200px] bg-background text-sm leading-relaxed p-6"
                    value={aiContext}
                    onChange={(e) => setAiAiContext(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full h-12 gap-2 font-bold"
                      onClick={() => document.getElementById('ai-file-upload')?.click()}
                    >
                      <Upload size={18} /> {aiFileName ? "Change PDF" : "Upload Context (PDF)"}
                    </Button>
                    <input 
                      type="file" 
                      id="ai-file-upload" 
                      className="hidden" 
                      accept=".pdf" 
                      onChange={handleFileChange}
                    />
                  </div>
                  <Button 
                    className="flex-1 h-12 gap-2 font-bold shadow-lg"
                    onClick={handleAiGenerate}
                    disabled={loading || (!aiContext.trim() && !aiFileDataUri)}
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    Generate Assignment Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
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
          )}
        </div>
      </main>
    </div>
  );
}
