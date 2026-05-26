import { createActor } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useExamQuestions } from "@/hooks/useExams";
import { useExamStore } from "@/store/examStore";
import type { CertificationExam, ExamVersion, Question } from "@/types/exam";
import { getDomainLabel } from "@/types/exam";
import { getHistory } from "@/utils/studyHistory";
import {
  createActorWithConfig,
  useActor,
} from "@caffeineai/core-infrastructure";
import { Link, useParams } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Clock,
  Database,
  HelpCircle,
  Lightbulb,
  ListOrdered,
  RefreshCw,
  Shuffle,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

type BackendActor = {
  getExamDetails: (
    id: string,
  ) => Promise<
    | CertificationExam
    | { __kind__: "Some"; value: CertificationExam }
    | { __kind__: "None" }
  >;
  getExamVersions: (id: string) => Promise<ExamVersion[]>;
};

// ── Type for AnyActor ──────────────────────────────────────────────────────────
type AnyActor = {
  getExamQuestions: (id: string) => Promise<Question[]>;
};

// ── PTCE official domain distribution ────────────────────────────────────────
const PTCE_DOMAINS = [
  { label: "Medications", pct: 40 },
  { label: "Federal Requirements", pct: 12.5 },
  { label: "Patient Safety & QA", pct: 26.25 },
  { label: "Order Entry", pct: 21.25 },
] as const;

// ── Domain weights for PTCE ───────────────────────────────────────────────────
const DOMAIN_WEIGHTS = [
  { kind: "Medications" as const, pct: 40 },
  { kind: "FederalRequirements" as const, pct: 12.5 },
  { kind: "PatientSafety" as const, pct: 26.25 },
  { kind: "OrderEntry" as const, pct: 21.25 },
];

/* Removed static fallback catalog (now using backend-supplied versions only) */

/** Fisher-Yates shuffle using a string seed */
function fisherYates<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({
  message,
  onRetry,
}: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm font-body">
      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <span className="flex-1 text-destructive">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 flex items-center gap-1 text-xs font-display font-semibold text-destructive hover:opacity-80 transition-opacity"
      >
        <RefreshCw className="w-3 h-3" />
        Try Again
      </button>
    </div>
  );
}

// ── InstantSolutionRow ────────────────────────────────────────────────────────
function InstantSolutionRow({
  enabled,
  onToggle,
  ocid,
}: { enabled: boolean; onToggle: (v: boolean) => void; ocid: string }) {
  return (
    <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-body text-muted-foreground">
          Show solution after each question
        </span>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} data-ocid={ocid} />
    </div>
  );
}

