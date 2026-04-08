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
  Share2,
  Undo2
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
  const { toast } = useToast();
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

  const handleUnsubmit = (submission: any) => {
    if (!firestore || !courseId) return;

    const assignment = assignments?.find(a => a.id === submission.assignmentId);
    if (assignment?.deadline && new Date() > new Date(assignment.deadline)) {
      toast({ title: "Deadline Passed", description: "You cannot unsubmit after the deadline.", variant: "destructive" });
      return;
    }

    if (submission.status === 'graded') {
      toast({ title: "Already Graded", description: "You cannot unsubmit a graded assignment.", variant: "destructive" });
      return;
    }

    const subRef = doc(firestore, 'courses', courseId as string, 'assignments', submission.assignmentId, 'submissions', submission.id);
    deleteDocumentNonBlocking(subRef);
    toast({ title: "Submission Withdrawn", description: "You can now resubmit your work." });
  };

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
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.name}</h1>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span>Hey, {user.displayName?.split(' ')[0] || 'Student'}</span>
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
                    <div className="text-2xl font-bold text-foreground">
                      {mySubmissions.filter(s => s.status === 'graded').length > 0 
                        ? `${Math.round(mySubmissions.filter(s => s.status === 'graded').reduce((acc, s) => acc + (s.evaluation?.totalScore || 0), 0) / mySubmissions.filter(s => s.status === 'graded').length)}%` 
                        : '0%'}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Score</div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-border overflow-hidden rounded-2xl">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground">Pending Work</CardTitle>
                    <button onClick={() => setActiveTab('assignments')} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {assignments && assignments.filter(a => !submittedAssignmentIds.has(a.id)).length > 0 ? (
                        assignments.filter(a => !submittedAssignmentIds.has(a.id)).slice(0, 3).map((task, i) => (
                          <div key={i} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => router.push(`/student/courses/${courseId}/submit/${task.id}`)}>
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                              <div className="text-[10px] text-muted-foreground font-medium">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                               <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">No pending work!</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-bold tracking-tight">Active Assignments</h1>
              <div className="grid gap-6">
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const isSubmitted = submittedAssignmentIds.has(assignment.id);
                    return (
                      <Card key={assignment.id} className={cn("border-border overflow-hidden", isSubmitted && "opacity-60")}>
                        <CardContent className="p-8 flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold">{assignment.title}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              <span className="flex items-center gap-1.5 text-orange-500"><Clock className="h-3.5 w-3.5" /> Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}</span>
                              {isSubmitted && <span className="flex items-center gap-1.5 text-emerald-500"><CheckCircle className="h-3.5 w-3.5" /> Submitted</span>}
                            </div>
                          </div>
                          {!isSubmitted && (
                            <Link href={`/student/courses/${courseId}/submit/${assignment.id}`}>
                              <Button className="rounded-xl font-bold gap-2">
                                Start Work <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">No assignments assigned.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
              {mySubmissions.length > 0 ? (
                <div className="grid gap-6">
                  {mySubmissions.map((sub) => {
                    const assignment = assignments?.find(a => a.id === sub.assignmentId);
                    const isGraded = sub.status === 'graded';
                    const deadlinePassed = assignment?.deadline && new Date() > new Date(assignment.deadline);

                    return (
                      <Card key={sub.id} className="border-border overflow-hidden rounded-2xl">
                        <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b p-6">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">{assignment?.title || 'Unknown Assignment'}</CardTitle>
                            <CardDescription className="text-xs font-medium">Submitted on {sub.submittedAt?.toDate().toLocaleString()}</CardDescription>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "font-bold px-3 py-1 border-none",
                              isGraded ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                            )}>
                              {isGraded ? `${sub.evaluation?.totalScore}%` : 'RECEIVED'}
                            </Badge>
                            {!isGraded && !deadlinePassed && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-2 font-bold h-8 px-3 rounded-lg"
                                onClick={() => handleUnsubmit(sub)}
                              >
                                <Undo2 className="h-3.5 w-3.5" /> Unsubmit
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {isGraded ? (
                            <div className="space-y-4">
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm leading-relaxed text-muted-foreground italic font-medium">
                                "{sub.evaluation?.writtenFeedback}"
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {sub.evaluation?.weakAreas?.map((area: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{area}</Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground font-medium italic">Your submission is awaiting evaluation by your professor.</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">No submissions yet.</div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="p-10 space-y-10 animate-in fade-in duration-500">
              <h1 className="text-3xl font-bold tracking-tighter">Resources & Feed</h1>
              <div className="max-w-4xl space-y-8">
                {courseContent && courseContent.length > 0 ? (
                  courseContent.map((post) => (
                    <Card key={post.id} className="rounded-[2rem] border-border overflow-hidden">
                      <CardContent className="p-10 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                              {post.contentType === 'announcement' ? <Megaphone className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{post.contentType}</div>
                              <h3 className="text-xl font-bold">{post.title}</h3>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{post.content}</p>
                        <div className="flex items-center justify-between pt-6 border-t border-border">
                          <LikeButton postId={post.id} courseId={courseId as string} currentUserId={user.uid} initialLikes={post.likesCount} />
                          <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" /> Comments
                          </button>
                        </div>
                        {expandedPostId === post.id && (
                          <div className="mt-6 pt-6 border-t border-border space-y-6">
                            <div className="flex gap-4">
                              <Input placeholder="Comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="rounded-xl border-none bg-accent/30" />
                              <Button size="icon" className="rounded-xl" onClick={() => handleAddComment(post.id)}><Send className="h-4 w-4" /></Button>
                            </div>
                            <PostComments contentId={post.id} courseId={courseId as string} currentUserId={user.uid} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic border-2 border-dashed rounded-3xl">No feed updates yet.</div>
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
    if (isLiked) deleteDocumentNonBlocking(likeRef);
    else setDocumentNonBlocking(likeRef, { uid: currentUserId, createdAt: serverTimestamp() }, { merge: true });
  };

  return (
    <button onClick={handleToggleLike} className={cn("flex items-center gap-2 transition-colors", isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}>
      <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500")} />
      <span className="text-[10px] font-bold">{initialLikes || 0}</span>
    </button>
  );
}

function PostComments({ contentId, courseId, currentUserId }: { contentId: string, courseId: string, currentUserId: string }) {
  const firestore = useFirestore();
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', courseId, 'content', contentId, 'comments'), orderBy('createdAt', 'desc'));
  }, [firestore, contentId, courseId]);
  const { data: comments } = useCollection(commentsQuery);

  const handleDeleteComment = (commentId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'courses', courseId, 'content', contentId, 'comments', commentId));
  };

  return (
    <div className="space-y-4">
      {comments?.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] font-bold">{comment.authorName?.[0]}</AvatarFallback></Avatar>
          <div className="bg-accent/30 p-4 rounded-2xl flex-1 relative group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold">{comment.authorName}</span>
              {comment.authorId === currentUserId && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(comment.id)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
            <p className="text-sm text-muted-foreground">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}