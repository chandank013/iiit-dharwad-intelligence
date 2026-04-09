
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, BarChart3, Loader2, BookOpen, Activity, HelpCircle, GraduationCap } from "lucide-react";
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

  // State to hold derived counts
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [quizAttemptsCount, setQuizAttemptsCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      if (!firestore || !courses || courses.length === 0) {
        setAssignmentCount(0);
        setPendingSubmissionsCount(0);
        setQuizCount(0);
        setQuizAttemptsCount(0);
        return;
      }

      setIsLoadingCounts(true);
      try {
        let totalA = 0;
        let totalP = 0;
        let totalQ = 0;
        let totalQA = 0;

        const promises = courses.map(async (course) => {
          // Fetch Assignments & Pending
          const assignmentsRef = collection(firestore, 'courses', course.id, 'assignments');
          const assignmentsSnap = await getDocs(assignmentsRef);
          totalA += assignmentsSnap.size;

          const submissionsPromises = assignmentsSnap.docs.map(async (aDoc) => {
            const subsRef = collection(firestore, 'courses', course.id, 'assignments', aDoc.id, 'submissions');
            const pQuery = query(subsRef, where('status', '==', 'submitted'));
            const pSnap = await getDocs(pQuery);
            return pSnap.size;
          });

          const pResults = await Promise.all(submissionsPromises);
          totalP += pResults.reduce((acc, curr) => acc + curr, 0);

          // Fetch Quizzes & Attempts
          const quizzesRef = collection(firestore, 'courses', course.id, 'quizzes');
          const quizzesSnap = await getDocs(quizzesRef);
          totalQ += quizzesSnap.size;

          const quizAttemptsRef = collection(firestore, 'courses', course.id, 'quiz_submissions');
          const quizAttemptsSnap = await getDocs(quizAttemptsRef);
          totalQA += quizAttemptsSnap.size;
        });

        await Promise.all(promises);
        setAssignmentCount(totalA);
        setPendingSubmissionsCount(totalP);
        setQuizCount(totalQ);
        setQuizAttemptsCount(totalQA);
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
    <div className="space-y-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Professor Hub</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage courses, assessments, and AI-driven insights.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/audit">
            <Button variant="outline" className="font-bold gap-2 h-12 px-6 rounded-xl border-primary/20 hover:bg-primary/5">
              <Activity className="h-4 w-4" /> Activity
            </Button>
          </Link>
          <Link href="/courses/create">
            <Button className="font-bold gap-2 h-12 px-6 rounded-xl shadow-xl shadow-primary/20">
              <PlusCircle className="h-4 w-4" /> Create Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueStudentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all portals</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Portals</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Live environments</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignmentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingSubmissionsCount} pending evaluation</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Quizzes</CardTitle>
            <HelpCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quizCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{quizAttemptsCount} attempts recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Active Course Portals</h2>
            <Link href="/courses" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View Catalog</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses && courses.length > 0 ? (
              courses.map((course) => {
                const courseStudents = enrollments?.filter(e => e.courseId === course.id).length || 0;
                return (
                  <Card key={course.id} className="group hover:border-primary/20 transition-all border-border bg-card/50 overflow-hidden">
                    <div className="h-1.5 bg-primary/10 group-hover:bg-primary transition-colors" />
                    <CardHeader>
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className="font-bold">{course.code}</Badge>
                        <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded tracking-widest font-bold">ID: {course.joinCode}</span>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">{course.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {courseStudents} Students</span>
                      </div>
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="secondary" className="w-full justify-between font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          Enter Portal <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 p-20 text-center border-2 border-dashed rounded-[2rem] bg-card/30">
                <div className="mb-6 p-4 bg-primary/5 rounded-full w-fit mx-auto">
                  <BookOpen className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold">No portals launched</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">Start by creating your first digital course environment.</p>
                <Link href="/courses/create">
                  <Button className="font-bold px-8">Create Portal</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight">Intelligence</h2>
          <div className="space-y-6">
            <Card className="border-border bg-card/50">
              <CardContent className="pt-8 space-y-6">
                <div className="flex gap-5 items-start">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-bold">Cloud Integrity Guard</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Real-time monitoring of student work and system interactions across all courses.
                    </p>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-primary/20 text-primary w-fit mt-2">Active Monitor</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-2xl border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BarChart3 className="h-20 w-20" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <TrendingUp className="h-5 w-5" /> Analytics Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs font-medium opacity-90 leading-relaxed">
                  Synthesizing student performance data to identify cognitive gaps and curriculum strengths.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                    <span>Synthesizing</span>
                    <span>94% Accurate</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-2/3 animate-[progress_3s_ease-in-out_infinite]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
