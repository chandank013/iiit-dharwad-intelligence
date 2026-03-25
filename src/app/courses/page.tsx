
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Plus, Loader2, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import Link from 'next/link';

export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Ensure query is only created when user is authenticated to avoid auth: null errors
  const coursesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "courses"));
  }, [firestore, user]);

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || (isCoursesLoading && user) || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6FAFC]">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold">Academic Courses</h1>
              <p className="text-muted-foreground">Manage and browse current academic offerings.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search courses..." className="pl-9" />
              </div>
              {user.email?.endsWith('@iiitdwd.ac.in') && !user.email?.startsWith('24bds') && (
                <Link href="/courses/create">
                  <Button className="gap-2 shadow-md">
                    <Plus className="h-4 w-4" /> Create Course
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses && courses.length > 0 ? (
              courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-all group border-none shadow-sm">
                  <div className="h-2 bg-primary rounded-t-lg" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{course.code}</Badge>
                      {course.isActive ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-green-600 bg-green-50 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">Archived</Badge>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors text-xl">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>Semester: {course.semester}</span>
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">ID: {course.joinCode}</span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        Course Portal <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border-2 border-dashed">
                <div className="p-4 bg-primary/5 rounded-full">
                  <BookOpen className="h-12 w-12 text-primary/40" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold">No courses found</h3>
                  <p className="text-muted-foreground max-w-sm">
                    {user.email?.startsWith('24bds') 
                      ? "You are not enrolled in any courses yet. Use a join code provided by your professor."
                      : "Start by creating your first academic course for your students."}
                  </p>
                </div>
                {!user.email?.startsWith('24bds') && (
                  <Link href="/courses/create">
                    <Button className="mt-2">Create Course Now</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
