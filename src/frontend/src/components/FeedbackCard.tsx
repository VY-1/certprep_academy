import { cn } from "@/lib/utils";
import type { Question } from "@/types/exam";
import { getDomainColor, getDomainLabel } from "@/types/exam";
import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackCardProps {
  question: Question;
  selectedOption: number;
  onNext: () => void;
  isLast: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function FeedbackCard({
  question,
  selectedOption,
  onNext,
  isLast,
}: FeedbackCardProps) {
  const correctIndex = Number(question.correctOptionIndex);
  const isCorrect = selectedOption === correctIndex;

  return (
    <div className="flex flex-col gap-4" data-ocid="exam.feedback_card">
      {/* Result banner */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-xl border",
          isCorrect
            ? "bg-accent/10 border-accent/30"
            : "bg-destructive/10 border-destructive/30",
        )}
      >
        {isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-display font-semibold",
              isCorrect ? "text-accent" : "text-destructive",
            )}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </span>
          {!isCorrect && (
            <span className="text-xs font-body text-muted-foreground mt-0.5">
              Correct answer:{" "}
              <span className="font-medium text-foreground">
                {OPTION_LETTERS[correctIndex]} —{" "}
                {question.options[correctIndex]}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
            Explanation
          </span>
          <span
            className={cn(
              "text-xs font-body font-medium px-2 py-0.5 rounded-full border",
              getDomainColor(question.knowledgeDomain),
            )}
          >
            {getDomainLabel(question.knowledgeDomain)}
          </span>
        </div>
        <p className="text-sm font-body text-muted-foreground leading-relaxed">
          {question.explanation}
        </p>
      </div>

      {/* Next button */}
      <div className="flex justify-end" data-ocid="exam.feedback_action">
        <button
          type="button"
          onClick={onNext}
          data-ocid={isLast ? "exam.finish_button" : "exam.next_button"}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
        >
          {isLast ? "Finish Exam" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
