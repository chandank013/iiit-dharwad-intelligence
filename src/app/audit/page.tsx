
"use client";

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  limit
} from 'firebase/firestore';
import { Activity, Clock, User, ShieldAlert, Loader2, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AuditLogsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const auditQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);

  const { data: logs, isLoading: isLogsLoading } = useCollection(auditQuery);

  if (isUserLoading || isLogsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">System Activity Logs</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Academic integrity and system monitoring audit trail.
            </p>
          </div>

          <div className="space-y-4">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <Card key={log.id} className="border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/5 rounded-xl text-primary">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                            {log.actionType.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm font-bold text-foreground">{log.description}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Actor: {log.actorId}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-24 border-2 border-dashed rounded-[2rem] bg-card/30">
                <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto mb-4">
                  <ShieldAlert className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold">No logs found</h3>
                <p className="text-muted-foreground text-sm">System activity will appear here as professors interact with the portal.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
