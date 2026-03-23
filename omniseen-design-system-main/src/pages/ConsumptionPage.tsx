import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";

interface BreakdownRow {
  source: string;
  tokens: number;
  ops: number;
}

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function getPercentColor(p: number) {
  if (p > 50) return "text-success";
  if (p > 25) return "text-warning";
  return "text-error";
}

export default function ConsumptionPage() {
  const { blog, subscription, loading: blogLoading } = useBlog();
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = (subscription?.articles_per_month ?? 10) * 20000; // rough token estimate per article

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("ai_usage_logs")
        .select("source, tokens")
        .eq("blog_id", blog.id);

      if (data) {
        const grouped: Record<string, { tokens: number; ops: number }> = {};
        let total = 0;
        data.forEach((row) => {
          if (!grouped[row.source]) grouped[row.source] = { tokens: 0, ops: 0 };
          grouped[row.source].tokens += row.tokens;
          grouped[row.source].ops += 1;
          total += row.tokens;
        });
        setTotalTokens(total);
        setBreakdown(Object.entries(grouped).map(([source, v]) => ({ source, ...v })));
      }
      setLoading(false);
    };
    fetch();
  }, [blog, blogLoading]);

  const remaining = Math.max(0, limit - totalTokens);
  const usedPct = limit > 0 ? Math.round((totalTokens / limit) * 100) : 0;
  const remainPct = 100 - usedPct;

  if (loading) return <div className="p-space-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      <h1 className="text-h1 text-foreground mb-space-7">Consumo</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-5 mb-space-7">
        <div className="bg-card border border-border rounded-lg p-space-5">
          <p className="text-body-sm text-muted-foreground mb-space-2">Total Usado</p>
          <p className="text-h2 font-semibold text-foreground">{formatTokens(totalTokens)}</p>
          <p className="text-caption text-muted-foreground">tokens</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-space-5">
          <p className="text-body-sm text-muted-foreground mb-space-2">Limite do Plano</p>
          <p className="text-h2 font-semibold text-foreground">{formatTokens(limit)}</p>
          <p className="text-caption text-muted-foreground">tokens</p>
          <Progress value={usedPct} className="mt-space-3 h-2" />
        </div>
        <div className="bg-card border border-border rounded-lg p-space-5">
          <p className="text-body-sm text-muted-foreground mb-space-2">Restante</p>
          <p className={`text-h2 font-semibold ${getPercentColor(remainPct)}`}>{formatTokens(remaining)}</p>
          <p className="text-caption text-muted-foreground">tokens</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-7">
        <h3 className="text-h3 text-foreground mb-space-5">Uso Diário</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-space-3" />
            <p className="text-body">Gráfico de consumo diário</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-space-6 py-space-4 border-b border-border">
          <h3 className="text-h3 text-foreground">Detalhamento</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left text-caption font-medium text-muted-foreground px-space-6 py-space-3">Fonte</th>
              <th className="text-right text-caption font-medium text-muted-foreground px-space-6 py-space-3">Tokens</th>
              <th className="text-right text-caption font-medium text-muted-foreground px-space-6 py-space-3">%</th>
              <th className="text-right text-caption font-medium text-muted-foreground px-space-6 py-space-3">Operações</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-space-6 text-muted-foreground">Nenhum consumo registrado</td></tr>
            ) : breakdown.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-space-6 py-space-3 text-body font-medium text-foreground">{row.source}</td>
                <td className="px-space-6 py-space-3 text-body text-foreground text-right font-mono">{formatTokens(row.tokens)}</td>
                <td className="px-space-6 py-space-3 text-body text-muted-foreground text-right">{totalTokens > 0 ? Math.round((row.tokens / totalTokens) * 100) : 0}%</td>
                <td className="px-space-6 py-space-3 text-body text-muted-foreground text-right">{row.ops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
