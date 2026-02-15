import { db } from "./db";
import {
  disputes, cases, caseDocuments, documentPages,
  type InsertDispute, type InsertCase,
  type Dispute, type Case,
  type CaseDocument, type InsertCaseDocument,
  type DocumentPage, type InsertDocumentPage
} from "@shared/schema";
import { eq, and, ilike, inArray } from "drizzle-orm";

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

  // Documents
  getDocumentsByCaseId(caseId: number): Promise<CaseDocument[]>;
  getDocument(id: number): Promise<CaseDocument | undefined>;
  createDocument(doc: InsertCaseDocument): Promise<CaseDocument>;
  deleteDocument(id: number): Promise<void>;
  getPagesByDocumentId(documentId: number): Promise<DocumentPage[]>;
  getPage(id: number): Promise<DocumentPage | undefined>;
  createPages(pages: InsertDocumentPage[]): Promise<DocumentPage[]>;
  getPagesByCase(caseId: number): Promise<DocumentPage[]>;
  searchPages(caseId: number, query: string): Promise<DocumentPage[]>;
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

  // Documents
  async getDocumentsByCaseId(caseId: number): Promise<CaseDocument[]> {
    return await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, caseId)).orderBy(caseDocuments.id);
  }

  async getDocument(id: number): Promise<CaseDocument | undefined> {
    const [doc] = await db.select().from(caseDocuments).where(eq(caseDocuments.id, id));
    return doc;
  }

  async createDocument(doc: InsertCaseDocument): Promise<CaseDocument> {
    const [newDoc] = await db.insert(caseDocuments).values(doc).returning();
    return newDoc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documentPages).where(eq(documentPages.documentId, id));
    await db.delete(caseDocuments).where(eq(caseDocuments.id, id));
  }

  async getPagesByDocumentId(documentId: number): Promise<DocumentPage[]> {
    return await db.select().from(documentPages).where(eq(documentPages.documentId, documentId)).orderBy(documentPages.pageNumber);
  }

  async getPage(id: number): Promise<DocumentPage | undefined> {
    const [page] = await db.select().from(documentPages).where(eq(documentPages.id, id));
    return page;
  }

  async createPages(pages: InsertDocumentPage[]): Promise<DocumentPage[]> {
    if (pages.length === 0) return [];
    return await db.insert(documentPages).values(pages).returning();
  }

  async getPagesByCase(caseId: number): Promise<DocumentPage[]> {
    const docs = await db.select({ id: caseDocuments.id }).from(caseDocuments).where(eq(caseDocuments.caseId, caseId));
    const docIds = docs.map(d => d.id);
    if (docIds.length === 0) return [];
    return await db.select().from(documentPages).where(inArray(documentPages.documentId, docIds)).orderBy(documentPages.documentId, documentPages.pageNumber);
  }

  async searchPages(caseId: number, query: string): Promise<DocumentPage[]> {
    const docs = await db.select({ id: caseDocuments.id }).from(caseDocuments).where(eq(caseDocuments.caseId, caseId));
    const docIds = docs.map(d => d.id);
    if (docIds.length === 0) return [];
    return await db.select().from(documentPages).where(
      and(
        inArray(documentPages.documentId, docIds),
        ilike(documentPages.content, `%${query}%`)
      )
    ).orderBy(documentPages.pageNumber);
  }
}

export const storage = new DatabaseStorage();
