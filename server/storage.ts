import { db } from "./db";
import {
  disputes, cases,
  type InsertDispute, type InsertCase,
  type Dispute, type Case
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Disputes
  getDisputes(): Promise<Dispute[]>;
  getDispute(id: number): Promise<Dispute | undefined>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: number, updates: Partial<InsertDispute>): Promise<Dispute>;

  // Cases
  getCases(): Promise<Case[]>;
  getCase(id: number): Promise<Case | undefined>;
  createCase(case_: InsertCase): Promise<Case>;
  updateCase(id: number, updates: Partial<InsertCase>): Promise<Case>;
}

export class DatabaseStorage implements IStorage {
  // Disputes
  async getDisputes(): Promise<Dispute[]> {
    return await db.select().from(disputes).orderBy(disputes.id);
  }

  async getDispute(id: number): Promise<Dispute | undefined> {
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id));
    return dispute;
  }

  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [newDispute] = await db.insert(disputes).values(dispute).returning();
    return newDispute;
  }

  async updateDispute(id: number, updates: Partial<InsertDispute>): Promise<Dispute> {
    const [updated] = await db.update(disputes)
      .set(updates)
      .where(eq(disputes.id, id))
      .returning();
    return updated;
  }

  // Cases
  async getCases(): Promise<Case[]> {
    return await db.select().from(cases).orderBy(cases.id);
  }

  async getCase(id: number): Promise<Case | undefined> {
    const [case_] = await db.select().from(cases).where(eq(cases.id, id));
    return case_;
  }

  async createCase(case_: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(case_).returning();
    return newCase;
  }

  async updateCase(id: number, updates: Partial<InsertCase>): Promise<Case> {
    const [updated] = await db.update(cases)
      .set(updates)
      .where(eq(cases.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
