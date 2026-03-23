import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Clock, Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const modes = [
  { key: "manual", label: "Manual", desc: "Você aprova cada conteúdo" },
  { key: "semi_auto", label: "Semi-automático", desc: "Gera rascunhos para revisão" },
  { key: "full_auto", label: "Automático", desc: "Publica automaticamente" },
];

export default function AutomationPage() {
  const { blog, loading: blogLoading } = useBlog();
  const [automation, setAutomation] = useState<Tables<"blog_automation"> | null>(null);
  const [queue, setQueue] = useState<Tables<"article_queue">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) { setLoading(false); return; }
    const fetch = async () => {
      const [autoRes, queueRes] = await Promise.all([
        supabase.from("blog_automation").select("*").eq("blog_id", blog.id).maybeSingle(),
        supabase.from("article_queue").select("*").eq("blog_id", blog.id).order("scheduled_for", { ascending: true }).limit(10),
      ]);
      setAutomation(autoRes.data);
      setQueue(queueRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [blog, blogLoading]);

  const updateAutomation = async (updates: Partial<Tables<"blog_automation">>) => {
    if (!blog) return;
    if (!automation) {
      const { data, error } = await supabase.from("blog_automation").insert({ blog_id: blog.id, ...updates }).select().single();
      if (error) toast.error("Erro ao salvar");
      else setAutomation(data);
    } else {
      const { data, error } = await supabase.from("blog_automation").update(updates).eq("blog_id", blog.id).select().single();
      if (error) toast.error("Erro ao salvar");
      else setAutomation(data);
    }
  };

  if (loading) return <div className="p-space-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-space-6 max-w-content-form mx-auto">
      <h1 className="text-h1 text-foreground mb-space-7">Automação</h1>

      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-6">
        <div className="flex items-center justify-between mb-space-6">
          <div className="flex items-center gap-space-3">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-h3 text-foreground">Automação de Conteúdo</h3>
          </div>
          <Switch checked={automation?.is_active ?? false} onCheckedChange={(v) => updateAutomation({ is_active: v })} />
        </div>

        <div className="grid grid-cols-3 gap-space-4 mb-space-6">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => updateAutomation({ mode: m.key })}
              className={`p-space-4 rounded-lg border text-left transition-all ${
                (automation?.mode ?? "manual") === m.key ? "border-primary bg-primary-light" : "border-border hover:border-gray-300"
              }`}
            >
              <p className="text-body font-medium text-foreground">{m.label}</p>
              <p className="text-caption text-muted-foreground mt-space-1">{m.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Frequência</label>
            <Select value={automation?.frequency ?? "weekly"} onValueChange={(v) => updateAutomation({ frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Horário</label>
            <Select value={automation?.preferred_time ?? "09:00"} onValueChange={(v) => updateAutomation({ preferred_time: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00">06:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="12:00">12:00</SelectItem>
                <SelectItem value="18:00">18:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between col-span-2">
            <span className="text-body-sm text-foreground">Auto-publicar</span>
            <Switch checked={automation?.auto_publish ?? false} onCheckedChange={(v) => updateAutomation({ auto_publish: v })} />
          </div>
          <div className="flex items-center justify-between col-span-2">
            <span className="text-body-sm text-foreground">Pesquisa web</span>
            <Switch checked={automation?.web_research_enabled ?? true} onCheckedChange={(v) => updateAutomation({ web_research_enabled: v })} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-space-6">
        <h3 className="text-h3 text-foreground mb-space-4">Fila de Geração</h3>
        <div className="divide-y divide-border">
          {queue.length === 0 ? (
            <p className="py-space-4 text-center text-muted-foreground text-body-sm">Fila vazia</p>
          ) : queue.map((item) => (
            <div key={item.id} className="py-space-3 flex items-center justify-between">
              <span className="text-body text-foreground">{item.suggested_theme}</span>
              <span className={`omniseen-badge ${item.status === "generating" ? "badge-generating" : "badge-pending"}`}>
                {item.status === "generating" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
