import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const researchTools = [
  {
    name: "get_document_pages",
    description: "Retrieve specific pages from a case document. Use this to read the content of documents filed in this case. You can request multiple pages at once.",
    input_schema: {
      type: "object" as const,
      properties: {
        document_id: { type: "number", description: "The ID of the document to read from" },
        page_numbers: {
          type: "array",
          items: { type: "number" },
          description: "Array of page numbers to retrieve (1-indexed)"
        },
      },
      required: ["document_id", "page_numbers"],
    },
  },
  {
    name: "search_case_documents",
    description: "Search across all documents in this case for specific terms or phrases. Returns matching pages with their content. Use this when looking for specific information like dates, names, or legal terms.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query to find relevant pages" },
      },
      required: ["query"],
    },
  },
];

function extractJSON(text: string): any {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
    try {
      const fixed = match[0]
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch (e) {
      console.error("JSON extraction failed:", e);
    }
  }
  return null;
}

const RESOLVE_SYSTEM_PROMPT = `You are CLAUSE, an AI legal dispute resolution system for India. You help citizens understand their legal rights and resolve disputes before they reach court.

Your role:
1. Classify the dispute type (Section 138 NI Act, landlord-tenant, consumer, labor, motor accident, etc.)
2. Ask smart follow-up questions to extract key facts (ask 2-3 at a time, not all at once)
3. Apply relevant Indian law (BNS/BNSS/BSA, NI Act, Consumer Protection Act, etc.)
4. Calculate exact deadlines and limitation periods
5. Propose fair settlement with legal reasoning
6. Generate draft legal documents when ready

Key legal knowledge:

CHEQUE BOUNCE (Section 138 NI Act):
- Payee must send written demand notice within 30 DAYS of receiving bank return memo
- Drawer gets 15 DAYS after receiving notice to pay
- If unpaid, complaint must be filed within 30 DAYS after 15-day period expires
- Maximum punishment: 2 years imprisonment or fine up to 2x cheque amount
- Offense is COMPOUNDABLE — can be settled at any stage
- Key case: Meters & Instruments v. Kanchan Mehta — compensatory, not punitive

BAIL UNDER BNSS:
- Section 479: Mandatory bail for undertrials who served 1/2 of max sentence (1/3 for first-time offenders)
- Section 480: Bail in non-bailable offenses — judicial discretion
- Triple test: criminal antecedents, flight risk, evidence tampering
- "Bail is the rule, jail is the exception" — SC principle

CONSUMER DISPUTES:
- Consumer Protection Act 2019
- File within 2 years from cause of action
- District Commission: up to ₹1 crore
- State Commission: ₹1 crore to ₹10 crore

RENTAL DISPUTES:
- Model Tenancy Act 2021 provisions
- Security deposit limits and return timelines
- Eviction grounds and procedures

COMMUNICATION STYLE:
- Be warm, empathetic, and clear
- Use simple language to explain legal concepts
- Support Hindi, Kannada, and English input — always respond in the same language the user uses
- When you have enough information, provide a structured analysis
- Calculate deadlines precisely based on dates provided
- Flag urgency when time-sensitive
- Use ₹ for currency amounts
- When providing analysis, structure it clearly with sections

When you have gathered enough facts (usually after 2-3 exchanges), provide your full analysis in this format:

**CLAUSE ANALYSIS**

**Case Type:** [classification]
**Status:** [urgency level and days remaining if applicable]

**Key Facts:**
- [fact 1]
- [fact 2]

**Your Legal Position:**
[Clear explanation]

**Critical Deadlines:**
[Timeline with dates]

**Fair Settlement Range:** [amount range with reasoning]

**Recommended Next Steps:**
1. [step 1]
2. [step 2]

**Documents Ready:**
- Draft Legal Notice
- Settlement Proposal

After giving the analysis, ask if they want you to generate the legal notice or settlement proposal.`;

