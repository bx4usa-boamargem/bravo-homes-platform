import { useEffect, useState } from "react";
import { Copy, ExternalLink, Globe, Plus, Trash2, Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

const dnsStatusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-4 w-4 text-success" />,
  pending: <Clock className="h-4 w-4 text-warning" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  verifying: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
};

const dnsStatusLabel: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  error: "Erro DNS",
  verifying: "Verificando...",
};

export default function DomainsPage() {
  const { blog, tenant, loading: blogLoading } = useBlog();
  const [domains, setDomains] = useState<Tables<"tenant_domains">[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // WordPress sync state
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpAppPass, setWpAppPass] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; timestamp: string } | null>(null);

  const fetchDomains = async () => {
    if (!tenant) { setLoading(false); return; }
    const { data } = await supabase.from("tenant_domains").select("*").eq("tenant_id", tenant.id);
    setDomains(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDomains(); }, [tenant]);

  const addDomain = async () => {
    if (!newDomain.trim() || !tenant || !blog) return;
    const { error } = await supabase.from("tenant_domains").insert({
      tenant_id: tenant.id,
      blog_id: blog.id,
      domain: newDomain.trim(),
      domain_type: "custom",
    });
    if (error) toast.error("Erro ao adicionar domínio");
    else { toast.success("Domínio adicionado — configure o DNS e clique em Verificar"); setNewDomain(""); fetchDomains(); }
  };

  const removeDomain = async (id: string) => {
    await supabase.from("tenant_domains").delete().eq("id", id);
    toast.success("Domínio removido");
    fetchDomains();
  };

  const verifyDns = async (domainId: string, domainName: string) => {
    setVerifyingId(domainId);
    try {
      // Update status to verifying
      await supabase.from("tenant_domains").update({ status: "verifying" }).eq("id", domainId);
      fetchDomains();

      // Call check-domain-dns edge function if available
      const { data, error } = await supabase.functions.invoke("check-domain-dns", {
        body: { domain: domainName, tenant_id: tenant?.id },
      });

      if (error || !data?.verified) {
        await supabase.from("tenant_domains").update({ status: "pending" }).eq("id", domainId);
        toast.error("DNS não propagado ainda. Aguarde e tente novamente.");
      } else {
        await supabase.from("tenant_domains").update({ status: "active" }).eq("id", domainId);
        toast.success("DNS verificado! Domínio ativo.");
      }
      fetchDomains();
    } catch {
      await supabase.from("tenant_domains").update({ status: "pending" }).eq("id", domainId);
      fetchDomains();
      toast.info("Função de verificação não disponível — atualize o status manualmente.");
    } finally {
      setVerifyingId(null);
    }
  };

  const syncToWordPress = async () => {
    if (!wpUrl || !wpUser || !wpAppPass || !blog) return;
    setSyncing(true);
    try {
      // Fetch published articles
      const { data: articles } = await supabase
        .from("articles")
        .select("title, content, slug, status")
        .eq("blog_id", blog.id)
        .eq("status", "published")
        .limit(10);

      if (!articles?.length) {
        toast.info("Nenhum artigo publicado para sincronizar.");
        return;
      }

      let successCount = 0;
      for (const article of articles) {
        const { data, error } = await supabase.functions.invoke("publish-to-cms", {
          body: {
            wpUrl: wpUrl.trim(),
            wpUser: wpUser.trim(),
            wpAppPass: wpAppPass.trim(),
            title: article.title,
            contentHtml: article.content,
            status: "publish",
            slug: article.slug,
          },
        });
        if (!error && data?.success) successCount++;
      }

      setSyncResult({
        message: `✅ ${successCount} artigos enviados para ${wpUrl}`,
        timestamp: new Date().toLocaleString("pt-BR"),
      });
      toast.success(`${successCount} de ${articles.length} artigos sincronizados com WordPress!`);
    } catch (err: any) {
      toast.error("Erro ao sincronizar: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const subdomain = blog?.platform_subdomain ? `${blog.platform_subdomain}.omniseen.app` : "";
  const omniUrl = subdomain ? `https://${subdomain}` : "";

  if (loading || blogLoading) return <div className="p-space-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-space-6 max-w-content-form mx-auto space-y-space-6">
      <h1 className="text-h1 text-foreground">Domínios</h1>

      {/* Subdomínio Omniseen */}
      <div className="bg-card border border-border rounded-lg p-space-6">
        <div className="flex items-center gap-space-3 mb-space-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-h3 text-foreground">Subdomínio Omniseen</h3>
          <span className="omniseen-badge badge-published">Ativo</span>
        </div>
        <p className="text-body-sm text-muted-foreground mb-space-4">
          Seu site está disponível gratuitamente neste endereço.
        </p>
        <div className="flex items-center gap-space-3">
          <code className="flex-1 bg-muted px-space-4 py-space-3 rounded-md text-body font-mono text-foreground truncate">
            {subdomain || "Configure seu subdomínio em Configurações"}
          </code>
          {subdomain && (
            <>
              <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(omniUrl); toast.success("URL copiada!"); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.open(omniUrl, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Domínios Personalizados */}
      <div className="bg-card border border-border rounded-lg p-space-6">
        <h3 className="text-h3 text-foreground mb-space-2">Domínio Personalizado</h3>
        <p className="text-body-sm text-muted-foreground mb-space-5">
          Use seu próprio domínio (ex: blog.suaempresa.com.br). Configure o DNS abaixo e clique em Verificar.
        </p>

        <div className="space-y-space-4 mb-space-5">
          {domains.filter(d => d.domain_type === "custom").map((d) => (
            <div key={d.id} className="flex items-center justify-between py-space-3 border-b border-border last:border-0">
              <div className="flex items-center gap-space-3">
                <span className="text-body font-mono text-foreground">{d.domain}</span>
                <div className="flex items-center gap-1">
                  {dnsStatusIcon[d.status ?? "pending"]}
                  <span className={cn(
                    "text-caption font-medium",
                    d.status === "active" ? "text-success" : d.status === "error" ? "text-destructive" : "text-warning"
                  )}>
                    {dnsStatusLabel[d.status ?? "pending"]}
                  </span>
                </div>
              </div>
              <div className="flex gap-space-2">
                {d.status !== "active" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => verifyDns(d.id, d.domain)}
                    disabled={verifyingId === d.id}
                    className="gap-1"
                  >
                    <RefreshCw className={cn("h-3 w-3", verifyingId === d.id && "animate-spin")} />
                    Verificar DNS
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeDomain(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {domains.filter(d => d.domain_type === "custom").length === 0 && (
            <p className="text-body-sm text-muted-foreground">Nenhum domínio personalizado adicionado</p>
          )}
        </div>

        <div className="flex gap-space-3">
          <Input
            placeholder="blog.suaempresa.com.br"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomain()}
            className="flex-1"
          />
          <Button onClick={addDomain} disabled={!newDomain.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Configuração DNS */}
      <div className="bg-card border border-border rounded-lg p-space-6">
        <h3 className="text-h3 text-foreground mb-space-4">Instruções de Configuração DNS</h3>
        <p className="text-body-sm text-muted-foreground mb-space-4">
          No painel do seu registrador de domínio, adicione os seguintes registros:
        </p>
        <div className="space-y-space-3">
          <div className="bg-muted rounded-md p-space-4">
            <p className="text-caption text-muted-foreground mb-space-1 font-medium">CNAME</p>
            <code className="font-mono text-foreground text-body-sm">@ → omniseen.app</code>
            <p className="text-caption text-muted-foreground mt-1">Aponta seu domínio para a plataforma Omniseen</p>
          </div>
          <div className="bg-muted rounded-md p-space-4">
            <p className="text-caption text-muted-foreground mb-space-1 font-medium">TXT (verificação)</p>
            <code className="font-mono text-foreground text-body-sm">omniseen-verify={tenant?.id?.slice(0, 12) || "..."}</code>
            <p className="text-caption text-muted-foreground mt-1">Prova que você é o dono do domínio</p>
          </div>
        </div>
        <p className="text-caption text-muted-foreground mt-space-4">
          A propagação DNS pode levar até 48h. Clique em "Verificar DNS" após configurar.
        </p>
      </div>

      {/* Publicação WordPress */}
      <div className="bg-card border border-primary/20 rounded-lg p-space-6">
        <div className="flex items-center gap-space-3 mb-space-2">
          <Globe className="h-5 w-5 text-info" />
          <h3 className="text-h3 text-foreground">Publicar via WordPress</h3>
          <span className="text-[10px] font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full">Novo</span>
        </div>
        <p className="text-body-sm text-muted-foreground mb-space-5">
          Sincronize seus artigos publicados diretamente para um site WordPress.
        </p>
        <div className="space-y-space-3 mb-space-5">
          <div>
            <label className="text-caption text-muted-foreground mb-1 block">URL do WordPress</label>
            <Input
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
              placeholder="https://meusite.com.br"
            />
          </div>
          <div className="grid grid-cols-2 gap-space-3">
            <div>
              <label className="text-caption text-muted-foreground mb-1 block">Usuário</label>
              <Input
                value={wpUser}
                onChange={(e) => setWpUser(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-caption text-muted-foreground mb-1 block">Senha de Aplicativo</label>
              <Input
                type="password"
                value={wpAppPass}
                onChange={(e) => setWpAppPass(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
              />
              <p className="text-caption text-muted-foreground mt-1">
                Não sabe como gerar?{" "}
                <a href="https://wordpress.com/support/application-passwords/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Veja o guia oficial →
                </a>
              </p>
            </div>
          </div>
          <p className="text-caption text-muted-foreground">
            Gere uma Senha de Aplicativo em: WordPress Admin → Usuários → Perfil → Senhas de Aplicativo
          </p>
        </div>
        <Button
          onClick={syncToWordPress}
          disabled={!wpUrl || !wpUser || !wpAppPass || syncing}
          className="w-full"
        >
          {syncing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sincronizando...</>
          ) : (
            "Sincronizar artigos publicados → WordPress"
          )}
        </Button>
        {syncResult && (
          <div className="mt-space-4 bg-success/10 border border-success/20 rounded-lg p-space-4 flex items-center gap-space-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-body-sm font-medium text-foreground">{syncResult.message}</p>
              <p className="text-caption text-muted-foreground">{syncResult.timestamp}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
