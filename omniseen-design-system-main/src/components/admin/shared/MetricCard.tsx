interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export default function MetricCard({ label, value, icon, color = "var(--admin-cyan)", subtitle }: MetricCardProps) {
  return (
    <div className="admin-card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{label}</span>
      </div>
      <span className="text-2xl font-bold font-mono-data" style={{ color }}>{value}</span>
      {subtitle && <span className="text-xs" style={{ color: "var(--admin-muted)" }}>{subtitle}</span>}
    </div>
  );
}
