interface Props { value: number; label?: string; className?: string; }

export function PercentBar({ value, label, className }: Props) {
  const level = value >= 80 ? "good" : value >= 60 ? "medium" : "poor";
  const colorVar =
    level === "good" ? "var(--color-success)" :
    level === "medium" ? "var(--color-warning)" :
    "var(--color-destructive)";
  const labelText =
    level === "good" ? "Good" : level === "medium" ? "Watch" : "Critical";

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label ?? "Progress"}</span>
        <span className="text-sm font-display font-bold tabular-nums" style={{ color: colorVar }}>
          {value}% · {labelText}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: colorVar }}
        />
      </div>
    </div>
  );
}
