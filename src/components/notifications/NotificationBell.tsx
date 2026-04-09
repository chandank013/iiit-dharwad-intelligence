
"use client";

import { useState, useMemo } from 'react';
import { 
  Bell, 
  Trash2, 
  Loader2, 
  Clock, 
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [firestore, user?.uid]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.read).length || 0;
  }, [notifications]);

  const handleMarkAsRead = async (id: string) => {
    if (!firestore || !user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', id);
    await updateDoc(notifRef, { read: true });
  };

  const handleMarkAllRead = async () => {
    if (!firestore || !user || !notifications) return;
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => 
      updateDoc(doc(firestore, 'users', user.uid, 'notifications', n.id), { read: true })
    );
    await Promise.all(promises);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', id));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-accent group">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-2xl shadow-2xl border-border overflow-hidden">
        <DropdownMenuLabel className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && <Badge variant="secondary" className="text-[10px] h-5">{unreadCount} New</Badge>}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-bold text-primary p-0 hover:bg-transparent"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Checking alerts...</span>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <Link 
                  key={notif.id} 
                  href={notif.link || '#'}
                  onClick={() => {
                    if (!notif.read) handleMarkAsRead(notif.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors group relative",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5 border",
                    notif.type === 'submission' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    notif.type === 'deadline' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                    "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  )}>
                    {notif.type === 'submission' ? <CheckCircle2 className="h-4 w-4" /> :
                     notif.type === 'deadline' ? <Clock className="h-4 w-4" /> :
                     <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn("text-xs font-bold truncate", notif.read ? "text-foreground/70" : "text-foreground")}>
                        {notif.title}
                      </p>
                      {!notif.read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-2 tracking-tight">
                      {notif.createdAt?.seconds 
                        ? formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true }) 
                        : 'Just now'}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 p-8 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <h4 className="text-sm font-bold">All caught up</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">System alerts and academic reminders will appear here.</p>
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-3 bg-muted/10 text-center">
          <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
            Activity Archive
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
