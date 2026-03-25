"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Plus, Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import Link from 'next/link';

export default function CoursesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const isStudent = user?.email?.startsWith('24bds');

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tighter">Course Catalog</h1>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Academic Offerings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search catalog..." className="pl-10 w-64 bg-card/50 border-white/5 focus:ring-primary/20" />
              </div>
              {!isStudent && (
                <Link href="/courses/create">
                  <Button className="gap-2 shadow-lg shadow-primary/10 font-bold px-6">
                    <Plus className="h-4 w-4" /> Create Course
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses && courses.length > 0 ? (
              courses.map((course) => (
                <Card key={course.id} className="group hover:border-primary/40 transition-all border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                        {course.code}
                      </Badge>
                      {course.isActive ? (
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-green-500 uppercase">Live</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Archived</span>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors text-2xl font-bold leading-tight">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed mt-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>{course.semester}</span>
                      {!isStudent && (
                        <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-primary">ID: {course.joinCode}</span>
                      )}
                    </div>
                    {!isStudent && (
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all font-bold">
                          Portal Entry <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-6 bg-card/30 border-2 border-dashed border-white/5 rounded-3xl">
                <div className="p-6 bg-primary/5 rounded-full ring-1 ring-primary/10">
                  <BookOpen className="h-12 w-12 text-primary/40" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">No courses found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                    {isStudent 
                      ? "You are not enrolled in any courses yet. Use a join code provided by your professor to get started."
                      : "The academic catalog is empty. Start by launching your first course for students."}
                  </p>
                </div>
                {!isStudent && (
                  <Link href="/courses/create">
                    <Button className="font-bold px-8 shadow-xl shadow-primary/20">Create Course Now</Button>
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