import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Eye, RotateCcw, Loader2, MapPin, Building2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const tabs = [
  { key: "pending", label: "Pendentes" },
  { key: "converted", label: "Convertidas" },
  { key: "dismissed", label: "Descartadas" },
];

function MiniGauge({ value, size = 48 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2 + 2;
  const pct = Math.min(1, Math.max(0, value / 100));
  const getPoint = (p: number) => {
    const angle = Math.PI - p * Math.PI;
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const arcPath = (from: number, to: number) => {
    const s = getPoint(from);
    const e = getPoint(to);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  const color =
    value >= 80
      ? "hsl(var(--success))"
      : value >= 60
      ? "hsl(var(--info))"
      : value >= 40
      ? "hsl(var(--warning))"
      : "hsl(var(--error))";

  return (
    <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`} className="shrink-0">
      <path d={arcPath(0, 1)} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} strokeLinecap="round" />
      {pct > 0 && (
        <path d={arcPath(0, pct)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" className="text-[12px] font-bold" fill="currentColor">
        {value}
      </text>
    </svg>
  );
}

export default function RadarPage() {
  const navigate = useNavigate();
  const { blog, loading: blogLoading } = useBlog();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("status") || "pending";

  const [opps, setOpps] = useState<Tables<"article_opportunities">[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const subcontaComplete =
    blog && blog.segmento && blog.bairro && blog.cidade && blog.servicos_oferecidos;

  const fetchOpps = async () => {
    if (!blog) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("article_opportunities")
      .select("*")
      .eq("blog_id", blog.id)
      .eq("status", currentTab)
      .order("relevance_score", { ascending: false });
    setOpps(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (blogLoading) return;
    fetchOpps();
  }, [blog, blogLoading, currentTab]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("article_opportunities")
      .update({ status })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else fetchOpps();
  };

  const convertOpportunity = async (opp: Tables<"article_opportunities">) => {
    if (!blog) return;
    setConvertingId(opp.id);
    try {
      // Usa o mesmo motor (generate-article-pipeline) do botão "Criar Artigo"
      const { data, error } = await supabase.functions.invoke("generate-article-pipeline", {
        body: {
          blog_id: blog.id,
          keyword: opp.primary_keyword,
          language: blog.language === "pt-BR" ? "pt-br" : blog.language?.toLowerCase() || "pt-br",
          size: "medium",
          tone: blog.brand_voice || "profissional e próximo",
          include_faq: true,
          include_images: true,
        },
      });

      if (error) {
        toast.error("Erro ao gerar artigo: " + error.message);
        setConvertingId(null);
        return;
      }

      const articleId = data?.article_id;
      if (articleId) {
        // Vincular oportunidade ao artigo gerado
        await supabase
          .from("article_opportunities")
          .update({ status: "converted", converted_article_id: articleId })
          .eq("id", opp.id);

        await supabase
          .from("articles")
          .update({ source_opportunity_id: opp.id })
          .eq("id", articleId);

        toast.success("Artigo sendo gerado pelo pipeline completo! Redirecionando...");
        navigate(`/client/articles/${articleId}`);
      } else {
        toast.error("Artigo gerado mas sem ID retornado");
      }
    } catch {
      toast.error("Erro ao converter oportunidade");
    }
    setConvertingId(null);
  };

  const generateOpportunities = async () => {
    if (!blog) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-opportunities", {
        body: { blog_id: blog.id },
      });
      if (error) {
        toast.error("Erro ao gerar oportunidades: " + error.message);
      } else {
        const localMsg = subcontaComplete
          ? ` hiper-localizadas para ${blog.bairro}, ${blog.cidade}`
          : "";
        toast.success(`${data?.count || 0} oportunidades${localMsg} geradas!`);
        const p = new URLSearchParams(searchParams);
        p.set("status", "pending");
        setSearchParams(p);
        fetchOpps();
      }
    } catch {
      toast.error("Erro ao gerar oportunidades");
    }
    setGenerating(false);
  };

  if (blogLoading)
    return (
      <div className="p-space-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      {/* ── Header ── */}
      <div className="h-16 flex items-center justify-between mb-space-5">
        <h1 className="text-h1 text-foreground">Radar de Oportunidades</h1>
        <Button onClick={generateOpportunities} disabled={generating || !blog}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-space-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-space-2" />
          )}
          {generating ? "Gerando..." : "Gerar Oportunidades"}
        </Button>
      </div>

      {/* ── Subconta context banner ── */}
      {blog && subcontaComplete && (
        <div className="flex items-center gap-space-3 bg-primary/5 border border-primary/20 rounded-lg px-space-4 py-space-3 mb-space-5 text-body-sm">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">{blog.name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{blog.segmento}</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {blog.bairro}, {blog.cidade}
          </span>
          <span className="ml-auto text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
            Radar hiper-localizado ativo
          </span>
        </div>
      )}

      {/* ── Subconta incomplete warning ── */}
      {blog && !subcontaComplete && (
        <div className="flex items-start gap-space-3 bg-amber-50 border border-amber-200 rounded-lg px-space-4 py-space-3 mb-space-5">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-amber-800">
              Radar usando dados genéricos
            </p>
            <p className="text-body-sm text-amber-700 mt-0.5">
              Preencha o <strong>Segmento</strong>, <strong>Bairro</strong>, <strong>Cidade</strong> e{" "}
              <strong>Serviços Oferecidos</strong> nas configurações para ativar oportunidades hiper-localizadas com
              dados reais da sua região.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/client/settings")}
            className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Completar dados
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-space-1 bg-muted rounded-md p-1 mb-space-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set("status", t.key);
              setSearchParams(p);
            }}
            className={`px-space-4 py-space-2 rounded text-body-sm font-medium transition-colors ${
              currentTab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Opportunity cards ── */}
      {loading ? (
        <div className="flex justify-center py-space-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-space-4">
          {opps.length === 0 ? (
            <div className="text-center py-space-8 text-muted-foreground">
              {currentTab === "pending"
                ? 'Nenhuma oportunidade pendente. Clique em "Gerar Oportunidades" para começar.'
                : "Nenhuma oportunidade nesta categoria."}
            </div>
          ) : (
            opps.map((opp) => (
              <div
                key={opp.id}
                className="bg-card border border-border rounded-lg p-space-5 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-space-4">
                  <MiniGauge value={opp.relevance_score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-space-4">
                      <h4 className="text-h4 text-foreground">{opp.suggested_title}</h4>
                      <span className="omniseen-badge badge-new shrink-0">{opp.intent}</span>
                    </div>
                    <div className="flex items-center gap-space-2 mt-space-2 flex-wrap">
                      <span className="px-space-2 py-0.5 rounded text-tiny bg-primary-light text-primary">
                        {opp.primary_keyword}
                      </span>
                      {opp.secondary_keywords?.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-space-2 py-0.5 rounded text-tiny bg-gray-100 text-gray-600">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-body-sm text-muted-foreground mt-space-2">
                      Tipo: {opp.recommended_type}
                      {opp.difficulty_estimate !== null && (
                        <> · Dificuldade: {opp.difficulty_estimate}/100</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-space-3 mt-space-4">
                  {opp.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => convertOpportunity(opp)}
                        disabled={convertingId === opp.id}
                      >
                        {convertingId === opp.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Gerando...
                          </>
                        ) : (
                          "Converter em Artigo"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => updateStatus(opp.id, "dismissed")}
                      >
                        Descartar
                      </Button>
                    </>
                  )}
                  {opp.status === "converted" && opp.converted_article_id && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/client/articles/${opp.converted_article_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver Artigo
                    </Button>
                  )}
                  {opp.status === "dismissed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(opp.id, "pending")}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
