export interface StatusDotProps {
  status: "active" | "idle" | "error";
  label?: string;
  pulse?: boolean;
}

export default function StatusDot({ status, label }: StatusDotProps) {
  const colors = { active: "var(--admin-green)", idle: "var(--admin-muted)", error: "var(--admin-red)" };
  const labels = { active: "ATIVO", idle: "IDLE", error: "ERRO" };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
      <span
        className={status === "active" ? "live-badge" : ""}
        style={{
          width: 8, height: 8, borderRadius: "50%",
          background: colors[status], display: "inline-block",
        }}
      />
      <span style={{ color: colors[status] }}>{label || labels[status]}</span>
    </span>
  );
}