// ── Weak Areas Version Card ───────────────────────────────────────────────────
function WeakAreasVersionCard({
  examId,
  index,
}: { examId: string; index: number }) {
  const { startSession } = useExamStore();
  const router = useRouter();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [instantSolutionEnabled, setInstantSolutionEnabled] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const { actor, isFetching } = useActor(createActor);

  const history = getHistory();

  // Compute domain scores from history
  const domainTotals: Record<string, { correct: number; total: number }> = {};
  for (const entry of history) {
    for (const [domain, stats] of Object.entries(entry.domainBreakdown)) {
      if (!domainTotals[domain])
        domainTotals[domain] = { correct: 0, total: 0 };
      domainTotals[domain].correct += stats.correct;
      domainTotals[domain].total += stats.total;
    }
  }

  // Compute pct per domain and sort ascending
  const domainScores = Object.entries(domainTotals)
    .filter(([, s]) => s.total > 0)
    .map(([domain, s]) => ({
      domain,
      pct: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct);

  // Identify weak domains (below average or lowest 2)
  const weakDomains =
    domainScores.length > 0
      ? domainScores.slice(0, Math.min(2, domainScores.length))
      : [];

  // Kind-lookup map: domain label → kind string
  const LABEL_TO_KIND: Record<string, string> = {
    Medications: "Medications",
    "Federal Requirements": "FederalRequirements",
    "Patient Safety & Quality Assurance": "PatientSafety",
    "Order Entry & Processing": "OrderEntry",
  };

  const weakKinds = weakDomains
    .map((d) => LABEL_TO_KIND[d.domain])
    .filter(Boolean);

  const hasHistory = history.length > 0;
  const actorReady = !!actor && !isFetching;

  const handleStart = async () => {
    if (!actor || isFetching || weakKinds.length === 0) return;
    setIsBuilding(true);
    setBuildError(null);
    try {
      const versionIds = [
        "ptcb-v1",
        "ptcb-v2",
        "ptcb-v3",
        "ptcb-v4",
        "ptcb-v5",
        "ptcb-v6",
        "ptcb-v7",
        "ptcb-v8",
        "ptcb-v9",
        "ptcb-v10",
        "ptcb-v11",
      ];
      const results = await Promise.allSettled(
        versionIds.map((id) =>
          (actor as unknown as AnyActor).getExamQuestions(id),
        ),
      );
      const pool: Question[] = results
        .filter(
          (r): r is PromiseFulfilledResult<Question[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value);

      if (pool.length === 0) {
        setBuildError(
          "Could not load questions. Please check your connection and try again.",
        );
        return;
      }

      // Filter to weak domain questions only
      const weakPool = pool.filter((q) =>
        weakKinds.includes(q.knowledgeDomain.__kind__),
      );
      const shuffled = fisherYates(
        weakPool.length > 0 ? weakPool : pool,
        Date.now().toString(),
      );
      const TARGET = 35;
      const selected = shuffled.slice(0, TARGET);

      startSession(
        "ptcb-weak-areas",
        examId,
        selected,
        45, // 45-minute timer for 35 questions
        timerEnabled,
        instantSolutionEnabled,
      );
      router.navigate({
        to: "/exam/$versionId",
        params: { versionId: "ptcb-weak-areas" },
      });
    } catch {
      setBuildError("Failed to build Weak Areas exam. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div
      className="bg-card border border-[oklch(0.75_0.15_280)]/30 rounded-xl p-6 flex flex-col gap-4 hover:border-[oklch(0.75_0.15_280)]/60 transition-colors duration-200 relative overflow-hidden col-span-full"
      data-ocid={`versions.item.${index}`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[oklch(0.65_0.18_280)]/80 via-primary/40 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[oklch(0.65_0.18_280)]" />
            <h3 className="font-display font-semibold text-foreground">
              Weak Areas Practice
            </h3>
            <span className="text-xs font-mono font-semibold bg-[oklch(0.65_0.18_280)]/10 border border-[oklch(0.65_0.18_280)]/20 text-[oklch(0.65_0.18_280)] px-2 py-0.5 rounded-md">
              FOCUS
            </span>
          </div>
          <p className="text-xs font-body text-muted-foreground max-w-xl">
            35 questions drawn exclusively from your lowest-scoring knowledge
            domains. Perfect for targeted remediation.
          </p>
        </div>
      </div>

      {!hasHistory ? (
        <div
          className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg px-4 py-3"
          data-ocid="versions.weak_areas.empty_state"
        >
          <BarChart2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs font-body text-muted-foreground">
            Complete at least one practice exam to unlock Weak Areas Practice.
            Your domain scores will be analyzed automatically.
          </p>
        </div>
      ) : (
        <>
          {weakDomains.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-body text-muted-foreground self-center">
                Focusing on:
              </span>
              {weakDomains.map((d) => (
                <span
                  key={d.domain}
                  className="inline-flex items-center gap-1.5 text-xs font-display font-semibold bg-destructive/10 border border-destructive/30 text-destructive px-2.5 py-1 rounded-full"
                >
                  {d.domain}
                  <span className="font-mono opacity-70">{d.pct}%</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-5 text-xs font-body text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" />
              35 questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              45 min timer
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[oklch(0.65_0.18_280)]" />
              Weak-domain targeted
            </span>
          </div>

          {buildError && (
            <ErrorBanner
              message={buildError}
              onRetry={() => setBuildError(null)}
            />
          )}

          <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-body text-muted-foreground">
                Enable 45-minute timer
              </span>
            </div>
            <Switch
              checked={timerEnabled}
              onCheckedChange={setTimerEnabled}
              data-ocid={`versions.timer_toggle.${index}`}
            />
          </div>

          <InstantSolutionRow
            enabled={instantSolutionEnabled}
            onToggle={setInstantSolutionEnabled}
            ocid={`versions.instant_solution_toggle.${index}`}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1">
            <button
              type="button"
              onClick={handleStart}
              disabled={isBuilding || !actorReady}
              data-ocid={`versions.start_button.${index}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[oklch(0.52_0.18_280)] text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBuilding ? "Building exam..." : "Start Weak Areas Practice"}
              {!isBuilding && <Target className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Daily Quiz version card (25 questions, 30-minute timer) ─────────────────
function DailyQuizVersionCard({
  examId,
  index,
}: { examId: string; index: number }) {
  const { startSession } = useExamStore();
  const router = useRouter();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [instantSolutionEnabled, setInstantSolutionEnabled] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const { actor, isFetching } = useActor(createActor);

  const QUIZ_QUESTION_COUNT = 25;
  const QUIZ_TIMER_MINUTES = 30;

  const handleStart = async () => {
    if (!actor || isFetching) return;
    setIsBuilding(true);
    setBuildError(null);
    try {
      const results = await Promise.allSettled([
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v1"),
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v2"),
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v3"),
      ]);
      const pool = results
        .filter(
          (r): r is PromiseFulfilledResult<Question[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value);

      if (pool.length === 0) {
        setBuildError(
          "Could not load questions. Please check your connection and try again.",
        );
        return;
      }

      const shuffled = fisherYates(pool, Date.now().toString());
      const selected: Question[] = [];
      for (const { kind, pct } of DOMAIN_WEIGHTS) {
        const target = Math.round((pct / 100) * QUIZ_QUESTION_COUNT);
        const domainPool = shuffled.filter(
          (q) => q.knowledgeDomain.__kind__ === kind,
        );
        selected.push(...domainPool.slice(0, target));
      }
      if (selected.length < QUIZ_QUESTION_COUNT) {
        const usedIds = new Set(selected.map((q) => q.id));
        const extras = shuffled.filter((q) => !usedIds.has(q.id));
        selected.push(
          ...extras.slice(0, QUIZ_QUESTION_COUNT - selected.length),
        );
      }
      const quizQuestions = fisherYates(
        selected.slice(0, QUIZ_QUESTION_COUNT),
        Date.now().toString(),
      );

      startSession(
        "ptcb-daily-quiz",
        examId,
        quizQuestions,
        QUIZ_TIMER_MINUTES,
        timerEnabled,
        instantSolutionEnabled,
      );
      router.navigate({
        to: "/exam/$versionId",
        params: { versionId: "ptcb-daily-quiz" },
      });
    } catch {
      setBuildError("Failed to build the Daily Quiz. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  const actorReady = !!actor && !isFetching;

  return (
    <div
      className="bg-card border border-primary/40 rounded-xl p-6 flex flex-col gap-4 hover:border-primary/60 transition-colors duration-200 relative overflow-hidden col-span-full"
      data-ocid={`versions.item.${index}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              Daily Quiz — 25 Questions
            </h3>
            <span className="text-xs font-mono text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
              QUICK
            </span>
          </div>
          <p className="text-xs font-body text-muted-foreground max-w-xl">
            25 randomized questions sampled across all PTCE domains — perfect
            for a quick daily practice session. Finish in under 30 minutes.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          25 questions
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          25 scored
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          30 min timer
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          PTCE domain-weighted
        </span>
      </div>

      {buildError && (
        <ErrorBanner message={buildError} onRetry={() => setBuildError(null)} />
      )}

      <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-body text-muted-foreground">
            Enable 30-minute timer
          </span>
        </div>
        <Switch
          checked={timerEnabled}
          onCheckedChange={setTimerEnabled}
          data-ocid={`versions.timer_toggle.${index}`}
        />
      </div>

      <InstantSolutionRow
        enabled={instantSolutionEnabled}
        onToggle={setInstantSolutionEnabled}
        ocid={`versions.instant_solution_toggle.${index}`}
      />

      <button
        type="button"
        onClick={handleStart}
        disabled={isBuilding || !actorReady}
        data-ocid={`versions.start_button.${index}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBuilding ? "Building quiz..." : "Start Daily Quiz"}
        {!isBuilding && <Zap className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Standard version card ─────────────────────────────────────────────────────
function VersionCard({
  version,
  examId,
  index,
}: {
  version: ExamVersion;
  examId: string;
  index: number;
}) {
  if (version.id === "ptcb-daily-quiz") {
    return <DailyQuizVersionCard examId={examId} index={index} />;
  }
  if (version.id === "ptcb-weak-areas") {
    return <WeakAreasVersionCard examId={examId} index={index} />;
  }
  if (version.id === "ptcb-randomized") {
    return (
      <RandomizedVersionCard version={version} examId={examId} index={index} />
    );
  }
  if (version.id === "ptcb-full-pool") {
    return (
      <FullPoolVersionCard version={version} examId={examId} index={index} />
    );
  }
  return (
    <StandardVersionCard version={version} examId={examId} index={index} />
  );
}

/* StaticVersionCard removed — rely on backend-provided versions */

function StandardVersionCard({
  version,
  examId,
  index,
}: {
  version: ExamVersion;
  examId: string;
  index: number;
}) {
  const {
    data: questions,
    isLoading,
    isError,
    refetch,
  } = useExamQuestions(version.id);
  const { startSession } = useExamStore();
  const router = useRouter();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [instantSolutionEnabled, setInstantSolutionEnabled] = useState(true);

  const handleStart = () => {
    if (!questions) return;
    const shuffled = fisherYates(questions, Date.now().toString());
    startSession(
      version.id,
      examId,
      shuffled,
      Number(version.timeLimitMinutes),
      timerEnabled,
      instantSolutionEnabled,
    );
    router.navigate({
      to: "/exam/$versionId",
      params: { versionId: version.id },
    });
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors duration-200"
      data-ocid={`versions.item.${index}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-foreground">
            {version.versionName}
          </h3>
          <p className="text-xs font-body text-muted-foreground mt-1">
            Version ID: {version.id}
          </p>
        </div>
        <span className="text-xs font-mono text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">
          {(() => {
            const m = version.id.match(/^ptcb-v(\d+)$/);
            if (m) return `v${m[1]}`;
            if (version.id === "ptcb-randomized") return "RAND";
            if (version.id === "ptcb-full-pool") return "FULL";
            return "";
          })()}
        </span>
      </div>

      <div className="flex items-center gap-5 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          {String(version.totalQuestions)} questions
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          {String(version.scoredQuestions)} scored
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {String(version.timeLimitMinutes)} min
        </span>
      </div>

      {isError && (
        <ErrorBanner
          message="Could not load questions for this version."
          onRetry={() => refetch()}
        />
      )}

      <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-body text-muted-foreground">
            Enable {String(version.timeLimitMinutes)}-minute timer
          </span>
        </div>
        <Switch
          checked={timerEnabled}
          onCheckedChange={setTimerEnabled}
          data-ocid={`versions.timer_toggle.${index}`}
        />
      </div>

      <InstantSolutionRow
        enabled={instantSolutionEnabled}
        onToggle={setInstantSolutionEnabled}
        ocid={`versions.instant_solution_toggle.${index}`}
      />

      <button
        type="button"
        onClick={handleStart}
        disabled={isLoading || !questions || isError}
        data-ocid={`versions.start_button.${index}`}
        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading questions..." : "Start Exam"}
        {!isLoading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

function RandomizedVersionCard({
  version,
  examId,
  index,
}: {
  version: ExamVersion;
  examId: string;
  index: number;
}) {
  const { startSession } = useExamStore();
  const router = useRouter();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [instantSolutionEnabled, setInstantSolutionEnabled] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const { actor, isFetching } = useActor(createActor);

  const handleStart = async () => {
    if (!actor || isFetching) return;
    setIsBuilding(true);
    setBuildError(null);
    try {
      const results = await Promise.allSettled([
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v1"),
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v2"),
        (actor as unknown as AnyActor).getExamQuestions("ptcb-v3"),
      ]);
      const pool = results
        .filter(
          (r): r is PromiseFulfilledResult<Question[]> =>
            r.status === "fulfilled",
        )
        .flatMap((r) => r.value);

      if (pool.length === 0) {
        setBuildError(
          "Could not load questions. Please check your connection and try again.",
        );
        return;
      }

      const shuffled = fisherYates(pool, Date.now().toString());
      const selected = shuffled.slice(0, 90);
      startSession(
        version.id,
        examId,
        selected,
        Number(version.timeLimitMinutes),
        timerEnabled,
        instantSolutionEnabled,
      );
      router.navigate({
        to: "/exam/$versionId",
        params: { versionId: version.id },
      });
    } catch {
      setBuildError("Failed to build the randomized exam. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  const actorReady = !!actor && !isFetching;

  return (
    <div
      className="bg-card border border-primary/30 rounded-xl p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors duration-200 relative overflow-hidden"
      data-ocid={`versions.item.${index}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shuffle className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              {version.versionName}
            </h3>
          </div>
          <p className="text-xs font-body text-muted-foreground">
            90 random questions drawn from all PTCB versions. A new set each
            time you start.
          </p>
        </div>
        <span className="text-xs font-mono text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-1 rounded-md shrink-0">
          RAND
        </span>
      </div>

      <div className="flex items-center gap-5 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          90 questions
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          90 scored
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {String(version.timeLimitMinutes)} min
        </span>
      </div>

      {buildError && (
        <ErrorBanner message={buildError} onRetry={() => setBuildError(null)} />
      )}

      <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-body text-muted-foreground">
            Enable {String(version.timeLimitMinutes)}-minute timer
          </span>
        </div>
        <Switch
          checked={timerEnabled}
          onCheckedChange={setTimerEnabled}
          data-ocid={`versions.timer_toggle.${index}`}
        />
      </div>

      <InstantSolutionRow
        enabled={instantSolutionEnabled}
        onToggle={setInstantSolutionEnabled}
        ocid={`versions.instant_solution_toggle.${index}`}
      />

      <button
        type="button"
        onClick={handleStart}
        disabled={isBuilding || !actorReady}
        data-ocid={`versions.start_button.${index}`}
        className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBuilding ? "Building exam..." : "Start Randomized Exam"}
        {!isBuilding && <Shuffle className="w-4 h-4" />}
      </button>
    </div>
  );
}

function FullPoolVersionCard({
  version,
  examId,
  index,
}: {
  version: ExamVersion;
  examId: string;
  index: number;
}) {
  const { startSession } = useExamStore();
  const router = useRouter();
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(110);
  const [instantSolutionEnabled, setInstantSolutionEnabled] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const { actor, isFetching } = useActor(createActor);

  const TOTAL_VERSIONS = 11;

  const handleStart = async () => {
    if (!actor || isFetching) return;
    setIsBuilding(true);
    setBuildError(null);
    setLoadedCount(0);
    try {
      const versionIds = [
        "ptcb-v1",
        "ptcb-v2",
        "ptcb-v3",
        "ptcb-v4",
        "ptcb-v5",
        "ptcb-v6",
        "ptcb-v7",
        "ptcb-v8",
        "ptcb-v9",
        "ptcb-v10",
        "ptcb-v11",
      ];
      const allQuestions: Question[] = [];
      let successCount = 0;
      for (const id of versionIds) {
        try {
          const qs = await (actor as unknown as AnyActor).getExamQuestions(id);
          allQuestions.push(...qs);
          successCount++;
          setLoadedCount(successCount);
        } catch {
          setLoadedCount((n) => n + 1);
        }
      }

      if (allQuestions.length === 0) {
        setBuildError(
          "Could not load any questions. Please check your connection and try again.",
        );
        return;
      }

      const shuffled = fisherYates(allQuestions, Date.now().toString());
      const effectiveMinutes = timerEnabled
        ? timerMinutes
        : Number(version.timeLimitMinutes);
      startSession(
        "ptcb-full-pool",
        examId,
        shuffled,
        effectiveMinutes,
        timerEnabled,
        instantSolutionEnabled,
      );
      router.navigate({
        to: "/exam/$versionId",
        params: { versionId: "ptcb-full-pool" },
      });
    } catch {
      setBuildError("Failed to build the Full Pool exam. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  const actorReady = !!actor && !isFetching;

  return (
    <div
      className="bg-card border border-accent/30 rounded-xl p-6 flex flex-col gap-4 hover:border-accent/60 transition-colors duration-200 relative overflow-hidden col-span-full"
      data-ocid={`versions.item.${index}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/60 via-primary/60 to-accent/60" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-foreground">
              Full Pool Exam — All Questions
            </h3>
            <span className="text-xs font-mono text-accent font-semibold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md">
              FULL
            </span>
          </div>
          <p className="text-xs font-body text-muted-foreground max-w-xl">
            All ~990 questions from the complete PTCB question pool in a single
            session — shuffled fresh every time. Far more coverage than the real
            PTCE (90 questions) — ideal for exhaustive preparation.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          ~990 questions total
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          All ~990 scored
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timerEnabled ? `${timerMinutes} min timer` : "No timer"}
        </span>
      </div>

      <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
        <p className="text-xs font-display font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider">
          Official PTCE Domain Distribution
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PTCE_DOMAINS.map((d) => (
            <div key={d.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-muted-foreground truncate pr-1">
                  {d.label}
                </span>
                <span className="text-xs font-mono font-semibold text-foreground shrink-0">
                  {d.pct}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {buildError && (
        <ErrorBanner message={buildError} onRetry={() => setBuildError(null)} />
      )}

      {isBuilding && (
        <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
          <div className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          Loading versions... {loadedCount}/{TOTAL_VERSIONS}
        </div>
      )}

      {/* Timer row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-body text-muted-foreground">
              Enable countdown timer
            </span>
          </div>
          <Switch
            checked={timerEnabled}
            onCheckedChange={setTimerEnabled}
            data-ocid={`versions.timer_toggle.${index}`}
          />
        </div>
        {timerEnabled && (
          <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-body text-muted-foreground shrink-0">
              Timer duration (minutes)
            </span>
            <input
              type="number"
              min={1}
              max={600}
              value={timerMinutes}
              onChange={(e) => {
                const val = Math.max(1, Math.min(600, Number(e.target.value)));
                setTimerMinutes(Number.isNaN(val) ? 110 : val);
              }}
              className="ml-auto w-20 rounded-md border border-input bg-background px-2 py-1 text-xs font-mono text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
              data-ocid={`versions.timer_minutes_input.${index}`}
            />
          </div>
        )}
      </div>

      <InstantSolutionRow
        enabled={instantSolutionEnabled}
        onToggle={setInstantSolutionEnabled}
        ocid={`versions.instant_solution_toggle.${index}`}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1">
        <button
          type="button"
          onClick={handleStart}
          disabled={isBuilding || !actorReady}
          data-ocid={`versions.start_button.${index}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBuilding
            ? `Loading... (${loadedCount}/${TOTAL_VERSIONS})`
            : "Start Full Pool Exam"}
          {!isBuilding && <Database className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function ExamSelectPage() {
  const { examId } = useParams({ from: "/exams/$examId" });
  const [exam, setExam] = useState<CertificationExam | null>(null);
  const [versions, setVersions] = useState<ExamVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const actor = (await createActorWithConfig(
          createActor,
        )) as unknown as BackendActor;
        const [examResult, versionsResult] = await Promise.all([
          actor.getExamDetails(examId),
          actor.getExamVersions(examId),
        ]);

        if (cancelled) return;

        const resolvedExam =
          examResult &&
          typeof examResult === "object" &&
          "__kind__" in examResult
            ? examResult.__kind__ === "Some"
              ? examResult.value
              : null
            : (examResult as CertificationExam | null);

        setExam(resolvedExam ?? null);
        setVersions(Array.isArray(versionsResult) ? versionsResult : []);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
        setExam(null);
        setVersions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  const displayVersions = versions;
  const useStaticCatalog = false;

  // Order versions: keep Daily Quiz and Weak Areas first, then numeric practice
  // tests sorted by their numeric suffix (ptcb-v1..ptcb-v11), then remaining
  // special modes (randomized/full-pool).
  function extractNumericVersionId(v: ExamVersion) {
    const m = v.id.match(/^ptcb-v(\d+)$/);
    return m ? Number(m[1]) : null;
  }
  const specialsFirst = displayVersions.filter(
    (v) => v.id === "ptcb-daily-quiz" || v.id === "ptcb-weak-areas",
  );
  const numericVersions = displayVersions
    .filter((v) => extractNumericVersionId(v) !== null)
    .sort(
      (a, b) =>
        (extractNumericVersionId(a) ?? 0) - (extractNumericVersionId(b) ?? 0),
    );
  const otherModes = displayVersions.filter(
    (v) =>
      v.id !== "ptcb-daily-quiz" &&
      v.id !== "ptcb-weak-areas" &&
      extractNumericVersionId(v) === null,
  );
  const orderedVersions = [...specialsFirst, ...numericVersions, ...otherModes];

  // badge computation is inlined inside the card components

  // Suppress unused import warning for getDomainLabel
  void getDomainLabel;

  return (
    <div className="flex-1 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
          data-ocid="versions.back_link"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Exams
        </Link>

        {isLoading ? (
          <div className="mb-8" data-ocid="exam_detail.loading_state">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : exam ? (
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl text-foreground">
              {exam.name}
            </h1>
            <p className="text-sm font-body text-muted-foreground mt-2 leading-relaxed">
              {exam.description}
            </p>
          </div>
        ) : null}

        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-4">
            Select a Practice Version
          </h2>

          {/* Static fallback catalog removed; versions come from backend */}

          {!useStaticCatalog && isLoading && (
            <div
              className="grid gap-4 sm:grid-cols-2"
              data-ocid="versions.loading_state"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}

          {!useStaticCatalog && loadError && (
            <div
              className="flex flex-col items-center gap-3 py-12 border border-destructive/20 bg-destructive/5 rounded-xl text-center"
              data-ocid="versions.error_state"
            >
              <AlertCircle className="w-8 h-8 text-destructive/60" />
              <div>
                <p className="font-display font-semibold text-foreground">
                  Unable to load exam versions
                </p>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  This may be a temporary issue. Please try again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:opacity-90 transition-opacity"
                data-ocid="versions.retry_button"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}

          {!useStaticCatalog &&
            !isLoading &&
            !loadError &&
            displayVersions.length === 0 && (
              <div
                className="text-center py-16 border border-dashed border-border rounded-xl"
                data-ocid="versions.empty_state"
              >
                <p className="font-display font-medium text-foreground">
                  No versions available
                </p>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  This exam has no practice versions yet.
                </p>
              </div>
            )}

          {!useStaticCatalog && !isLoading && displayVersions.length > 0 && (
            <div
              className="grid gap-4 sm:grid-cols-2"
              data-ocid="versions.list"
            >
              {orderedVersions.map((version, i) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  examId={examId}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
