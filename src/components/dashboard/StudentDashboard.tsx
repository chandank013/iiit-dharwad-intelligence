"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Trophy, Clock, ArrowRight, Zap, Target, Library } from "lucide-react";
import { MOCK_COURSES, MOCK_ASSIGNMENTS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function StudentDashboard() {
  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Student Portal</h1>
          <p className="text-muted-foreground">Track your academic progress and submissions at IIIT Dharwad.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Library className="h-4 w-4" /> Browse Courses
          </Button>
          <Button className="font-semibold gap-2">
            <Zap className="h-4 w-4" /> Join Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
              <Target className="h-4 w-4" /> Overall GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">8.42</div>
            <p className="text-xs opacity-75 mt-1">Based on 12 completed assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Pending Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Next due in 2 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" /> Portfolio Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Top 15%</div>
            <p className="text-xs text-muted-foreground mt-1">Across CSE Branch</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-headline font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> My Enrolled Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_COURSES.map((course) => (
              <Link href={`/courses/${course.id}`} key={course.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 border-l-primary">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-1">{course.code}</Badge>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                      <div className="bg-secondary h-full w-[45%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <span>45% Progress</span>
                      <span>12/24 Modules</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-headline font-semibold">Upcoming Deadlines</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {MOCK_ASSIGNMENTS.map((assignment) => (
                <div key={assignment.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-primary uppercase">CS302</span>
                    <Badge variant="destructive" className="text-[10px]">Due Dec 20</Badge>
                  </div>
                  <p className="text-sm font-semibold leading-tight">{assignment.title}</p>
                  <Button variant="link" className="p-0 h-auto text-xs justify-start gap-1">
                    Prepare Submission <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="p-3 rounded-lg border bg-muted/10 text-center">
                <p className="text-xs text-muted-foreground">No other deadlines for this week.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-secondary">
            <CardHeader>
              <CardTitle className="text-base font-headline">AI Smart Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Based on your recent feedback in NLP, try reviewing "Transformer Architectures".</p>
              <Button variant="secondary" size="sm" className="w-full text-xs">Explore Resources</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}