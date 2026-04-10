
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Zap, 
  Target, 
  Loader2, 
  Search,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  limit,
  collectionGroup
} from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

export function StudentDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState(0);
  const [totalQuizzesCount, setTotalQuizzesCount] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const isChandan = user?.displayName?.toLowerCase().includes('chandan') || user?.email?.toLowerCase().includes('chandan');

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "course_enrollments"), where("studentId", "==", user.uid));
  }, [firestore, user?.uid]);

  const { data: enrollments, isLoading: isEnrollmentsLoading } = useCollection(enrollmentsQuery);

  const allCoursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "courses"), where("isActive", "==", true));
  }, [firestore, user]);

  const { data: allCourses, isLoading: isCoursesLoading } = useCollection(allCoursesQuery);

  // Logic to auto-generate 24-hour deadline notifications
  useEffect(() => {
    async function checkDeadlines() {
      if (!firestore || !user?.uid || allAssignments.length === 0) return;

      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      for (const assignment of allAssignments) {
        if (!assignment.deadline) continue;
        const deadline = new Date(assignment.deadline);
        
        // If deadline is within 24 hours and in the future
        if (deadline > now && deadline <= next24Hours) {
          // Check if we already notified for this assignment
          const notifKey = `deadline_notified_${assignment.id}_${user.uid}`;
          const alreadyNotified = localStorage.getItem(notifKey);

          if (!alreadyNotified) {
            try {
              await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
                userId: user.uid,
                title: "Upcoming Deadline",
                message: `The assignment "${assignment.title}" is due within 24 hours!`,
                type: 'deadline',
                link: `/student/courses/${assignment.courseId}`,
                read: false,
                createdAt: serverTimestamp()
              });
              localStorage.setItem(notifKey, 'true');
            } catch (err) {
              console.error("Failed to create deadline notification", err);
            }
          }
        }
      }
    }

    if (!isAssignmentsLoading) {
      checkDeadlines();
    }
  }, [firestore, user?.uid, allAssignments, isAssignmentsLoading]);

  useEffect(() => {
    async function fetchPortalData() {
      if (!firestore || !enrollments || enrollments.length === 0 || !user) {
        setAllAssignments([]);
        setTotalSubmissionsCount(0);
        setTotalQuizzesCount(0);
        return;
      }

      setIsStatsLoading(true);
      setIsAssignmentsLoading(true);
      
      try {
        let totalS = 0;
        let totalQ = 0;
        
        if (!isChandan) {
          const sq = query(collectionGroup(firestore, 'submissions'), where('submitterId', '==', user.uid));
          const sSnap = await getDocs(sq);
          totalS = sSnap.docs.filter(d => d.data().status !== 'returned').length;

          const qsq = query(collectionGroup(firestore, 'quiz_submissions'), where('studentId', '==', user.uid));
          const qsSnap = await getDocs(qsq);
          totalQ = qsSnap.size;
        }

        const dataPromises = enrollments.map(async (enrollment) => {
          const courseId = enrollment.courseId;
          const course = allCourses?.find(c => c.id === courseId);

          const aq = query(collection(firestore, 'courses', courseId, 'assignments'), limit(15));
          const aSnap = await getDocs(aq);
          
          return aSnap.docs.map(aDoc => ({ 
            ...aDoc.data(), 
            id: aDoc.id, 
            courseId: courseId,
            courseName: course?.name || 'Unknown Course',
            courseCode: course?.code || ''
          }));
        });

        const results = await Promise.all(dataPromises);
        const flattened = results.flat().sort((a, b) => {
          const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
          const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
          return dateA - dateB;
        });

        setAllAssignments(flattened);
        setTotalSubmissionsCount(totalS);
        setTotalQuizzesCount(totalQ);
      } catch (err) {
        console.error("Error fetching portal data:", err);
      } finally {
        setIsAssignmentsLoading(false);
        setIsStatsLoading(false);
      }
    }

    fetchPortalData();
  }, [firestore, enrollments, allCourses, user, isChandan]);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !firestore || !user) return;

    setIsJoining(true);
    try {
      const coursesRef = collection(firestore, 'courses');
      const q = query(coursesRef, where('joinCode', '==', joinCode.trim().toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Invalid Join Code", description: "No active course found with this code.", variant: "destructive" });
        setIsJoining(false);
        return;
      }

      const courseDoc = querySnapshot.docs[0];
      const courseData = courseDoc.data();

      const isAlreadyEnrolled = enrollments?.some(e => e.courseId === courseDoc.id);
      if (isAlreadyEnrolled) {
        toast({ title: "Already Enrolled", variant: "destructive" });
        setIsJoining(false);
        setIsDialogOpen(false);
        return;
      }

      const enrollmentData = {
        studentId: user.uid,
        courseId: courseDoc.id,
        professorId: courseData.professorId,
        enrollmentDate: serverTimestamp(),
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'course_enrollments'), enrollmentData);
      toast({ title: "Successfully Enrolled!" });
      setJoinCode('');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Enrollment Failed", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const myCourses = allCourses?.filter(course => 
    enrollments?.some(enrollment => enrollment.courseId === course.id)
  ) || [];

  if (isEnrollmentsLoading || isCoursesLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Student Portal</h1>
          <p className="text-muted-foreground font-medium mt-1">Track your progress, assignments, and AI quizzes.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold gap-2 h-12 px-6 rounded-xl shadow-xl shadow-primary/20">
                <Zap className="h-4 w-4 fill-current" /> Join Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Enroll in Course</DialogTitle>
                <DialogDescription className="font-medium">Enter the 6-character portal code provided by your professor.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinCourse} className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="joinCode" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portal Join Code</Label>
                  <Input
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="XYZ123"
                    className="h-16 text-center text-3xl font-mono border-none bg-accent/30 rounded-2xl"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg" disabled={isJoining || joinCode.length < 4}>
                    {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enroll Now'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Academic Standing */}
        <Card className="bg-primary text-primary-foreground shadow-2xl border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 opacity-90">
              <Target className="h-4 w-4" /> Academic Standing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myCourses.length > 0 ? 'Active' : 'N/A'}</div>
            <p className="text-xs opacity-75 mt-1">Enrollment status</p>
          </CardContent>
        </Card>

        {/* Card 2: Tasks Pending */}
        <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Tasks Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allAssignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Current workload</p>
          </CardContent>
        </Card>

        {/* Card 3: Assignments Done */}
        <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> Assignments Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalSubmissionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Work submitted</p>
          </CardContent>
        </Card>

        {/* Card 4: AI Quizzes Done */}
        <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-orange-500">
              <HelpCircle className="h-4 w-4" /> AI Quizzes Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQuizzesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Assessments completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" /> My Enrolled Courses
          </h2>
          {myCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCourses.map((course) => (
                <Card key={course.id} className="h-full border-border group hover:border-primary/20 transition-all bg-card/50 overflow-hidden">
                  <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="font-bold">{course.code}</Badge>
                      <Link href={`/student/courses/${course.id}`}>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                           <ArrowRight className="h-4 w-4" />
                         </Button>
                      </Link>
                    </div>
                    <Link href={`/student/courses/${course.id}`}>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">{course.name}</CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/student/courses/${course.id}`}>
                      <Button variant="outline" className="w-full text-xs font-bold gap-2 h-10 rounded-xl">
                        Enter Portal <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-card/30">
              <Search className="h-10 w-10 text-primary/40 mx-auto mb-6" />
              <h3 className="text-lg font-bold">No active enrollments</h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">Use a portal code from your professor to begin your coursework.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="font-bold px-8 rounded-xl h-11 shadow-lg shadow-primary/10">Join Your First Course</Button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" /> Upcoming Deadlines
          </h2>
          <div className="space-y-4">
            {isAssignmentsLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : allAssignments.length > 0 ? (
              allAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-border bg-card/50 hover:border-primary/20 transition-all">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase font-bold tracking-widest">
                          {assignment.courseCode}
                        </Badge>
                        <h4 className="text-sm font-bold leading-tight line-clamp-1">{assignment.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Clock className="h-3.5 w-3.5" /> Due {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-10 text-center border-2 border-dashed rounded-2xl bg-card/30">
                <AlertCircle className="h-6 w-6 text-primary/40 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No Pending Tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
