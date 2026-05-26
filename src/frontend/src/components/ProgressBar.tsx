interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  className = "",
}: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      data-ocid="exam.progress_bar"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-body text-muted-foreground">
          Question progress{" "}
          <span className="text-foreground font-medium">
            ({current}/{total})
          </span>
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {percent}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          tabIndex={0}
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Question ${current} of ${total}`}
        />
      </div>
    </div>
  );
}
