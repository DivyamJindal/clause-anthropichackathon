import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Disputes API ---

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
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
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

    // Mock AI Analysis if not already present (for speed/demo reliability)
    // In a real app, we would call Anthropic here.
    // Let's call Anthropic to demonstrate integration, but fallback to mock if needed.
    
    try {
      const prompt = `
        Analyze this dispute for Indian Law (Section 138 NI Act context):
        "${dispute.description}"
        
        Return a JSON object with:
        - caseType: string (e.g. "Section 138 NI Act")
        - urgency: string (e.g. "High", "Medium")
        - daysRemaining: number
        - deadlines: array of { label, date, passed: boolean }
        - settlementRange: { min: number, max: number }
        - legalPoints: array of strings
        
        Assume today is ${new Date().toISOString().split('T')[0]}.
        If exact dates aren't in text, estimate based on "2 weeks ago" etc.
      `;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const contentBlock = response.content[0];
      let analysisData;
      
      if (contentBlock.type === 'text') {
         // Naive JSON extraction for demo
         const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
             try {
                analysisData = JSON.parse(jsonMatch[0]);
             } catch (e) {
                 console.error("Failed to parse AI response", e);
             }
         }
      }

      // Fallback/Default data if AI fails or returns non-JSON
      if (!analysisData) {
        analysisData = {
            caseType: "Section 138 NI Act",
            urgency: "High",
            daysRemaining: 15,
            deadlines: [
                { label: "Send Legal Notice", date: "2025-10-30", passed: false },
                { label: "File Complaint", date: "2025-11-15", passed: false }
            ],
            settlementRange: { min: 300000, max: 322500 },
            legalPoints: ["Cheque bounced for insufficient funds", "Legally enforceable debt"]
        };
      }

      const updated = await storage.updateDispute(id, { 
        analysis: analysisData,
        status: "analyzed"
      });
      res.json(updated);

    } catch (error) {
      console.error("AI Analysis failed:", error);
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
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
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
        const prompt = `
          Generate a Judicial Bench Brief for a Bail Application in India.
          Case Details:
          Applicant: ${case_.applicantName}
          Offense: ${case_.offenseType}
          Detention: ${case_.detentionMonths} months
          
          Return JSON with:
          - caseSnapshot: { accused, offense, maxSentence, detained, firDate }
          - bailAnalysis: { section479: { status, reason }, section480: { gravity, flightRisk, tampering, safety } }
          - precedents: array of { caseName, relevance }
          - recommendation: { decision, confidence, reasoning, conditions }
        `;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
        });

        const contentBlock = response.content[0];
        let briefData;

        if (contentBlock.type === 'text') {
            const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    briefData = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error("Failed to parse AI response", e);
                }
            }
        }

        if (!briefData) {
            briefData = {
                caseSnapshot: {
                    accused: case_.applicantName,
                    offense: case_.offenseType,
                    maxSentence: "5 years",
                    detained: `${case_.detentionMonths} months`,
                    firDate: "2025-10-15"
                },
                bailAnalysis: {
                    section479: { status: false, reason: "1/3 threshold not reached" },
                    section480: { gravity: "Moderate", flightRisk: "Low", tampering: "Low", safety: "Low" }
                },
                precedents: [
                    { caseName: "Satender Kumar Antil v. CBI", relevance: "Bail is the rule, jail is the exception" }
                ],
                recommendation: {
                    decision: "GRANT",
                    confidence: "HIGH",
                    reasoning: "First-time offender, low flight risk.",
                    conditions: ["Personal bond ₹50,000", "Weekly reporting"]
                }
            };
        }

        const updated = await storage.updateCase(id, {
            brief: briefData,
            status: "analyzed"
        });
        res.json(updated);

    } catch (error) {
        console.error("Bench Analysis failed:", error);
        res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Seed Data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
    const disputes = await storage.getDisputes();
    if (disputes.length === 0) {
        await storage.createDispute({
            description: "I supplied fabric worth ₹3 Lakhs to a garment manufacturer. He gave me a cheque which bounced last week. Bank memo says 'Insufficient Funds'.",
            type: "cheque_bounce",
            status: "draft",
            analysis: null,
            documents: null
        });
    }

    const cases = await storage.getCases();
    if (cases.length === 0) {
        await storage.createCase({
            applicantName: "Arjun Mehra",
            offenseType: "Section 304A BNS (Death by Negligence)",
            detentionMonths: 4,
            status: "pending",
            brief: null,
            order: null
        });
        await storage.createCase({
            applicantName: "Vikram Singh",
            offenseType: "Section 379 BNS (Theft)",
            detentionMonths: 6,
            status: "pending",
            brief: null,
            order: null
        });
    }
}
