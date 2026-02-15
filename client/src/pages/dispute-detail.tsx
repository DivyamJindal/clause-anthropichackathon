import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useDispute, useAnalyzeDispute } from "@/hooks/use-disputes";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, FileText, Calendar, CheckCircle2, RefreshCw, Download } from "lucide-react";
import { motion } from "framer-motion";
import type { DisputeAnalysis } from "@shared/schema";

export default function DisputeDetail() {
  const [match, params] = useRoute("/resolve/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: dispute, isLoading } = useDispute(id);
  const analyzeDispute = useAnalyzeDispute();

  // Trigger analysis automatically if it's a draft
  useEffect(() => {
    if (dispute && dispute.status === "draft" && !dispute.analysis) {
      analyzeDispute.mutate(id);
    }
  }, [dispute?.status, id]);

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!dispute) {
    return <div className="text-center py-20">Dispute not found. <Button variant="link" onClick={() => setLocation("/")}>Go Back</Button></div>;
  }

  const analysis = dispute.analysis as DisputeAnalysis | null;
  const isAnalyzing = analyzeDispute.isPending;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-muted-foreground">ID: #{dispute.id}</Badge>
            <Badge variant={dispute.status === "analyzed" ? "success" : "default"}>
              {dispute.status.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-primary">
            {dispute.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Case
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">{dispute.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => analyzeDispute.mutate(id)} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Re-Analyze
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      {isAnalyzing && !analysis ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="w-12 h-12 animate-spin text-accent relative z-10" />
          </div>
          <h3 className="text-xl font-medium">AI Analysis in Progress</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Reviewing relevant statutes (Section 138 NI Act), calculating limitation periods, and drafting your legal notice...
          </p>
        </Card>
      ) : analysis ? (
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="analysis" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Analysis</TabsTrigger>
            <TabsTrigger value="documents" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Documents</TabsTrigger>
            <TabsTrigger value="timeline" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Summary Card */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="h-full border-l-4 border-l-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-accent" />
                      Legal Assessment
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">Urgency Level</span>
                      <span className="text-sm font-bold text-destructive flex items-center gap-1">
                        {analysis.urgency.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Key Legal Points:</p>
                      <ul className="space-y-2">
                        {analysis.legalPoints?.map((point, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t mt-4">
                      <p className="text-sm text-muted-foreground mb-1">Estimated Settlement Range</p>
                      <div className="text-2xl font-bold text-primary font-mono">
                        ${analysis.settlementRange?.min.toLocaleString()} - ${analysis.settlementRange?.max.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Action Plan */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Critical Deadlines
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-4">
                    {analysis.deadlines?.map((deadline, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${deadline.passed ? 'bg-muted opacity-60' : 'bg-white'}`}>
                        <div className={`mt-0.5 w-2 h-2 rounded-full ${deadline.passed ? 'bg-gray-400' : 'bg-red-500 animate-pulse'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{deadline.label}</p>
                          <p className="text-xs text-muted-foreground">Due: {deadline.date}</p>
                        </div>
                        {deadline.passed && <Badge variant="secondary" className="text-[10px]">Passed</Badge>}
                      </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">Next Step</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Legal notice must be sent within {analysis.daysRemaining} days to remain valid under the Negotiable Instruments Act.
                      </p>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Generate Notice Now</Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Draft Legal Notice</CardTitle>
                  <CardDescription>AI-generated based on your dispute details</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardHeader>
              <div className="bg-muted/30 p-8 rounded-b-xl border-t font-mono text-sm leading-relaxed overflow-y-auto max-h-[600px] whitespace-pre-wrap">
                {/* Mock document content if not in DB */}
                {(dispute.documents as any)?.notice || `LEGAL NOTICE
                
To,
[Defaulter Name]
[Address]

Subject: Notice under Section 138 of the Negotiable Instruments Act, 1881 regarding dishonour of Cheque No. XXXXXX.

Dear Sir/Madam,

Under instruction from my client ${analysis.caseType ? '...' : ''}, I hereby serve upon you the following legal notice:

1. That you issued a cheque bearing No. XXXXXX dated [Date] for an amount of $${analysis.settlementRange?.max} drawn on [Bank Name] in discharge of your liability.

2. That the said cheque was presented for clearance but was returned unpaid with the remark "Insufficient Funds".

3. That my client is entitled to the said amount...

[...Full generated legal text would appear here...]
                `}
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline">
            <Card className="p-6">
              <div className="relative border-l-2 border-muted ml-3 space-y-8">
                {[
                  { title: "Dispute Created", date: new Date(dispute.createdAt!).toLocaleDateString(), active: true },
                  { title: "AI Analysis Complete", date: "Today", active: true },
                  { title: "Legal Notice Sent", date: "Pending", active: false },
                  { title: "Waiting Period (15 Days)", date: "Future", active: false },
                  { title: "Court Filing Window", date: "Future", active: false }
                ].map((step, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${step.active ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                    <h4 className={`text-sm font-semibold ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.date}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center text-muted-foreground">Analysis pending...</div>
      )}
    </div>
  );
}
