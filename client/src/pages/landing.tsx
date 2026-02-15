import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Scale, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo";

const categories = [
  { label: "Cheque Bounce", icon: FileText },
  { label: "Property", icon: Scale },
  { label: "Employment", icon: Briefcase },
];

const steps = [
  { num: "01", title: "Describe your dispute", desc: "Tell CLAUSE what happened in plain language" },
  { num: "02", title: "AI analyzes your rights", desc: "Claude identifies applicable laws and deadlines" },
  { num: "03", title: "Get legal documents", desc: "Demand notices, settlement proposals, court briefs" },
  { num: "04", title: "Resolve or escalate", desc: "Settle early or file in court with AI-prepared briefs" },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

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

  return (
    <div className="flex flex-col min-h-full">
      <SEO
        title="CLAUSE - AI Legal Resolution for India"
        description="From cheque bounce to court order in days, not years. AI-powered dispute resolution built with Claude's Extended Thinking."
      />

      {/* Hero Section - dark bg like Anthropic landing */}
      <div className="bg-[hsl(75,15%,8%)] text-[hsl(40,15%,90%)] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-2xl space-y-6">
            <Badge
              variant="outline"
              className="text-[11px] tracking-wider border-[hsl(40,15%,25%)] text-[hsl(40,15%,70%)]"
              data-testid="badge-tagline"
            >
              Built with Claude's Extended Thinking
            </Badge>

            <h1
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-normal leading-[1.15] tracking-tight"
              data-testid="text-heading"
            >
              Meet your legal
              <br />
              thinking partner
            </h1>

            <p
              className="text-lg text-[hsl(40,15%,65%)] leading-relaxed max-w-lg"
              data-testid="text-subtitle"
            >
              Tackle any cheque bounce, property, or employment dispute with Claude.
              From legal notice to court order in days, not years.
            </p>

            {/* Input box like Anthropic */}
            <div className="mt-8 max-w-lg">
              <div className="flex items-center gap-2 bg-[hsl(75,10%,14%)] border border-[hsl(70,8%,22%)] rounded-md px-4 py-2.5">
                <input
                  type="text"
                  placeholder="How can I help you today?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-[hsl(40,15%,90%)] placeholder:text-[hsl(40,10%,40%)] outline-none"
                  data-testid="input-hero-query"
                />
                <Button
                  onClick={handleSubmit}
                  className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,50%)] text-white rounded-md px-4 py-1.5 text-sm font-medium shrink-0 no-default-hover-elevate"
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
                      className="text-[11px] border-[hsl(70,8%,22%)] text-[hsl(40,15%,65%)] gap-1.5 cursor-pointer"
                      data-testid={`pill-${cat.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section - light bg */}
      <div className="bg-background py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-10" data-testid="text-how-label">
            How it works
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="space-y-3" data-testid={`step-${i + 1}`}>
                <p className="text-xs font-mono text-muted-foreground">{step.num}</p>
                <h3 className="text-base font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact stats - subtle section */}
      <div className="border-t border-border py-16 md:py-24" data-testid="section-impact">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-10" data-testid="text-impact-label">
            The scale of the problem
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "5 Cr+", label: "Cases Pending", desc: "in Indian courts" },
              { value: "21", label: "Judges per Million", desc: "vs 50+ in developed nations" },
              { value: "18 mo", label: "Average Resolution", desc: "for a simple cheque bounce" },
              { value: "2 wk", label: "With CLAUSE", desc: "same case, AI-accelerated" },
            ].map((stat, i) => (
              <div key={i} className="space-y-1" data-testid={`card-stat-${i}`}>
                <p className="text-3xl md:text-4xl font-serif font-normal text-foreground tracking-tight" data-testid={`text-stat-value-${i}`}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-foreground" data-testid={`text-stat-label-${i}`}>{stat.label}</p>
                <p className="text-xs text-muted-foreground" data-testid={`text-stat-desc-${i}`}>{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ramesh's story */}
      <div className="border-t border-border py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-10" data-testid="text-story-label">
            Ramesh's story
          </p>

          <div className="space-y-8">
            {[
              { day: "Day 1", title: "Ramesh's ₹3 lakh cheque bounces", desc: "His supplier's cheque is returned by the bank. Ramesh doesn't know his rights or where to start." },
              { day: "Day 1", title: "CLAUSE analyzes his rights", desc: "AI identifies Section 138 NI Act, calculates the 30-day notice deadline, and explains his legal position." },
              { day: "Day 2", title: "Legal notice drafted & sent", desc: "CLAUSE generates a formal demand notice under Section 138. The 15-day payment window begins." },
              { day: "Day 17", title: "Settlement proposed", desc: "CLAUSE proposes fair compensation based on legal precedents. The supplier refuses to pay." },
              { day: "Day 18", title: "Case enters court", desc: "Complaint filed under S.138. CLAUSE Bench prepares the magistrate's brief with precedent analysis." },
              { day: "Day 30", title: "Resolved in 2 weeks", desc: "What would have taken 18 months is done. The AI prepared everything — the judge decided." },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start" data-testid={`step-${i + 1}`}>
                <p className="text-xs font-mono text-muted-foreground w-14 shrink-0 pt-1">{step.day}</p>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="border-t border-border py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground font-medium">54 million pending cases. 21 judges per million people.</p>
            <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-footer">
              Built with Claude Extended Thinking · Anthropic Hackathon 2025
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/resolve">
              <Button data-testid="button-resolve-bottom" className="gap-2">
                I have a dispute
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/bench">
              <Button variant="outline" data-testid="button-bench" className="gap-2">
                Judge's Bench
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
