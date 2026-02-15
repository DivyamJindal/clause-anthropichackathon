import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useCase, useAnalyzeCase } from "@/hooks/use-cases";
import { Card, CardHeader, CardTitle } from "@/components/ui/card-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel, Scale, AlertOctagon, BookOpen, Check, X } from "lucide-react";
import type { BenchBrief } from "@shared/schema";
import { motion } from "framer-motion";

export default function CaseDetail() {
  const [match, params] = useRoute("/bench/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: caseData, isLoading } = useCase(id);
  const analyzeCase = useAnalyzeCase();

  useEffect(() => {
    // Auto-analyze on load for demo purposes if not present
    if (caseData && !caseData.brief) {
      analyzeCase.mutate(id);
    }
  }, [caseData?.brief, id]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!caseData) return <div>Case not found</div>;

  const brief = caseData.brief as BenchBrief | null;
  const isAnalyzing = analyzeCase.isPending;

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b mb-6 bg-background sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-900">
              State vs. {caseData.applicantName}
            </h1>
            <Badge variant="outline" className="font-mono">CASE-{id.toString().padStart(4, '0')}</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">{caseData.offenseType} • Custody: {caseData.detentionMonths} Months</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => analyzeCase.mutate(id)} disabled={isAnalyzing}>
            {isAnalyzing ? "Processing..." : "Refresh Brief"}
          </Button>
          <Button className="bg-slate-900 text-white">Generate Order</Button>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* Left: Case Facts (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <Card className="bg-slate-50 border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Case Snapshot</CardTitle>
            </CardHeader>
            <div className="p-6 pt-0 space-y-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400">Accused</span>
                <span className="font-medium text-slate-900">{caseData.applicantName}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">FIR Date</span>
                <span className="font-medium text-slate-900">{brief?.caseSnapshot?.firDate || "Loading..."}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Max Sentence</span>
                <span className="font-medium text-slate-900">{brief?.caseSnapshot?.maxSentence || "TBD"}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs text-slate-400 mb-1">Timeline</span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                  <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-slate-500">Investigation Complete</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Legal Precedents</CardTitle>
            </CardHeader>
            <div className="p-6 pt-0 space-y-3">
              {brief?.precedents ? (
                brief.precedents.map((p, i) => (
                  <div key={i} className="text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <p className="font-medium text-blue-800 hover:underline cursor-pointer flex gap-1">
                      <BookOpen className="w-3 h-3 mt-1" />
                      {p.caseName}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 leading-snug">{p.relevance}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">AI analyzing precedents...</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right: AI Bench Brief (9 cols) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col overflow-hidden h-full">
          {isAnalyzing && !brief ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Generating Bench Brief...</p>
            </div>
          ) : brief ? (
            <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto pb-20">
              
              {/* Bail Analysis Grid */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <Card className={`p-5 border-l-4 ${brief.bailAnalysis.section479.status ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">Section 479 Compliance</h3>
                    <Badge variant={brief.bailAnalysis.section479.status ? "success" : "destructive"}>
                      {brief.bailAnalysis.section479.status ? "COMPLIANT" : "NON-COMPLIANT"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {brief.bailAnalysis.section479.reason}
                  </p>
                </Card>

                <Card className="p-5 border-l-4 border-l-blue-500">
                  <h3 className="font-semibold text-slate-900 mb-3">Risk Assessment (Triple Test)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Flight Risk</span>
                      <span className="font-medium">{brief.bailAnalysis.section480.flightRisk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tampering</span>
                      <span className="font-medium">{brief.bailAnalysis.section480.tampering}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Offense Gravity</span>
                      <span className="font-medium">{brief.bailAnalysis.section480.gravity}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Final Recommendation - Hero Card */}
              <motion.div 
                className="col-span-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-slate-900 text-slate-100 border-none shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 opacity-50" />
                  
                  <div className="p-8 relative z-10 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">AI Recommendation</span>
                        <div className="flex items-center gap-3 mt-1">
                          <h2 className={`text-3xl font-display font-bold ${brief.recommendation.decision === 'GRANT' ? 'text-green-400' : 'text-red-400'}`}>
                            {brief.recommendation.decision} BAIL
                          </h2>
                          <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50">
                            {brief.recommendation.confidence} CONFIDENCE
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 leading-relaxed text-lg font-light">
                        {brief.recommendation.reasoning}
                      </p>

                      <div className="pt-4 space-y-2">
                        <span className="text-xs text-slate-500 uppercase">Suggested Conditions</span>
                        <div className="flex flex-wrap gap-2">
                          {brief.recommendation.conditions.map((c, i) => (
                            <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                      <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                        <Check className="mr-2 w-5 h-5" /> Grant Bail
                      </Button>
                      <Button className="w-full h-14 text-lg bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900/50">
                        <X className="mr-2 w-5 h-5" /> Deny Bail
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
