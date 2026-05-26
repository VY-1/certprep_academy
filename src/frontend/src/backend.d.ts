import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Question {
    id: string;
    versionId: string;
    knowledgeDomain: KnowledgeDomain;
    explanation: string;
    text: string;
    isScored: boolean;
    correctOptionIndex: bigint;
    options: Array<string>;
}
export interface CertificationExam {
    id: string;
    name: string;
    description: string;
}
export type KnowledgeDomain = {
    __kind__: "Medications";
    Medications: null;
} | {
    __kind__: "FederalRequirements";
    FederalRequirements: null;
} | {
    __kind__: "OrderEntry";
    OrderEntry: null;
} | {
    __kind__: "Other";
    Other: string;
} | {
    __kind__: "PatientSafety";
    PatientSafety: null;
};
export interface ExamVersion {
    id: string;
    scoredQuestions: bigint;
    totalQuestions: bigint;
    timeLimitMinutes: bigint;
    examId: string;
    versionName: string;
}
export interface backendInterface {
    addExam(exam: CertificationExam): Promise<void>;
    getExamDetails(examId: string): Promise<CertificationExam | null>;
    getExamQuestions(versionId: string): Promise<Array<Question>>;
    getExamVersions(examId: string): Promise<Array<ExamVersion>>;
    getExams(): Promise<Array<CertificationExam>>;
}
