"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Zap, 
  Target, 
  Library, 
  Loader2, 
  Search,
  CheckCircle2,
  AlertCircle
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
  limit
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

  // Fetch student's enrollments
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "course_enrollments"), where("studentId", "==", user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isEnrollmentsLoading } = useCollection(enrollmentsQuery);

  // Fetch all courses (for display/lookup)
  const allCoursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "courses"), where("isActive", "==", true));
  }, [firestore, user]);

  const { data: allCourses, isLoading: isCoursesLoading } = useCollection(allCoursesQuery);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !firestore || !user) return;

    setIsJoining(true);
    try {
      // 1. Find the course with the matching join code
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

      // 2. Check if already enrolled
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

      // 3. Create enrollment
      const enrollmentData = {
        studentId: user.uid,
        courseId: courseDoc.id,
        professorId: courseData.professorId, // denormalized for security rules
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
      console.error("Error joining course:", error);
      
      // Only emit permission error if it's actually a permission-denied error from Firebase
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

  // Map enrolled course IDs to actual course objects
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
          <p className="text-muted-foreground">Track your academic progress and submissions at IIIT Dharwad.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/courses">
            <Button variant="outline" className="gap-2">
              <Library className="h-4 w-4" /> Browse Courses
            </Button>
          </Link>
          
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
            <div className="text-4xl font-bold">Good</div>
            <p className="text-xs opacity-75 mt-1">Based on {enrollments?.length || 0} enrolled courses</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Active Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">No pending deadlines today</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Assignments evaluated</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-headline font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> My Enrolled Courses
          </h2>
          {myCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCourses.map((course) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <Card className="hover:shadow-md transition-all cursor-pointer h-full border-l-4 border-l-primary group">
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit mb-1">{course.code}</Badge>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{course.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        <span>Portal Active</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-xl bg-white/50">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="font-bold text-lg">Not enrolled in any courses</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Use a join code from your professor or browse public courses to get started.
              </p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                Join Your First Course
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-headline font-semibold">Activity Feed</h2>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4 items-start p-3 rounded-lg border border-dashed border-primary/20 bg-primary/5">
                <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">Welcome to AIS</p>
                  <p className="text-xs text-muted-foreground">Your academic dashboard is now active. Explore your courses and track your progress.</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground italic">No other recent activity.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}