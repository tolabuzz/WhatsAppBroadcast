export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-2 w-full rounded-full bg-black/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-brand-light transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
