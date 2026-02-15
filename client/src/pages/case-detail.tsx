import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useCase, useAnalyzeCase, useDecideCase } from "@/hooks/use-cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X, RefreshCw, BookOpen, FileText, AlertCircle } from "lucide-react";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import type { BenchBrief } from "@shared/schema";

interface CaseOrder {
  text: string;
  decision: string;
  date: string;
}

export default function CaseDetail() {
  const [, params] = useRoute("/bench/:id");
  const id = parseInt(params?.id || "0");
  const { data: caseData, isLoading } = useCase(id);
  const analyzeCase = useAnalyzeCase();
  const decideCase = useDecideCase();
  const { toast } = useToast();
  const [showOrder, setShowOrder] = useState(false);

  useEffect(() => {
    if (caseData && !caseData.brief && !analyzeCase.isPending) {
      analyzeCase.mutate(id);
    }
  }, [caseData?.brief, id]);

  const handleDecision = (decision: "granted" | "denied") => {
    decideCase.mutate(
      { id, decision },
      {
        onSuccess: (data) => {
          toast({
            title: `Bail ${decision === "granted" ? "Granted" : "Denied"}`,
            description: `Order generated for State v. ${data.applicantName}`,
          });
          setShowOrder(true);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to process decision. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="status-loading">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm" data-testid="text-not-found">
        Case not found.
      </div>
    );
  }

  const brief = caseData.brief as BenchBrief | null;
  const order = caseData.order as CaseOrder | null;
  const isAnalyzing = analyzeCase.isPending;
  const isDeciding = decideCase.isPending;
  const isDecided = caseData.status === "granted" || caseData.status === "denied";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <SEO
        title={`State v. ${caseData.applicantName} - CLAUSE Bench`}
        description={`AI-generated bench brief for bail application: ${caseData.offenseType}. ${caseData.detentionMonths} months in custody.`}
      />

      <div className="max-w-5xl w-full mx-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold" data-testid="text-case-title">
                State v. {caseData.applicantName}
              </h1>
              <Badge variant="outline" className="font-mono text-[10px]" data-testid="badge-case-number">
                BAIL-{id.toString().padStart(4, "0")}
              </Badge>
              {isDecided && (
                <Badge
                  variant={caseData.status === "granted" ? "default" : "destructive"}
                  className="text-[10px]"
                  data-testid="badge-decision-status"
                >
                  {caseData.status === "granted" ? "Bail Granted" : "Bail Denied"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-case-details">
              {caseData.offenseType} &middot; {caseData.detentionMonths} months in custody
            </p>
          </div>
          {!isDecided && (
            <Button
              variant="outline"
              onClick={() => analyzeCase.mutate(id)}
              disabled={isAnalyzing}
              data-testid="button-refresh-brief"
              className="gap-2"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </Button>
          )}
        </div>

        {order && showOrder && (
          <Card className="p-6 mb-6 space-y-3 border-2" data-testid="card-order">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Judicial Order &middot; {order.date}
              </p>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90" data-testid="text-order-content">
              {order.text}
            </div>
          </Card>
        )}

        {order && !showOrder && (
          <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap" data-testid="card-order-banner">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Order has been generated ({order.date}).
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowOrder(true)} data-testid="button-view-order">
              View Order
            </Button>
          </Card>
        )}

        {isAnalyzing && !brief ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3" data-testid="status-analyzing">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generating bench brief...</p>
          </div>
        ) : brief ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 space-y-4" data-testid="card-case-snapshot">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Case Snapshot</p>
                <div className="space-y-3 text-sm">
                  <Row label="Accused" value={brief.caseSnapshot.accused} testId="row-accused" />
                  <Row label="Offense" value={brief.caseSnapshot.offense} testId="row-offense" />
                  <Row label="Max Sentence" value={brief.caseSnapshot.maxSentence} testId="row-sentence" />
                  <Row label="Detained" value={brief.caseSnapshot.detained} testId="row-detained" />
                  <Row label="FIR Date" value={brief.caseSnapshot.firDate} testId="row-fir-date" />
                  {brief.caseSnapshot.chargesheetStatus && (
                    <Row label="Chargesheet" value={brief.caseSnapshot.chargesheetStatus} testId="row-chargesheet" />
                  )}
                </div>
              </Card>

              <Card className="p-5 space-y-4" data-testid="card-section479">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">S.479 Assessment</p>
                <div className="space-y-2">
                  {brief.bailAnalysis.section479.points?.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`s479-point-${i}`}>
                      <span className="text-muted-foreground mt-0.5 shrink-0">
                        {brief.bailAnalysis.section479.status ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : i === (brief.bailAnalysis.section479.points?.length || 1) - 1 ? (
                          <X className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </span>
                      <span className="text-foreground/80">{point}</span>
                    </div>
                  )) || (
                    <p className="text-sm text-foreground/80" data-testid="s479-reason">{brief.bailAnalysis.section479.reason}</p>
                  )}
                  <div className="pt-2">
                    <Badge variant={brief.bailAnalysis.section479.status ? "default" : "outline"} className="text-[10px]" data-testid="badge-s479-status">
                      {brief.bailAnalysis.section479.status ? "Eligible" : "Not yet eligible"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-5 space-y-4" data-testid="card-section480">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">S.480 Risk Assessment (Triple Test)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <RiskItem label="Offense Gravity" value={brief.bailAnalysis.section480.gravity} testId="risk-gravity" />
                <RiskItem label="Flight Risk" value={brief.bailAnalysis.section480.flightRisk} testId="risk-flight" />
                <RiskItem label="Evidence Tampering" value={brief.bailAnalysis.section480.tampering} testId="risk-tampering" />
                <RiskItem label="Public Safety" value={brief.bailAnalysis.section480.safety} testId="risk-safety" />
              </div>
            </Card>

            <Card className="p-5 space-y-4" data-testid="card-precedents">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Precedent Map</p>
              </div>
              <div className="divide-y">
                {brief.precedents.map((p, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0" data-testid={`precedent-${i}`}>
                    <p className="text-sm font-medium text-foreground">
                      {p.caseName} {p.year ? `(${p.year})` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.relevance}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-card border" data-testid="card-recommendation">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Recommendation</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xl font-semibold ${
                        brief.recommendation.decision === "GRANT" ? "text-green-600" : "text-red-600"
                      }`}
                      data-testid="text-recommendation"
                    >
                      {brief.recommendation.decision === "GRANT" ? "Grant Bail" : "Deny Bail"}
                    </span>
                    <Badge variant="outline" className="text-[10px]" data-testid="badge-confidence">
                      {brief.recommendation.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl" data-testid="text-reasoning">
                    {brief.recommendation.reasoning}
                  </p>
                </div>
              </div>

              {brief.recommendation.conditions && brief.recommendation.conditions.length > 0 && (
                <div className="space-y-2 pt-2" data-testid="list-conditions">
                  <p className="text-xs font-medium text-muted-foreground">Suggested Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {brief.recommendation.conditions.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-condition-${i}`}>
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!isDecided ? (
                <div className="flex gap-3 pt-2 flex-wrap">
                  <Button
                    onClick={() => handleDecision("granted")}
                    disabled={isDeciding}
                    data-testid="button-grant-bail"
                  >
                    {isDeciding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Grant Bail
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecision("denied")}
                    disabled={isDeciding}
                    data-testid="button-deny-bail"
                  >
                    {isDeciding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                    Deny Bail
                  </Button>
                  {brief.draftOrder && (
                    <Button
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setShowOrder(true)}
                      data-testid="button-draft-order"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Draft
                    </Button>
                  )}
                </div>
              ) : (
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <Badge
                    variant={caseData.status === "granted" ? "default" : "destructive"}
                    data-testid="badge-final-decision"
                  >
                    Bail {caseData.status === "granted" ? "Granted" : "Denied"}
                  </Badge>
                  {order && (
                    <Button
                      variant="outline"
                      onClick={() => setShowOrder(!showOrder)}
                      data-testid="button-toggle-order"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {showOrder ? "Hide Order" : "View Order"}
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {brief.draftOrder && !isDecided && showOrder && (
              <Card className="p-5 space-y-3" data-testid="card-draft-order">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Draft Order</p>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap" data-testid="text-draft-order">
                  {brief.draftOrder}
                </p>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex justify-between gap-4" data-testid={testId}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function RiskItem({ label, value, testId }: { label: string; value: string; testId: string }) {
  const level = value.split(" ")[0]?.toUpperCase() || "";
  const detail = value.includes("-") ? value.split("-").slice(1).join("-").trim() : value;

  return (
    <div className="space-y-1" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${
            level === "LOW" ? "bg-green-500" : level === "MODERATE" ? "bg-yellow-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium">{level}</span>
      </div>
      {detail !== value && <p className="text-xs text-muted-foreground leading-snug">{detail}</p>}
    </div>
  );
}
