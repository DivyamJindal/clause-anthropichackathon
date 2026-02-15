import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Scale, FileText, Briefcase, Brain, Shield, Clock, Zap, ChevronRight, Sparkles, Eye, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/seo";
import { LogoMark } from "@/components/logo";
import { motion, useInView } from "framer-motion";

const categories = [
  { label: "Cheque Bounce", icon: FileText },
  { label: "Property", icon: Scale },
  { label: "Employment", icon: Briefcase },
];

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return { ref, isInView };
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const totalSteps = 40;
    const increment = value / totalSteps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / totalSteps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

const intelligenceCards = [
  {
    icon: Brain,
    label: "Legal Analysis",
    detail: "Section 138 NI Act identified",
    color: "text-orange-400",
    delay: 0,
  },
  {
    icon: Clock,
    label: "Deadline Alert",
    detail: "23 days left for demand notice",
    color: "text-amber-400",
    delay: 0.8,
  },
  {
    icon: Shield,
    label: "Risk Assessment",
    detail: "Strong case - 87% success rate",
    color: "text-emerald-400",
    delay: 1.6,
  },
  {
    icon: Zap,
    label: "Auto-Draft",
    detail: "Legal notice generated",
    color: "text-blue-400",
    delay: 2.4,
  },
];

const storySteps = [
  {
    day: "Day 1",
    title: "Cheque bounces",
    problem: "Ramesh receives a ₹3 lakh cheque that bounces. He doesn't know his rights or what to do next.",
    solution: "CLAUSE instantly classifies the dispute under Section 138 NI Act and calculates the 30-day notice deadline.",
    icon: FileText,
    tag: "Problem",
  },
  {
    day: "Day 2",
    title: "Legal notice drafted",
    problem: "Without CLAUSE: Ramesh spends weeks finding a lawyer, pays ₹15,000 just for a consultation.",
    solution: "AI drafts a formal demand notice with all legal requirements. Sent same day. The 15-day payment window begins.",
    icon: BookOpen,
    tag: "AI Action",
  },
  {
    day: "Day 17",
    title: "Settlement proposed",
    problem: "Traditional path: Case sits in a queue. No settlement attempt. Months pass with no progress.",
    solution: "CLAUSE proposes fair compensation based on precedents like Meters & Instruments v. Kanchan Mehta. Supplier receives structured offer.",
    icon: Users,
    tag: "Resolution",
  },
  {
    day: "Day 18",
    title: "Case enters court",
    problem: "Traditional courts: 18+ months backlog. Judge has 50 cases to review that day. No brief preparation.",
    solution: "CLAUSE Bench prepares the magistrate's full brief with precedent analysis, risk assessment, and draft order. Ready in 2 minutes.",
    icon: Scale,
    tag: "Escalation",
  },
  {
    day: "2 Weeks",
    title: "Resolved",
    problem: "Average resolution: 18 months. ₹2-5 lakh in legal fees. Emotional toll on all parties.",
    solution: "Same case, resolved in 2 weeks. AI prepared everything — the judge decided. Fair outcome for everyone.",
    icon: Shield,
    tag: "Outcome",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (query.trim()) {
      navigate("/resolve");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hero = useScrollReveal(0.1);
  const intel = useScrollReveal(0.1);
  const stats = useScrollReveal(0.15);
  const story = useScrollReveal(0.1);
  const cta = useScrollReveal(0.2);

  return (
    <div ref={containerRef} className="flex flex-col min-h-full scroll-smooth">
      <SEO
        title="CLAUSE - AI Legal Resolution for India"
        description="From cheque bounce to court order in days, not years. AI-powered dispute resolution built with Claude's Extended Thinking."
      />

      <div className="bg-[hsl(75,15%,8%)] text-[hsl(40,15%,90%)] relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 hero-gradient" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 rounded-full bg-primary/30 animate-orbit" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-amber-400/20 animate-orbit-reverse" />
          </div>
          <div className="absolute top-[15%] right-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-[20%] left-[5%] w-48 h-48 rounded-full bg-amber-500/5 blur-3xl animate-float-delayed" />
        </div>

        <div ref={hero.ref} className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={hero.isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-6">
                <Badge
                  variant="outline"
                  className="text-[11px] tracking-wider border-[hsl(40,15%,25%)] text-[hsl(40,15%,70%)] no-default-hover-elevate no-default-active-elevate"
                  data-testid="badge-tagline"
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Built with Claude's Extended Thinking
                </Badge>

                <h1
                  className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-normal leading-[1.12] tracking-tight"
                  data-testid="text-heading"
                >
                  Justice should be
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(15,80%,55%)] to-[hsl(30,80%,60%)]">
                    fast, fair, and
                  </span>
                  <br />
                  accessible
                </h1>

                <p
                  className="text-lg text-[hsl(40,15%,65%)] leading-relaxed max-w-lg"
                  data-testid="text-subtitle"
                >
                  54 million cases pending. 21 judges per million people.
                  CLAUSE resolves cheque bounce disputes in 2 weeks instead of 18 months.
                </p>
              </div>

              <div className="max-w-lg">
                <div className="glass-dark rounded-xl px-4 py-3 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Describe your legal dispute..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-sm text-[hsl(40,15%,90%)] placeholder:text-[hsl(40,10%,40%)] outline-none"
                    data-testid="input-hero-query"
                  />
                  <Button
                    onClick={handleSubmit}
                    className="bg-[hsl(15,80%,55%)] border-[hsl(15,80%,45%)] text-white rounded-lg px-5 text-sm font-medium shrink-0"
                    data-testid="button-resolve"
                  >
                    Ask CLAUSE
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Badge
                        key={cat.label}
                        variant="outline"
                        className="text-[11px] border-[hsl(70,8%,22%)] text-[hsl(40,15%,65%)] gap-1.5 cursor-pointer no-default-hover-elevate no-default-active-elevate"
                        data-testid={`pill-${cat.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Icon className="w-3 h-3" />
                        {cat.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="hidden lg:block relative"
              initial={{ opacity: 0, x: 40 }}
              animate={hero.isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative w-full max-w-md mx-auto">
                <div className="glass-dark rounded-2xl p-6 space-y-4 animate-glow-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <LogoMark className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium text-[hsl(40,15%,80%)]">CLAUSE Analysis</span>
                    <div className="ml-auto flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot" />
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="glass-dark rounded-lg px-3 py-2.5">
                      <p className="text-[hsl(40,15%,60%)] text-xs mb-1">Case Type</p>
                      <p className="text-[hsl(40,15%,85%)] font-medium">S.138 NI Act — Cheque Dishonour</p>
                    </div>
                    <div className="glass-dark rounded-lg px-3 py-2.5">
                      <p className="text-[hsl(40,15%,60%)] text-xs mb-1">Deadline</p>
                      <p className="text-amber-400 font-medium">23 days remaining for demand notice</p>
                    </div>
                    <div className="glass-dark rounded-lg px-3 py-2.5">
                      <p className="text-[hsl(40,15%,60%)] text-xs mb-1">Recommendation</p>
                      <p className="text-emerald-400 font-medium">Send legal notice immediately</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Eye className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-[11px] text-[hsl(40,15%,50%)]">Extended Thinking active — analyzing 12 precedents</span>
                  </div>
                </div>

                <motion.div
                  className="absolute -top-4 -right-4 glass-dark rounded-xl px-3 py-2 flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={hero.isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-[hsl(40,15%,80%)]">87% success rate</span>
                </motion.div>

                <motion.div
                  className="absolute -bottom-3 -left-4 glass-dark rounded-xl px-3 py-2 flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={hero.isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.3, duration: 0.5 }}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-[hsl(40,15%,80%)]">2 min brief generation</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div ref={intel.ref} className="bg-background py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={intel.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3" data-testid="text-intel-label">
              Real-Time Intelligence
            </p>
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              AI that thinks like a lawyer
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Claude's extended thinking analyzes your dispute in real-time, identifying applicable laws, calculating deadlines, and drafting documents — all in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {intelligenceCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 40 }}
                  animate={intel.isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <Card className="glass-strong rounded-xl p-5 space-y-3 h-full" data-testid={`card-intel-${i}`}>
                    <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.detail}</p>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary/30"
                        initial={{ width: 0 }}
                        animate={intel.isInView ? { width: "100%" } : {}}
                        transition={{ duration: 1.5, delay: i * 0.15 + 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="mt-12 glass-strong rounded-xl p-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={intel.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-medium text-primary">Extended Thinking</p>
                  <Badge variant="outline" className="text-[10px] no-default-hover-elevate no-default-active-elevate">Live</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "Analyzing under Section 138 of the Negotiable Instruments Act... The payee must send a demand notice within 30 days of receiving the bank return memo. Given the cheque date of February 1st, the deadline is March 3rd. Reviewing precedent from Meters & Instruments v. Kanchan Mehta — this court held the remedy is compensatory, not punitive..."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div ref={stats.ref} className="bg-[hsl(75,15%,8%)] text-[hsl(40,15%,90%)] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-30" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.p
            className="text-xs font-medium text-primary uppercase tracking-widest mb-12 text-center"
            initial={{ opacity: 0 }}
            animate={stats.isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            data-testid="text-impact-label"
          >
            The scale of the problem
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: 54, suffix: "M+", label: "Cases Pending", desc: "in Indian courts", icon: Scale },
              { value: 21, suffix: "", label: "Judges per Million", desc: "vs 50+ in developed nations", icon: Users },
              { value: 18, suffix: " mo", label: "Average Resolution", desc: "for a simple cheque bounce", icon: Clock },
              { value: 2, suffix: " wk", label: "With CLAUSE", desc: "same case, AI-accelerated", icon: Zap },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  className="glass-dark rounded-xl p-5 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={stats.isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  data-testid={`card-stat-${i}`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-3 ${i === 3 ? "text-emerald-400" : "text-primary/60"}`} />
                  <p className={`text-3xl md:text-4xl font-serif font-normal tracking-tight ${i === 3 ? "text-emerald-400" : "text-[hsl(40,15%,90%)]"}`} data-testid={`text-stat-value-${i}`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm font-medium text-[hsl(40,15%,80%)] mt-2" data-testid={`text-stat-label-${i}`}>{stat.label}</p>
                  <p className="text-xs text-[hsl(40,15%,50%)] mt-0.5" data-testid={`text-stat-desc-${i}`}>{stat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={story.ref} className="bg-background py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={story.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3" data-testid="text-story-label">
              Ramesh's Story
            </p>
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              From dispute to resolution
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Follow a real cheque bounce case through the CLAUSE platform. See how AI transforms an 18-month ordeal into a 2-week resolution.
            </p>
          </motion.div>

          <div className="space-y-6">
            {storySteps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === storySteps.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  animate={story.isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: i * 0.15 }}
                  data-testid={`story-step-${i}`}
                >
                  <Card className={`glass-strong rounded-xl overflow-hidden ${isLast ? "border-primary/20" : ""}`}>
                    <div className="p-5 md:p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isLast ? "bg-emerald-500/10" : "bg-muted/50"}`}>
                          <Icon className={`w-5 h-5 ${isLast ? "text-emerald-500" : "text-primary/70"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{step.day}</span>
                            <Badge
                              variant={isLast ? "default" : "outline"}
                              className={`text-[10px] no-default-hover-elevate no-default-active-elevate ${isLast ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : ""}`}
                            >
                              {step.tag}
                            </Badge>
                          </div>
                          <h3 className="text-base font-medium text-foreground mb-3">{step.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-destructive/5 border border-destructive/10 px-4 py-3">
                              <p className="text-[10px] font-medium text-destructive uppercase tracking-wider mb-1">Without CLAUSE</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{step.problem}</p>
                            </div>
                            <div className={`rounded-lg border px-4 py-3 ${isLast ? "bg-emerald-500/5 border-emerald-500/10" : "bg-primary/5 border-primary/10"}`}>
                              <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isLast ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>With CLAUSE</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{step.solution}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={story.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="glass-strong rounded-xl inline-flex items-center gap-3 px-6 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-serif text-muted-foreground line-through">18 months</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-serif text-emerald-500 dark:text-emerald-400 font-medium">2 weeks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-background py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              Four steps to resolution
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Describe your dispute", desc: "Tell CLAUSE what happened in plain language. Upload cheques, notices, or any documents.", icon: FileText },
              { num: "02", title: "AI analyzes your rights", desc: "Claude identifies applicable laws, calculates deadlines, and assesses your legal position.", icon: Brain },
              { num: "03", title: "Get legal documents", desc: "Demand notices, settlement proposals, and court briefs — drafted in seconds.", icon: BookOpen },
              { num: "04", title: "Resolve or escalate", desc: "Settle early or file in court with AI-prepared briefs for the judge.", icon: Scale },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="glass-strong rounded-xl p-5 h-full" data-testid={`step-${i + 1}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{step.num}</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={cta.ref} className="bg-[hsl(75,15%,8%)] text-[hsl(40,15%,90%)] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-50" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={cta.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <LogoMark className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-2xl md:text-3xl font-serif">
              What if every day was a
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(15,80%,55%)] to-[hsl(30,80%,60%)]">
                National Lok Adalat?
              </span>
            </h2>
            <p className="text-[hsl(40,15%,60%)] text-sm max-w-md mx-auto leading-relaxed">
              54 million pending cases. 21 judges per million people.
              Start resolving disputes today.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <Link href="/resolve">
                <Button
                  className="bg-[hsl(15,80%,55%)] border-[hsl(15,80%,45%)] text-white px-6 gap-2"
                  data-testid="button-resolve-bottom"
                >
                  I have a dispute
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/bench">
                <Button
                  variant="outline"
                  className="border-[hsl(70,8%,22%)] text-[hsl(40,15%,80%)] gap-2"
                  data-testid="button-bench"
                >
                  Judge's Bench
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-[10px] text-[hsl(40,10%,35%)] pt-4" data-testid="text-footer">
              Built with Claude Extended Thinking · Anthropic Hackathon 2025
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
