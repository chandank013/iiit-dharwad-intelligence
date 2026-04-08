
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
  collectionGroup,
  increment
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  BookOpen, 
  ChevronLeft, 
  Clock, 
  TrendingUp, 
  Loader2, 
  FolderOpen,
  ChevronRight,
  ArrowRight,
  Megaphone,
  File as FileIcon,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  FileArchive,
  AlertTriangle,
  Download,
  FileText,
  CheckCircle2,
  ExternalLink
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
  setDocumentNonBlocking,
  updateDocumentNonBlocking
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

  // Check if user is Chandan to hide specific data
  const isChandan = user?.displayName?.toLowerCase().includes('chandan') || user?.email?.toLowerCase().includes('chandan');

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
    if (isChandan) return []; // Filter out data for Chandan as requested
    return rawSubmissions.filter(s => s.courseId === courseId);
  }, [rawSubmissions, courseId, isChandan]);

  const submittedAssignmentIds = useMemo(() => {
    return new Set(mySubmissions.map(s => s.assignmentId));
  }, [mySubmissions]);

  const handleViewContent = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } catch (err) {
        toast({ title: "View Error", description: "Could not open document.", variant: "destructive" });
      }
    } else {
      window.open(url, '_blank');
    }
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
    { id: 'submissions', label: 'My Submissions', icon: FileText },
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
          <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{activeTab}</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <CardTitle className="text-sm font-bold text-foreground">Work List</CardTitle>
                    <button onClick={() => setActiveTab('assignments')} className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase">
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {assignments && assignments.length > 0 ? (
                        assignments.slice(0, 3).map((task, i) => {
                          const isSubmitted = submittedAssignmentIds.has(task.id);
                          const deadlinePassed = task.deadline && new Date() > new Date(task.deadline);
                          return (
                            <div key={i} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => router.push(`/student/courses/${courseId}/submit/${task.id}`)}>
                              <div className="space-y-1">
                                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                  {task.title}
                                  {isSubmitted ? (
                                    <Badge variant="outline" className="text-[8px] h-4 font-bold bg-emerald-50 text-emerald-600 border-emerald-100 uppercase">Done</Badge>
                                  ) : deadlinePassed ? (
                                    <Badge variant="destructive" className="text-[8px] h-4 font-bold uppercase">Missing</Badge>
                                  ) : null}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</div>
                              </div>
                              <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                                 <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center text-xs text-muted-foreground italic">No tasks available.</div>
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
                    const deadlinePassed = assignment.deadline && new Date() > new Date(assignment.deadline);
                    return (
                      <Card key={assignment.id} className={cn("border-border overflow-hidden", (isSubmitted || deadlinePassed) && "opacity-60")}>
                        <CardContent className="p-8 flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold">{assignment.title}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              <span className={cn("flex items-center gap-1.5", deadlinePassed ? "text-rose-500" : "text-orange-500")}>
                                <Clock className="h-3.5 w-3.5" /> {deadlinePassed ? 'Missed' : 'Due'}: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          {!isSubmitted && !deadlinePassed && (
                            <Link href={`/student/courses/${courseId}/submit/${assignment.id}`}>
                              <Button className="rounded-xl font-bold gap-2">
                                Start Work <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {deadlinePassed && !isSubmitted && (
                            <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-4 py-2">
                              DEADLINE CROSSED
                            </Badge>
                          )}
                          {isSubmitted && (
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-4 py-2 gap-2">
                               <CheckCircle2 className="h-4 w-4" /> SUBMITTED
                             </Badge>
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
              <div className="grid gap-6">
                {mySubmissions.length > 0 ? (
                  mySubmissions.map((sub) => (
                    <Card key={sub.id} className="border-border overflow-hidden group hover:border-primary/20 transition-all">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{sub.assignmentTitle}</h3>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" /> Submitted on {sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() : 'Just now'}
                            </div>
                          </div>
                          {sub.status === 'graded' ? (
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">{sub.evaluation?.totalScore}%</div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">AI Evaluated</div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-bold uppercase text-[9px]">Awaiting Grade</Badge>
                          )}
                        </div>

                        {sub.status === 'graded' && sub.evaluation?.writtenFeedback && (
                          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5" /> AI Personalized Feedback
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{sub.evaluation.writtenFeedback}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-border flex justify-between items-center">
                           <button className="text-xs font-bold text-primary flex items-center gap-2 hover:underline">
                             <ExternalLink className="h-3.5 w-3.5" /> View Submission
                           </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-card">
                    <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto mb-4">
                      <FileText className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-bold">No submissions found</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                      {isChandan ? "Submissions for this account are restricted from viewing." : "You haven't submitted any work for this course yet."}
                    </p>
                    <Button onClick={() => setActiveTab('assignments')} variant="outline" className="font-bold">Browse Assignments</Button>
                  </div>
                )}
              </div>
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
                              {post.contentType === 'link' ? <LinkIcon className="h-5 w-5" /> : 
                               post.contentType === 'zip' ? <FileArchive className="h-5 w-5" /> :
                               post.contentType === 'file' ? <FileIcon className="h-5 w-5" /> :
                               <Megaphone className="h-5 w-5" />}
                            </div>
                            <div>
                              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{post.contentType}</Badge>
                              <h3 className="text-xl font-bold">{post.title}</h3>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{post.content}</p>
                        {post.attachmentUrl && (
                          <div className="flex items-center gap-4">
                            <button onClick={() => handleViewContent(post.attachmentUrl)} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                              <LinkIcon className="h-3 w-3" /> View Content
                            </button>
                            <a href={post.attachmentUrl} download={post.title} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline">
                              <Download className="h-3 w-3" /> Download
                            </a>
                          </div>
                        )}
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
    const parentRef = doc(firestore, 'courses', courseId, 'content', postId);
    if (isLiked) {
      deleteDocumentNonBlocking(likeRef);
      updateDocumentNonBlocking(parentRef, { 
        likesCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } else {
      setDocumentNonBlocking(likeRef, { uid: currentUserId, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(parentRef, { 
        likesCount: increment(1),
        updatedAt: serverTimestamp()
      });
    }
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
              <span className="text-xs font-bold flex items-center gap-2">
                {comment.authorName}
                {comment.professorId && <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">STAFF</Badge>}
              </span>
              {comment.authorId === currentUserId && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(comment.id)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
            <p className="text-sm text-muted-foreground">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
