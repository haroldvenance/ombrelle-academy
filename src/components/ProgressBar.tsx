type Variant = "default" | "success" | "danger" | "warning";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "from-brand-600 to-accent-500",
  success: "from-emerald-500 to-emerald-600",
  danger: "from-red-500 to-red-600",
  warning: "from-amber-500 to-amber-600",
};

export default function ProgressBar({
  value,
  label = "Progression",
  variant = "default",
  className = "",
}: {
  value: number;
  label?: string;
  variant?: Variant;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${VARIANT_CLASS[variant]} transition-all`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}