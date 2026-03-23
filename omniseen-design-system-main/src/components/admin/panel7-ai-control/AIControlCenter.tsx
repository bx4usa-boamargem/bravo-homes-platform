import { useState } from "react";
import { useAIConfig } from "@/hooks/admin/useAIConfig";
import { useAgentCosts } from "@/hooks/admin/useAgentCosts";
import { useRoutingRules } from "@/hooks/admin/useRoutingRules";
import { AGENTS_MAP, MOCK_DAILY_COST } from "@/components/admin/shared/mockData";
import MetricCard from "@/components/admin/shared/MetricCard";
import StatusDot from "@/components/admin/shared/StatusDot";
import CostBadge from "@/components/admin/shared/CostBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Pause, Play, Save } from "lucide-react";

const MODEL_OPTIONS = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "gemini-2.5-flash", "fal-flux-dev", "pollinations", "serper-api", "google-places-api"];

export default function AIControlCenter() {
  const { configs, updateConfig } = useAIConfig();
  const { data: agentCosts } = useAgentCosts();
  const { rules, addRule, deleteRule, toggleRule } = useRoutingRules();
  const [newRule, setNewRule] = useState({ field: "plano", op: "=", value: "free", action: "force_model", actionValue: "gpt-4o-mini" });

  const totalCostToday = agentCosts.reduce((s, a) => s + a.total_cost_usd, 0);
  const totalTokens = agentCosts.reduce((s, a) => s + a.total_tokens, 0);

  return (
    <div className="space-y-6">
      {/* 7A — Model Switcher */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-cyan)" }}>🧠 Controle de Modelos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((cfg) => (
            <div key={cfg.id} className="admin-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{cfg.function_name}</span>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--admin-muted)" }}>Modelo principal</label>
                <Select value={cfg.model_name} onValueChange={(v) => updateConfig(cfg.id, { model_name: v })}>
                  <SelectTrigger className="h-8 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--admin-muted)" }}>Fallback</label>
                <Select value={cfg.fallback_model || "none"} onValueChange={(v) => updateConfig(cfg.id, { fallback_model: v === "none" ? null : v })}>
                  <SelectTrigger className="h-8 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {MODEL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cfg.is_economy_mode === true}
                    onCheckedChange={(v) => updateConfig(cfg.id, { is_economy_mode: v, is_premium_mode: v ? false : cfg.is_premium_mode })}
                  />
                  <span className="text-xs" style={{ color: "var(--admin-green)" }}>Econômico</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={cfg.is_premium_mode === true}
                    onCheckedChange={(v) => updateConfig(cfg.id, { is_premium_mode: v, is_economy_mode: v ? false : cfg.is_economy_mode })}
                  />
                  <span className="text-xs" style={{ color: "var(--admin-purple)" }}>Premium</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7B — Agent Map */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-cyan)" }}>🤖 Mapa de Agentes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS_MAP.map((agent) => {
            const cost = agentCosts.find(c => c.agent_name === agent.key);
            const hasErrors = (cost?.error_count || 0) > 0;
            const status = cost ? (hasErrors && cost.error_count > 10 ? "error" : "active") : "idle";

            return (
              <div
                key={agent.key}
                className={`admin-card relative overflow-hidden ${status === "active" ? "agent-active-border" : ""}`}
                style={{ "--agent-color": agent.color } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.icon}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{agent.name}</div>
                      <StatusDot status={status} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: "var(--admin-muted)" }}>Chamadas</span>
                    <div className="font-mono-data font-bold" style={{ color: "var(--admin-text)" }}>{cost?.calls_count || 0}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-muted)" }}>Custo hoje</span>
                    <div><CostBadge value={cost?.total_cost_usd || 0} /></div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-muted)" }}>Erros</span>
                    <div className="font-mono-data font-bold" style={{ color: hasErrors ? "var(--admin-red)" : "var(--admin-green)" }}>{cost?.error_count || 0}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-muted)" }}>Latência</span>
                    <div className="font-mono-data font-bold" style={{ color: "var(--admin-text)" }}>{cost?.avg_duration_ms ? `${(cost.avg_duration_ms / 1000).toFixed(1)}s` : "—"}</div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full" style={{ background: agent.color }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* 7C — Routing Rules */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-cyan)" }}>🔀 Roteamento Inteligente</h2>
        <div className="admin-card space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 flex-wrap" style={{ opacity: rule.is_active ? 1 : 0.5 }}>
              <span className="text-xs font-semibold" style={{ color: "var(--admin-orange)" }}>SE</span>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-card2)", color: "var(--admin-text)" }}>{rule.condition_field}</span>
              <span className="text-xs" style={{ color: "var(--admin-muted)" }}>{rule.condition_operator}</span>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-card2)", color: "var(--admin-text)" }}>{rule.condition_value}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--admin-green)" }}>→</span>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-card2)", color: "var(--admin-cyan)" }}>{rule.action_type}: {rule.action_value}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRule(rule.id, !rule.is_active)}>
                {rule.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteRule(rule.id)}>
                <Trash2 className="h-3 w-3" style={{ color: "var(--admin-red)" }} />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 flex-wrap pt-2" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--admin-orange)" }}>SE</span>
            <Select value={newRule.field} onValueChange={(v) => setNewRule(r => ({ ...r, field: v }))}>
              <SelectTrigger className="h-7 w-24 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plano">plano</SelectItem>
                <SelectItem value="hora">hora</SelectItem>
                <SelectItem value="seções">seções</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newRule.op} onValueChange={(v) => setNewRule(r => ({ ...r, op: v }))}>
              <SelectTrigger className="h-7 w-16 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="=">=</SelectItem>
                <SelectItem value="<">&lt;</SelectItem>
                <SelectItem value=">">&gt;</SelectItem>
              </SelectContent>
            </Select>
            <input
              value={newRule.value}
              onChange={(e) => setNewRule(r => ({ ...r, value: e.target.value }))}
              className="h-7 w-20 px-2 rounded text-xs"
              style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            />
            <span className="text-xs font-semibold" style={{ color: "var(--admin-green)" }}>→</span>
            <Select value={newRule.actionValue} onValueChange={(v) => setNewRule(r => ({ ...r, actionValue: v }))}>
              <SelectTrigger className="h-7 w-28 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => addRule({
                condition_field: newRule.field,
                condition_operator: newRule.op,
                condition_value: newRule.value,
                action_type: "force_model",
                action_value: newRule.actionValue,
                is_active: true,
                priority: 10,
              })}
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </section>

      {/* 7D — Real-time Costs */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-cyan)" }}>💰 Custo Total Tempo Real</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon="🧠" label="Tokens OpenAI" value={`${(totalTokens / 1_000_000).toFixed(1)}M`} subtitle={`Custo: $${totalCostToday.toFixed(2)}`} />
          <MetricCard icon="🖼" label="Imagens geradas" value={MOCK_DAILY_COST.fal_images.toLocaleString()} color="var(--admin-pink)" subtitle={`Custo: $${MOCK_DAILY_COST.fal_cost.toFixed(2)}`} />
          <div className="admin-card flex flex-col items-center justify-center gap-1 md:col-span-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>CUSTO TOTAL HOJE</span>
            <span className="text-4xl font-bold font-mono-data" style={{ color: "var(--admin-cyan)" }}>
              ${(totalCostToday + MOCK_DAILY_COST.fal_cost + MOCK_DAILY_COST.serper_cost + MOCK_DAILY_COST.places_cost).toFixed(2)}
            </span>
            <span className="text-xs" style={{ color: "var(--admin-muted)" }}>Projeção mensal: ~${MOCK_DAILY_COST.monthly_projection}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
