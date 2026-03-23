export interface CostBadgeProps {
  value?: number;
  cost?: number;
  size?: "sm" | "md" | "lg";
}

export default function CostBadge({ value, cost, size = "sm" }: CostBadgeProps) {
  const amount = value ?? cost ?? 0;
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  const sizeClass = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";

  return (
    <span className={`font-mono-data font-bold ${sizeClass}`} style={{ color: "var(--admin-cyan)" }}>
      {formatted}
    </span>
  );
}
