// Shared types matching the backend contract

export type KnowledgeDomain =
  | { __kind__: "Medications" }
  | { __kind__: "FederalRequirements" }
  | { __kind__: "PatientSafety" }
  | { __kind__: "OrderEntry" }
  | { __kind__: "Other"; Other: string };

export interface CertificationExam {
  id: string;
  name: string;
  description: string;
}

export interface ExamVersion {
  id: string;
  examId: string;
  versionName: string;
  totalQuestions: bigint;
  scoredQuestions: bigint;
  timeLimitMinutes: bigint;
}

export interface Question {
  id: string;
  versionId: string;
  text: string;
  options: string[];
  correctOptionIndex: bigint;
  explanation: string;
  knowledgeDomain: KnowledgeDomain;
  isScored: boolean;
}

// Local state for an in-progress exam session
export interface ExamSession {
  versionId: string;
  examId: string;
  questions: Question[];
  currentQuestionIndex: number;
  /** Map from questionId to selected option index */
  answers: Record<string, number>;
  /** Map from questionId to whether answer was submitted */
  submitted: Record<string, boolean>;
  startTime: number; // Date.now() ms
  isComplete: boolean;
  timeLimitMinutes: number;
  timerEnabled: boolean;
  /** When false, FeedbackCard (answer + explanation) is hidden until exam ends */
  instantSolutionEnabled: boolean;
}

export function getDomainLabel(domain: KnowledgeDomain): string {
  switch (domain.__kind__) {
    case "Medications":
      return "Medications";
    case "FederalRequirements":
      return "Federal Requirements";
    case "PatientSafety":
      return "Patient Safety & Quality Assurance";
    case "OrderEntry":
      return "Order Entry & Processing";
    case "Other":
      return domain.Other;
  }
}

export function getDomainColor(domain: KnowledgeDomain): string {
  switch (domain.__kind__) {
    case "Medications":
      return "text-primary border-primary/30 bg-primary/10";
    case "FederalRequirements":
      return "text-[oklch(0.75_0.15_280)] border-[oklch(0.75_0.15_280)]/30 bg-[oklch(0.75_0.15_280)]/10";
    case "PatientSafety":
      return "text-accent border-accent/30 bg-accent/10";
    case "OrderEntry":
      return "text-[oklch(0.75_0.18_55)] border-[oklch(0.75_0.18_55)]/30 bg-[oklch(0.75_0.18_55)]/10";
    case "Other":
      return "text-muted-foreground border-border bg-muted/30";
  }
}
