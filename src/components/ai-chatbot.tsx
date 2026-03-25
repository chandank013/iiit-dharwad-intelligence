"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your IIITDWD Academic Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I'm currently processing your request. I can help with assignment deadlines, rubric explanations, or study resources. Please specify which course you're asking about!"
      }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl hover:scale-105 transition-all bg-primary"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bot className="h-4 w-4" /> AI Academic Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/10 text-white">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full gap-2">
              <Input
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 h-9"
              />
              <Button type="submit" size="icon" className="h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
          <div className="bg-accent px-4 py-2 text-[10px] text-accent-foreground font-medium flex items-center justify-center gap-1.5 rounded-b-lg">
            <Sparkles className="h-3 w-3" /> Data-aware & Contextual Assistance Active
          </div>
        </Card>
      )}
    </div>
  );
}