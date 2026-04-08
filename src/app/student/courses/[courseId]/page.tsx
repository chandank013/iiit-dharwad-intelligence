"use client";

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  doc, 
  collection, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileCheck, 
  ChevronLeft, 
  Clock, 
  TrendingUp, 
  Loader2, 
  AlertCircle, 
  FolderOpen,
  User,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Inbox,
  Megaphone,
  File as FileIcon,
  Link as LinkIcon,
  Download,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!isUserLoading && user && !user.email?.startsWith('24bds')) {
      router.push(`/courses/${courseId}`);
    }
  }, [user, isUserLoading, router, courseId]);

  const courseRef = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return doc(firestore, 'courses', courseId as string);
  }, [firestore, courseId]);
  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'assignments'), orderBy('createdAt', 'desc'));
  }, [firestore, courseId]);
  const { data: assignments } = useCollection(assignmentsQuery);

  const contentQuery = useMemoFirebase(() => {
    if (!firestore || !courseId) return null;
    return query(collection(firestore, 'courses', courseId as string, 'content'), orderBy('postedAt', 'desc'));
  }, [firestore, courseId]);
  const { data: courseContent } = useCollection(contentQuery);

  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collectionGroup(firestore, 'submissions'),
      where('submitterId', '==', user.uid)
    );
  }, [firestore, user]);
  const { data: rawSubmissions } = useCollection(submissionsQuery);

  const mySubmissions = useMemo(() => {
    if (!rawSubmissions || !courseId) return [];
    return rawSubmissions.filter(s => s.courseId === courseId);
  }, [rawSubmissions, courseId]);

  const submittedAssignmentIds = useMemo(() => {
    return new Set(mySubmissions.map(s => s.assignmentId));
  }, [mySubmissions]);

  const handleAddComment = (contentId: string) => {
    if (!firestore || !courseId || !user || !commentText.trim()) return;
    const commentsRef = collection(firestore, 'courses', courseId as string, 'content', contentId, 'comments');
    addDocumentNonBlocking(commentsRef, {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  if (isUserLoading || isCourseLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Course not found.</div>;

  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'submissions', label: 'My Submissions', icon: FileCheck },
    { id: 'content', label: 'Content', icon: FolderOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border flex flex-col fixed inset-y-0 left-0 bg-card z-30">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest mb-8 group">
            <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> All Courses
          </Link>

          <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">{course.code}</div>
            <div className="text-sm font-bold truncate leading-tight">{course.name}</div>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all font-semibold",
                  activeTab === link.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.name} Dashboard</h1>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span>Hey, {user.displayName?.split(' ')[0] || 'Student'}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{course.code}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{course.semester}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border p-6 flex items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {assignments?.filter(a => !submittedAssignmentIds.has(a.id)).length || 0}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</div>
                  </div>
                </Card>
                <Card className="border-border p-6 flex items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{mySubmissions.length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submitted</div>
                  </div>
                </Card>
                <Card className="border-border p-6 flex items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">0%</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Score</div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-border overflow-hidden">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground">Pending Assignments</CardTitle>
                    <button onClick={() => setActiveTab('assignments')} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {assignments && assignments.filter(a => !submittedAssignmentIds.has(a.id)).length > 0 ? (
                        assignments.filter(a => !submittedAssignmentIds.has(a.id)).slice(0, 3).map((task, i) => (
                          <div key={i} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => router.push(`/student/courses/${courseId}/submit/${task.id}`)}>
                            <div className="space-y-2">
                              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20">{course.name}</Badge>
                                <Badge variant="outline" className="text-[8px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">Individual</Badge>
                              </div>
                            </div>
                            <div className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/10">
                              Due Soon
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">No pending assignments found.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border overflow-hidden">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground">Recent Grades</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {mySubmissions.filter(s => s.status === 'graded').length > 0 ? (
                        mySubmissions.filter(s => s.status === 'graded').slice(0, 3).map((sub, i) => (
                          <div key={i} className="p-5 flex items-center justify-between">
                            <span className="text-sm font-bold">{assignments?.find(a => a.id === sub.assignmentId)?.title}</span>
                            <Badge className="bg-emerald-500 text-white">{sub.evaluation?.totalScore}%</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">
                          No graded submissions yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-orange-500">{assignments?.filter(a => !submittedAssignmentIds.has(a.id)).length || 0} pending</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-emerald-500">{submittedAssignmentIds.size} submitted</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-500">
                  <AlertCircle className="h-4 w-4" /> Pending Submissions
                </div>
                <div className="space-y-4">
                  {assignments && assignments.filter(a => !submittedAssignmentIds.has(a.id)).length > 0 ? (
                    assignments.filter(a => !submittedAssignmentIds.has(a.id)).map((assignment, idx) => (
                      <Card key={assignment.id} className={cn(
                        "border-border bg-card/50 backdrop-blur-sm overflow-hidden border-l-4 transition-all hover:shadow-lg group",
                        idx === 0 ? "border-l-rose-500" : "border-l-orange-500"
                      )}>
                        <CardContent className="p-8 flex items-center justify-between gap-8">
                          <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{assignment.description}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
                                {course.code || 'Course'}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1.5 font-bold px-3 py-1 bg-accent/30 border-none">
                                <User className="h-3 w-3" /> Individual
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1.5 font-bold px-3 py-1 border-none bg-orange-500/10 text-orange-500">
                                <Clock className="h-3 w-3" /> Due Soon
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-6 min-w-[120px]">
                            <Link href={`/student/courses/${courseId}/submit/${assignment.id}`} className="w-full">
                              <Button className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all font-bold gap-2 py-6">
                                Submit <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-12 text-center bg-accent/20 border-2 border-dashed rounded-3xl text-muted-foreground font-bold italic">
                      No pending assignments. You're all caught up!
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                  <CheckCircle className="h-4 w-4" /> Submitted
                </div>
                <div className="space-y-4">
                  {assignments && assignments.filter(a => submittedAssignmentIds.has(a.id)).length > 0 ? (
                    assignments.filter(a => submittedAssignmentIds.has(a.id)).map((assignment) => (
                      <Card key={assignment.id} className="border-border bg-accent/10 opacity-80">
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <div>
                              <div className="text-sm font-bold">{assignment.title}</div>
                              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Received</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('submissions')} className="font-bold text-xs">
                            View Feedback <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground font-medium italic border-border border rounded-2xl bg-card/30">
                      No submissions found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight">My Submissions</h1>
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <span>{mySubmissions.length} total submissions</span>
                </div>
              </div>

              {mySubmissions.length > 0 ? (
                <div className="grid gap-6">
                  {mySubmissions.map((sub) => {
                    const assignment = assignments?.find(a => a.id === sub.assignmentId);
                    return (
                      <Card key={sub.id} className="border-border bg-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                          <div>
                            <CardTitle className="text-lg font-bold">{assignment?.title || 'Unknown Assignment'}</CardTitle>
                            <CardDescription className="text-xs">Submitted on {sub.submittedAt?.toDate().toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">{sub.status || 'RECEIVED'}</Badge>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="text-sm font-medium text-muted-foreground italic line-clamp-2">
                              {sub.content.substring(0, 150)}...
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: sub.evaluation?.totalScore ? `${sub.evaluation.totalScore}%` : '0%' }} />
                              </div>
                              <span className="text-sm font-bold">{sub.evaluation?.totalScore || 0}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-card/50 border-2 border-dashed border-border rounded-[2rem] space-y-6">
                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary/40 ring-1 ring-primary/10">
                    <Inbox className="h-10 w-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">No submissions yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Your evaluations and feedback will appear here once you submit your first assignment.</p>
                  </div>
                  <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setActiveTab('assignments')}>
                    View Active Assignments
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="p-10 space-y-10 animate-in fade-in duration-500">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tighter">Course Content</h1>
                <p className="text-muted-foreground text-sm font-medium">{courseContent?.length || 0} posts shared</p>
              </div>

              <div className="max-w-4xl space-y-8 mx-auto lg:mx-0">
                {courseContent && courseContent.length > 0 ? (
                  courseContent.map((post) => (
                    <Card key={post.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow rounded-[2rem] overflow-hidden group">
                      <CardContent className="p-10 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-2xl border transition-colors",
                              post.contentType === 'announcement' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              post.contentType === 'file' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>
                              {post.contentType === 'announcement' && <Megaphone className="h-5 w-5" />}
                              {post.contentType === 'file' && <FileIcon className="h-5 w-5" />}
                              {post.contentType === 'link' && <LinkIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className={cn(
                                "text-[10px] font-bold uppercase tracking-widest mb-1",
                                post.contentType === 'announcement' ? "text-blue-500" :
                                post.contentType === 'file' ? "text-orange-500" :
                                "text-emerald-500"
                              )}>
                                {post.contentType}
                              </div>
                              <h3 className="text-xl font-bold tracking-tight">{post.title}</h3>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {post.postedAt?.toDate().toLocaleDateString('en-CA')}
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl font-medium">
                          {post.content}
                        </p>

                        {post.attachmentUrl && (
                          <div className="flex items-center gap-3">
                            <Button variant="outline" className="h-10 px-4 rounded-xl gap-2 font-bold text-xs" asChild>
                              <a href={post.attachmentUrl} download={post.fileName || 'attachment'} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" /> 
                                {post.contentType === 'file' ? (post.fileName || 'Download Resource') : 'Visit Link'}
                              </a>
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-border">
                          <div className="flex items-center gap-6">
                            <LikeButton 
                              postId={post.id} 
                              courseId={courseId as string} 
                              currentUserId={user.uid} 
                              initialLikes={post.likesCount} 
                            />
                            <button 
                              onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group/comment"
                            >
                              <MessageCircle className="h-4 w-4 group-hover/comment:fill-primary/20 transition-all" />
                              <span className="text-[10px] font-bold">Comments</span>
                            </button>
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground italic">
                            by Professor
                          </div>
                        </div>

                        {expandedPostId === post.id && (
                          <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-4">
                              <Input 
                                placeholder="Write a comment..." 
                                className="h-11 rounded-xl bg-accent/30 border-none focus-visible:ring-primary/20"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                              />
                              <Button 
                                size="icon" 
                                className="h-11 w-11 shrink-0 rounded-xl"
                                onClick={() => handleAddComment(post.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>

                            <PostComments contentId={post.id} courseId={courseId as string} currentUserId={user.uid} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-24 text-center space-y-6 bg-card/50 border-2 border-dashed border-border rounded-[3rem]">
                    <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto ring-1 ring-primary/10">
                      <Share2 className="h-10 w-10 text-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight">No content shared yet</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Resources and announcements shared by your professor will appear here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LikeButton({ postId, courseId, currentUserId, initialLikes }: { postId: string, courseId: string, currentUserId: string, initialLikes: number }) {
  const firestore = useFirestore();
  const likeRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId, 'content', postId, 'likes', currentUserId);
  }, [firestore, courseId, postId, currentUserId]);
  
  const { data: likeData } = useDoc(likeRef);
  const isLiked = !!likeData;

  const handleToggleLike = () => {
    if (!firestore || !likeRef) return;
    
    if (isLiked) {
      deleteDocumentNonBlocking(likeRef);
    } else {
      setDocumentNonBlocking(likeRef, { uid: currentUserId, createdAt: serverTimestamp() }, { merge: true });
    }
  };

  return (
    <button 
      onClick={handleToggleLike}
      className={cn(
        "flex items-center gap-2 transition-colors group/like",
        isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
      )}
    >
      <Heart className={cn("h-4 w-4 transition-all", isLiked && "fill-rose-500")} />
      <span className="text-[10px] font-bold">{initialLikes || 0}</span>
    </button>
  );
}

function PostComments({ contentId, courseId, currentUserId }: { contentId: string, courseId: string, currentUserId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'courses', courseId, 'content', contentId, 'comments'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, contentId, courseId]);

  const { data: comments } = useCollection(commentsQuery);

  const handleDeleteComment = (commentId: string) => {
    if (!firestore) return;
    const commentRef = doc(firestore, 'courses', courseId, 'content', contentId, 'comments', commentId);
    deleteDocumentNonBlocking(commentRef);
    toast({ title: "Comment deleted" });
  };

  return (
    <div className="space-y-4">
      {comments && comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {comment.authorName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="bg-accent/30 p-4 rounded-2xl rounded-tl-none flex-1 relative group/comment-item">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground">{comment.authorName}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {comment.createdAt?.toDate().toLocaleDateString()}
                </span>
                {comment.authorId === currentUserId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover/comment-item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{comment.text}</p>
          </div>
        </div>
      ))}
      {(!comments || comments.length === 0) && (
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-4">
          No comments yet. Start the conversation.
        </p>
      )}
    </div>
  );
}