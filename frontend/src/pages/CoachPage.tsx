import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Plus, ChevronRight, Loader2, MessageSquare, User, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Session {
  session_id: string;
  user_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const CoachPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [roadmapProgress, setRoadmapProgress] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchSessions = useCallback(async () => {
    if (!user?.user_id) return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API}/coach/sessions/${user.user_id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) { console.error(e); }
    setLoadingSessions(false);
  }, [user?.user_id]);

  useEffect(() => {
    fetchSessions();
    // Fetch roadmap progress
    if (user?.user_id) {
      fetch(`${API}/user-progress/${user.user_id}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => setRoadmapProgress(Array.isArray(data) ? data.filter((p: any) => p.completed).length : 0))
        .catch(() => {});
    }
  }, [fetchSessions, user?.user_id]);

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API}/coach/session/${sessionId}/history`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(sessionId);
        setMessages(data.messages || []);
      }
    } catch (e) { console.error(e); }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !user?.user_id) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    const userMessage: Message = {
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch(`${API}/coach/message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          session_id: currentSessionId || undefined,
          message: userMsg,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!currentSessionId) {
          setCurrentSessionId(data.session_id);
        }
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSessionPreview = (session: Session) => {
    const lastMsg = session.messages?.[session.messages.length - 1];
    return lastMsg?.content?.slice(0, 60) + "..." || "New conversation";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-80px)] flex gap-4">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col gap-3">
        <Button onClick={startNewSession} className="w-full gap-2" size="sm">
          <Plus className="w-4 h-4" /> New Session
        </Button>

        {/* Context Panel */}
        <div className="flat-card p-3">
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Context
            </span>
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showContext && "rotate-90")} />
          </button>
          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 text-xs text-muted-foreground"
              >
                <div className="flex justify-between">
                  <span>Roadmap Steps</span>
                  <span className="text-primary font-medium">{roadmapProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logged in as</span>
                  <span className="text-foreground truncate max-w-[100px]">{user?.name || user?.email}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Session List */}
        <div className="flat-card flex-1 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">Past Sessions</p>
          </div>
          {loadingSessions ? (
            <div className="p-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">No sessions yet</div>
          ) : (
            <div className="divide-y divide-border/50">
              {sessions.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => loadSession(s.session_id)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/20 transition-colors",
                    currentSessionId === s.session_id && "bg-primary/10 border-l-2 border-primary"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                        {getSessionPreview(s)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(s.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col flat-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">CareerNav Coach</h2>
            <p className="text-xs text-muted-foreground">AI-powered career advisor with memory</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Start a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about your career — skill gaps, job strategies, interview prep, or next steps.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                {[
                  "What skills should I focus on next?",
                  "How do I transition to a new role?",
                  "Review my career progress",
                  "Interview tips for tech roles",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/40 text-foreground rounded-bl-md border border-border/50"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={cn("text-[10px] mt-1 opacity-60", msg.role === "user" ? "text-right" : "")}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted/40 rounded-2xl rounded-bl-md px-4 py-3 border border-border/50">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach anything... (Enter to send)"
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              size="icon"
              className="h-11 w-11 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachPage;