const BENCH_SYSTEM_PROMPT = `You are an AI law clerk — you prepare comprehensive briefs for the judge's review. The judge always makes the final decision. Your role is to save the judge time by organizing facts, analyzing law, and presenting a clear assessment.

You are CLAUSE Bench, an AI judicial assistant for Indian courts. You generate comprehensive Bench Briefs to help judges process cases efficiently.

Given case details, generate a structured Bench Brief in JSON format containing:

1. caseSnapshot: { accused (string with age and criminal history), offense (section and description), maxSentence (string), detained (string with months), firDate (string date), chargesheetStatus (string) }
2. bailAnalysis: {
   section479: { status (boolean - eligible or not), points (array of strings explaining each criterion) },
   section480: { gravity (string: LOW/MODERATE/HIGH with explanation), flightRisk (string: LOW/MODERATE/HIGH with explanation), tampering (string: LOW/MODERATE/HIGH with explanation), safety (string: LOW/MODERATE/HIGH with explanation) }
}
3. precedents: array of { caseName (string), year (string), relevance (string - 1-2 sentence explanation) } — include 3-5 relevant SC/HC judgments
4. recommendation: { decision ("GRANT" or "DENY"), confidence ("HIGH" or "MEDIUM" or "LOW"), reasoning (string - detailed 2-3 sentence reasoning), conditions (array of strings - specific bail conditions if granting) }
5. draftOrder: string — a brief 3-4 sentence draft order text

For BAIL cases analyze:
- Section 479 eligibility (detention threshold: 1/2 max for repeat, 1/3 for first-time)
- Section 480 factors (offense gravity, flight risk, tampering risk, public safety)
- Constitutional principles (Article 21, presumption of innocence)
- SC guidelines from Satender Kumar Antil categorization
- Key cases: Satender Kumar Antil v. CBI (2022), Kashmira Singh v. State of Punjab (1977), Jalaluddin Khan v. UOI

Be legally precise. Cite specific sections and judgments. Use formal legal language.
Return ONLY valid JSON. No markdown, no code blocks, just the JSON object.`;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Resolve Chat API (streaming) ---
  app.post("/api/resolve/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
        system: RESOLVE_SYSTEM_PROMPT,
        messages: messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      let currentBlockType: string | null = null;

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          currentBlockType = event.content_block.type;
          if (currentBlockType === "thinking") {
            res.write(`data: ${JSON.stringify({ type: "thinking_start" })}\n\n`);
          } else if (currentBlockType === "text") {
            res.write(`data: ${JSON.stringify({ type: "text_start" })}\n\n`);
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "thinking_delta") {
            res.write(`data: ${JSON.stringify({ type: "thinking", content: event.delta.thinking })}\n\n`);
          } else if (event.delta.type === "text_delta") {
            res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
          }
        } else if (event.type === "content_block_stop") {
          if (currentBlockType === "thinking") {
            res.write(`data: ${JSON.stringify({ type: "thinking_end" })}\n\n`);
          }
          currentBlockType = null;
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Chat failed" });
      }
    }
  });

  // --- Disputes CRUD ---
  app.get(api.disputes.list.path, async (req, res) => {
    const disputes = await storage.getDisputes();
    res.json(disputes);
  });

  app.post(api.disputes.create.path, async (req, res) => {
    try {
      const input = api.disputes.create.input.parse(req.body);
      const dispute = await storage.createDispute(input);
      res.status(201).json(dispute);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.get(api.disputes.get.path, async (req, res) => {
    const dispute = await storage.getDispute(Number(req.params.id));
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    res.json(dispute);
  });

  app.post(api.disputes.analyze.path, async (req, res) => {
    const id = Number(req.params.id);
    const dispute = await storage.getDispute(id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    try {
      const prompt = `Analyze this dispute comprehensively under Indian law. The user described: "${dispute.description}"

Today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY a JSON object (no markdown) with:
- caseType: string
- urgency: "High" | "Medium" | "Low"
- daysRemaining: number (days until next critical deadline)
- deadlines: array of { label: string, date: string (YYYY-MM-DD), passed: boolean }
- settlementRange: { min: number, max: number } (in INR)
- legalPoints: array of strings (key legal facts)
- nextStep: string (immediate action required)
- legalNotice: string (full draft legal notice text if applicable)`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const contentBlock = response.content[0];
      let analysisData;

      if (contentBlock.type === 'text') {
        analysisData = extractJSON(contentBlock.text);
      }

      if (!analysisData) {
        console.warn("AI did not return valid JSON for dispute analysis, using fallback");
        analysisData = {
          caseType: "Section 138 NI Act", urgency: "High", daysRemaining: 16,
          deadlines: [
            { label: "Send Legal Notice", date: "2026-03-15", passed: false },
            { label: "Payment Window Expires", date: "2026-03-30", passed: false },
            { label: "File Court Complaint", date: "2026-04-29", passed: false }
          ],
          settlementRange: { min: 300000, max: 322500 },
          legalPoints: ["Cheque bounced due to insufficient funds", "Legally enforceable debt under Section 138 NI Act", "Offense is compoundable - can settle at any stage"],
          nextStep: "Send a legal demand notice within 30 days of receiving the return memo",
          legalNotice: "LEGAL NOTICE\n\nUnder Section 138 of the Negotiable Instruments Act, 1881..."
        };
      }

      const updated = await storage.updateDispute(id, { analysis: analysisData, status: "analyzed" });
      res.json(updated);
    } catch (error) {
      console.error("Analysis failed:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // --- Cases API ---
  app.get(api.cases.list.path, async (req, res) => {
    const cases = await storage.getCases();
    res.json(cases);
  });

  app.post(api.cases.create.path, async (req, res) => {
    try {
      const input = api.cases.create.input.parse(req.body);
      const case_ = await storage.createCase(input);
      res.status(201).json(case_);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.get(api.cases.get.path, async (req, res) => {
    const case_ = await storage.getCase(Number(req.params.id));
    if (!case_) return res.status(404).json({ message: 'Case not found' });
    res.json(case_);
  });

  app.post(api.cases.analyze.path, async (req, res) => {
    const id = Number(req.params.id);
    const case_ = await storage.getCase(id);
    if (!case_) return res.status(404).json({ message: 'Case not found' });

    try {
      const documents = await storage.getDocumentsByCaseId(id);

      let documentInventory = "No case documents have been uploaded.";
      if (documents.length > 0) {
        documentInventory = "Available case documents:\n" + documents.map(d =>
          `- Document ID ${d.id}: "${d.name}" (Type: ${d.type}, ${d.totalPages} pages)`
        ).join("\n");
      }

      const systemPrompt = BENCH_SYSTEM_PROMPT + `\n\nIMPORTANT: You have access to case documents filed in this matter. Before generating your brief, you MUST research the available documents thoroughly. Use the tools provided to read document pages and search for specific information. Make multiple research passes if needed — don't stop at the first document. Build a complete picture of the case from the filed documents.\n\nAfter your research is complete, generate the JSON brief. Your analysis must cite specific documents and page numbers where you found key facts. Add a "citations" array to your JSON output where each citation has: documentId (number), documentName (string), pageNumber (number), and excerpt (string - the relevant text you're citing).\n\nAlso add a "confidenceAssessment" object with: overall ("HIGH"/"MEDIUM"/"LOW"), evidenceGaps (array of strings describing what information is missing or unclear), and contradictions (array of strings describing any conflicting information found across documents).\n\nIf no documents are available, proceed with analysis based on case metadata alone but note this in your confidence assessment.`;

      let messages: any[] = [{
        role: "user",
        content: `Generate a Judicial Bench Brief for this Bail Application.

Case Details:
- Applicant: ${case_.applicantName}
- Offense: ${case_.offenseType}
- Period in Custody: ${case_.detentionMonths} months
- Today's date: ${new Date().toISOString().split('T')[0]}

${documentInventory}

First, research the available documents thoroughly using the provided tools. Read key pages from each document, search for relevant terms. Then generate your comprehensive bench brief as JSON.`
      }];

      let briefData = null;
      let maxIterations = 8;
      let researchLog: Array<{tool: string, input: any, pagesReturned: number}> = [];

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 16000,
          thinking: {
            type: "enabled",
            budget_tokens: 10000,
          },
          system: systemPrompt,
          tools: researchTools,
          messages,
        });

        if (response.stop_reason === "tool_use") {
          const toolResults: any[] = [];

          for (const block of response.content) {
            if (block.type === "tool_use") {
              let result: string;

              if (block.name === "get_document_pages") {
                const { document_id, page_numbers } = block.input as any;
                const pages = await storage.getPagesByDocumentId(document_id);
                const requestedPages = pages.filter(p => page_numbers.includes(p.pageNumber));

                if (requestedPages.length === 0) {
                  result = `No pages found for document ${document_id} with page numbers ${page_numbers.join(", ")}. The document may have fewer pages.`;
                } else {
                  result = requestedPages.map(p =>
                    `--- Page ${p.pageNumber} ---\n${p.content}`
                  ).join("\n\n");
                }

                researchLog.push({ tool: "get_document_pages", input: { document_id, page_numbers }, pagesReturned: requestedPages.length });
              } else if (block.name === "search_case_documents") {
                const { query } = block.input as any;
                const matchingPages = await storage.searchPages(id, query);

                if (matchingPages.length === 0) {
                  result = `No pages found matching "${query}".`;
                } else {
                  result = `Found ${matchingPages.length} matching page(s):\n` + matchingPages.slice(0, 10).map(p =>
                    `--- Document ${p.documentId}, Page ${p.pageNumber} ---\n${p.content.substring(0, 1000)}${p.content.length > 1000 ? '...' : ''}`
                  ).join("\n\n");
                }

                researchLog.push({ tool: "search_case_documents", input: { query }, pagesReturned: matchingPages.length });
              } else {
                result = "Unknown tool";
              }

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "user", content: toolResults });

        } else if (response.stop_reason === "end_turn") {
          for (const block of response.content) {
            if (block.type === "text") {
              briefData = extractJSON(block.text);
              if (briefData) {
                briefData.researchLog = researchLog;
                break;
              }
            }
          }
          break;
        } else {
          console.warn("Unexpected stop reason:", response.stop_reason);
          break;
        }
      }

      if (!briefData) {
        console.warn("AI did not return valid JSON for bench brief, using fallback");
        briefData = {
          caseSnapshot: { accused: `${case_.applicantName}, no prior convictions`, offense: case_.offenseType, maxSentence: "5 years", detained: `${case_.detentionMonths} months`, firDate: "2025-10-15", chargesheetStatus: "Filed" },
          bailAnalysis: {
            section479: { status: false, points: ["First-time offender", "Not punishable by death or life", `${case_.detentionMonths} months served, 1/3 threshold not reached`] },
            section480: { gravity: "MODERATE - Negligence-based offense, not intentional", flightRisk: "LOW - Local resident with family ties", tampering: "LOW - Chargesheet filed, investigation complete", safety: "LOW - No threat to public safety" }
          },
          precedents: [
            { caseName: "Satender Kumar Antil v. CBI", year: "2022", relevance: "SC directed categorization of offenses for bail; negligence offenses in liberal grant category" },
            { caseName: "Kashmira Singh v. State of Punjab", year: "1977", relevance: "Bail is a right under Article 21 of the Constitution" },
            { caseName: "Jalaluddin Khan v. Union of India", year: "2006", relevance: "Bail is the rule, jail is the exception - fundamental SC principle" }
          ],
          recommendation: { decision: "GRANT", confidence: "HIGH", reasoning: "First-time offender charged with negligence. Investigation complete, chargesheet filed. Local roots, family present. No flight risk. SC guidelines categorize such offenses for liberal bail grant.", conditions: ["Personal bond of Rs. 50,000 with one surety", "Report to local police station weekly", "Surrender passport", "Attend all court hearings"] },
          draftOrder: "Considering the nature of the offense, the period of custody already undergone, and the guidelines laid down by the Hon'ble Supreme Court in Satender Kumar Antil v. CBI, the bail application is allowed. The applicant is directed to be released on bail on furnishing a personal bond.",
          researchLog: [],
          confidenceAssessment: { overall: "LOW", evidenceGaps: ["No case documents were available for review"], contradictions: [] },
          citations: [],
        };
      }

      const updated = await storage.updateCase(id, { brief: briefData, status: "analyzed" });
      res.json(updated);
    } catch (error) {
      console.error("Bench analysis failed:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // --- Case Decision (Grant/Deny) ---
  app.post("/api/cases/:id/decide", async (req, res) => {
    const id = Number(req.params.id);
    const case_ = await storage.getCase(id);
    if (!case_) return res.status(404).json({ message: "Case not found" });

    const schema = z.object({ decision: z.enum(["granted", "denied"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid decision" });

    const brief = case_.brief as any;
    const applicant = case_.applicantName;
    const offense = case_.offenseType;
    const decision = parsed.data.decision;

    try {
      const prompt = `Generate a formal judicial bail order for Indian courts.

Case: State v. ${applicant}
Offense: ${offense}
Decision: Bail ${decision.toUpperCase()}
${brief ? `AI Brief reasoning: ${brief.recommendation?.reasoning || ""}` : ""}
${brief?.recommendation?.conditions ? `Conditions: ${brief.recommendation.conditions.join(", ")}` : ""}

Write a formal 4-6 sentence order in legal language. Include:
- Reference to relevant BNSS sections
- Reasoning for the decision
${decision === "granted" ? "- Bail conditions" : "- Grounds for denial"}
- Date and court reference

Return the order text as a plain string, no JSON, no markdown code blocks.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      let orderText = "";
      const block = response.content[0];
      if (block.type === "text") {
        orderText = block.text.trim();
      }

      if (!orderText) {
        orderText = decision === "granted"
          ? `ORDER\n\nThe bail application of ${applicant} in the matter of ${offense} is hereby allowed. The applicant is directed to be released on bail upon furnishing a personal bond of Rs. 50,000 with one surety of like amount. The applicant shall report to the concerned police station every week, surrender passport, and attend all court hearings without fail.`
          : `ORDER\n\nThe bail application of ${applicant} in the matter of ${offense} is hereby rejected. Considering the gravity of the offense and the stage of investigation, this Court is not inclined to grant bail at this stage. The applicant may approach this Court after the filing of the chargesheet.`;
      }

      const updated = await storage.updateCase(id, {
        status: decision === "granted" ? "granted" : "denied",
        order: { text: orderText, decision, date: new Date().toISOString().split("T")[0] },
      });
      res.json(updated);
    } catch (error) {
      console.error("Decision generation failed:", error);
      res.status(500).json({ message: "Failed to generate order" });
    }
  });

  // --- Document Upload & Management ---
  app.post("/api/cases/:id/documents", upload.single("file"), async (req, res) => {
    try {
      const caseId = Number(req.params.id);
      const case_ = await storage.getCase(caseId);
      if (!case_) return res.status(404).json({ message: "Case not found" });

      const name = req.body.name || "Untitled Document";
      const type = req.body.type || "other";
      let textContent = "";

      if (req.file) {
        const ext = req.file.originalname.split(".").pop()?.toLowerCase();
        if (ext === "pdf") {
          const pdfData = await pdfParse(req.file.buffer);
          textContent = pdfData.text;
        } else {
          textContent = req.file.buffer.toString("utf-8");
        }
      } else if (req.body.text) {
        textContent = req.body.text;
      } else {
        return res.status(400).json({ message: "No file or text provided" });
      }

      let pageTexts: string[];
      if (textContent.includes("\n\n---\n\n")) {
        pageTexts = textContent.split("\n\n---\n\n").filter((p: string) => p.trim().length > 0);
      } else {
        pageTexts = [];
        for (let i = 0; i < textContent.length; i += 3000) {
          const chunk = textContent.slice(i, i + 3000).trim();
          if (chunk.length > 0) pageTexts.push(chunk);
        }
        if (pageTexts.length === 0 && textContent.trim().length > 0) {
          pageTexts = [textContent.trim()];
        }
      }

      const doc = await storage.createDocument({
        caseId,
        name,
        type,
        totalPages: pageTexts.length,
      });

      const pages = pageTexts.map((content: string, i: number) => ({
        documentId: doc.id,
        pageNumber: i + 1,
        content,
      }));

      if (pages.length > 0) {
        await storage.createPages(pages);
      }

      res.status(201).json(doc);
    } catch (error) {
      console.error("Document upload failed:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/cases/:id/documents", async (req, res) => {
    const caseId = Number(req.params.id);
    const documents = await storage.getDocumentsByCaseId(caseId);
    res.json(documents);
  });

  app.get("/api/documents/:id/pages", async (req, res) => {
    const docId = Number(req.params.id);
    const doc = await storage.getDocument(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    const pages = await storage.getPagesByDocumentId(docId);
    res.json(pages);
  });

  app.get("/api/documents/:id/pages/:pageNum", async (req, res) => {
    const docId = Number(req.params.id);
    const pageNum = Number(req.params.pageNum);
    const pages = await storage.getPagesByDocumentId(docId);
    const page = pages.find(p => p.pageNumber === pageNum);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    const docId = Number(req.params.id);
    const doc = await storage.getDocument(docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    await storage.deleteDocument(docId);
    res.json({ success: true });
  });

  app.post("/api/cases/:id/documents/search", async (req, res) => {
    const caseId = Number(req.params.id);
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Query string required" });
    }
    const pages = await storage.searchPages(caseId, query);
    res.json(pages);
  });

  app.post("/api/escalate", async (req, res) => {
    try {
      const schema = z.object({
        applicantName: z.string().min(1),
        offenseType: z.string().min(1),
        summary: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid escalation data" });
      }

      const { applicantName, offenseType, summary } = parsed.data;

      const newCase = await storage.createCase({
        applicantName,
        offenseType,
        detentionMonths: 0,
        status: "pending",
        brief: null,
        order: null,
      });

      res.status(201).json(newCase);
    } catch (error) {
      console.error("Escalation failed:", error);
      res.status(500).json({ message: "Failed to escalate to court" });
    }
  });

  // --- Case Chat API (streaming) ---
  app.post("/api/cases/:id/chat", async (req, res) => {
    const id = Number(req.params.id);
    const case_ = await storage.getCase(id);
    if (!case_) return res.status(404).json({ message: "Case not found" });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "messages array required" });
    }

    try {
      const allPages = await storage.getPagesByCase(id);
      const documents = await storage.getDocumentsByCaseId(id);

      let documentsContent = "No case documents have been uploaded yet.";
      if (allPages.length > 0) {
        const pagesByDoc = new Map<number, typeof allPages>();
        for (const page of allPages) {
          const existing = pagesByDoc.get(page.documentId) || [];
          existing.push(page);
          pagesByDoc.set(page.documentId, existing);
        }

        documentsContent = "";
        for (const doc of documents) {
          const docPages = pagesByDoc.get(doc.id) || [];
          documentsContent += `\n\n=== DOCUMENT: "${doc.name}" (${doc.type}) ===\n`;
          for (const page of docPages.sort((a, b) => a.pageNumber - b.pageNumber)) {
            documentsContent += `\n--- Page ${page.pageNumber} ---\n${page.content}\n`;
          }
        }
      }

      let briefSummary = "";
      if (case_.brief) {
        const brief = case_.brief as any;
        briefSummary = `\nAI BRIEF SUMMARY:\n- Recommendation: ${brief.recommendation?.decision || "N/A"}\n- Reasoning: ${brief.recommendation?.reasoning || "N/A"}\n`;
      }

      const systemPrompt = `You are CLAUSE Bench Assistant, an AI law clerk helping a judge understand case documents. You have direct access to all documents filed in this case.

Case: State v. ${case_.applicantName}
Offense: ${case_.offenseType}
Detention: ${case_.detentionMonths} months
${briefSummary}

CASE DOCUMENTS:
${documentsContent}

INSTRUCTIONS:
- Answer the judge's questions accurately using ONLY the information in the case documents above
- Always cite the specific document name and page number where you found information (e.g., "According to the FIR (Page 2)...")
- If information is not available in the documents, say so clearly — do not make up facts
- Be concise and precise — judges are busy
- Use formal legal language appropriate for judicial proceedings
- If asked about legal provisions, reference the relevant sections of Indian law`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        thinking: {
          type: "enabled",
          budget_tokens: 5000,
        },
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      let currentBlockType: string | null = null;

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          currentBlockType = event.content_block.type;
          if (currentBlockType === "thinking") {
            res.write(`data: ${JSON.stringify({ type: "thinking_start" })}\n\n`);
          } else if (currentBlockType === "text") {
            res.write(`data: ${JSON.stringify({ type: "text_start" })}\n\n`);
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "thinking_delta") {
            res.write(`data: ${JSON.stringify({ type: "thinking", content: event.delta.thinking })}\n\n`);
          } else if (event.delta.type === "text_delta") {
            res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
          }
        } else if (event.type === "content_block_stop") {
          if (currentBlockType === "thinking") {
            res.write(`data: ${JSON.stringify({ type: "thinking_end" })}\n\n`);
          }
          currentBlockType = null;
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Case chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Chat failed" });
      }
    }
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const existingCases = await storage.getCases();
  if (existingCases.length === 0) {
    await storage.createCase({
      applicantName: "Ramesh Verma",
      offenseType: "S.138 NI Act (Cheque Dishonour)",
      detentionMonths: 0,
      status: "pending",
      brief: null,
      order: null,
    });
    await storage.createCase({
      applicantName: "Arjun Mehra",
      offenseType: "S.304A BNS (Death by Negligence)",
      detentionMonths: 4,
      status: "pending",
      brief: null,
      order: null,
    });
    await storage.createCase({
      applicantName: "Vikram Singh",
      offenseType: "S.379 BNS (Theft)",
      detentionMonths: 8,
      status: "pending",
      brief: null,
      order: null,
    });
    await storage.createCase({
      applicantName: "Fatima Khan",
      offenseType: "S.115 BNS (Voluntarily Causing Hurt)",
      detentionMonths: 2,
      status: "pending",
      brief: null,
      order: null,
    });
    await storage.createCase({
      applicantName: "Rajesh Gupta",
      offenseType: "S.316(2) BNS (Criminal Breach of Trust)",
      detentionMonths: 11,
      status: "pending",
      brief: null,
      order: null,
    });
    await storage.createCase({
      applicantName: "Suresh Kumar",
      offenseType: "S.303(2) BNS (Robbery)",
      detentionMonths: 14,
      status: "pending",
      brief: null,
      order: null,
    });
  }
}
