import { useLeadsROI } from "@/hooks/admin/useLeadsROI";
import MetricCard from "@/components/admin/shared/MetricCard";
import CostBadge from "@/components/admin/shared/CostBadge";
import { Loader2 } from "lucide-react";

export default function LeadsROIPanel() {
  const { clients, loading } = useLeadsROI();

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-cyan)" }} /></div>;

  const totalLeads = clients.reduce((s, c) => s + c.total_leads, 0);
  const convertedLeads = clients.reduce((s, c) => s + c.converted_leads, 0);
  const totalDealValue = clients.reduce((s, c) => s + c.total_deal_value, 0);
  const totalAICost = clients.reduce((s, c) => s + c.ai_cost_usd, 0);
  const overallROI = totalAICost > 0 ? (totalDealValue / totalAICost).toFixed(1) : "∞";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>📊 Leads & ROI</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon="👥" label="Total leads" value={totalLeads} color="var(--admin-green)" />
        <MetricCard icon="✅" label="Convertidos" value={convertedLeads} color="var(--admin-cyan)" />
        <MetricCard icon="💰" label="Valor total" value={`$${totalDealValue.toFixed(0)}`} color="var(--admin-yellow)" />
        <MetricCard icon="🤖" label="Custo IA (30d)" value={`$${totalAICost.toFixed(2)}`} color="var(--admin-orange)" />
        <MetricCard icon="📈" label="ROI geral" value={`${overallROI}x`} color={Number(overallROI) > 1 ? "var(--admin-green)" : "var(--admin-red)"} />
      </div>

      <div className="admin-card overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-muted)" }}>ROI por Cliente</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
              {["Cliente", "Plano", "Leads", "Convertidos", "Valor Deals", "Custo IA", "ROI"].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.client_id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <td className="py-2 px-3" style={{ color: "var(--admin-text)" }}>{c.client_name || "—"}</td>
                <td className="py-2 px-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--admin-purple)", color: "#fff" }}>{c.plan}</span></td>
                <td className="py-2 px-3 font-mono-data" style={{ color: "var(--admin-green)" }}>{c.total_leads}</td>
                <td className="py-2 px-3 font-mono-data" style={{ color: "var(--admin-cyan)" }}>{c.converted_leads}</td>
                <td className="py-2 px-3"><CostBadge value={c.total_deal_value} /></td>
                <td className="py-2 px-3"><CostBadge value={c.ai_cost_usd} /></td>
                <td className="py-2 px-3 font-mono-data font-bold" style={{ color: c.roi_ratio > 1 ? "var(--admin-green)" : "var(--admin-red)" }}>{c.roi_ratio}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
