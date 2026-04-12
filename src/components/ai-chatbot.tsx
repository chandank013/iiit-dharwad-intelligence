"use client";

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { academicAssistantChat } from '@/ai/flows/academic-assistant-chat';
import { useUser } from '@/firebase';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

interface AIChatbotProps {
  customContext?: string;
  placeholder?: string;
}

export function AIChatbot({ customContext, placeholder }: AIChatbotProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hello! I am your Course Content Assistant. Ask me anything about the resources uploaded here!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input };
    const currentInput = input;
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(0).map(m => ({
        role: m.role,
        content: m.content
      }));

      const isStudent = user?.email?.startsWith('24bds');
      const role = isStudent ? 'Student' : 'Professor';
      const pageTitle = typeof document !== 'undefined' ? document.title : 'IIIT Dharwad Portal';
      
      const context = `
        User Role: ${role}. 
        Current Page Path: ${pathname}. 
        Page Title: ${pageTitle}.
        Specific Course/Content Context: ${customContext || 'No additional resource context provided.'}
      `;

      const { response } = await academicAssistantChat({
        query: currentInput,
        history: history,
        pageContext: context
      });

      setMessages(prev => [...prev, {
        role: 'model',
        content: response
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-all bg-primary flex items-center justify-center p-0"
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-primary text-primary-foreground rounded-t-lg shrink-0 border-none">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bot className="h-4 w-4" /> Content Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden bg-background/50">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed",
                      m.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card text-foreground rounded-tl-none border border-border"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card text-foreground rounded-2xl rounded-tl-none border border-border px-4 py-2.5 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-1" />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t border-border bg-card shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full gap-2">
              <Input
                placeholder={placeholder || "Ask about this content..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-10 shadow-inner rounded-xl border-border bg-background"
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
          
          <div className="bg-muted/50 px-4 py-2 text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1.5 rounded-b-lg shrink-0 border-t border-border">
            <Sparkles className="h-3 w-3 text-primary" /> Resource Context Active
          </div>
        </Card>
      )}
    </div>
  );
}
