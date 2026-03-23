import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatusDot from "@/components/admin/shared/StatusDot";
import { Loader2 } from "lucide-react";

interface LogEntry {
  id: string;
  agent_name: string;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  model_used: string | null;
  created_at: string | null;
  pipeline_type: string;
}

export default function AlertsLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("agent_logs")
        .select("id, agent_name, status, error_message, duration_ms, tokens_used, cost_usd, model_used, created_at, pipeline_type")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setLogs(data as LogEntry[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-cyan)" }} /></div>;

  const errors = logs.filter(l => l.status !== "success");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>🔔 Alertas & Logs</h2>

      {errors.length > 0 && (
        <div className="admin-card" style={{ borderColor: "var(--admin-red)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-red)" }}>⚠ Erros Recentes ({errors.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-xs py-1" style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <StatusDot status="error" />
                <div>
                  <span className="font-semibold" style={{ color: "var(--admin-text)" }}>{e.agent_name}</span>
                  <span style={{ color: "var(--admin-muted)" }}> — {e.error_message || "Erro desconhecido"}</span>
                  <div style={{ color: "var(--admin-muted)" }}>{e.created_at ? new Date(e.created_at).toLocaleString("pt-BR") : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-card overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-muted)" }}>Feed de Logs (últimos 50)</h3>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
              {["Horário", "Agente", "Pipeline", "Modelo", "Status", "Duração", "Tokens", "Custo"].map((h) => (
                <th key={h} className="text-left py-2 px-2 uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <td className="py-1.5 px-2" style={{ color: "var(--admin-muted)" }}>{l.created_at ? new Date(l.created_at).toLocaleTimeString("pt-BR") : "—"}</td>
                <td className="py-1.5 px-2 font-semibold" style={{ color: "var(--admin-text)" }}>{l.agent_name}</td>
                <td className="py-1.5 px-2" style={{ color: "var(--admin-text)" }}>{l.pipeline_type}</td>
                <td className="py-1.5 px-2" style={{ color: "var(--admin-purple)" }}>{l.model_used || "—"}</td>
                <td className="py-1.5 px-2">
                  <StatusDot status={l.status === "success" ? "active" : "error"} label={l.status} />
                </td>
                <td className="py-1.5 px-2 font-mono-data" style={{ color: "var(--admin-text)" }}>{l.duration_ms ? `${(l.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                <td className="py-1.5 px-2 font-mono-data" style={{ color: "var(--admin-text)" }}>{l.tokens_used?.toLocaleString() || "0"}</td>
                <td className="py-1.5 px-2 font-mono-data" style={{ color: "var(--admin-cyan)" }}>${(l.cost_usd || 0).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--admin-muted)" }}>Nenhum log registrado.</p>
        )}
      </div>
    </div>
  );
}
