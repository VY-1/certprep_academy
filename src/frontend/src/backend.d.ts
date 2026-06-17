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
export interface UserProfilePatch {
    username: string | null;
    fullName: string | null;
    email: string | null;
}
export interface UserProfile {
    principal: Principal;
    username: string | null;
    fullName: string | null;
    email: string | null;
    createdAt: bigint;
    updatedAt: bigint;
}
export interface SyncedAttempt {
    id: string;
    payload: string;
}
export interface backendInterface {
    addExam(exam: CertificationExam): Promise<void>;
    getExamDetails(examId: string): Promise<CertificationExam | null>;
    getExamQuestions(versionId: string): Promise<Array<Question>>;
    getExamVersions(examId: string): Promise<Array<ExamVersion>>;
    getExams(): Promise<Array<CertificationExam>>;
    getMyProfile(): Promise<UserProfile | null>;
    getMyResults(): Promise<Array<SyncedAttempt>>;
    saveMyResult(result: SyncedAttempt): Promise<void>;
    saveMyResultsBatch(results: Array<SyncedAttempt>): Promise<void>;
    updateMyProfile(patch: UserProfilePatch): Promise<UserProfile>;
    whoami(): Promise<Principal>;
}
