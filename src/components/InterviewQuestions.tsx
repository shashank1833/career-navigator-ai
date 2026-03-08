import DashboardCard from "./DashboardCard";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const questions = {
  technical: [
    "Explain the difference between server-side rendering and client-side rendering in React.",
    "How would you design a caching layer for a high-traffic API?",
    "Describe how you'd implement a rate limiter using Redis.",
    "What are the tradeoffs between SQL and NoSQL databases?",
    "How does garbage collection work in Node.js?",
  ],
  conceptual: [
    "What is event-driven architecture and when would you use it?",
    "Explain the CAP theorem and its practical implications.",
    "How do microservices differ from a monolithic architecture?",
  ],
  behavioral: [
    "Tell me about a time you had to debug a critical production issue.",
    "How do you handle disagreements with team members on technical decisions?",
  ],
};

type Category = keyof typeof questions;

const categoryColors: Record<Category, string> = {
  technical: "bg-primary/10 text-primary border-primary/20",
  conceptual: "bg-secondary/10 text-secondary border-secondary/20",
  behavioral: "bg-accent/10 text-accent border-accent/20",
};

const InterviewQuestions = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("technical");

  return (
    <DashboardCard title="Interview Questions" icon={MessageSquare} delay={0.4} accentColor="accent" className="col-span-full lg:col-span-2">
      <div className="flex gap-2 mb-4">
        {(Object.keys(questions) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 capitalize ${
              activeCategory === cat ? categoryColors[cat] : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
            }`}
          >
            {cat} ({questions[cat].length})
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {questions[activeCategory].map((q, i) => (
          <motion.div
            key={q}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-lg bg-muted/20 border border-border/50 text-sm text-foreground/90 hover:bg-muted/30 transition-colors"
          >
            <span className="text-muted-foreground font-mono text-xs mr-2">Q{i + 1}</span>
            {q}
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};

export default InterviewQuestions;
