import { useSystemStatus } from "@/hooks/admin/useSystemStatus";
import MetricCard from "@/components/admin/shared/MetricCard";
import { Loader2 } from "lucide-react";

export default function SystemStatusPanel() {
  const { status, loading } = useSystemStatus();

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-cyan)" }} /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>⚡ Sistema ao Vivo</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard icon="📝" label="Artigos" value={status.totalArticles} color="var(--admin-purple)" />
        <MetricCard icon="🚀" label="Super Pages" value={status.totalSuperPages} color="var(--admin-blue)" />
        <MetricCard icon="📰" label="Blogs" value={status.totalBlogs} color="var(--admin-teal)" />
        <MetricCard icon="👥" label="Leads" value={status.totalLeads} color="var(--admin-green)" />
        <MetricCard icon="🤖" label="Agentes ativos" value={`${status.activeAgents}/8`} color="var(--admin-cyan)" />
        <MetricCard icon="✅" label="Uptime 24h" value={`${status.uptime}%`} color={status.uptime >= 99 ? "var(--admin-green)" : "var(--admin-orange)"} />
      </div>
    </div>
  );
}
