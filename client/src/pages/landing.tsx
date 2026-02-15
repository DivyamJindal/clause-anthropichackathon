import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, FileText, Scale, Send, Handshake, Gavel, Check, Clock, Users, TrendingDown, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";
import { LogoMark } from "@/components/logo";

const steps = [
  {
    icon: FileText,
    title: "Ramesh's \u20b93 lakh cheque bounces",
    description: "His supplier's cheque is returned by the bank. Ramesh doesn't know his rights or where to start.",
    label: "Day 1",
    color: "text-red-500 dark:text-red-400",
  },
  {
    icon: Brain,
    title: "CLAUSE analyzes his rights",
    description: "AI identifies Section 138 NI Act, calculates the 30-day notice deadline, and explains his legal position with full reasoning transparency.",
    label: "Day 1",
    color: "text-blue-500 dark:text-blue-400",
  },
  {
    icon: Send,
    title: "Legal notice drafted & sent",
    description: "CLAUSE generates a formal demand notice under Section 138. Ramesh sends it. The 15-day payment window begins.",
    label: "Day 2",
    color: "text-amber-500 dark:text-amber-400",
  },
  {
    icon: Handshake,
    title: "Settlement proposed",
    description: "CLAUSE proposes fair compensation based on legal precedents. The supplier refuses to pay.",
    label: "Day 17",
    color: "text-purple-500 dark:text-purple-400",
  },
  {
    icon: Gavel,
    title: "Case enters court",
    description: "Complaint filed under S.138. CLAUSE Bench prepares the magistrate's brief with precedent analysis and risk assessment.",
    label: "Day 18",
    color: "text-primary",
  },
  {
    icon: Check,
    title: "Resolved in 2 weeks",
    description: "What would have taken 18 months is done. The AI law clerk prepared everything \u2014 the judge decided.",
    label: "Day 30",
    color: "text-green-500 dark:text-green-400",
  },
];

const impactStats = [
  { value: "5 Cr+", label: "Cases Pending", icon: FileText, description: "in Indian courts" },
  { value: "21", label: "Judges per Million", icon: Users, description: "vs 50+ in developed nations" },
  { value: "18 mo", label: "Average Resolution", icon: Clock, description: "for a simple cheque bounce" },
  { value: "2 wk", label: "With CLAUSE", icon: Zap, description: "same case, AI-accelerated" },
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const numMatch = target.match(/^(\d+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            const rest = target.slice(numMatch[1].length);
            let current = 0;
            const increment = Math.max(1, Math.floor(num / 30));
            const interval = setInterval(() => {
              current += increment;
              if (current >= num) {
                current = num;
                clearInterval(interval);
              }
              setDisplay(`${current}${rest}`);
            }, 40);
          }
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export default function Landing() {
  return (
    <div className="flex flex-col min-h-full relative">
      <SEO
        title="CLAUSE - AI Dispute Resolution for India's Cheque Bounce Crisis"
        description="From cheque bounce to court order in days, not years. AI-powered dispute resolution that walks you through the legal process, generates notices, proposes settlement, and prepares court briefs."
      />

      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="gradient-orb w-[600px] h-[600px] -top-[200px] -right-[200px] bg-primary" style={{position:'absolute'}} />
        <div className="gradient-orb w-[400px] h-[400px] top-[40%] -left-[100px] bg-chart-4" style={{position:'absolute'}} />
        <div className="gradient-orb w-[500px] h-[500px] bottom-[10%] right-[10%] bg-chart-2" style={{position:'absolute'}} />
      </div>

      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center px-6 py-16 md:py-24">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-ring" />
              <div className="relative glass rounded-full p-3">
                <LogoMark className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Badge variant="outline" className="text-xs tracking-wider" data-testid="badge-tagline">
              Built with Claude's Extended Thinking
            </Badge>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground"
              data-testid="text-heading"
            >
              What if every day was a{" "}
              <span className="bg-gradient-to-r from-primary via-chart-3 to-primary bg-clip-text text-transparent animate-gradient">
                National Lok Adalat?
              </span>
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-subtitle"
            >
              AI-powered dispute resolution for India. From cheque bounce to court order in days, not years.
              <span className="block mt-1 text-base">The AI prepares. The judge decides.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/resolve">
              <Button data-testid="button-resolve" size="lg" className="gap-2">
                I have a dispute
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/bench">
              <Button data-testid="button-bench" variant="outline" size="lg" className="gap-2">
                Judge's Bench
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="max-w-4xl w-full mt-20 md:mt-28" data-testid="section-impact">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center mb-8" data-testid="text-impact-label">
            The scale of the problem
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="glass p-5 text-center space-y-2 rounded-md" data-testid={`card-stat-${i}`}>
                  <Icon className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight" data-testid={`text-stat-value-${i}`}>
                    <AnimatedCounter target={stat.value} />
                  </p>
                  <p className="text-xs font-medium text-foreground" data-testid={`text-stat-label-${i}`}>{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground" data-testid={`text-stat-desc-${i}`}>{stat.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Before / After Comparison */}
        <div className="max-w-4xl w-full mt-20 md:mt-28" data-testid="section-comparison">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center mb-8" data-testid="text-comparison-label">
            Traditional vs CLAUSE
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 space-y-4 border-destructive/20 rounded-md" data-testid="card-traditional">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <p className="text-sm font-semibold text-foreground">Without CLAUSE</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Time to resolve", value: "18 months" },
                  { label: "Lawyer fees", value: "\u20b950,000+" },
                  { label: "Court visits", value: "47 hearings" },
                  { label: "Legal awareness", value: "Zero guidance" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm" data-testid={`row-traditional-${i}`}>
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-destructive">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass p-6 space-y-4 border-primary/20 rounded-md" data-testid="card-clause">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">With CLAUSE</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Time to resolve", value: "2 weeks" },
                  { label: "Cost", value: "\u20b90" },
                  { label: "Court visits", value: "0 before resolution" },
                  { label: "Legal awareness", value: "Full AI guidance" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm" data-testid={`row-clause-${i}`}>
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Ramesh's Story Timeline */}
        <div className="max-w-3xl w-full mt-20 md:mt-28">
          <p
            className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center mb-12"
            data-testid="text-story-label"
          >
            Ramesh's story
          </p>

          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            <div className="space-y-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative flex gap-5 items-start group"
                    data-testid={`step-${index + 1}`}
                  >
                    <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full glass-strong flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${step.color}`} />
                    </div>

                    <div className="pt-1 pb-2 space-y-1.5 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-medium text-foreground">
                          {step.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {step.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-footer">
            54 million pending cases. 21 judges per million people. CLAUSE attacks the backlog from both sides.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Built with Claude Extended Thinking &middot; Anthropic Hackathon 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
