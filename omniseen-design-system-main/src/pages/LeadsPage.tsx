import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search, Mail, Phone, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import type { Tables } from "@/integrations/supabase/types";

const tabs = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Novos" },
  { key: "contacted", label: "Contatados" },
  { key: "qualified", label: "Qualificados" },
  { key: "lost", label: "Perdidos" },
];

function getScoreColor(s: number) {
  if (s >= 80) return "text-success";
  if (s >= 60) return "text-primary";
  if (s >= 40) return "text-warning";
  return "text-error";
}

export default function LeadsPage() {
  const { blog, loading: blogLoading } = useBlog();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("status") || "all";
  const [leads, setLeads] = useState<Tables<"brand_agent_leads">[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("brand_agent_leads").select("*").eq("blog_id", blog.id).order("created_at", { ascending: false });
      if (currentTab !== "all") query = query.eq("status", currentTab);
      const { data } = await query;
      setLeads(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [blog, blogLoading, currentTab]);

  const detail = leads.find((l) => l.id === selectedLead);

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      <div className="h-16 flex items-center justify-between mb-space-5">
        <h1 className="text-h1 text-foreground">Leads</h1>
        <Button variant="secondary"><Download className="h-4 w-4 mr-space-2" /> Exportar CSV</Button>
      </div>

      <div className="flex items-center justify-between mb-space-5 gap-space-4">
        <div className="flex gap-space-1 bg-muted rounded-md p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { const p = new URLSearchParams(searchParams); p.set("status", t.key); setSearchParams(p); }}
              className={`px-space-3 py-space-2 rounded text-body-sm font-medium transition-colors ${currentTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{t.label}</button>
          ))}
        </div>
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-space-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex gap-space-6">
          <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left text-caption font-medium text-muted-foreground px-space-4 py-space-3">Nome</th>
                  <th className="text-left text-caption font-medium text-muted-foreground px-space-4 py-space-3 hidden md:table-cell">Contato</th>
                  <th className="text-left text-caption font-medium text-muted-foreground px-space-4 py-space-3 hidden lg:table-cell">Origem</th>
                  <th className="text-center text-caption font-medium text-muted-foreground px-space-4 py-space-3">Score</th>
                  <th className="text-center text-caption font-medium text-muted-foreground px-space-4 py-space-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-space-6 text-muted-foreground">Nenhum lead encontrado</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead.id)}
                    className={`border-b border-border cursor-pointer hover:bg-accent transition-colors ${selectedLead === lead.id ? "bg-accent" : ""}`}>
                    <td className="px-space-4 py-space-3 text-body font-medium text-foreground">{lead.name}</td>
                    <td className="px-space-4 py-space-3 text-body-sm text-muted-foreground hidden md:table-cell">{lead.email || lead.phone || "-"}</td>
                    <td className="px-space-4 py-space-3 text-body-sm text-muted-foreground hidden lg:table-cell">{lead.source_page_url || "-"}</td>
                    <td className="px-space-4 py-space-3 text-center"><span className={`text-body font-semibold ${getScoreColor(lead.lead_score)}`}>{lead.lead_score}</span></td>
                    <td className="px-space-4 py-space-3 text-center">
                      <span className={`omniseen-badge badge-${lead.status === "new" ? "new" : lead.status === "qualified" ? "published" : lead.status === "lost" ? "error" : "scheduled"}`}>{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detail && (
            <div className="w-[400px] bg-card border border-border rounded-lg p-space-6 hidden xl:block">
              <h3 className="text-h3 text-foreground mb-space-5">{detail.name}</h3>
              <div className="space-y-space-4">
                {detail.email && <div className="flex items-center gap-space-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-body text-foreground">{detail.email}</span></div>}
                {detail.phone && <div className="flex items-center gap-space-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-body text-foreground">{detail.phone}</span></div>}
                <div className="flex items-center gap-space-3"><Tag className="h-4 w-4 text-muted-foreground" /><span className="text-body text-foreground">{detail.source_page_url || "-"}</span></div>
                <div className="pt-space-4 border-t border-border">
                  <p className="text-body-sm text-muted-foreground mb-space-2">Score</p>
                  <p className={`text-h2 font-semibold ${getScoreColor(detail.lead_score)}`}>{detail.lead_score}</p>
                </div>
                {detail.interest_summary && (
                  <div className="pt-space-4 border-t border-border">
                    <p className="text-body-sm text-muted-foreground mb-space-2">Resumo do interesse</p>
                    <p className="text-body text-foreground">{detail.interest_summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
