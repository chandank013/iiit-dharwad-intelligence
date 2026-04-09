
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, BarChart3, Loader2, BookOpen, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, collectionGroup } from "firebase/firestore";

export function ProfessorDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. Fetch Professor's Courses
  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "courses"), where("professorId", "==", user.uid));
  }, [firestore, user]);

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery);

  // 2. Fetch Enrollments
  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "course_enrollments"), where("professorId", "==", user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isEnrollmentsLoading } = useCollection(enrollmentsQuery);

  // State to hold derived counts to avoid collectionGroup index errors
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Derive counts by iterating through courses manually to bypass index requirement for collectionGroup
  useEffect(() => {
    async function fetchCounts() {
      if (!firestore || !courses || courses.length === 0) {
        setAssignmentCount(0);
        setPendingSubmissionsCount(0);
        return;
      }

      setIsLoadingCounts(true);
      try {
        let totalA = 0;
        let totalP = 0;

        const promises = courses.map(async (course) => {
          const assignmentsRef = collection(firestore, 'courses', course.id, 'assignments');
          const assignmentsSnap = await getDocs(assignmentsRef);
          totalA += assignmentsSnap.size;

          // For each assignment, check for submissions that are 'submitted'
          const submissionsPromises = assignmentsSnap.docs.map(async (aDoc) => {
            const subsRef = collection(firestore, 'courses', course.id, 'assignments', aDoc.id, 'submissions');
            const pQuery = query(subsRef, where('status', '==', 'submitted'));
            const pSnap = await getDocs(pQuery);
            return pSnap.size;
          });

          const pResults = await Promise.all(submissionsPromises);
          totalP += pResults.reduce((acc, curr) => acc + curr, 0);
        });

        await Promise.all(promises);
        setAssignmentCount(totalA);
        setPendingSubmissionsCount(totalP);
      } catch (err) {
        console.error("Error calculating dashboard counts:", err);
      } finally {
        setIsLoadingCounts(false);
      }
    }

    fetchCounts();
  }, [firestore, courses]);

  const uniqueStudentsCount = useMemo(() => {
    if (!enrollments) return 0;
    const studentIds = new Set(enrollments.map(e => e.studentId));
    return studentIds.size;
  }, [enrollments]);

  if (isUserLoading || isCoursesLoading || isEnrollmentsLoading || isLoadingCounts) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Professor Hub</h1>
          <p className="text-muted-foreground">Manage your courses, assignments, and evaluate student progress.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/audit">
            <Button variant="outline" className="font-semibold gap-2 border-primary/20 hover:bg-primary/5">
              <Activity className="h-4 w-4" /> Activity Logs
            </Button>
          </Link>
          <Link href="/courses/create">
            <Button className="font-semibold gap-2 shadow-lg">
              <PlusCircle className="h-4 w-4" /> Create Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStudentsCount}</div>
            <p className="text-xs text-muted-foreground">Across all course portals</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Portals</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Live courses offered</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{assignmentCount}</div>
            <p className="text-xs text-muted-foreground">Total tasks assigned</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingSubmissionsCount}</div>
            <p className="text-xs text-muted-foreground">Work awaiting evaluation</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-semibold">Live Courses</h2>
            <Link href="/courses" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses && courses.length > 0 ? (
              courses.map((course) => {
                const courseStudents = enrollments?.filter(e => e.courseId === course.id).length || 0;
                return (
                  <Card key={course.id} className="group hover:border-primary transition-colors cursor-pointer border-none shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="mb-2">{course.code}</Badge>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded tracking-widest">{course.joinCode}</span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{course.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {courseStudents} Students</span>
                      </div>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="ghost" className="w-full mt-4 justify-between group">
                          Enter Course Portal <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 p-12 text-center border-2 border-dashed rounded-xl bg-white/50 text-muted-foreground">
                <div className="mb-4 flex justify-center">
                  <BookOpen className="h-10 w-10 opacity-20" />
                </div>
                <p className="font-medium">No courses launched yet.</p>
                <Link href="/courses/create">
                  <Button variant="link" className="mt-2 text-primary font-bold">Launch your first course</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-headline font-semibold">System Insights</h2>
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4 items-start p-3 rounded-lg bg-primary/5">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">Real-time Monitoring</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Course portals and student work are audited automatically for integrity.
                  </p>
                  <span className="text-[10px] font-bold text-primary mt-1 uppercase">Cloud Guard Online</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground shadow-xl border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" /> Analytics Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs opacity-90 leading-relaxed">
                Evaluating student performance and identifying weak areas across all your active courses.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span>Processing</span>
                  <span>Active</span>
                </div>
                <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/3 animate-[progress_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
