import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, BookOpen, Bot, CreditCard, Loader2, Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const SEGMENTOS = [
  "Advocacia / Jurídico",
  "Contabilidade / Auditoria",
  "Tecnologia da Informação",
  "Saúde / Medicina",
  "Educação / Treinamento",
  "Engenharia / Construção",
  "Marketing / Publicidade",
  "Consultoria Empresarial",
  "Varejo / E-commerce",
  "Alimentação / Gastronomia",
  "Logística / Transporte",
  "Imobiliário",
  "Financeiro / Seguros",
  "Recursos Humanos",
  "Beleza / Estética",
  "Outro",
];

export default function SettingsPage() {
  const { blog, profile, subscription, loading: ctxLoading } = useBlog();

  // ── Perfil ────────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");

  // ── Blog ─────────────────────────────────────────────────────────────────
  const [blogName, setBlogName] = useState("");
  const [blogDesc, setBlogDesc] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  // ── Subconta ──────────────────────────────────────────────────────────────
  const [segmento, setSegmento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [servicosOferecidos, setServicosOferecidos] = useState("");

  // ── Agente de Vendas ──────────────────────────────────────────────────────
  const [agent, setAgent] = useState<Tables<"brand_agent_config"> | null>(null);
  const [agentName, setAgentName] = useState("Assistente");
  const [agentMsg, setAgentMsg] = useState("Olá! Como posso ajudar?");
  const [agentEnabled, setAgentEnabled] = useState(false);

  const [saving, setSaving] = useState(false);

  // ── Sub-context completeness indicator ────────────────────────────────────
  const subcontaComplete = segmento && bairro && cidade && servicosOferecidos;

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
    if (blog) {
      setBlogName(blog.name);
      setBlogDesc(blog.description);
      setLanguage(blog.language);
      setTimezone(blog.timezone);
      setSegmento(blog.segmento ?? "");
      setEndereco(blog.endereco ?? "");
      setBairro(blog.bairro ?? "");
      setCidade(blog.cidade ?? "");
      setCep(blog.cep ?? "");
      setServicosOferecidos(blog.servicos_oferecidos ?? "");

      supabase
        .from("brand_agent_config")
        .select("*")
        .eq("blog_id", blog.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAgent(data);
            setAgentName(data.agent_name);
            setAgentMsg(data.welcome_message);
            setAgentEnabled(data.is_enabled);
          }
        });
    }
  }, [profile, blog]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", profile.user_id);
    toast.success("Perfil salvo");
    setSaving(false);
  };

  const saveBlog = async () => {
    if (!blog) return;
    setSaving(true);
    await supabase
      .from("blogs")
      .update({ name: blogName, description: blogDesc, language, timezone })
      .eq("id", blog.id);
    toast.success("Blog salvo");
    setSaving(false);
  };

  const saveSubconta = async () => {
    if (!blog) return;
    setSaving(true);
    const { error } = await supabase
      .from("blogs")
      .update({
        segmento,
        endereco,
        bairro,
        cidade,
        cep,
        servicos_oferecidos: servicosOferecidos,
      })
      .eq("id", blog.id);
    if (error) {
      toast.error("Erro ao salvar dados da subconta");
    } else {
      toast.success("Dados da subconta salvos! Radar e gerador de artigos já usam as novas informações.");
    }
    setSaving(false);
  };

  const saveAgent = async () => {
    if (!blog) return;
    setSaving(true);
    if (agent) {
      await supabase
        .from("brand_agent_config")
        .update({ agent_name: agentName, welcome_message: agentMsg, is_enabled: agentEnabled })
        .eq("blog_id", blog.id);
    } else {
      await supabase.from("brand_agent_config").insert({
        blog_id: blog.id,
        agent_name: agentName,
        welcome_message: agentMsg,
        is_enabled: agentEnabled,
      });
    }
    toast.success("Agente salvo");
    setSaving(false);
  };

  if (ctxLoading)
    return (
      <div className="p-space-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const trialDays = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="p-space-6 max-w-content-form mx-auto">
      <h1 className="text-h1 text-foreground mb-space-7">Configurações</h1>

      {/* ── Perfil ── */}
      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-6">
        <h3 className="text-h3 text-foreground mb-space-5 flex items-center gap-space-2">
          <User className="h-5 w-5" /> Perfil
        </h3>
        <div className="space-y-space-5">
          <div className="flex items-center gap-space-5">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-h2 font-semibold">
              {fullName?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Nome</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            Salvar Perfil
          </Button>
        </div>
      </div>

      {/* ── Blog ── */}
      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-6">
        <h3 className="text-h3 text-foreground mb-space-5 flex items-center gap-space-2">
          <BookOpen className="h-5 w-5" /> Configurações do Blog
        </h3>
        <div className="space-y-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Nome do Blog</label>
            <Input value={blogName} onChange={(e) => setBlogName(e.target.value)} />
          </div>
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Descrição</label>
            <Textarea value={blogDesc} onChange={(e) => setBlogDesc(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-space-5">
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Idioma</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Fuso horário</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">América/São Paulo</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveBlog} disabled={saving}>
            Salvar Blog
          </Button>
        </div>
      </div>

      {/* ── Dados da Subconta ── */}
      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-6">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-space-2">
            <Building2 className="h-5 w-5" /> Dados da Subconta
          </h3>
          {subcontaComplete ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              Radar ativo
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Incompleto — preencha para ativar o Radar
            </span>
          )}
        </div>

        <p className="text-body-sm text-muted-foreground mb-space-5">
          Estas informações são usadas pelo <strong>Radar de Oportunidades</strong> e pelo{" "}
          <strong>Gerador de Artigos</strong> para criar conteúdo hiper-localizado com contexto real da sua região.
        </p>

        <div className="space-y-space-5">
          {/* Segmento */}
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">
              Segmento de Atuação
            </label>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento..." />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Endereço */}
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Endereço Completo
            </label>
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número"
            />
          </div>

          {/* Bairro + CEP */}
          <div className="grid grid-cols-2 gap-space-5">
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">Bairro</label>
              <Input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
            <div>
              <label className="text-body-sm font-medium text-foreground mb-space-2 block">CEP</label>
              <Input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          {/* Cidade */}
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">Cidade / UF</label>
            <Input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: São Paulo / SP"
            />
          </div>

          {/* Serviços */}
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">
              Serviços Oferecidos
            </label>
            <Textarea
              value={servicosOferecidos}
              onChange={(e) => setServicosOferecidos(e.target.value)}
              rows={3}
              placeholder="Descreva os principais serviços que sua empresa oferece..."
            />
          </div>

          <Button onClick={saveSubconta} disabled={saving}>
            Salvar Dados da Subconta
          </Button>
        </div>
      </div>

      {/* ── Agente de Vendas ── */}
      <div className="bg-card border border-border rounded-lg p-space-6 mb-space-6">
        <div className="flex items-center justify-between mb-space-5">
          <h3 className="text-h3 text-foreground flex items-center gap-space-2">
            <Bot className="h-5 w-5" /> Agente de Vendas
          </h3>
          <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} />
        </div>
        <div className="space-y-space-5">
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">
              Nome do Agente
            </label>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} />
          </div>
          <div>
            <label className="text-body-sm font-medium text-foreground mb-space-2 block">
              Mensagem inicial
            </label>
            <Textarea value={agentMsg} onChange={(e) => setAgentMsg(e.target.value)} rows={2} />
          </div>
          <Button onClick={saveAgent} disabled={saving}>
            Salvar Agente
          </Button>
        </div>
      </div>

      {/* ── Faturamento ── */}
      <div className="bg-card border border-border rounded-lg p-space-6">
        <h3 className="text-h3 text-foreground mb-space-5 flex items-center gap-space-2">
          <CreditCard className="h-5 w-5" /> Faturamento
        </h3>
        <div className="flex items-center justify-between mb-space-5">
          <div>
            <p className="text-body font-medium text-foreground">
              Plano {subscription?.plan || "Trial"}
            </p>
            {subscription?.plan === "trial" && (
              <p className="text-body-sm text-muted-foreground">{trialDays} dias restantes</p>
            )}
          </div>
          <span className="badge-trial omniseen-badge">{subscription?.plan || "Trial"}</span>
        </div>
        <Button>Gerenciar Plano</Button>
      </div>
    </div>
  );
}
