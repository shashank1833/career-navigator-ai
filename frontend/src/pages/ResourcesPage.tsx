import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, ExternalLink, Star, GraduationCap, Monitor, Users,
  Zap, Globe, Award, Search, X, Brain
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const RESOURCES = [
  {
    category: "Online Platforms",
    icon: Monitor,
    color: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    items: [
      { name: "freeCodeCamp", desc: "Free coding bootcamp with certifications", url: "https://freecodecamp.org", tags: ["Free", "Coding"] },
      { name: "Coursera", desc: "University courses and professional certificates", url: "https://coursera.org", tags: ["Paid", "Certificates"] },
      { name: "Udemy", desc: "Affordable courses on any tech topic", url: "https://udemy.com", tags: ["Paid", "Wide Range"] },
      { name: "edX", desc: "Harvard, MIT courses for career advancement", url: "https://edx.org", tags: ["Free/Paid", "University"] },
    ],
  },
  {
    category: "Coding Practice",
    icon: Zap,
    color: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    items: [
      { name: "LeetCode", desc: "Algorithm challenges for tech interviews", url: "https://leetcode.com", tags: ["Free/Paid", "Interviews"] },
      { name: "HackerRank", desc: "Coding challenges and skill verification", url: "https://hackerrank.com", tags: ["Free", "Skills"] },
      { name: "Codewars", desc: "Gamified coding kata challenges", url: "https://codewars.com", tags: ["Free", "Gamified"] },
      { name: "Exercism", desc: "Mentor-guided coding exercises in 50+ languages", url: "https://exercism.org", tags: ["Free", "Mentoring"] },
    ],
  },
  {
    category: "Career & Networking",
    icon: Users,
    color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    items: [
      { name: "LinkedIn Learning", desc: "Professional development and soft skills", url: "https://linkedin.com/learning", tags: ["Paid", "Business"] },
      { name: "Glassdoor", desc: "Company reviews, salaries, and interview prep", url: "https://glassdoor.com", tags: ["Free", "Research"] },
      { name: "Blind", desc: "Anonymous professional networking community", url: "https://teamblind.com", tags: ["Free", "Community"] },
      { name: "Levels.fyi", desc: "Compensation data across tech companies", url: "https://levels.fyi", tags: ["Free", "Salary"] },
    ],
  },
  {
    category: "AI & Data Science",
    icon: Brain,
    color: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    items: [
      { name: "Kaggle", desc: "Data science competitions and datasets", url: "https://kaggle.com", tags: ["Free", "Competitions"] },
      { name: "Fast.ai", desc: "Practical deep learning for coders", url: "https://fast.ai", tags: ["Free", "Deep Learning"] },
      { name: "Google AI", desc: "Google's AI education and research resources", url: "https://ai.google/education", tags: ["Free", "Google"] },
      { name: "Papers with Code", desc: "ML research papers with implementations", url: "https://paperswithcode.com", tags: ["Free", "Research"] },
    ],
  },
  {
    category: "Certifications",
    icon: Award,
    color: "from-pink-500/20 to-pink-600/5 border-pink-500/20",
    items: [
      { name: "AWS Certifications", desc: "Cloud computing certifications by Amazon", url: "https://aws.amazon.com/certification", tags: ["Paid", "Cloud"] },
      { name: "Google Cloud Certs", desc: "GCP professional certifications", url: "https://cloud.google.com/certification", tags: ["Paid", "Cloud"] },
      { name: "CompTIA", desc: "IT fundamentals and security certifications", url: "https://comptia.org", tags: ["Paid", "IT"] },
      { name: "Scrum.org", desc: "Agile and Scrum certifications", url: "https://scrum.org", tags: ["Paid", "Agile"] },
    ],
  },
];

const ResourcesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = RESOURCES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Learning Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-3">
            Learning <span className="gradient-text">Resources</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Curated collection of the best platforms, tools, and certifications to accelerate your career.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card/50 border-border/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Resource Categories */}
        <div className="space-y-10">
          {filtered.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <cat.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{cat.category}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cat.items.map((item, ii) => (
                  <motion.a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ci * 0.1 + ii * 0.05 }}
                    whileHover={{ y: -4 }}
                    className={`p-5 rounded-xl bg-gradient-to-br ${cat.color} border transition-all group block`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] bg-background/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No resources found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term</p>
          </motion.div>
        )}

        {/* AI CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 text-center">
            <Brain className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Need Personalized Recommendations?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Sign in to get AI-powered career and learning recommendations tailored to your skills.
            </p>
            <Button onClick={() => navigate("/auth")} className="gap-2 rounded-xl">
              <Zap className="w-4 h-4" /> Get AI Recommendations
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResourcesPage;
