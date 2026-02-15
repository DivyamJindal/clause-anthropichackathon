import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-full">
      <SEO
        title="CLAUSE - AI Legal Platform for India"
        description="AI-powered dispute resolution and judicial acceleration. Resolve disputes before court, or process bail applications in minutes."
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-foreground" data-testid="text-heading">
              What if every day was a National Lok Adalat?
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-subtitle">
              AI-powered dispute resolution and judicial acceleration. Resolve disputes before court, or process cases in minutes instead of hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/resolve">
              <Button data-testid="button-resolve" className="h-12 px-8 text-base gap-2">
                I have a dispute
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/bench">
              <Button data-testid="button-bench" variant="outline" className="h-12 px-8 text-base gap-2">
                Judge Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="space-y-2" data-testid="card-citizens">
              <p className="text-sm font-medium text-foreground">For Citizens</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe your dispute in any language. Get instant legal analysis, deadlines, and draft notices.
              </p>
            </div>
            <div className="space-y-2" data-testid="card-judges">
              <p className="text-sm font-medium text-foreground">For Judges</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Process bail applications in 2 minutes. AI-generated bench briefs with precedents and recommendations.
              </p>
            </div>
            <div className="space-y-2" data-testid="card-pipeline">
              <p className="text-sm font-medium text-foreground">The Pipeline</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Disputes that can't settle flow directly into judge-ready briefs. Zero wasted work.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground" data-testid="text-footer">
            54 million pending cases. 21 judges per million people. CLAUSE attacks the backlog from both sides.
          </p>
        </div>
      </footer>
    </div>
  );
}
