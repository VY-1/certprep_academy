import type { ExamSession, Question } from "@/types/exam";
import { create } from "zustand";

interface ExamStoreState {
  session: ExamSession | null;
  startSession: (
    versionId: string,
    examId: string,
    questions: Question[],
    timeLimitMinutes: number,
    timerEnabled?: boolean,
    instantSolutionEnabled?: boolean,
  ) => void;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  submitAnswer: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  goToNext: () => void;
  completeExam: () => void;
  clearSession: () => void;
}

export const useExamStore = create<ExamStoreState>((set) => ({
  session: null,

  startSession: (
    versionId,
    examId,
    questions,
    timeLimitMinutes,
    timerEnabled = true,
    instantSolutionEnabled = true,
  ) =>
    set({
      session: {
        versionId,
        examId,
        questions,
        currentQuestionIndex: 0,
        answers: {},
        submitted: {},
        startTime: Date.now(),
        isComplete: false,
        timeLimitMinutes,
        timerEnabled,
        instantSolutionEnabled,
      },
    }),

  selectAnswer: (questionId, optionIndex) =>
    set((state) => {
      if (!state.session || state.session.submitted[questionId]) return state;
      return {
        session: {
          ...state.session,
          answers: { ...state.session.answers, [questionId]: optionIndex },
        },
      };
    }),

  submitAnswer: (questionId) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          submitted: { ...state.session.submitted, [questionId]: true },
        },
      };
    }),

  goToQuestion: (index) =>
    set((state) => {
      if (!state.session) return state;
      return { session: { ...state.session, currentQuestionIndex: index } };
    }),

  goToNext: () =>
    set((state) => {
      if (!state.session) return state;
      const next = state.session.currentQuestionIndex + 1;
      const atLast = next >= state.session.questions.length;
      return {
        session: {
          ...state.session,
          currentQuestionIndex: atLast
            ? state.session.currentQuestionIndex
            : next,
        },
      };
    }),

  completeExam: () =>
    set((state) => {
      if (!state.session) return state;
      return { session: { ...state.session, isComplete: true } };
    }),

  clearSession: () => set({ session: null }),
}));
