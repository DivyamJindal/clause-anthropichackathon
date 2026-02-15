import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'cheque_bounce', etc.
  status: text("status").notNull().default("draft"), // draft, analyzed, notice_sent, court_filed
  analysis: jsonb("analysis"), // Stores the AI analysis, timeline, dates
  documents: jsonb("documents"), // Stores generated document content
  createdAt: timestamp("created_at").defaultNow(),
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  applicantName: text("applicant_name").notNull(),
  offenseType: text("offense_type").notNull(),
  detentionMonths: integer("detention_months").notNull(),
  status: text("status").notNull().default("pending"), // pending, analyzed, decided
  brief: jsonb("brief"), // Stores the Bench Brief data
  order: jsonb("order"), // Stores the generated order
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true });
export const insertCaseSchema = createInsertSchema(cases).omit({ id: true, createdAt: true });

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type CreateDisputeRequest = InsertDispute;
export type CreateCaseRequest = InsertCase;

// Types for AI Analysis structures (for strong typing in frontend)
export interface DisputeAnalysis {
  caseType: string;
  urgency: string;
  daysRemaining: number;
  deadlines: { label: string; date: string; passed: boolean }[];
  settlementRange: { min: number; max: number };
  legalPoints: string[];
}

export interface BenchBrief {
  caseSnapshot: {
    accused: string;
    offense: string;
    maxSentence: string;
    detained: string;
    firDate: string;
    chargesheetStatus?: string;
  };
  bailAnalysis: {
    section479: { status: boolean; reason?: string; points?: string[] };
    section480: { gravity: string; flightRisk: string; tampering: string; safety: string };
  };
  precedents: { caseName: string; year?: string; relevance: string }[];
  recommendation: {
    decision: "GRANT" | "DENY";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    reasoning: string;
    conditions: string[];
  };
  draftOrder?: string;
}
