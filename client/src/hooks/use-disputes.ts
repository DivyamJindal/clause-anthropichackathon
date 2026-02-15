import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import { z } from "zod";
import type { InsertDispute, Dispute } from "@shared/schema";

// Helper to validate API responses
function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("API Validation Error:", result.error);
    throw new Error("Invalid API response");
  }
  return result.data;
}

export function useDisputes() {
  return useQuery({
    queryKey: [api.disputes.list.path],
    queryFn: async () => {
      const res = await fetch(api.disputes.list.path);
      if (!res.ok) throw new Error("Failed to fetch disputes");
      return validateResponse(api.disputes.list.responses[200], await res.json());
    },
  });
}

export function useDispute(id: number) {
  return useQuery({
    queryKey: [api.disputes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.disputes.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch dispute");
      return validateResponse(api.disputes.get.responses[200], await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDispute) => {
      const res = await fetch(api.disputes.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = errorSchemas.validation.parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create dispute");
      }
      return validateResponse(api.disputes.create.responses[201], await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.disputes.list.path] });
    },
  });
}

export function useAnalyzeDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.disputes.analyze.path, { id });
      const res = await fetch(url, { method: "POST" });
      
      if (!res.ok) throw new Error("Analysis failed");
      return validateResponse(api.disputes.analyze.responses[200], await res.json());
    },
    onSuccess: (data) => {
      // Invalidate both list and individual item
      queryClient.invalidateQueries({ queryKey: [api.disputes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.disputes.get.path, data.id] });
    },
  });
}
