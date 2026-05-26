import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudyHistoryEntry } from "@/utils/studyHistory";
import { clearHistory, getHistory } from "@/utils/studyHistory";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  History,
  Home,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function AttemptCard({
  entry,
  index,
}: {
  entry: StudyHistoryEntry;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const domains = Object.entries(entry.domainBreakdown);

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden transition-colors duration-200 hover:border-primary/30 print:border print:border-gray-300 print:rounded-none print:mb-4"
      data-ocid={`history.item.${index + 1}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors duration-200 print:cursor-default"
        data-ocid={`history.toggle.${index + 1}`}
      >
        <div
          className={`shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 ${
            entry.passed
              ? "border-green-500/50 bg-green-500/10"
              : "border-destructive/50 bg-destructive/10"
          }`}
        >
          <span
            className={`text-lg font-display font-bold leading-none ${
              entry.passed ? "text-green-600" : "text-destructive"
            }`}
          >
            {entry.score}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-display font-semibold text-foreground text-sm leading-snug">
                {entry.examName}
              </p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {entry.versionName}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs font-display font-semibold ${
                entry.passed
                  ? "text-green-600 border-green-500/40 bg-green-500/10"
                  : "text-destructive border-destructive/40 bg-destructive/10"
              }`}
            >
              {entry.passed ? "PASSED" : "DID NOT PASS"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs font-body text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(entry.timeTaken)}
            </span>
            <span>{formatDate(entry.date)}</span>
          </div>
        </div>

        <span className="shrink-0 text-muted-foreground mt-1 print:hidden">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Expanded domain breakdown — always visible in print */}
      {(expanded || false) && domains.length > 0 && (
        <div className="px-5 pb-5 border-t border-border pt-4 print:block">
          <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Domain Breakdown
          </p>
          <div className="flex flex-col gap-2">
            {domains.map(([domain, stats]) => {
              const pct =
                stats.total > 0
                  ? Math.round((stats.correct / stats.total) * 100)
                  : 0;
              return (
                <div
                  key={domain}
                  className="flex items-center gap-3 text-sm font-body"
                >
                  <span className="flex-1 min-w-0 truncate text-foreground">
                    {domain}
                  </span>
                  <div className="w-24 h-1.5 bg-muted/60 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 70
                          ? "bg-green-500"
                          : pct >= 50
                            ? "bg-yellow-500"
                            : "bg-destructive"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0 w-20 text-right">
                    {stats.correct}/{stats.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Print-specific summary table rendered off-screen, mounted to DOM before print ──
function PrintDocument({ entries }: { entries: StudyHistoryEntry[] }) {
  const passed = entries.filter((e) => e.passed).length;
  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length)
      : 0;

  return (
    <div id="print-document">
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        CertPrep Academy — Study History
      </h1>
      <p style={{ fontSize: 12, marginBottom: 16, color: "#555" }}>
        Exported on{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 20,
          fontSize: 12,
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
              Total Attempts:
            </td>
            <td>{entries.length}</td>
            <td style={{ padding: "4px 12px 4px 24px", fontWeight: 600 }}>
              Passed:
            </td>
            <td>{passed}</td>
            <td style={{ padding: "4px 12px 4px 24px", fontWeight: 600 }}>
              Avg Score:
            </td>
            <td>{avgScore}%</td>
          </tr>
        </tbody>
      </table>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th
              style={{
                textAlign: "left",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Date
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Exam
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Version
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Score
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Result
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.id}
              style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
            >
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {entry.examName}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {entry.versionName}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {entry.score}%
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                  textAlign: "center",
                  fontWeight: 600,
                  color: entry.passed ? "#16a34a" : "#dc2626",
                }}
              >
                {entry.passed ? "PASS" : "FAIL"}
              </td>
              <td
                style={{
                  padding: "5px 8px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {formatTime(entry.timeTaken)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Domain breakdowns */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Domain Breakdown by Attempt
        </h2>
        {entries.map((entry) => {
          const domains = Object.entries(entry.domainBreakdown);
          if (domains.length === 0) return null;
          return (
            <div
              key={entry.id}
              style={{ marginBottom: 16, pageBreakInside: "avoid" }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                {new Date(entry.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {" — "}
                {entry.versionName} ({entry.score}%)
              </p>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 10,
                }}
              >
                <tbody>
                  {domains.map(([domain, stats]) => {
                    const pct =
                      stats.total > 0
                        ? Math.round((stats.correct / stats.total) * 100)
                        : 0;
                    return (
                      <tr key={domain}>
                        <td style={{ padding: "2px 8px 2px 0", width: "60%" }}>
                          {domain}
                        </td>
                        <td
                          style={{
                            padding: "2px 8px",
                            color:
                              pct >= 70
                                ? "#16a34a"
                                : pct >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                            fontWeight: 600,
                          }}
                        >
                          {stats.correct}/{stats.total} ({pct}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryPage() {
  const [entries, setEntries] = useState<StudyHistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setConfirmClear(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <>
      {/* Hidden print document injected to DOM for @media print */}
      <div ref={printRef} className="hidden print:block" aria-hidden="true">
        <PrintDocument entries={entries} />
      </div>

      <div className="flex-1 py-10 px-4 print:hidden">
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl text-foreground">
                  Study History
                </h1>
              </div>
              <p className="text-sm font-body text-muted-foreground">
                Track your progress and performance across all practice
                sessions.
              </p>
            </div>

            {entries.length > 0 && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Export PDF button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  data-ocid="history.export_button"
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export as PDF
                </Button>

                {!confirmClear ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmClear(true)}
                    data-ocid="history.clear_button"
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Progress
                  </Button>
                ) : (
                  <div className="flex flex-col items-end gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
                    <p className="text-xs font-body text-destructive font-semibold">
                      This will permanently delete all study history.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmClear(false)}
                        data-ocid="history.cancel_clear_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClear}
                        data-ocid="history.confirm_clear_button"
                        className="flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Yes, reset all
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats summary bar */}
          {entries.length > 0 && (
            <div className="bg-muted/40 border border-border rounded-xl px-5 py-4 flex items-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {entries.length}
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  Total Attempts
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-green-600">
                  {entries.filter((e) => e.passed).length}
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  Passed
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {Math.round(
                    entries.reduce((sum, e) => sum + e.score, 0) /
                      entries.length,
                  )}
                  %
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  Avg Score
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {Math.round(
                    entries.reduce((sum, e) => sum + e.score, 0) /
                      entries.length,
                  ) >= 70 ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-destructive">✗</span>
                  )}
                </p>
                <p className="text-xs font-body text-muted-foreground">
                  Pass Rate
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {entries.length === 0 && (
            <div
              className="text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center gap-5"
              data-ocid="history.empty_state"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold text-xl text-foreground">
                  No exams taken yet
                </p>
                <p className="text-sm font-body text-muted-foreground mt-1 max-w-xs">
                  Start practicing to see your history and track your progress!
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  asChild
                  data-ocid="history.home_button"
                >
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild data-ocid="history.start_exam_button">
                  <Link to="/exams/$examId" params={{ examId: "ptcb" }}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start Practicing
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Attempts list */}
          {entries.length > 0 && (
            <div className="flex flex-col gap-3" data-ocid="history.list">
              {entries.map((entry, i) => (
                <AttemptCard key={entry.id} entry={entry} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
