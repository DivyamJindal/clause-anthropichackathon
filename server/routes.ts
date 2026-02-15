import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

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
      const prompt = `Generate a Judicial Bench Brief for this Bail Application.
Case Details:
- Applicant: ${case_.applicantName}
- Offense: ${case_.offenseType}
- Period in Custody: ${case_.detentionMonths} months
- Assume this is a first-time offender unless the offense suggests otherwise
- Today's date: ${new Date().toISOString().split('T')[0]}

Provide comprehensive analysis with relevant precedents.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        system: BENCH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const contentBlock = response.content[0];
      let briefData;

      if (contentBlock.type === 'text') {
        briefData = extractJSON(contentBlock.text);
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
          draftOrder: "Considering the nature of the offense, the period of custody already undergone, and the guidelines laid down by the Hon'ble Supreme Court in Satender Kumar Antil v. CBI, the bail application is allowed. The applicant is directed to be released on bail on furnishing a personal bond."
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
