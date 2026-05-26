// This file wires the frontend to the backend API.
// Backend methods are cast via AnyActor because bindgen runs after frontend code;
// once `pnpm bindgen` populates backendInterface, the actor types will be satisfied.

import { createActor } from "@/backend";
import type { CertificationExam, ExamVersion, Question } from "@/types/exam";
import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
/** Exponential-backoff retry helper */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 600,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((res) => setTimeout(res, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastErr;
}

type AnyActor = {
  getExams: () => Promise<CertificationExam[]>;
  getExamDetails: (
    id: string,
  ) => Promise<
    { __kind__: "Some"; value: CertificationExam } | { __kind__: "None" }
  >;
  getExamVersions: (id: string) => Promise<ExamVersion[]>;
  getExamQuestions: (id: string) => Promise<Question[]>;
};

function fromOption<T>(
  opt: { __kind__: "Some"; value: T } | { __kind__: "None" } | undefined,
): T | null {
  if (!opt || opt.__kind__ === "None") return null;
  return opt.value;
}

export function useExams() {
  return useQuery<CertificationExam[]>({
    queryKey: ["exams"],
    queryFn: async () => {
      const actor = await createActorWithConfig(createActor);
      return withRetry(() => (actor as unknown as AnyActor).getExams());
    },
    enabled: true,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

export function useExamDetails(examId: string) {
  return useQuery<CertificationExam | null>({
    queryKey: ["exam", examId],
    queryFn: async () => {
      if (!examId) return null;
      const actor = await createActorWithConfig(createActor);
      const result = await withRetry(() =>
        (actor as unknown as AnyActor).getExamDetails(examId),
      );
      if (result === null || result === undefined) return null;
      if (typeof result === "object" && "__kind__" in result) {
        return fromOption<CertificationExam>(
          result as
            | { __kind__: "Some"; value: CertificationExam }
            | { __kind__: "None" },
        );
      }
      return result as CertificationExam;
    },
    enabled: !!examId,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

export function useExamVersions(examId: string) {
  return useQuery<ExamVersion[]>({
    queryKey: ["examVersions", examId],
    queryFn: async () => {
      if (!examId) return [];
      const actor = await createActorWithConfig(createActor);
      return withRetry(() =>
        (actor as unknown as AnyActor).getExamVersions(examId),
      );
    },
    enabled: !!examId,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

export function useExamQuestions(versionId: string) {
  return useQuery<Question[]>({
    queryKey: ["examQuestions", versionId],
    queryFn: async () => {
      if (!versionId) return [];
      const actor = await createActorWithConfig(createActor);
      return withRetry(() =>
        (actor as unknown as AnyActor).getExamQuestions(versionId),
      );
    },
    enabled: !!versionId,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
