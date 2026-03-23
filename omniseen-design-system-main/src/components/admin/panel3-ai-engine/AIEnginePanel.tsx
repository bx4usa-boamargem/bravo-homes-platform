import { useAgentCosts } from "@/hooks/admin/useAgentCosts";
import MetricCard from "@/components/admin/shared/MetricCard";
import CostBadge from "@/components/admin/shared/CostBadge";

export default function AIEnginePanel() {
  const { data: costs } = useAgentCosts();
  const totalCost = costs.reduce((s, c) => s + c.total_cost_usd, 0);
  const totalTokens = costs.reduce((s, c) => s + c.total_tokens, 0);
  const totalCalls = costs.reduce((s, c) => s + c.calls_count, 0);
  const totalErrors = costs.reduce((s, c) => s + c.error_count, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>🔧 Motor de IA</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="💰" label="Custo total hoje" value={`$${totalCost.toFixed(2)}`} color="var(--admin-cyan)" />
        <MetricCard icon="🔢" label="Total tokens" value={`${(totalTokens / 1_000_000).toFixed(1)}M`} color="var(--admin-purple)" />
        <MetricCard icon="📞" label="Total chamadas" value={totalCalls.toLocaleString()} color="var(--admin-blue)" />
        <MetricCard icon="❌" label="Erros hoje" value={totalErrors} color={totalErrors > 0 ? "var(--admin-red)" : "var(--admin-green)"} />
      </div>

      <div className="admin-card overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-muted)" }}>Consumo por Agente</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
              {["Agente", "Chamadas", "Tokens", "Custo", "Erros", "Latência média"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {costs.map((c) => (
              <tr key={c.agent_name} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <td className="py-2 px-3 font-semibold" style={{ color: "var(--admin-text)" }}>{c.agent_name}</td>
                <td className="py-2 px-3 font-mono-data" style={{ color: "var(--admin-text)" }}>{c.calls_count}</td>
                <td className="py-2 px-3 font-mono-data" style={{ color: "var(--admin-text)" }}>{c.total_tokens.toLocaleString()}</td>
                <td className="py-2 px-3"><CostBadge value={c.total_cost_usd} /></td>
                <td className="py-2 px-3 font-mono-data" style={{ color: c.error_count > 0 ? "var(--admin-red)" : "var(--admin-green)" }}>{c.error_count}</td>
                <td className="py-2 px-3 font-mono-data" style={{ color: "var(--admin-text)" }}>{(c.avg_duration_ms / 1000).toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
