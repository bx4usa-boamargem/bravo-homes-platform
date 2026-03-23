import { useEffect, useState } from "react";
import { Plug, Check, Loader2, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function IntegrationsPage() {
  const { blog, loading: blogLoading } = useBlog();
  const [integration, setIntegration] = useState<Tables<"cms_integrations"> | null>(null);
  const [logs, setLogs] = useState<Tables<"cms_publish_logs">[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) { setLoading(false); return; }
    const fetchData = async () => {
      const { data: intData } = await supabase.from("cms_integrations").select("*").eq("blog_id", blog.id).limit(1).maybeSingle();
      setIntegration(intData);
      if (intData) {
        const { data: logData } = await supabase.from("cms_publish_logs").select("*").eq("integration_id", intData.id).order("created_at", { ascending: false }).limit(5);
        setLogs(logData ?? []);
      }
      setLoading(false);
    };
    fetchData();
  }, [blog, blogLoading]);

  const connectWordPress = async () => {
    if (!blog || !wpUrl.trim() || !wpUser.trim() || !wpPassword.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validate URL format
    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    cleanUrl = cleanUrl.replace(/\/+$/, "");

    setConnecting(true);
    try {
      // Test the connection first
      const testRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=1`, {
        headers: {
          Authorization: "Basic " + btoa(`${wpUser.trim()}:${wpPassword.trim()}`),
        },
      });

      if (!testRes.ok && testRes.status === 401) {
        toast.error("Credenciais inválidas. Verifique o usuário e a senha de aplicativo.");
        return;
      }

      // Save integration
      const { data, error } = await supabase.from("cms_integrations").insert({
        blog_id: blog.id,
        platform: "wordpress",
        site_url: cleanUrl,
        credentials: { username: wpUser.trim(), password: wpPassword.trim() },
        is_active: true,
        auto_publish: false,
      }).select().single();

      if (error) {
        toast.error("Erro ao salvar integração: " + error.message);
        return;
      }

      setIntegration(data);
      setShowForm(false);
      setWpUrl("");
      setWpUser("");
      setWpPassword("");
      toast.success("WordPress conectado com sucesso!");
    } catch (err: any) {
      toast.error("Não foi possível conectar. Verifique a URL e tente novamente.");
    } finally {
      setConnecting(false);
    }
  };

  const toggleAutoPublish = async () => {
    if (!integration) return;
    const { data } = await supabase.from("cms_integrations").update({ auto_publish: !integration.auto_publish }).eq("id", integration.id).select().single();
    if (data) setIntegration(data);
  };

  const disconnect = async () => {
    if (!integration) return;
    await supabase.from("cms_integrations").delete().eq("id", integration.id);
    setIntegration(null);
    setLogs([]);
    toast.success("Desconectado");
  };

  if (loading) return <div className="p-space-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-space-6 max-w-content-form mx-auto">
      <h1 className="text-h1 text-foreground mb-space-7">Integrações</h1>

      <div className="bg-card border border-border rounded-lg p-space-6">
        <div className="flex items-center gap-space-3 mb-space-5">
          <div className="h-10 w-10 bg-info/10 rounded-lg flex items-center justify-center">
            <span className="font-bold text-info text-body-lg">W</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-space-2">
              <h3 className="text-h3 text-foreground">WordPress</h3>
              <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">Novo</Badge>
            </div>
            <p className="text-body-sm text-muted-foreground">Publique artigos diretamente no seu WordPress</p>
          </div>
          {integration && <span className="omniseen-badge badge-published">Conectado</span>}
        </div>

        {!integration && !showForm && (
          <div className="space-y-space-4">
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Globe className="h-4 w-4 mr-2" /> Conectar WordPress
            </Button>
          </div>
        )}

        {!integration && showForm && (
          <div className="space-y-space-4 border-t border-border pt-space-5">
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">URL do WordPress</label>
              <Input
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
                placeholder="https://meusite.com.br"
              />
            </div>
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Usuário WordPress</label>
              <Input
                value={wpUser}
                onChange={(e) => setWpUser(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Senha de Aplicativo</label>
              <Input
                type="password"
                value={wpPassword}
                onChange={(e) => setWpPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              />
              <a
                href="https://wordpress.com/support/application-passwords/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-primary hover:underline mt-space-1 inline-block"
              >
                Como gerar uma senha de aplicativo no WordPress →
              </a>
            </div>
            <div className="flex gap-space-3">
              <Button onClick={connectWordPress} disabled={connecting} className="flex-1">
                {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
                {connecting ? "Testando conexão..." : "Conectar"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {integration && (
          <div className="space-y-space-5">
            <div className="flex items-center justify-between py-space-3 border-t border-border">
              <div className="flex items-center gap-space-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-body text-foreground font-mono">{integration.site_url}</span>
              </div>
              <a href={integration.site_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-foreground">Auto-publicar novos artigos</span>
              <Switch checked={integration.auto_publish} onCheckedChange={toggleAutoPublish} />
            </div>
            {integration.last_sync_at && (
              <div className="bg-success/10 border border-success/20 rounded-md p-space-3 flex items-center gap-space-2">
                <Check className="h-4 w-4 text-success" />
                <span className="text-body-sm text-success">
                  Última sincronização: {new Date(integration.last_sync_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            {logs.length > 0 && (
              <div>
                <p className="text-body-sm font-medium text-foreground mb-space-2">Últimas publicações</p>
                <div className="space-y-space-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-space-2 text-body-sm">
                      <Check className={`h-3 w-3 ${log.status === "success" ? "text-success" : "text-destructive"}`} />
                      <span className="text-foreground flex-1 truncate">
                        {log.external_url || log.external_id || (log.status === "error" ? log.error_message?.slice(0, 50) : "Publicado")}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button variant="ghost" className="text-destructive" onClick={disconnect}>Desconectar WordPress</Button>
          </div>
        )}
      </div>
    </div>
  );
}
