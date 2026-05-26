import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExamQuestions } from "@/hooks/useExams";
import { useExamStore } from "@/store/examStore";
import { getDomainLabel } from "@/types/exam";
import type { KnowledgeDomain, Question } from "@/types/exam";
import type { StudyHistoryEntry } from "@/utils/studyHistory";
import { saveAttempt } from "@/utils/studyHistory";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Home,
  RotateCcw,
  Shuffle,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function domainAccuracyClass(pct: number): string {
  if (pct >= 70) return "border-green-500/50 bg-green-500/10";
  if (pct >= 50) return "border-yellow-500/50 bg-yellow-500/10";
  return "border-destructive/50 bg-destructive/10";
}

function domainBarClass(pct: number): string {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-destructive";
}

function domainTextClass(pct: number): string {
  if (pct >= 70) return "text-green-600";
  if (pct >= 50) return "text-yellow-600";
  return "text-destructive";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DomainCard({
  domain,
  correct,
  total,
}: {
  domain: KnowledgeDomain;
  correct: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${domainAccuracyClass(
        pct,
      )}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-display font-medium text-foreground leading-tight">
          {getDomainLabel(domain)}
        </p>
        <span
          className={`text-sm font-mono font-bold shrink-0 ${domainTextClass(pct)}`}
        >
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${domainBarClass(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {correct}/{total}
        </span>
      </div>
    </div>
  );
}

function QuestionReviewItem({
  question,
  index,
  selectedAnswer,
  wasSubmitted,
}: {
  question: Question;
  index: number;
  selectedAnswer: number | undefined;
  wasSubmitted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const correctIdx = Number(question.correctOptionIndex);
  const isCorrect = wasSubmitted && selectedAnswer === correctIdx;
  const isIncorrect = wasSubmitted && selectedAnswer !== correctIdx;
  const skipped = !wasSubmitted;

  return (
    <div
      data-ocid={`results.review.item.${index + 1}`}
      className={`rounded-xl border overflow-hidden transition-smooth ${
        isCorrect
          ? "border-green-500/40 bg-green-500/5"
          : isIncorrect
            ? "border-destructive/40 bg-destructive/5"
            : "border-border bg-card"
      }`}
    >
      {/* Question header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors duration-200"
        data-ocid={`results.review.toggle.${index + 1}`}
      >
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
            isCorrect
              ? "bg-green-500/20 text-green-600"
              : isIncorrect
                ? "bg-destructive/20 text-destructive"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-foreground leading-snug">
            {question.text}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {isCorrect && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-500/40 bg-green-500/10 text-[10px] py-0"
              >
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Correct
              </Badge>
            )}
            {isIncorrect && (
              <Badge
                variant="outline"
                className="text-destructive border-destructive/40 bg-destructive/10 text-[10px] py-0"
              >
                <XCircle className="w-2.5 h-2.5 mr-1" /> Incorrect
              </Badge>
            )}
            {skipped && (
              <Badge
                variant="outline"
                className="text-muted-foreground text-[10px] py-0"
              >
                Skipped
              </Badge>
            )}
            {!question.isScored && (
              <Badge
                variant="outline"
                className="text-muted-foreground text-[10px] py-0"
              >
                Unscored
              </Badge>
            )}
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Options */}
          <div className="flex flex-col gap-1.5">
            {question.options.map((opt, i) => {
              const isCorrectOpt = i === correctIdx;
              const isSelected = selectedAnswer === i;
              return (
                <div
                  key={opt}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-body border ${
                    isCorrectOpt
                      ? "border-green-500/50 bg-green-500/10 text-green-600"
                      : isSelected && !isCorrectOpt
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-transparent text-muted-foreground"
                  }`}
                >
                  <span className="w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 min-w-0">{opt}</span>
                  {isCorrectOpt && (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {isSelected && !isCorrectOpt && (
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5">
            <p className="text-xs font-display font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Explanation
            </p>
            <p className="text-sm font-body text-foreground leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ResultsPage() {
  const { versionId } = useParams({ from: "/results/$versionId" });
  const { session, clearSession } = useExamStore();
  const navigate = useNavigate();

  // Snapshot the session so clearing doesn't blank the page
  const snapshotRef = useRef(session);
  const historySavedRef = useRef(false);
  useEffect(() => {
    if (session && session.versionId === versionId) {
      snapshotRef.current = session;
    }
  }, [session, versionId]);

  // Also fetch questions from backend for the review (fallback to store questions)
  const { data: fetchedQuestions, isLoading: questionsLoading } =
    useExamQuestions(versionId);

  const snap = snapshotRef.current;

  // Auto-save to study history — must be before any early return (hooks rule)
  useEffect(() => {
    if (historySavedRef.current) return;
    if (!snap || snap.versionId !== versionId || !snap.isComplete) return;
    historySavedRef.current = true;

    const resolvedQuestions = fetchedQuestions?.length
      ? fetchedQuestions
      : snap.questions;
    const resolvedScored = resolvedQuestions.filter(
      (q) => q.isScored && snap.submitted[q.id],
    );
    const resolvedCorrect = resolvedScored.filter(
      (q) => snap.answers[q.id] === Number(q.correctOptionIndex),
    ).length;
    const resolvedTotal = resolvedScored.length;
    const resolvedPct =
      resolvedTotal > 0
        ? Math.round((resolvedCorrect / resolvedTotal) * 100)
        : 0;
    const resolvedPassed = resolvedPct >= 70;
    const resolvedElapsed = Math.floor((Date.now() - snap.startTime) / 1000);

    const domainBreakdown: Record<string, { correct: number; total: number }> =
      {};
    for (const q of resolvedScored) {
      const label = getDomainLabel(q.knowledgeDomain);
      const isCorrect = snap.answers[q.id] === Number(q.correctOptionIndex);
      if (domainBreakdown[label]) {
        domainBreakdown[label].total++;
        if (isCorrect) domainBreakdown[label].correct++;
      } else {
        domainBreakdown[label] = { correct: isCorrect ? 1 : 0, total: 1 };
      }
    }

    const versionName = snap.versionId
      .replace("ptcb-randomized", "Randomized Practice")
      .replace("ptcb-v1", "PTCB Version 1")
      .replace("ptcb-v2", "PTCB Version 2")
      .replace("ptcb-v3", "PTCB Version 3");

    const entry: StudyHistoryEntry = {
      id: `${snap.versionId}-${snap.startTime}`,
      versionId: snap.versionId,
      versionName,
      examName:
        snap.examId === "ptcb" ? "PTCB Exam" : snap.examId.toUpperCase(),
      date: new Date(snap.startTime).toISOString(),
      score: resolvedPct,
      passed: resolvedPassed,
      timeTaken: resolvedElapsed,
      domainBreakdown,
    };
    saveAttempt(entry);
  }, [snap, versionId, fetchedQuestions]);

  // If no session data, show redirect message
  if (!snap || snap.versionId !== versionId) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center gap-6"
        data-ocid="results.empty_state"
      >
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-display font-semibold text-xl text-foreground">
            No results found
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            It looks like you haven't completed this exam yet. Start an exam to
            see your results here.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild data-ocid="results.home_button">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button asChild data-ocid="results.start_exam_button">
            <Link to="/exam/$versionId" params={{ versionId }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Start Exam
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { answers, submitted, startTime, examId } = snap;
  const questions = fetchedQuestions?.length
    ? fetchedQuestions
    : snap.questions;
  const elapsed = Date.now() - startTime;

  // -------------------------------------------------------------------------
  // Score calculation — only scored + submitted questions count
  // -------------------------------------------------------------------------
  const scoredQuestions = questions.filter(
    (q) => q.isScored && submitted[q.id],
  );
  const correctCount = scoredQuestions.filter(
    (q) => answers[q.id] === Number(q.correctOptionIndex),
  ).length;
  const totalScored = scoredQuestions.length;
  const percentage =
    totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0;
  const passed = percentage >= 70; // PTCB passing threshold ≈70%

  // -------------------------------------------------------------------------
  // Domain breakdown
  // -------------------------------------------------------------------------
  const domainMap = new Map<
    string,
    { domain: KnowledgeDomain; correct: number; total: number }
  >();
  for (const q of scoredQuestions) {
    const key = q.knowledgeDomain.__kind__;
    const existing = domainMap.get(key);
    const isCorrect = answers[q.id] === Number(q.correctOptionIndex);
    if (existing) {
      existing.total++;
      if (isCorrect) existing.correct++;
    } else {
      domainMap.set(key, {
        domain: q.knowledgeDomain,
        correct: isCorrect ? 1 : 0,
        total: 1,
      });
    }
  }

  const handleRetake = () => {
    clearSession();
    navigate({ to: "/exams/$examId", params: { examId } });
  };

  const handleTryAnother = () => {
    clearSession();
    navigate({ to: "/exams/$examId", params: { examId } });
  };

  const handleHome = () => {
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <div className="flex-1 py-10 px-4" data-ocid="results.page">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* ------------------------------------------------------------------ */}
        {/* Score hero card */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center gap-5 shadow-elevated"
          data-ocid="results.score_card"
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              passed
                ? "bg-green-500/15 border-2 border-green-500/40"
                : "bg-destructive/15 border-2 border-destructive/40"
            }`}
          >
            {passed ? (
              <Trophy className="w-9 h-9 text-green-600" />
            ) : (
              <XCircle className="w-9 h-9 text-destructive" />
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <p
              className={`font-display font-bold text-7xl leading-none ${
                passed ? "text-green-600" : "text-destructive"
              }`}
            >
              {percentage}%
            </p>
            <Badge
              variant="outline"
              className={`mt-2 text-sm px-4 py-1 font-display font-semibold ${
                passed
                  ? "text-green-600 border-green-500/40 bg-green-500/10"
                  : "text-destructive border-destructive/40 bg-destructive/10"
              }`}
            >
              {passed ? "PASSED" : "DID NOT PASS"}
            </Badge>
            <p className="text-base font-body text-muted-foreground mt-2">
              {passed
                ? "Outstanding work — you've met the PTCB standard!"
                : "Keep studying — you're building the right foundation."}
            </p>
          </div>

          <div className="flex items-center gap-8 pt-2 border-t border-border w-full justify-center">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {correctCount}
              </p>
              <p className="text-xs font-body text-muted-foreground">Correct</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {totalScored - correctCount}
              </p>
              <p className="text-xs font-body text-muted-foreground">
                Incorrect
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {totalScored}
              </p>
              <p className="text-xs font-body text-muted-foreground">Scored</p>
            </div>
            {elapsed > 0 && (
              <>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-sm font-display font-bold text-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatElapsed(elapsed)}
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    Time taken
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Domain breakdown */}
        {/* ------------------------------------------------------------------ */}
        {domainMap.size > 0 && (
          <div
            className="bg-card border border-border rounded-2xl p-6"
            data-ocid="results.domain_section"
          >
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Knowledge Domain Breakdown
              </h2>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              data-ocid="results.domain_breakdown"
            >
              {Array.from(domainMap.values()).map(
                ({ domain, correct, total }) => (
                  <DomainCard
                    key={domain.__kind__}
                    domain={domain}
                    correct={correct}
                    total={total}
                  />
                ),
              )}
            </div>
            <p className="text-xs font-body text-muted-foreground mt-4">
              <span className="inline-flex items-center gap-1 mr-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                ≥70% (passing)
              </span>
              <span className="inline-flex items-center gap-1 mr-3">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                50–69% (needs review)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" />
                &lt;50% (focus area)
              </span>
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Full question review */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="bg-card border border-border rounded-2xl p-6"
          data-ocid="results.review_section"
        >
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-base text-foreground">
              Full Answer Review
            </h2>
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {questions.length} questions
            </span>
          </div>

          {questionsLoading ? (
            <div
              className="flex flex-col gap-2"
              data-ocid="results.review.loading_state"
            >
              {["sk1", "sk2", "sk3", "sk4", "sk5"].map((sk) => (
                <Skeleton key={sk} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col gap-2"
              data-ocid="results.review.list"
            >
              {questions.map((q, i) => (
                <QuestionReviewItem
                  key={q.id}
                  question={q}
                  index={i}
                  selectedAnswer={answers[q.id]}
                  wasSubmitted={!!submitted[q.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Action buttons */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="flex flex-wrap gap-3 justify-end pb-6"
          data-ocid="results.actions"
        >
          <Button
            variant="outline"
            onClick={handleHome}
            data-ocid="results.home_button"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="secondary"
            onClick={handleTryAnother}
            data-ocid="results.try_another_button"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Try Another Version
          </Button>
          <Button onClick={handleRetake} data-ocid="results.retake_button">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake This Version
          </Button>
        </div>
      </div>
    </div>
  );
}
