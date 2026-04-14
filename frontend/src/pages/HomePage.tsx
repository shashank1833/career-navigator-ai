import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Compass, ArrowRight, Sparkles, TrendingUp, Users, BookOpen,
  Code, BarChart3, Target, Brain, Shield, Cloud, Zap, ChevronRight,
  Star, Award, Rocket, GraduationCap, Briefcase, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "";

interface Career {
  id: string;
  title: string;
  domain: string;
  description: string;
  avg_salary: string;
  demand: string;
  growth_rate: string;
  skills: string[];
  icon: string;
  color: string;
  trending: boolean;
}

const ICON_MAP: Record<string, any> = {
  code: Code, "bar-chart": BarChart3, target: Target, palette: Sparkles,
  server: Cloud, brain: Brain, briefcase: Briefcase, shield: Shield,
  wrench: Target, zap: Zap, cloud: Cloud, megaphone: TrendingUp,
};

const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/50",
  purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30 hover:border-purple-400/50",
  green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-400/50",
  pink: "from-pink-500/20 to-pink-600/5 border-pink-500/30 hover:border-pink-400/50",
  orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30 hover:border-orange-400/50",
  violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30 hover:border-violet-400/50",
  teal: "from-teal-500/20 to-teal-600/5 border-teal-500/30 hover:border-teal-400/50",
  red: "from-red-500/20 to-red-600/5 border-red-500/30 hover:border-red-400/50",
  slate: "from-slate-500/20 to-slate-600/5 border-slate-500/30 hover:border-slate-400/50",
  yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 hover:border-yellow-400/50",
  cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 hover:border-cyan-400/50",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-400/50",
};

const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400", purple: "text-purple-400", green: "text-emerald-400",
  pink: "text-pink-400", orange: "text-orange-400", violet: "text-violet-400",
  teal: "text-teal-400", red: "text-red-400", slate: "text-slate-400",
  yellow: "text-yellow-400", cyan: "text-cyan-400", amber: "text-amber-400",
};

const STATS = [
  { value: "50+", label: "Career Paths", icon: Compass },
  { value: "200+", label: "Skills Tracked", icon: BookOpen },
  { value: "10K+", label: "Learners", icon: Users },
  { value: "95%", label: "Success Rate", icon: Award },
];

const FEATURES = [
  { title: "AI Career Matching", desc: "Get personalized career recommendations based on your skills and interests using AI.", icon: Brain, gradient: "from-primary to-accent" },
  { title: "Interactive Roadmaps", desc: "Follow step-by-step visual paths with progress tracking to reach your career goals.", icon: Map, gradient: "from-accent to-secondary" },
  { title: "Skill Gap Analysis", desc: "Identify missing skills and get targeted learning resources to fill the gaps.", icon: Target, gradient: "from-secondary to-primary" },
  { title: "Resume Optimization", desc: "AI-powered resume analysis and optimization tailored to your target roles.", icon: Sparkles, gradient: "from-primary to-secondary" },
  { title: "Job Matching", desc: "Discover jobs that align with your skills, experience, and career aspirations.", icon: Briefcase, gradient: "from-accent to-primary" },
  { title: "Learning Resources", desc: "Curated courses, tutorials, and certifications for every skill you need.", icon: GraduationCap, gradient: "from-secondary to-accent" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [trendingCareers, setTrendingCareers] = useState<Career[]>([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/careers?trending=true`)
      .then((r) => r.json())
      .then((data) => setTrendingCareers(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Career Navigation</span>
            </motion.div>

            <motion.h1 variants={item} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              <span className="text-foreground">Build Your </span>
              <span className="gradient-text">Career Path</span>
              <br />
              <span className="text-foreground">With Confidence</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore career paths, build skills with interactive roadmaps, and get AI-powered recommendations to accelerate your professional growth.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/explore")}
                size="lg"
                className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-primary/25"
              >
                <Compass className="w-5 h-5" />
                Explore Careers
              </Button>
              <Button
                onClick={() => navigate("/roadmaps")}
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base gap-2 rounded-xl border-border/50 hover:bg-muted/30"
              >
                <Rocket className="w-5 h-5" />
                Start Learning
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-primary/60" />
          </div>
        </motion.div>
      </section>

      {/* Trending Careers */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">Trending Now</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Hot Career Paths</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Discover the most in-demand careers with the highest growth potential in 2025.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trendingCareers.map((career, i) => {
              const IconComp = ICON_MAP[career.icon] || Compass;
              return (
                <motion.button
                  key={career.id}
                  onClick={() => navigate("/explore")}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${COLOR_MAP[career.color] || COLOR_MAP.blue} border transition-all text-left group overflow-hidden`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center ${ICON_COLOR_MAP[career.color] || "text-primary"}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/30 text-xs">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">{career.growth_rate}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1.5">{career.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{career.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{career.avg_salary}</span>
                    <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate("/explore")}
              className="gap-2 rounded-xl"
            >
              View All Careers <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Features */}
      <AnimatedSection className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
              <Star className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-medium text-secondary">Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Powerful tools designed to help you navigate your career with clarity and confidence.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl glass-card group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative p-10 sm:p-14 rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 border border-primary/20 rounded-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Start Your Journey?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Join thousands of professionals who are building their dream careers with our AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="h-12 px-8 text-base gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => navigate("/explore")}
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base gap-2 rounded-xl border-border/50 hover:bg-muted/30"
                >
                  Explore Careers
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold gradient-text">CareerNav</span>
            </div>
            <p className="text-xs text-muted-foreground">Built with AI to power your career growth</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
