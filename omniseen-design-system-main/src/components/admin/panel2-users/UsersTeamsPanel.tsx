import { useState, useEffect } from "react";
import { useAdminTeam } from "@/hooks/admin/useAdminTeam";
import { useLeadsROI } from "@/hooks/admin/useLeadsROI";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusDot from "@/components/admin/shared/StatusDot";
import { Plus, Trash2, UserPlus, RefreshCw } from "lucide-react";

export default function UsersTeamsPanel() {
  const { members, invite, remove, updateRole } = useAdminTeam();
  const { clients, loading: clientsLoading } = useLeadsROI();
  const [showInvite, setShowInvite] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("analyst");

  const handleInvite = () => {
    if (!invName || !invEmail) return;
    invite(invName, invEmail, invRole);
    setShowInvite(false);
    setInvName(""); setInvEmail(""); setInvRole("analyst");
  };

  return (
    <div className="space-y-6">
      {/* Team Management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>👥 Equipe Omniseen</h2>
          <Button size="sm" onClick={() => setShowInvite(true)} style={{ background: "var(--admin-cyan)", color: "#0a0e1a" }}>
            <UserPlus className="h-4 w-4 mr-1" /> Convidar Membro
          </Button>
        </div>
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>Membro</th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>Role</th>
                <th className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>Status</th>
                <th className="text-right py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <td className="py-3 px-3">
                    <div style={{ color: "var(--admin-text)" }}>{m.name}</div>
                    <div className="text-xs" style={{ color: "var(--admin-muted)" }}>{m.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                      <SelectTrigger className="h-7 w-28 text-xs" style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="tech_ops">Tech Ops</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-3">
                    <StatusDot status={m.accepted_at ? "active" : "idle"} label={m.accepted_at ? "Ativo" : "Pendente"} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {m.role !== "super_admin" && (
                      <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                        <Trash2 className="h-4 w-4" style={{ color: "var(--admin-red)" }} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-sm" style={{ color: "var(--admin-muted)" }}>Nenhum membro na equipe ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Clients Overview */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-cyan)" }}>🏢 Clientes</h2>
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                {["Cliente", "Plano", "Artigos", "Leads", "Custo IA", "ROI", "Subcontas"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.client_id} style={{ borderBottom: "1px solid var(--admin-border)" }}>
                  <td className="py-3 px-3" style={{ color: "var(--admin-text)" }}>{c.client_name || "—"}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{
                      background: c.plan === "trial" ? "var(--admin-purple)" : "var(--admin-cyan)",
                      color: "#fff",
                    }}>{c.plan}</span>
                  </td>
                  <td className="py-3 px-3 font-mono-data" style={{ color: "var(--admin-text)" }}>{c.articles_count}</td>
                  <td className="py-3 px-3 font-mono-data" style={{ color: "var(--admin-green)" }}>{c.total_leads}</td>
                  <td className="py-3 px-3 font-mono-data" style={{ color: "var(--admin-orange)" }}>${c.ai_cost_usd.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono-data" style={{ color: c.roi_ratio > 1 ? "var(--admin-green)" : "var(--admin-red)" }}>{c.roi_ratio}x</td>
                  <td className="py-3 px-3 font-mono-data" style={{ color: "var(--admin-text)" }}>{c.subcontas_count}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-sm" style={{ color: "var(--admin-muted)" }}>Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--admin-text)" }}>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--admin-muted)" }}>Nome</label>
              <Input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Nome completo"
                style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--admin-muted)" }}>Email</label>
              <Input value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="email@empresa.com"
                style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--admin-muted)" }}>Role</label>
              <Select value={invRole} onValueChange={setInvRole}>
                <SelectTrigger style={{ background: "var(--admin-card2)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyst">Analyst — leitura completa</SelectItem>
                  <SelectItem value="support">Support — impersonar clientes</SelectItem>
                  <SelectItem value="finance">Finance — custos e ROI</SelectItem>
                  <SelectItem value="tech_ops">Tech Ops — sistema e logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} className="w-full" style={{ background: "var(--admin-cyan)", color: "#0a0e1a" }}>
              <UserPlus className="h-4 w-4 mr-1" /> Enviar Convite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
