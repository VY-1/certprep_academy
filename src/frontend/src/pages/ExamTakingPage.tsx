import { FeedbackCard } from "@/components/FeedbackCard";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { Timer } from "@/components/Timer";
import { Skeleton } from "@/components/ui/skeleton";
import { useExamQuestions } from "@/hooks/useExams";
import { useExamStore } from "@/store/examStore";
import type { Question } from "@/types/exam";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

/** Fisher-Yates shuffle — deterministic seed from versionId for reproducibility */
function shuffleQuestions(questions: Question[], seed: string): Question[] {
  const arr = [...questions];
  // Simple seeded shuffle using versionId chars as a seed offset
  let s = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function ExamTakingPage() {
  const { versionId } = useParams({ from: "/exam/$versionId" });
  const navigate = useNavigate();
  const {
    session,
    startSession,
    selectAnswer,
    submitAnswer,
    goToQuestion,
    goToNext,
    completeExam,
  } = useExamStore();

  const { data: rawQuestions, isLoading } = useExamQuestions(versionId);
  const sessionStarted = useRef(false);

  // Shuffle and start session once questions load — only when there is NO existing session
  useEffect(() => {
    if (!rawQuestions || rawQuestions.length === 0) return;
    // If a session already exists for this versionId, use it as-is
    if (session?.versionId === versionId && session.questions.length > 0) {
      sessionStarted.current = true;
      return;
    }
    // Only create a new session when there is no session at all
    if (sessionStarted.current) return;
    const shuffled = shuffleQuestions(
      rawQuestions,
      versionId + Date.now().toString(),
    );
    startSession(versionId, "ptcb", shuffled, 110, true, true);
    sessionStarted.current = true;
  }, [rawQuestions, versionId, session, startSession]);

  // All questions answered check
  const allAnswered = useMemo(() => {
    if (!session) return false;
    return session.questions.every((q) => !!session.submitted[q.id]);
  }, [session]);

  const handleExpire = () => {
    completeExam();
    navigate({ to: "/results/$versionId", params: { versionId } });
  };

  const handleCompleteExam = () => {
    completeExam();
    navigate({ to: "/results/$versionId", params: { versionId } });
  };

  // Redirect if already complete
  useEffect(() => {
    if (session?.isComplete) {
      navigate({ to: "/results/$versionId", params: { versionId } });
    }
  }, [session?.isComplete, navigate, versionId]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading || !session || session.versionId !== versionId) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-6 w-20 flex-shrink-0" />
          </div>
        </div>
        <div className="flex-1 py-8 px-4">
          <div
            className="max-w-2xl mx-auto flex flex-col gap-4"
            data-ocid="exam.loading_state"
          >
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const {
    questions,
    currentQuestionIndex,
    answers,
    submitted,
    startTime,
    timeLimitMinutes,
    timerEnabled,
    instantSolutionEnabled,
  } = session;
  const question = questions[currentQuestionIndex];
  if (!question) return null;

  const selectedOption = answers[question.id];
  const isSubmitted = !!submitted[question.id];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(submitted).length;

  const handleSelect = (optionIndex: number) => {
    selectAnswer(question.id, optionIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === undefined) return;
    submitAnswer(question.id);
  };

  const handleNext = () => {
    goToNext();
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* ── Exam top bar ──────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={questions.length}
            className="flex-1"
          />
          {timerEnabled ? (
            <Timer
              startTime={startTime}
              timeLimitMinutes={timeLimitMinutes}
              onExpire={handleExpire}
              className="flex-shrink-0"
            />
          ) : (
            <span className="text-xs font-body text-muted-foreground flex-shrink-0">
              No timer
            </span>
          )}
        </div>
      </div>

      {/* ── Question area ─────────────────────────────────────────────────── */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Answered count badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">
              <span className="text-foreground font-medium">
                {answeredCount}
              </span>{" "}
              /{" "}
              <span className="text-foreground font-medium">
                {questions.length}
              </span>{" "}
              questions answered
            </span>
            {allAnswered && (
              <span className="text-xs font-body font-medium text-accent bg-accent/10 border border-accent/30 px-2.5 py-0.5 rounded-full">
                All answered!
              </span>
            )}
          </div>

          {/* Question card — animated on question change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <QuestionCard
                question={question}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                selectedOption={selectedOption}
                isSubmitted={isSubmitted}
                onSelect={handleSelect}
              />
            </motion.div>
          </AnimatePresence>

          {/* Feedback after submission — only when instant solution is enabled */}
          <AnimatePresence>
            {isSubmitted &&
              selectedOption !== undefined &&
              instantSolutionEnabled && (
                <motion.div
                  key={`feedback-${question.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <FeedbackCard
                    question={question}
                    selectedOption={selectedOption}
                    onNext={handleNext}
                    isLast={isLastQuestion}
                  />
                </motion.div>
              )}
          </AnimatePresence>

          {/* When instant solution is OFF, show a slim Next button after submitting */}
          <AnimatePresence>
            {isSubmitted && !instantSolutionEnabled && (
              <motion.div
                key={`next-no-feedback-${question.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3"
              >
                <span className="text-xs font-body text-muted-foreground">
                  Answer recorded — solution hidden until exam ends.
                </span>
                {!isLastQuestion && (
                  <button
                    type="button"
                    onClick={handleNext}
                    data-ocid="exam.next_button_no_feedback"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 shrink-0"
                  >
                    Next Question
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action row: Prev + Submit/Complete */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Previous button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirstQuestion}
              data-ocid="exam.prev_button"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-display font-medium text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 11L5 7L9 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-3">
              {/* Complete Exam button — visible when all answered */}
              {allAnswered && (
                <motion.button
                  type="button"
                  onClick={handleCompleteExam}
                  data-ocid="exam.complete_button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
                >
                  Complete Exam
                </motion.button>
              )}

              {/* Submit button — only shown before current question is submitted */}
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedOption === undefined}
                  data-ocid="exam.submit_button"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              )}
            </div>
          </div>

          {/* Question navigation dots (mini-map) */}
          <QuestionNavMap
            total={questions.length}
            current={currentQuestionIndex}
            submitted={submitted}
            answers={answers}
            questions={questions}
            onNavigate={(i) => goToQuestion(i)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Question navigation mini-map ──────────────────────────────────────────────
interface QuestionNavMapProps {
  total: number;
  current: number;
  submitted: Record<string, boolean>;
  answers: Record<string, number>;
  questions: Question[];
  onNavigate: (index: number) => void;
}

function QuestionNavMap({
  total,
  current,
  submitted,
  answers,
  questions,
  onNavigate,
}: QuestionNavMapProps) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4"
      data-ocid="exam.nav_map"
    >
      <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Question Map
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const q = questions[i];
          const isAnswered = q ? !!submitted[q.id] : false;
          const isCurrent = i === current;
          const hasSelection = q
            ? answers[q.id] !== undefined && !submitted[q.id]
            : false;

          return (
            <button
              key={`nav-btn-${String(i)}`}
              type="button"
              onClick={() => onNavigate(i)}
              data-ocid={`exam.nav_dot.${i + 1}`}
              title={`Question ${i + 1}${
                isAnswered ? " (answered)" : hasSelection ? " (selected)" : ""
              }`}
              className={`w-7 h-7 rounded-md text-xs font-mono font-medium transition-all duration-150 ${
                isCurrent
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-card"
                  : isAnswered
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : hasSelection
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <LegendDot
          color="bg-accent/20 border border-accent/30 text-accent"
          label="Answered"
        />
        <LegendDot
          color="bg-primary/20 border border-primary/30 text-primary"
          label="Selected"
        />
        <LegendDot color="bg-muted text-muted-foreground" label="Unanswered" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded-sm ${color}`} />
      <span className="text-xs font-body text-muted-foreground">{label}</span>
    </div>
  );
}
