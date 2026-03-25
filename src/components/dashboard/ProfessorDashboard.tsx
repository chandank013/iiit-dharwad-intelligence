"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText, CheckCircle, AlertTriangle, ArrowRight, TrendingUp, BarChart3 } from "lucide-react";
import { MOCK_COURSES } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function ProfessorDashboard() {
  return (
    <div className="space-y-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Professor Hub</h1>
          <p className="text-muted-foreground">Manage your courses, assignments, and evaluate student progress.</p>
        </div>
        <Button className="font-semibold gap-2">
          <PlusCircle className="h-4 w-4" /> Create Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">+5% from last semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">78%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending AI Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">12</div>
            <p className="text-xs text-muted-foreground">Requiring manual override</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-semibold">Active Courses</h2>
            <Link href="/courses" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_COURSES.map((course) => (
              <Card key={course.id} className="group hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="mb-2">{course.code}</Badge>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{course.joinCode}</span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.enrolledStudents.length} Students</span>
                    <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> 2 New Submissions</span>
                  </div>
                  <Button variant="ghost" className="w-full mt-4 justify-between group">
                    Enter Course <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-headline font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Assignment "Microservices Design" evaluation complete.</p>
                  <span className="text-xs text-muted-foreground">15 minutes ago</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-orange-500" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Low AI confidence detected for student "Aryan Sharma".</p>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-green-500" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Aryan Sharma enrolled via join code ASE2024.</p>
                  <span className="text-xs text-muted-foreground">Yesterday</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">View Audit Log</Button>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm opacity-90">Class average has improved by 4% since the last module.</p>
              <div className="h-2 w-full bg-primary-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[78%]" />
              </div>
              <Button variant="secondary" className="w-full text-foreground">Detailed Reports</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}