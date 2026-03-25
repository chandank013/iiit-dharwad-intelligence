"use client";

import { Navbar } from '@/components/layout/Navbar';
import { MOCK_COURSES } from '@/lib/mock-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CoursesPage() {
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Course
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COURSES.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{course.code}</Badge>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active</span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/3" />
                    </div>
                    <span className="text-xs font-bold">66% Complete</span>
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Course Portal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}