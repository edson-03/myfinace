export function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color =
    score >= 80
      ? "var(--success)"
      : score >= 60
        ? "var(--primary)"
        : score >= 40
          ? "var(--warning)"
          : "var(--danger)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
          <circle cx={70} cy={70} r={radius} stroke="var(--border)" strokeWidth={12} fill="none" />
          <circle
            cx={70}
            cy={70}
            r={radius}
            stroke={color}
            strokeWidth={12}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-semibold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
