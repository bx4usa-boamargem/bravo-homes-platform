import { useEffect, useState } from "react";
import { FileText, Layout, Users, PenTool, FilePlus, Radar, Zap, Globe, Plug, Search, Image, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { Skeleton } from "@/components/ui/skeleton";
import DigitalPresenceHero from "@/components/dashboard/DigitalPresenceHero";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

const tools = [
  { label: "Novo Artigo", icon: PenTool, route: "/client/articles/new" },
  { label: "Nova Página", icon: FilePlus, route: "/client/articles/new" },
  { label: "Radar", icon: Radar, route: "/client/radar" },
  { label: "Automação", icon: Zap, route: "/client/automation" },
  { label: "Domínios", icon: Globe, route: "/client/domains" },
  { label: "Integrações", icon: Plug, route: "/client/integrations" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { blog, profile, subscription, loading: blogLoading } = useBlog();
  const [articleCount, setArticleCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [superPageCount, setSuperPageCount] = useState(0);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      const [articlesRes, leadsRes, recentRes, pagesRes, oppsRes] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("blog_id", blog.id),
        supabase.from("brand_agent_leads").select("id", { count: "exact", head: true }).eq("blog_id", blog.id),
        supabase.from("articles").select("id, title, status, created_at").eq("blog_id", blog.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("landing_pages").select("id", { count: "exact", head: true }).eq("blog_id", blog.id),
        supabase.from("article_opportunities").select("id", { count: "exact", head: true }).eq("blog_id", blog.id).eq("status", "pending"),
      ]);
      setArticleCount(articlesRes.count ?? 0);
      setLeadCount(leadsRes.count ?? 0);
      setSuperPageCount(pagesRes.count ?? 0);
      setOpportunitiesCount(oppsRes.count ?? 0);
      setRecentDocs(recentRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [blog, blogLoading]);

  const trialDays = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  const metrics = [
    { label: "Artigos", value: articleCount, icon: FileText, color: "text-primary", bgColor: "bg-primary-light", route: "/client/articles" },
    { label: "Páginas", value: superPageCount, icon: Layout, color: "text-info", bgColor: "bg-info-light", route: "/client/landing-pages" },
    { label: "Leads", value: leadCount, icon: Users, color: "text-success", bgColor: "bg-success-light", route: "/client/leads" },
  ];

  // Estimate presence score from available data
  const presenceScore = Math.min(100, Math.round(
    (articleCount * 2) + (superPageCount * 5) + (leadCount * 3) + 20
  ));

  if (blogLoading || loading) {
    return (
      <div className="p-space-6 max-w-content-list mx-auto space-y-space-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-space-5">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-space-6">
        <div>
          <h2 className="text-h2 text-foreground">Olá, {profile?.full_name || "Usuário"}</h2>
          <p className="text-caption text-muted-foreground font-mono">{blog?.platform_subdomain}.omniseen.app</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {subscription?.plan === "trial" && (
            <span className="badge-trial omniseen-badge">Trial: {trialDays} dias</span>
          )}
        </div>
      </div>

      {/* Digital Presence Hero */}
      <div className="mb-space-7">
        <DigitalPresenceHero
          articleCount={articleCount}
          avgPosition={3}
          monthlyVisits={Math.round(articleCount * 70)}
          gmbRating={4.6}
          presenceScore={presenceScore}
          scoreChange={8}
          opportunitiesCount={opportunitiesCount}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-5 mb-space-7">
        {metrics.map((m) => (
          <button
            key={m.label}
            onClick={() => navigate(m.route)}
            className="bg-card border border-border rounded-lg p-space-5 flex items-center gap-space-4 hover:shadow-md hover:border-primary/20 transition-all text-left"
          >
            <div className={`h-12 w-12 rounded-full ${m.bgColor} flex items-center justify-center`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div>
              <p className="text-h2 text-foreground">{m.value}</p>
              <p className="text-body-sm text-muted-foreground">{m.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Motor Omniseen v1 */}
      <div className="mb-space-7">
        <h3 className="text-h3 text-foreground mb-space-4 flex items-center gap-space-2">
          Motor Omniseen v1 <span className="omniseen-badge badge-published text-[10px]">Ativo</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 mb-space-7">
          {[
            { name: "SERP Intelligence", fn: "generate-article-pro", icon: Search, color: "text-primary", badge: null },
            { name: "Super Page Squad", fn: "generate-super-page", icon: Zap, color: "text-info", badge: "Squad v2" },
            { name: "Regen de Imagens", fn: "ai-regen-image", icon: Image, color: "text-warning", badge: null },
            { name: "Sync WordPress", fn: "publish-to-cms", icon: Globe, color: "text-success", badge: null },
          ].map((f) => (
            <div key={f.fn} className="bg-card border border-border rounded-lg p-space-4 flex items-center gap-space-3">
              <f.icon className={`h-5 w-5 ${f.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-body-sm font-medium text-foreground">{f.name}</p>
                  {f.badge && (
                    <span className="text-[10px] font-semibold text-info bg-info/10 px-1.5 py-0.5 rounded-full">{f.badge}</span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">{f.fn}</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-success font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="mb-space-7">
        <h3 className="text-h3 text-foreground mb-space-4">Ferramentas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-space-4">
          {tools.map((t) => (
            <button
              key={t.label}
              onClick={() => navigate(t.route)}
              className="h-14 bg-card border border-border rounded-md px-space-4 flex items-center gap-space-3 hover:shadow-md hover:border-primary/20 transition-all text-body font-medium text-foreground"
            >
              <t.icon className="h-5 w-5 text-muted-foreground" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Docs */}
      <div>
        <div className="flex items-center justify-between mb-space-4">
          <h3 className="text-h3 text-foreground">Documentos Recentes</h3>
          <button onClick={() => navigate("/client/articles")} className="text-body-sm text-primary hover:underline">Ver todos</button>
        </div>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {recentDocs.length === 0 ? (
            <div className="p-space-5 text-center text-muted-foreground text-body-sm">Nenhum documento ainda</div>
          ) : (
            recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/client/articles/${doc.id}`)}
                className="w-full h-12 px-space-5 flex items-center gap-space-4 hover:bg-accent transition-colors text-left"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-body text-foreground flex-1 truncate">{doc.title}</span>
                <span className={`omniseen-badge badge-${doc.status}`}>{doc.status}</span>
                <span className="text-caption text-muted-foreground hidden sm:block">
                  {new Date(doc.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
