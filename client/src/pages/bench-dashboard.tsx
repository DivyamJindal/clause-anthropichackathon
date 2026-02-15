import { Link } from "wouter";
import { useCases } from "@/hooks/use-cases";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, ChevronRight } from "lucide-react";
import { SEO } from "@/components/seo";

export default function BenchDashboard() {
  const { data: cases, isLoading } = useCases();

  return (
    <div className="flex flex-col h-full">
      <SEO
        title="Judge Dashboard - CLAUSE Bench"
        description="AI-powered judicial bench briefs for bail applications. Process cases in minutes with automated precedent analysis and risk assessment."
      />

      <div className="max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-bench-heading">Bail Applications</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-bench-count">
            {cases?.length || 0} pending applications. Click to view AI-generated bench brief.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20" data-testid="status-loading">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-md divide-y" data-testid="list-cases">
            {cases?.map((c) => (
              <Link key={c.id} href={`/bench/${c.id}`}>
                <div
                  className="flex items-center gap-4 px-4 py-3 hover-elevate cursor-pointer"
                  data-testid={`case-row-${c.id}`}
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
                    <div className="sm:col-span-1">
                      <p className="text-xs text-muted-foreground font-mono" data-testid={`text-case-id-${c.id}`}>#{c.id.toString().padStart(4, "0")}</p>
                      <p className="text-sm font-medium truncate" data-testid={`text-case-name-${c.id}`}>{c.applicantName}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-case-offense-${c.id}`}>{c.offenseType}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-detention-${c.id}`}>
                        <Clock className="w-3 h-3" />
                        {c.detentionMonths}mo
                      </div>
                      <Badge
                        variant={
                          c.status === "granted" ? "default" :
                          c.status === "denied" ? "destructive" :
                          c.status === "analyzed" ? "secondary" : "outline"
                        }
                        className="text-[10px]"
                        data-testid={`badge-status-${c.id}`}
                      >
                        {c.status === "granted" ? "Granted" :
                         c.status === "denied" ? "Denied" :
                         c.status === "analyzed" ? "Briefed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}

            {(!cases || cases.length === 0) && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground" data-testid="text-empty-docket">
                No cases in the docket.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
