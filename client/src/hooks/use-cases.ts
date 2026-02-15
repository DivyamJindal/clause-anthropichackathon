import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import { z } from "zod";
import type { InsertCase, Case } from "@shared/schema";

function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("API Validation Error:", result.error);
    throw new Error("Invalid API response");
  }
  return result.data;
}

export function useCases() {
  return useQuery({
    queryKey: [api.cases.list.path],
    queryFn: async () => {
      const res = await fetch(api.cases.list.path);
      if (!res.ok) throw new Error("Failed to fetch cases");
      return validateResponse(api.cases.list.responses[200], await res.json());
    },
  });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: [api.cases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cases.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch case");
      return validateResponse(api.cases.get.responses[200], await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCase) => {
      const res = await fetch(api.cases.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = errorSchemas.validation.parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create case");
      }
      return validateResponse(api.cases.create.responses[201], await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
    },
  });
}

export function useAnalyzeCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cases.analyze.path, { id });
      const res = await fetch(url, { method: "POST" });
      
      if (!res.ok) throw new Error("Analysis failed");
      return validateResponse(api.cases.analyze.responses[200], await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cases.get.path, data.id] });
    },
  });
}

export function useDecideCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: "granted" | "denied" }) => {
      const url = buildUrl(api.cases.decide.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error("Decision failed");
      return validateResponse(api.cases.decide.responses[200], await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.cases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cases.get.path, data.id] });
    },
  });
}
