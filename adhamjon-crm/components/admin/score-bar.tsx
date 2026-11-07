import { getScoreLabel } from "@/lib/score";
import { cn } from "@/lib/utils";

export function ScoreBar({ score, size = "md", className }: { score: number; size?: "md" | "lg"; className?: string }) {
  const { label, color } = getScoreLabel(score);
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={cn("font-display font-extrabold tabular", size === "lg" ? "text-4xl" : "text-lg")} style={{ color }}>
          {score}
          <span className="text-xs font-semibold text-muted-foreground">/100</span>
        </span>
        <span className="text-xs font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", size === "lg" ? "h-2.5" : "h-1.5")}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lid balli"
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
