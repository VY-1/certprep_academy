import { cn } from "@/lib/utils";
import type { Question } from "@/types/exam";
import { getDomainColor, getDomainLabel } from "@/types/exam";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | undefined;
  isSubmitted: boolean;
  onSelect: (optionIndex: number) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  isSubmitted,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-4" data-ocid="exam.question_card">
      {/* Question header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-body font-medium text-primary">
            Question {questionNumber}/{totalQuestions}
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
        <p className="text-base font-body text-foreground leading-relaxed">
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div
        className="flex flex-col gap-2.5"
        role="radiogroup"
        aria-label="Answer options"
      >
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const letter = OPTION_LETTERS[index] ?? String(index + 1);
          const optionId = `${question.id}-opt-${index}`;

          return (
            <button
              key={optionId}
              type="button"
              onClick={() => !isSubmitted && onSelect(index)}
              disabled={isSubmitted}
              aria-pressed={isSelected}
              data-ocid={`exam.option.${index + 1}`}
              className={cn(
                "flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 group",
                isSubmitted
                  ? "cursor-default"
                  : "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                isSelected && !isSubmitted
                  ? "border-primary bg-primary/10 text-foreground"
                  : !isSelected && !isSubmitted
                    ? "border-border bg-card text-foreground"
                    : "border-border bg-card text-foreground",
              )}
            >
              {/* Option letter bubble */}
              <span
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-display font-bold transition-colors duration-200",
                  isSelected && !isSubmitted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-border text-muted-foreground group-hover:border-primary/50",
                )}
              >
                {letter}
              </span>
              <span className="text-sm font-body leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
