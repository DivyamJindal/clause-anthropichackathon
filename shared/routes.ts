import { z } from 'zod';
import { disputes, cases, insertDisputeSchema, insertCaseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  disputes: {
    list: {
      method: 'GET' as const,
      path: '/api/disputes' as const,
      responses: {
        200: z.array(z.custom<typeof disputes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/disputes' as const,
      input: insertDisputeSchema,
      responses: {
        201: z.custom<typeof disputes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/disputes/:id' as const,
      responses: {
        200: z.custom<typeof disputes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    analyze: { // Trigger AI analysis
      method: 'POST' as const,
      path: '/api/disputes/:id/analyze' as const,
      input: z.object({}), // No extra input needed, uses dispute data
      responses: {
        200: z.custom<typeof disputes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  cases: {
    list: {
      method: 'GET' as const,
      path: '/api/cases' as const,
      responses: {
        200: z.array(z.custom<typeof cases.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cases' as const,
      input: insertCaseSchema,
      responses: {
        201: z.custom<typeof cases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cases/:id' as const,
      responses: {
        200: z.custom<typeof cases.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    analyze: { // Trigger AI bench brief generation
      method: 'POST' as const,
      path: '/api/cases/:id/analyze' as const,
      input: z.object({}),
      responses: {
        200: z.custom<typeof cases.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
