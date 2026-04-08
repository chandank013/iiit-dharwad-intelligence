
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { professorAIRubricGenerator } from '@/ai/flows/professor-ai-rubric-generator';
import { Sparkles, Trash2, Plus, Loader2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';

export default function EditAssignmentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { assignmentId } = useParams();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const courseId = searchParams.get('courseId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionType, setSubmissionType] = useState('github');
  const [isGroupProject, setIsGroupProject] = useState(false);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [enableLeaderboard, setEnableLeaderboard] = useState(true);
  
  const [rubric, setRubric] = useState<{ id?: string, criterion: string; description: string; maxPoints: number }[]>([]);

  const assignmentRef = useMemoFirebase(() => {
    if (!firestore || !courseId || !assignmentId) return null;
    return doc(firestore, 'courses', courseId as string, 'assignments', assignmentId as string);
  }, [firestore, courseId, assignmentId]);

  const { data: assignment, isLoading: isAssignmentLoading } = useDoc(assignmentRef);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setDeadline(assignment.deadline || '');
      setSubmissionType(assignment.submissionType || 'github');
      setIsGroupProject(assignment.isGroupProject || false);
      setAllowResubmission(assignment.allowResubmissions || false);
      setEnableLeaderboard(assignment.enableLeaderboard || false);

      const fetchRubric = async () => {
        if (!firestore || !courseId || !assignmentId) return;
        const rubricsRef = collection(firestore, 'courses', courseId, 'assignments', assignmentId as string, 'rubrics');
        const rubricsSnap = await getDocs(rubricsRef);
        const rubricDoc = rubricsSnap.docs[0];
        if (rubricDoc) {
          const criteriaRef = collection(firestore, 'courses', courseId, 'assignments', assignmentId as string, 'rubrics', rubricDoc.id, 'criteria');
          const criteriaSnap = await getDocs(criteriaRef);
          const items = criteriaSnap.docs.map(d => {
            const data = d.data();
            const [criterion, ...rest] = data.description.split(': ');
            return {
              id: d.id,
              criterion: criterion,
              description: rest.join(': '),
              maxPoints: data.maxScore
            };
          });
          setRubric(items);
        }
      };
      fetchRubric();
    }
  }, [assignment, firestore, courseId, assignmentId]);

  const handleGenerateRubric = async () => {
    if (!description || description.length < 20) {
      toast({ 
        title: "Description Too Short", 
        description: "Please provide a more detailed assignment description for AI analysis.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await professorAIRubricGenerator({ description });
      if (result && result.rubric) {
        setRubric(result.rubric.map(r => ({
          criterion: r.criterion,
          description: r.description,
          maxPoints: r.maxPoints
        })));
        toast({ title: "Rubric Updated", description: "AI has successfully suggested a new rubric." });
      }
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
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

  const handleSave = async () => {
    if (!firestore || !user || !courseId || !assignmentId) return;

    const deadlinePassed = deadline && new Date() > new Date(deadline);
    if (deadlinePassed) {
      toast({ title: "Update Locked", description: "You cannot modify an assignment after the deadline.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const assignmentUpdate = {
        title,
        description,
        deadline: deadline || null,
        submissionType,
        isGroupProject,
        allowResubmissions: allowResubmission,
        enableLeaderboard,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(firestore, 'courses', courseId, 'assignments', assignmentId as string), assignmentUpdate);

      // Handle Rubric Sync (Simplistic: Delete old, add new)
      const rubricsRef = collection(firestore, 'courses', courseId, 'assignments', assignmentId as string, 'rubrics');
      const rubricsSnap = await getDocs(rubricsRef);
      let rubricId = rubricsSnap.docs[0]?.id;

      if (!rubricId) {
        const newRubricRef = doc(collection(firestore, 'courses', courseId, 'assignments', assignmentId as string, 'rubrics'));
        rubricId = newRubricRef.id;
        await setDocumentNonBlocking(newRubricRef, {
          id: rubricId,
          assignmentId,
          professorId: user.uid,
          name: `Rubric for ${title}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // Delete existing criteria
      const criteriaRef = collection(firestore, 'courses', courseId, 'assignments', assignmentId as string, 'rubrics', rubricId, 'criteria');
      const criteriaSnap = await getDocs(criteriaRef);
      for (const d of criteriaSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Add updated criteria
      for (const [i, item] of rubric.entries()) {
        const cRef = doc(criteriaRef);
        await setDocumentNonBlocking(cRef, {
          id: cRef.id,
          rubricId,
          professorId: user.uid,
          description: `${item.criterion}: ${item.description}`,
          maxScore: item.maxPoints,
          order: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      toast({ title: "Update Successful", description: "Assignment configuration has been synchronized." });
      router.push(`/courses/${courseId}`);
    } catch (err) {
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isAssignmentLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const isLocked = deadline && new Date() > new Date(deadline);

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
              <h1 className="text-3xl font-headline font-bold">Manage Assignment</h1>
              <p className="text-muted-foreground">Modify grading policies and assignment parameters.</p>
            </div>
            {isLocked && (
              <Badge variant="destructive" className="gap-2 h-10 px-4 rounded-xl">
                <AlertTriangle className="h-4 w-4" /> Editing Locked (Deadline Passed)
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className={cn(isLocked && "opacity-60 pointer-events-none")}>
                <CardHeader><CardTitle>Parameters</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[200px]" />
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(isLocked && "opacity-60 pointer-events-none")}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Rubric</CardTitle>
                  <Button variant="secondary" size="sm" className="gap-2" onClick={handleGenerateRubric} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Re-generate
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rubric.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-xl bg-white shadow-sm">
                      <div className="flex-1 space-y-3">
                        <Input placeholder="Criterion" value={item.criterion} onChange={(e) => updateRubricItem(index, 'criterion', e.target.value)} />
                        <Textarea placeholder="Guidelines" value={item.description} onChange={(e) => updateRubricItem(index, 'description', e.target.value)} />
                      </div>
                      <div className="w-24 space-y-3">
                        <Input type="number" value={item.maxPoints} onChange={(e) => updateRubricItem(index, 'maxPoints', parseInt(e.target.value) || 0)} />
                        <Button variant="ghost" size="icon" className="text-destructive w-full" onClick={() => removeRubricItem(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2" onClick={addRubricItem}><Plus className="h-4 w-4" /> Add Manual Criterion</Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className={cn(isLocked && "opacity-60 pointer-events-none")}>
                <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={submissionType} onValueChange={setSubmissionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="zip">ZIP</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="file">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Group Project</Label>
                    <Switch checked={isGroupProject} onCheckedChange={setIsGroupProject} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Resubmission</Label>
                    <Switch checked={allowResubmission} onCheckedChange={setAllowResubmission} />
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full h-12 text-lg font-bold shadow-lg" onClick={handleSave} disabled={saving || isLocked}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
