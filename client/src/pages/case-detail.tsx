import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useCase, useAnalyzeCase, useDecideCase } from "@/hooks/use-cases";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Check, X, RefreshCw, BookOpen, FileText, AlertCircle,
  Upload, Search, ChevronLeft, ChevronRight, Trash2, Plus, MessageSquare,
  Send, Brain, ChevronDown, ShieldCheck, AlertTriangle, Link2,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BenchBrief, CaseDocument, DocumentPage } from "@shared/schema";

interface CaseOrder {
  text: string;
  decision: string;
  date: string;
}

const DOC_TYPES = [
  { value: "fir", label: "FIR" },
  { value: "chargesheet", label: "Chargesheet" },
  { value: "witness_statement", label: "Witness Statement" },
  { value: "bail_application", label: "Bail Application" },
  { value: "other", label: "Other" },
];

export default function CaseDetail() {
  const [, params] = useRoute("/bench/:id");
  const id = parseInt(params?.id || "0");
  const { data: caseData, isLoading } = useCase(id);
  const analyzeCase = useAnalyzeCase();
  const decideCase = useDecideCase();
  const { toast } = useToast();
  const [showOrder, setShowOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<"brief" | "documents" | "chat">("brief");
  const [initialDocId, setInitialDocId] = useState<number | null>(null);
  const [initialPage, setInitialPage] = useState<number>(1);

  const handleCitationClick = (documentId: number, pageNumber: number) => {
    setInitialDocId(documentId);
    setInitialPage(pageNumber);
    setActiveTab("documents");
  };

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
          {!isDecided && activeTab === "brief" && (
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

        <div className="flex gap-1 mb-6 border-b">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "brief" ? "border-foreground" : "border-transparent"}`}
            onClick={() => setActiveTab("brief")}
            data-testid="tab-brief"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Brief
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "documents" ? "border-foreground" : "border-transparent"}`}
            onClick={() => setActiveTab("documents")}
            data-testid="tab-documents"
          >
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "chat" ? "border-foreground" : "border-transparent"}`}
            onClick={() => setActiveTab("chat")}
            data-testid="tab-chat"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>

        {activeTab === "brief" && (
          <BriefTab
            brief={brief}
            order={order}
            showOrder={showOrder}
            setShowOrder={setShowOrder}
            isAnalyzing={isAnalyzing}
            isDeciding={isDeciding}
            isDecided={isDecided}
            caseData={caseData}
            handleDecision={handleDecision}
            onCitationClick={handleCitationClick}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab caseId={id} initialDocId={initialDocId} initialPage={initialPage} />
        )}

        {activeTab === "chat" && (
          <CaseChatTab caseId={id} caseData={caseData} />
        )}
      </div>
    </div>
  );
}

function BriefTab({
  brief,
  order,
  showOrder,
  setShowOrder,
  isAnalyzing,
  isDeciding,
  isDecided,
  caseData,
  handleDecision,
  onCitationClick,
}: {
  brief: BenchBrief | null;
  order: CaseOrder | null;
  showOrder: boolean;
  setShowOrder: (v: boolean) => void;
  isAnalyzing: boolean;
  isDeciding: boolean;
  isDecided: boolean;
  caseData: any;
  handleDecision: (d: "granted" | "denied") => void;
  onCitationClick?: (documentId: number, pageNumber: number) => void;
}) {
  return (
    <>
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
          <p className="text-sm text-muted-foreground">Your law clerk is preparing the brief...</p>
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

          <Card className="p-6 space-y-4" data-testid="card-recommendation">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Law Clerk's Assessment</p>
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

          {(brief as any).confidenceAssessment && (
            <Card className="p-5 space-y-4" data-testid="card-confidence">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence Confidence</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                  (brief as any).confidenceAssessment.overall === "HIGH" ? "bg-green-500" : 
                  (brief as any).confidenceAssessment.overall === "MEDIUM" ? "bg-yellow-500" : "bg-red-500"
                }`} />
                <span className="text-sm font-medium" data-testid="text-confidence-level">
                  {(brief as any).confidenceAssessment.overall} confidence in evidence base
                </span>
              </div>
              {(brief as any).confidenceAssessment.evidenceGaps?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Evidence Gaps</p>
                  <div className="space-y-1.5">
                    {(brief as any).confidenceAssessment.evidenceGaps.map((gap: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-gap-${i}`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(brief as any).confidenceAssessment.contradictions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Contradictions Found</p>
                  <div className="space-y-1.5">
                    {(brief as any).confidenceAssessment.contradictions.map((c: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-contradiction-${i}`}>
                        <X className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {(brief as any).citations?.length > 0 && (
            <Card className="p-5 space-y-4" data-testid="card-citations">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Document Citations ({(brief as any).citations.length})
                </p>
              </div>
              <div className="divide-y">
                {(brief as any).citations.map((citation: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => onCitationClick?.(citation.documentId, citation.pageNumber)}
                    className="w-full text-left hover-elevate active-elevate-2 rounded-md px-3 py-3 -mx-3 transition-colors cursor-pointer"
                    data-testid={`citation-link-${i}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {citation.documentName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Page {citation.pageNumber}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                      "{citation.excerpt}"
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {(brief as any).researchLog?.length > 0 && (
            <Card className="p-5 space-y-3" data-testid="card-research-log">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Research Activity
                </p>
              </div>
              <div className="space-y-1.5">
                {(brief as any).researchLog.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`research-step-${i}`}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>
                      {entry.tool === "get_document_pages"
                        ? `Read ${entry.pagesReturned} page(s) from document #${entry.input?.document_id}`
                        : `Searched for "${entry.input?.query}" — ${entry.pagesReturned} match(es)`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {brief.draftOrder && !isDecided && showOrder && (
            <Card className="p-5 space-y-3" data-testid="card-draft-order">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Draft Order</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap" data-testid="text-draft-order">
                {brief.draftOrder}
              </p>
            </Card>
          )}
        </div>
      ) : null}
    </>
  );
}

function DocumentsTab({ caseId, initialDocId, initialPage }: { caseId: number; initialDocId?: number | null; initialPage?: number }) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentPage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("other");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading: docsLoading } = useQuery<CaseDocument[]>({
    queryKey: ["/api/cases", caseId, "documents"],
  });

  const { data: pages, isLoading: pagesLoading } = useQuery<DocumentPage[]>({
    queryKey: ["/api/documents", selectedDocId, "pages"],
    enabled: !!selectedDocId,
  });

  useEffect(() => {
    if (initialDocId !== null && initialDocId !== undefined) {
      setSelectedDocId(initialDocId);
      setCurrentPage(initialPage || 1);
    }
  }, [initialDocId, initialPage]);

  const selectedDoc = documents?.find((d) => d.id === selectedDocId);
  const currentPageData = pages?.find((p) => p.pageNumber === currentPage);

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      toast({ title: "Error", description: "Please enter a document name.", variant: "destructive" });
      return;
    }
    if (!uploadFile && !uploadText.trim()) {
      toast({ title: "Error", description: "Please upload a file or paste text.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      if (uploadFile) {
        formData.append("file", uploadFile);
      } else {
        formData.append("text", uploadText);
      }
      formData.append("name", uploadName);
      formData.append("type", uploadType);

      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      toast({ title: "Document uploaded", description: `${uploadName} has been added.` });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setShowUpload(false);
      setUploadName("");
      setUploadType("other");
      setUploadFile(null);
      setUploadText("");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await apiRequest("DELETE", `/api/documents/${docId}`);
      toast({ title: "Document deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      if (selectedDocId === docId) {
        setSelectedDocId(null);
        setCurrentPage(1);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/documents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();
      setSearchResults(results);
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const typeLabel = (type: string) => {
    const found = DOC_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold" data-testid="text-documents-heading">Case Documents</h2>
        <Button onClick={() => setShowUpload(!showUpload)} data-testid="button-upload-document">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {showUpload && (
        <Card className="p-5 space-y-4" data-testid="card-upload-form">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upload Document</p>
          <div className="space-y-3">
            <Input
              placeholder="Document name"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              data-testid="input-document-name"
            />
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger data-testid="select-document-type">
                <SelectValue placeholder="Document type" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} data-testid={`select-type-${t.value}`}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  if (e.target.files?.[0]) setUploadText("");
                }}
                data-testid="input-document-file"
              />
              <p className="text-xs text-muted-foreground text-center">or paste text below</p>
              <Textarea
                placeholder="Paste document text here..."
                value={uploadText}
                onChange={(e) => {
                  setUploadText(e.target.value);
                  if (e.target.value) setUploadFile(null);
                }}
                rows={5}
                data-testid="textarea-document-text"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleUpload} disabled={isUploading} data-testid="button-submit-upload">
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)} data-testid="button-cancel-upload">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search across all document pages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) setSearchResults(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
            data-testid="input-search-pages"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          data-testid="button-search-pages"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {searchResults && (
        <Card className="p-4 space-y-3" data-testid="card-search-results">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Search Results ({searchResults.length} page{searchResults.length !== 1 ? "s" : ""} found)
            </p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchResults(null); setSearchQuery(""); }} data-testid="button-clear-search">
              Clear
            </Button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-results">No matching pages found.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((page) => (
                <div
                  key={page.id}
                  className="p-3 rounded-md border cursor-pointer hover-elevate"
                  onClick={() => {
                    setSelectedDocId(page.documentId);
                    setCurrentPage(page.pageNumber);
                    setSearchResults(null);
                  }}
                  data-testid={`search-result-${page.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">Doc #{page.documentId}</Badge>
                    <span className="text-xs text-muted-foreground">Page {page.pageNumber}</span>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">{page.content.slice(0, 200)}...</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {docsLoading ? (
        <div className="flex justify-center py-8" data-testid="status-loading-docs">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={`p-4 cursor-pointer ${selectedDocId === doc.id ? "border-foreground/30" : ""}`}
              onClick={() => {
                setSelectedDocId(selectedDocId === doc.id ? null : doc.id);
                setCurrentPage(1);
              }}
              data-testid={`card-document-${doc.id}`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-doc-name-${doc.id}`}>{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.totalPages} page{doc.totalPages !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]" data-testid={`badge-doc-type-${doc.id}`}>
                    {typeLabel(doc.type)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    data-testid={`button-delete-doc-${doc.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-2" data-testid="text-no-documents">
          <FileText className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        </div>
      )}

      {selectedDocId && selectedDoc && (
        <Card className="p-5 space-y-4" data-testid="card-page-viewer">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {selectedDoc.name}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center" data-testid="text-page-indicator">
                Page {currentPage} of {selectedDoc.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.min(selectedDoc.totalPages, currentPage + 1))}
                disabled={currentPage >= selectedDoc.totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {pagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : currentPageData ? (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-foreground/90 bg-muted/30 p-4 rounded-md min-h-[200px]"
              data-testid="text-page-content"
            >
              {currentPageData.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-page">
              No content available for this page.
            </p>
          )}
        </Card>
      )}
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

function CaseThinkingBlock({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!thinking) return null;
  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover-elevate active-elevate-2 px-2 py-1.5 rounded-md transition-colors bg-muted/50"
        data-testid="button-chat-toggle-thinking"
      >
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span>{isOpen ? "Hide" : "View"} reasoning</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-2 pl-3 border-l-2 border-primary/30 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  );
}

function CaseChatTab({ caseId, caseData }: { caseId: number; caseData: any }) {
  const [messages, setMessages] = useState<Array<{role: "user"|"assistant", content: string, thinking?: string}>>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage = { role: "user" as const, content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage = { role: "assistant" as const, content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedThinking = "";
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "thinking") {
                  accumulatedThinking += data.content || "";
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: accumulatedContent, thinking: accumulatedThinking };
                    return updated;
                  });
                } else if (data.content && !data.type) {
                  accumulatedContent += data.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: accumulatedContent, thinking: accumulatedThinking };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error("Case chat error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const exampleQuestions = [
    "What are the key facts from the FIR?",
    "Summarize the witness statements",
    "What is the accused's criminal history?",
    "When was the chargesheet filed?",
  ];

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]" data-testid="case-chat-container">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <h3 className="text-lg font-semibold" data-testid="text-chat-heading">Ask about this case</h3>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-chat-subtitle">
                Ask questions about the case documents, evidence, or legal aspects. Answers are grounded in the uploaded case files.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try asking</p>
              {exampleQuestions.map((q, idx) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 rounded-md border border-border text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid={`button-chat-example-${idx}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                    : "text-foreground"
                }`}
                data-testid={`chat-message-${msg.role}-${i}`}
              >
                {msg.role === "assistant" ? (
                  <div>
                    {msg.thinking && (
                      <CaseThinkingBlock thinking={msg.thinking} />
                    )}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === "" && !messages[messages.length - 1]?.thinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Researching case files...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this case..."
            className="resize-none text-sm min-h-[48px] max-h-[150px] rounded-xl border-input flex-1"
            rows={1}
            disabled={isStreaming}
            data-testid="input-case-chat"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="rounded-lg shrink-0"
            data-testid="button-case-chat-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
