import { Link } from "wouter";
import { ArrowRight, FileText, Scale, Send, Handshake, Gavel, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";
import { LogoMark } from "@/components/logo";

const steps = [
  {
    icon: FileText,
    title: "Ramesh's ₹3 lakh cheque bounces",
    description: "His supplier's cheque is returned by the bank. Ramesh is owed money and doesn't know where to start.",
    label: "Day 1",
  },
  {
    icon: Scale,
    title: "CLAUSE analyzes his rights",
    description: "AI identifies Section 138 NI Act, calculates the 30-day notice deadline, and flags urgency.",
    label: "Day 1",
  },
  {
    icon: Send,
    title: "Legal notice generated",
    description: "CLAUSE drafts a demand notice. Ramesh sends it. The 15-day payment window starts.",
    label: "Day 2",
  },
  {
    icon: Handshake,
    title: "Settlement proposed",
    description: "CLAUSE proposes fair compensation. The supplier refuses to pay.",
    label: "Day 17",
  },
  {
    icon: Gavel,
    title: "Case enters court",
    description: "Complaint filed under S.138. CLAUSE Bench prepares the magistrate's brief with precedents and analysis.",
    label: "Day 18",
  },
  {
    icon: Check,
    title: "Resolved in 2 weeks",
    description: "What would have taken 18 months is done. The AI law clerk prepared everything.",
    label: "Day 30",
  },
];

export default function Landing() {
  return (
    <div className="flex flex-col min-h-full">
      <SEO
        title="CLAUSE - AI Dispute Resolution for India's Cheque Bounce Crisis"
        description="From cheque bounce to court order in days, not years. AI-powered dispute resolution that walks you through the legal process, generates notices, proposes settlement, and prepares court briefs."
      />

      <div className="flex-1 flex flex-col items-center px-6 py-16 md:py-24">
        <div className="max-w-3xl w-full text-center space-y-10">
          <div className="flex justify-center">
            <LogoMark className="w-10 h-10 opacity-40" />
          </div>

          <div className="space-y-5">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-foreground"
              data-testid="text-heading"
            >
              What if every day was a National Lok Adalat?
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
              data-testid="text-subtitle"
            >
              AI-powered dispute resolution for India. From cheque bounce to court order in days, not years.
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

        <div className="max-w-2xl w-full mt-24 md:mt-32">
          <p
            className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center mb-12"
            data-testid="text-story-label"
          >
            Ramesh's story
          </p>

          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-10">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="relative flex gap-6 items-start"
                    data-testid={`step-${index + 1}`}
                  >
                    <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>

                    <div className="pt-1 pb-2 space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-medium text-foreground">
                          {step.title}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          {step.label}
                        </span>
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

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-footer">
            54 million pending cases. 21 judges per million people. CLAUSE attacks the backlog from both sides.
          </p>
        </div>
      </footer>
    </div>
  );
}
