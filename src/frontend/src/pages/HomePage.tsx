import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExams } from "@/hooks/useExams";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Lock,
  Shield,
  Target,
} from "lucide-react";
import { useState } from "react";

// ── Sub-components ──────────────────────────────────────────────

interface ExamCardProps {
  id: string;
  badge: string;
  name: string;
  description: string;
  versionCount: number;
  to: string;
  params: Record<string, string>;
  index: number;
}

function ExamCard({
  badge,
  name,
  description,
  versionCount,
  to,
  params,
  index,
}: ExamCardProps) {
  return (
    <div
      className="group bg-card border border-border hover:border-primary/50 rounded-xl p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-elevated"
      data-ocid={`exams.item.${index}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="secondary"
          className="font-mono text-xs tracking-wider text-primary bg-primary/10 border-primary/20"
        >
          {badge}
        </Badge>
        <span className="text-xs font-body text-muted-foreground">
          {versionCount} versions
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <h3 className="font-display font-semibold text-foreground text-base leading-snug">
          {name}
        </h3>
        <p className="text-xs font-body text-muted-foreground leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-accent" /> 90 questions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-accent" /> 110 minutes
          </span>
        </div>
        <Button
          asChild
          className="w-full font-display font-semibold"
          data-ocid={`exams.take_exam_button.${index}`}
        >
          <Link
            to={to as "/exams/$examId"}
            params={params as { examId: string }}
          >
            Take Practice Exam
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface ComingSoonCardProps {
  badge: string;
  name: string;
  category: string;
  index: number;
}

function ComingSoonCard({ badge, name, category, index }: ComingSoonCardProps) {
  return (
    <div
      className="relative bg-card/60 border border-dashed border-border/60 rounded-xl p-6 flex flex-col gap-4 opacity-70"
      data-ocid={`exams.coming_soon.${index}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="outline"
          className="font-mono text-xs tracking-wider text-muted-foreground border-muted-foreground/30"
        >
          {badge}
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground">
          <Lock className="w-3 h-3" /> Coming Soon
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <h3 className="font-display font-medium text-muted-foreground text-base">
          {name}
        </h3>
        <p className="text-xs font-body text-muted-foreground/70">{category}</p>
      </div>
      <div className="pt-2 border-t border-border/40">
        <Button
          disabled
          variant="outline"
          className="w-full font-display text-sm opacity-50 cursor-not-allowed"
        >
          Notify Me When Available
        </Button>
      </div>
    </div>
  );
}

const COMING_SOON: Omit<ComingSoonCardProps, "index">[] = [
  {
    badge: "NHA",
    name: "Certified Clinical Medical Assistant",
    category: "Healthcare · Clinical & Administrative",
  },
  {
    badge: "NAPLEX",
    name: "North American Pharmacist Licensure Exam",
    category: "Pharmacy · Licensure",
  },
];

export function HomePage() {
  const { data: exams, isLoading, isError } = useExams();
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const ptcbExam = exams?.find((e) => e.id.toLowerCase() === "ptcb");

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Hero ────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-card border-b border-border"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-certprep.dim_1600x600.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
        data-ocid="home.hero"
      >
        {/* dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-background/80" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6 py-20 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-full">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-body font-medium text-primary tracking-wide">
              Professional Certification Training
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="font-display font-bold text-5xl sm:text-6xl text-foreground leading-tight tracking-tight">
              CertPrep <span className="text-primary">Academy</span>
            </h1>
            <p className="text-base font-body text-muted-foreground/90 italic">
              Prepare with confidence — pass with certainty
            </p>
          </div>

          <p className="text-sm font-body text-muted-foreground max-w-lg leading-relaxed">
            Exam-accurate practice tests with instant explanations. Built for
            serious candidates who expect nothing less than a passing score.
          </p>

          <div className="flex flex-wrap justify-center gap-5 mt-2">
            {[
              { icon: CheckCircle, text: "90–270 questions per mode" },
              { icon: Clock, text: "110-minute timed sessions" },
              { icon: BookOpen, text: "4 practice modes" },
              { icon: Target, text: "Instant explanations" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 text-xs font-body text-muted-foreground"
              >
                <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                {text}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={async () => {
                  setPingLoading(true);
                  setPingStatus(null);
                  try {
                    const res = await fetch("/ping.json", {
                      cache: "no-store",
                    });
                    if (!res.ok) throw new Error(res.statusText);
                    const data = await res.json();
                    setPingStatus(JSON.stringify(data));
                  } catch (e: any) {
                    setPingStatus(`Error: ${e?.message ?? e}`);
                  } finally {
                    setPingLoading(false);
                  }
                }}
                variant="outline"
              >
                {pingLoading ? "Pinging..." : "Ping backend"}
              </Button>
            </div>
            {pingStatus && (
              <div className="mt-3 text-center text-sm text-muted-foreground">
                {pingStatus}
              </div>
            )}
          </div>

          <Link
            to="/exams/$examId"
            params={{ examId: "ptcb" }}
            className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground font-display font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-smooth"
            data-ocid="home.hero.primary_button"
          >
            Start Practicing Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Exam Catalog ───────────────────────── */}
      <section
        className="flex-1 py-14 px-4 bg-background"
        data-ocid="home.exams.section"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="font-display font-semibold text-2xl text-foreground">
              Available Certifications
            </h2>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Choose a certification exam to begin your practice session
            </p>
          </div>

          {/* Loading skeletons */}
          {isLoading && (
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              data-ocid="exams.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <Skeleton className="h-5 w-20 mb-3" />
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="text-center py-12" data-ocid="exams.error_state">
              <p className="text-sm font-body text-muted-foreground">
                Unable to load exams. Please try again.
              </p>
            </div>
          )}

          {/* Exam cards + coming soon */}
          {!isLoading && !isError && (
            <div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              data-ocid="exams.list"
            >
              {/* ── Full-pool callout banner ── */}
              <div className="col-span-full bg-accent/5 border border-accent/20 rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
                  NEW
                </span>
                <p className="text-xs font-body text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Full Pool Exam now available —
                  </span>{" "}
                  4 practice modes including a 270-question full-pool session
                  covering the entire PTCB question bank.
                </p>
              </div>
              {/* ── PTCB card (live data or static fallback) ── */}
              <ExamCard
                id="ptcb"
                badge="PTCB"
                name={
                  ptcbExam?.name ?? "Pharmacy Technician Certification Exam"
                }
                description={
                  ptcbExam?.description ??
                  "Comprehensive practice modeled after the official PTCB exam covering pharmacology, drug interactions, sterile compounding, and more."
                }
                versionCount={4}
                to="/exams/$examId"
                params={{ examId: "ptcb" }}
                index={1}
              />

              {/* ── Coming soon cards ── */}
              {COMING_SOON.map((cs, i) => (
                <ComingSoonCard key={cs.badge} {...cs} index={i + 2} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA banner ─────────────────── */}
      <section className="py-12 px-4 bg-muted/40 border-t border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
          <Shield className="w-8 h-8 text-primary" />
          <h3 className="font-display font-semibold text-lg text-foreground">
            Exam-Accurate Practice
          </h3>
          <p className="text-sm font-body text-muted-foreground max-w-md leading-relaxed">
            Every question is crafted to reflect the structure, difficulty, and
            topic distribution of the real certification exam—so your practice
            time translates directly to exam-day confidence.
          </p>
        </div>
      </section>
    </div>
  );
}
