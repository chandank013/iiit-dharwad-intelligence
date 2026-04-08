
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Zap, 
  Target, 
  Loader2, 
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText
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
  orderBy,
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function StudentDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // Check if user is Chandan to hide specific stats if necessary
  const isChandan = user?.displayName?.toLowerCase().includes('chandan') || user?.email?.toLowerCase().includes('chandan');

  // Fetch student's enrollments
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "course_enrollments"), where("studentId", "==", user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isEnrollmentsLoading } = useCollection(enrollmentsQuery);

  // Fetch all active courses
  const allCoursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "courses"), where("isActive", "==", true));
  }, [firestore, user]);

  const { data: allCourses, isLoading: isCoursesLoading } = useCollection(allCoursesQuery);

  // Fetch all submissions for the student
  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collectionGroup(firestore, "submissions"), where("submitterId", "==", user.uid));
  }, [firestore, user]);

  const { data: submissions, isLoading: isSubmissionsLoading } = useCollection(submissionsQuery);

  const totalSubmissions = useMemo(() => {
    if (!submissions || isChandan) return 0;
    return submissions.length;
  }, [submissions, isChandan]);

  // Manual fetch for assignments across enrolled courses
  useEffect(() => {
    async function fetchAssignments() {
      if (!firestore || !enrollments || enrollments.length === 0) {
        setAllAssignments([]);
        return;
      }

      setIsAssignmentsLoading(true);
      try {
        const assignmentsPromises = enrollments.map(async (enrollment) => {
          const q = query(
            collection(firestore, 'courses', enrollment.courseId, 'assignments'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const snap = await getDocs(q);
          const course = allCourses?.find(c => c.id === enrollment.courseId);
          return snap.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id, 
            courseName: course?.name || 'Unknown Course',
            courseCode: course?.code || ''
          }));
        });

        const results = await Promise.all(assignmentsPromises);
        const flattened = results.flat().sort((a, b) => {
          const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
          const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
          return dateA - dateB;
        });
        setAllAssignments(flattened);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      } finally {
        setIsAssignmentsLoading(false);
      }
    }

    fetchAssignments();
  }, [firestore, enrollments, allCourses]);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !firestore || !user) return;

    setIsJoining(true);
    try {
      const coursesRef = collection(firestore, 'courses');
      const q = query(coursesRef, where('joinCode', '==', joinCode.trim().toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Invalid Join Code",
          description: "No active course found with this code. Please check and try again.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      const courseDoc = querySnapshot.docs[0];
      const courseData = courseDoc.data();

      const isAlreadyEnrolled = enrollments?.some(e => e.courseId === courseDoc.id);
      if (isAlreadyEnrolled) {
        toast({
          title: "Already Enrolled",
          description: `You are already a member of ${courseData.name}.`,
          variant: "destructive",
        });
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

      toast({
        title: "Successfully Enrolled!",
        description: `You have joined ${courseData.name}.`,
      });
      
      setJoinCode('');
      setIsDialogOpen(false);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'course_enrollments',
          operation: 'create',
          requestResourceData: { studentId: user?.uid },
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        toast({
          title: "Enrollment Failed",
          description: "Something went wrong while joining the course. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const myCourses = allCourses?.filter(course => 
    enrollments?.some(enrollment => enrollment.courseId === course.id)
  ) || [];

  if (isEnrollmentsLoading || isCoursesLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Student Portal</h1>
          <p className="text-muted-foreground">Track your academic progress at IIIT Dharwad.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-semibold gap-2 shadow-lg hover:scale-105 transition-transform">
                <Zap className="h-4 w-4 fill-current" /> Join Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Join a New Course</DialogTitle>
                <DialogDescription>
                  Enter the 6-character join code provided by your professor to enroll.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinCourse} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Course Join Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="e.g. AB12CD"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest uppercase"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg" 
                    disabled={isJoining || joinCode.length < 4}
                  >
                    {isJoining ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Enroll in Course'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
              <Target className="h-4 w-4" /> Academic Standing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{myCourses.length > 0 ? 'Good' : 'N/A'}</div>
            <p className="text-xs opacity-75 mt-1">Based on {enrollments?.length || 0} enrolled courses</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Active Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allAssignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending deadlines across courses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" /> Total Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments completed so far</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> My Enrolled Courses
            </h2>
          </div>
          {myCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCourses.map((course) => (
                <div key={course.id}>
                  <Card className="h-full border-l-4 border-l-primary hover:shadow-md transition-shadow group">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary" className="w-fit">{course.code}</Badge>
                        <Link href={`/student/courses/${course.id}`}>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowRight className="h-4 w-4" />
                           </Button>
                        </Link>
                      </div>
                      <Link href={`/student/courses/${course.id}`}>
                        <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">{course.name}</CardTitle>
                      </Link>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/student/courses/${course.id}`}>
                        <Button variant="outline" className="w-full text-xs font-bold gap-2">
                          My Dashboard <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-xl bg-white/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="font-bold text-lg">Not enrolled in any courses</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Use a join code from your professor to get started.
              </p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                Join Your First Course
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-headline font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming Deadlines
          </h2>
          <div className="space-y-4">
            {isAssignmentsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : allAssignments.length > 0 ? (
              allAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-none shadow-sm bg-white hover:bg-accent/5 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/20 text-primary uppercase font-bold">
                          {assignment.courseCode}
                        </Badge>
                        <h4 className="text-sm font-bold leading-none">{assignment.title}</h4>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none text-[10px] font-bold">
                        Open
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 
                        {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No Deadline'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="pt-6 space-y-4 text-center">
                  <div className="flex gap-4 items-start p-3 rounded-lg border border-dashed border-primary/20 bg-primary/5">
                    <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                    <div className="text-left space-y-1">
                      <p className="text-sm font-semibold leading-tight">No Active Assignments</p>
                      <p className="text-xs text-muted-foreground">Check back later or join a course.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
