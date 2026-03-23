import { useEffect, useState, useMemo } from "react";
import { Zap, Plus, ExternalLink, Loader2, Search, Code2, Eye, Trash2, Pencil, Save, X, Filter, Copy, Share2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import SuperPageSeoPanel from "@/components/SuperPageSeoPanel";

type LandingPage = Tables<"landing_pages">;
type SuperPage = Tables<"super_pages">;

const superPagePhases = [
  { text: "AGENT-1: Analisando SERP e capturando People Also Ask" },
  { text: "AGENT-2: Content Writer gerando 2500+ palavras" },
  { text: "AGENT-3: E-E-A-T Enricher injetando autoridade e fontes" },
  { text: "AGENT-4: Schema Architect gerando JSON-LD" },
  { text: "AGENT-6: Quality Gate verificando 20 critérios" },
];

const htmlGenPhases = [
  { icon: Search, text: (kw: string) => `Analisando SERP para '${kw}'...` },
  { icon: MapPin, text: () => "Buscando concorrentes locais no Google Maps..." },
  { icon: Code2, text: () => "Gerando HTML com GPT-4o..." },
  { icon: Eye, text: () => "Finalizando e publicando..." },
];

export default function LandingPagesPage() {
  const { blog, loading: blogLoading } = useBlog();
  const [activeTab, setActiveTab] = useState("super-pages");

  // Super Pages state
  const [superPages, setSuperPages] = useState<SuperPage[]>([]);
  const [spLoading, setSpLoading] = useState(true);
  const [showCreateSP, setShowCreateSP] = useState(false);
  const [spKeyword, setSpKeyword] = useState("");
  const [spNicho, setSpNicho] = useState("");
  const [spGenerating, setSpGenerating] = useState(false);
  const [spGenPhase, setSpGenPhase] = useState(0);

  // Landing Pages (HTML) state
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [lpLoading, setLpLoading] = useState(true);
  const [showCreateLP, setShowCreateLP] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [services, setServices] = useState("");
  const [language, setLanguage] = useState("auto");
  const [targetCity, setTargetCity] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Editor state (for HTML landing pages)
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<"code" | "preview">("code");

  // SEO Panel
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);

  const getShareUrl = (slug: string, isSP = false) => {
    const base = window.location.origin;
    return isSP ? `${base}/sp/${slug}` : `${base}/p/${slug}`;
  };

  const copyShareLink = (slug: string, isSP = false) => {
    navigator.clipboard.writeText(getShareUrl(slug, isSP));
    toast.success("Link copiado!");
  };

  // Fetch Super Pages
  const fetchSuperPages = async () => {
    if (!blog) { setSpLoading(false); return; }
    const { data } = await supabase
      .from("super_pages")
      .select("*")
      .eq("blog_id", blog.id)
      .order("created_at", { ascending: false });
    setSuperPages((data as SuperPage[]) ?? []);
    setSpLoading(false);
  };

  // Fetch Landing Pages
  const fetchPages = async () => {
    if (!blog) { setLpLoading(false); return; }
    const { data } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("blog_id", blog.id)
      .order("created_at", { ascending: false });
    setPages((data as LandingPage[]) ?? []);
    setLpLoading(false);
  };

  useEffect(() => {
    if (!blogLoading) {
      fetchSuperPages();
      fetchPages();
    }
  }, [blog, blogLoading]);

  // Super Page generation phases
  useEffect(() => {
    if (!spGenerating) { setSpGenPhase(0); return; }
    let phase = 0;
    setSpGenPhase(0);
    const interval = setInterval(() => {
      phase++;
      if (phase < superPagePhases.length) setSpGenPhase(phase);
      else clearInterval(interval);
    }, 3500);
    return () => clearInterval(interval);
  }, [spGenerating]);

  // HTML generation phases
  useEffect(() => {
    if (!generating) { setGenPhase(0); return; }
    let phase = 0;
    setGenPhase(0);
    const interval = setInterval(() => {
      phase++;
      if (phase < htmlGenPhases.length) setGenPhase(phase);
      else clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  // Create Super Page
  const createSuperPage = async () => {
    if (!spKeyword.trim() || !blog) return;
    setSpGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-super-page", {
        body: { blog_id: blog.id, keyword: spKeyword.trim(), size: "medium", tone: "profissional" },
      });
      if (error) { toast.error("Erro ao gerar Super Page"); return; }
      const score = data?.quality_score ?? "?";
      toast.success(`Super Page criada! Score: ${score}/100`);
      setShowCreateSP(false);
      setSpKeyword("");
      setSpNicho("");
      fetchSuperPages();
    } catch {
      toast.error("Erro ao gerar Super Page");
    } finally {
      setSpGenerating(false);
    }
  };

  // Create HTML Landing Page
  const createPage = async () => {
    if (!keyword.trim() || !blog) return;
    setGenerating(true);
    try {
      const body: Record<string, string> = { blog_id: blog.id, keyword: keyword.trim() };
      if (services.trim()) body.services_override = services.trim();
      if (language !== "auto") body.language_override = language;
      if (targetCity.trim()) body.city_override = targetCity.trim();
      if (targetAudience.trim()) body.audience_override = targetAudience.trim();
      const { error } = await supabase.functions.invoke("generate-super-page", { body });
      if (error) { toast.error("Erro ao gerar Landing Page"); return; }
      toast.success("Landing Page criada!");
      setShowCreateLP(false);
      setKeyword(""); setServices(""); setLanguage("auto"); setTargetCity(""); setTargetAudience("");
      fetchPages();
    } catch {
      toast.error("Erro ao gerar página");
    } finally {
      setGenerating(false);
    }
  };

  const openEditor = (page: LandingPage) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
  };

  const saveEdit = async () => {
    if (!editingPage) return;
    setSaving(true);
    const { error } = await supabase
      .from("landing_pages")
      .update({ title: editTitle, content: editContent, updated_at: new Date().toISOString() })
      .eq("id", editingPage.id);
    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Landing Page atualizada!");
      setPages((prev) => prev.map((p) => p.id === editingPage.id ? { ...p, title: editTitle, content: editContent } : p));
      setEditingPage(null);
    }
    setSaving(false);
  };

  // Publish Super Page
  const publishSuperPage = async (id: string) => {
    const { error } = await supabase
      .from("super_pages")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao publicar");
    } else {
      toast.success("Super Page publicada!");
      setSuperPages((prev) => prev.map((p) => p.id === id ? { ...p, status: "published", published_at: new Date().toISOString() } : p));
    }
  };

  // Delete Super Page
  const deleteSuperPage = async (id: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta Super Page?");
    if (!confirmed) return;
    const { error } = await supabase.from("super_pages").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Super Page excluída");
      setSuperPages((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Quality score color
  const scoreColor = (score: number | null) => {
    if (!score) return "bg-destructive";
    if (score >= 17) return "bg-success";
    if (score >= 12) return "bg-warning";
    return "bg-destructive";
  };

  const statusBadgeClass = (status: string | null) => {
    if (status === "published") return "bg-success/10 text-success border-success/20";
    if (status === "needs_review") return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground border-border";
  };

  // Filter super pages
  const filteredSuperPages = superPages.filter((p) => {
    const matchesSearch = !searchFilter || (p.meta_title || p.title).toLowerCase().includes(searchFilter.toLowerCase()) || (p.focus_keyword || "").toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter landing pages
  const filteredPages = pages.filter((p) => {
    const matchesSearch = !searchFilter || p.title.toLowerCase().includes(searchFilter.toLowerCase()) || p.focus_keyword.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (blogLoading) {
    return <div className="p-space-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-space-5">
        <h1 className="text-h1 text-foreground">Super Pages</h1>
        <Button onClick={() => activeTab === "super-pages" ? setShowCreateSP(true) : setShowCreateLP(true)}>
          <Plus className="h-4 w-4 mr-1" /> {activeTab === "super-pages" ? "Nova Super Page" : "Nova Landing Page"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-space-5">
        <TabsList>
          <TabsTrigger value="super-pages" className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Super Pages
          </TabsTrigger>
          <TabsTrigger value="landing-pages" className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4" /> Landing Pages HTML
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-space-3 mt-space-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título ou palavra-chave..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="needs_review">Revisão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ===== TAB: Super Pages ===== */}
        <TabsContent value="super-pages">
          {spLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : superPages.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-space-7 text-center">
              <Zap className="h-10 w-10 text-info mx-auto mb-space-4" />
              <h3 className="text-h3 text-foreground mb-space-2">Nenhuma Super Page ainda</h3>
              <p className="text-body-sm text-muted-foreground mb-space-5">Crie conteúdos premium com 7 agentes de IA.</p>
              <Button onClick={() => setShowCreateSP(true)}><Plus className="h-4 w-4 mr-1" /> Criar primeira Super Page</Button>
            </div>
          ) : filteredSuperPages.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-space-7 text-center">
              <p className="text-body-sm text-muted-foreground">Nenhuma Super Page corresponde aos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-5">
              {filteredSuperPages.map((sp) => (
                <div key={sp.id} className="bg-card border border-border rounded-lg p-space-5 flex flex-col hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-space-2 mb-space-3">
                    <span className="flex items-center gap-1 text-tiny font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full">
                      <Zap className="h-3 w-3" /> Super Page
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(sp.status)}`}>
                      {sp.status || "draft"}
                    </Badge>
                  </div>

                  <h3 className="text-body font-semibold text-foreground mb-space-1 line-clamp-2">
                    {sp.meta_title || sp.title}
                  </h3>

                  {sp.focus_keyword && (
                    <span className="text-tiny font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-fit mb-space-3">
                      🔑 {sp.focus_keyword}
                    </span>
                  )}

                  {/* Quality Score */}
                  <div className="flex items-center gap-space-3 mb-space-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-tiny mb-1">
                        <span className="text-muted-foreground">Quality Score</span>
                        <span className="font-semibold text-foreground">{sp.quality_score ?? 0}/20</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(sp.quality_score)} transition-all`} style={{ width: `${((sp.quality_score ?? 0) / 20) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-tiny text-muted-foreground">{sp.word_count ?? 0} palavras</span>
                  </div>

                  {/* SERP badges */}
                  <div className="flex flex-wrap gap-1.5 mb-space-3">
                    {sp.serp_data && typeof sp.serp_data === "object" && Array.isArray((sp.serp_data as any).competitors) && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        🎯 {(sp.serp_data as any).competitors.length} concorrentes analisados
                      </span>
                    )}
                    {sp.serp_data && typeof sp.serp_data === "object" && (sp.serp_data as any).position && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(sp.serp_data as any).position <= 3 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        📍 Posição #{(sp.serp_data as any).position} no Google
                      </span>
                    )}
                  </div>
                  <div className="flex gap-space-2 mt-auto">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`/sp/${sp.slug}`, "_blank")}>
                      <Eye className="h-4 w-4 mr-1" /> Visualizar
                    </Button>
                    {sp.status !== "published" && (
                      <Button variant="outline" size="sm" onClick={() => publishSuperPage(sp.id)}>
                        Publicar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSuperPage(sp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== TAB: Landing Pages HTML ===== */}
        <TabsContent value="landing-pages">
          {lpLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : pages.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-space-7 text-center">
              <Code2 className="h-10 w-10 text-muted-foreground mx-auto mb-space-4" />
              <h3 className="text-h3 text-foreground mb-space-2">Nenhuma Landing Page HTML</h3>
              <p className="text-body-sm text-muted-foreground mb-space-5">Crie páginas de conversão com HTML gerado por IA.</p>
              <Button onClick={() => setShowCreateLP(true)}><Plus className="h-4 w-4 mr-1" /> Criar Landing Page</Button>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-space-7 text-center">
              <p className="text-body-sm text-muted-foreground">Nenhuma Landing Page corresponde aos filtros.</p>
            </div>
          ) : (
            <div className="flex gap-space-5">
              <div className={`flex-1 grid grid-cols-1 ${selectedPage ? "" : "md:grid-cols-2"} gap-space-5`}>
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    className={`bg-card border rounded-lg p-space-5 flex flex-col cursor-pointer transition-all hover:border-primary/50 ${
                      selectedPage?.id === page.id ? "border-primary ring-1 ring-primary/20" : "border-border"
                    }`}
                    onClick={() => setSelectedPage(selectedPage?.id === page.id ? null : page)}
                  >
                    <div className="flex items-center gap-space-2 mb-space-3">
                      <span className="flex items-center gap-1 text-tiny font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Code2 className="h-3 w-3" /> HTML
                      </span>
                      <span className={`omniseen-badge badge-${page.status}`}>{page.status}</span>
                    </div>
                    <h3 className="text-body font-semibold text-foreground mb-space-1 line-clamp-2">{page.title}</h3>
                    <p className="text-caption text-muted-foreground font-mono mb-space-3">/{page.slug}</p>
                    {page.focus_keyword && (
                      <div className="flex flex-wrap gap-space-2 mt-auto mb-space-3">
                        <span className="text-tiny font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">🔑 {page.focus_keyword}</span>
                      </div>
                    )}
                    <div className="flex gap-space-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`/p/${page.slug}`, "_blank")}>
                        <Eye className="h-4 w-4 mr-1" /> Visualizar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditor(page)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/p/${page.slug}`, "_blank")}><ExternalLink className="h-4 w-4" /></Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          const confirmed = window.confirm("Excluir esta Landing Page?");
                          if (!confirmed) return;
                          const { error } = await supabase.from("landing_pages").delete().eq("id", page.id);
                          if (error) { toast.error("Erro ao excluir"); } else {
                            toast.success("Landing Page excluída");
                            setPages((prev) => prev.filter((p) => p.id !== page.id));
                            if (selectedPage?.id === page.id) setSelectedPage(null);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPage && (
                <div className="hidden lg:block w-[320px] flex-shrink-0 sticky top-4 self-start">
                  <SuperPageSeoPanel data={{ content: selectedPage.content, title: selectedPage.title, metaTitle: selectedPage.meta_title, metaDescription: selectedPage.meta_description, focusKeyword: selectedPage.focus_keyword }} />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== Modal: Create Super Page ===== */}
      <Dialog open={showCreateSP} onOpenChange={setShowCreateSP}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-info" /> Nova Super Page</DialogTitle>
          </DialogHeader>
          {!spGenerating ? (
            <div className="space-y-space-4">
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Keyword principal *</label>
                <Input value={spKeyword} onChange={(e) => setSpKeyword(e.target.value)} placeholder="Ex: como escolher um advogado trabalhista" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Nicho</label>
                <Input value={spNicho} onChange={(e) => setSpNicho(e.target.value)} placeholder="Ex: culinária saudável, advocacia trabalhista" />
              </div>
              <p className="text-tiny text-muted-foreground">
                7 agentes de IA: SERP Intelligence → Content Writer → E-E-A-T Enricher → Schema Architect → Quality Gate
              </p>
              <Button onClick={createSuperPage} disabled={!spKeyword.trim()} className="w-full">
                <Zap className="h-4 w-4 mr-1" /> Gerar Super Page
              </Button>
            </div>
          ) : (
            <div className="py-space-6 space-y-space-4">
              {superPagePhases.map((phase, i) => {
                const isActive = i === spGenPhase;
                const isDone = i < spGenPhase;
                return (
                  <div key={i} className={`flex items-center gap-space-3 transition-opacity ${i > spGenPhase ? "opacity-30" : "opacity-100"}`}>
                    {isDone ? (
                      <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center"><Zap className="h-3 w-3 text-primary-foreground" /></div>
                    ) : isActive ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted" />
                    )}
                    <span className={`text-body-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{phase.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Modal: Create HTML Landing Page ===== */}
      <Dialog open={showCreateLP} onOpenChange={setShowCreateLP}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Code2 className="h-5 w-5 text-muted-foreground" /> Nova Landing Page HTML</DialogTitle>
          </DialogHeader>
          {!generating ? (
            <div className="space-y-space-4">
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Palavra-chave principal *</label>
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ex: encanador em São Paulo" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Serviços específicos</label>
                <Input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Ex: desentupimento, reparo de tubulação" />
              </div>
              <div className="grid grid-cols-2 gap-space-3">
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-2 block">Idioma</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático</SelectItem>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-2 block">Cidade alvo</label>
                  <Input value={targetCity} onChange={(e) => setTargetCity(e.target.value)} placeholder="Ex: São Paulo" />
                </div>
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Público-alvo</label>
                <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Ex: proprietários de imóveis" />
              </div>
              <Button onClick={createPage} disabled={!keyword.trim()} className="w-full">
                <Code2 className="h-4 w-4 mr-1" /> Gerar Landing Page
              </Button>
            </div>
          ) : (
            <div className="py-space-6 space-y-space-4">
              {htmlGenPhases.map((phase, i) => {
                const PhaseIcon = phase.icon;
                const isActive = i === genPhase;
                const isDone = i < genPhase;
                return (
                  <div key={i} className={`flex items-center gap-space-3 transition-opacity ${i > genPhase ? "opacity-30" : "opacity-100"}`}>
                    {isDone ? (
                      <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center"><Zap className="h-3 w-3 text-primary-foreground" /></div>
                    ) : isActive ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <PhaseIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className={`text-body-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{phase.text(keyword)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Editor HTML ===== */}
      <Dialog open={!!editingPage} onOpenChange={(open) => { if (!open) setEditingPage(null); }}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] flex flex-col p-4">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-info" /> Editar Landing Page</DialogTitle>
              {editingPage && (
                <div className="flex items-center gap-space-2">
                  <Button variant="outline" size="sm" onClick={() => copyShareLink(editingPage.slug)}>
                    <Share2 className="h-4 w-4 mr-1" /> Copiar link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/p/${editingPage.slug}`, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {editingPage && (
            <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
              <div className="flex flex-col gap-space-3 w-[40%] min-h-0 flex-shrink-0">
                <div>
                  <label className="text-body-sm font-medium text-foreground mb-space-1 block">Título</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="flex gap-1 lg:hidden">
                  <Button variant={editorTab === "code" ? "default" : "outline"} size="sm" onClick={() => setEditorTab("code")}><Code2 className="h-4 w-4 mr-1" /> HTML</Button>
                  <Button variant={editorTab === "preview" ? "default" : "outline"} size="sm" onClick={() => setEditorTab("preview")}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
                </div>
                <div className={`flex-1 min-h-0 flex flex-col ${editorTab !== "code" ? "hidden lg:flex" : ""}`}>
                  <label className="text-body-sm font-medium text-foreground mb-space-1 block">Conteúdo HTML</label>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1 min-h-0 font-mono text-xs resize-none" />
                </div>
                <div className="flex gap-space-2 justify-end flex-shrink-0">
                  <Button variant="outline" onClick={() => setEditingPage(null)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
                  <Button onClick={saveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Salvar
                  </Button>
                </div>
              </div>
              <div className={`flex-1 min-h-0 flex flex-col border border-border rounded-lg overflow-hidden ${editorTab !== "preview" ? "hidden lg:flex" : ""}`}>
                <div className="bg-muted px-3 py-1.5 flex items-center justify-between border-b border-border flex-shrink-0">
                  <span className="text-tiny font-medium text-muted-foreground">Preview</span>
                  <Button variant="ghost" size="sm" className="h-6 text-tiny" onClick={() => copyShareLink(editingPage.slug)}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar link
                  </Button>
                </div>
                <iframe
                  className="flex-1 w-full bg-white"
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;}</style></head><body>${editContent}</body></html>`}
                  sandbox="allow-same-origin"
                  title="Preview"
                />
              </div>
              <div className="hidden xl:block w-[280px] flex-shrink-0 overflow-y-auto">
                <SuperPageSeoPanel data={{ content: editContent, title: editTitle, metaTitle: editingPage.meta_title, metaDescription: editingPage.meta_description, focusKeyword: editingPage.focus_keyword }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile SEO Panel */}
      {selectedPage && (
        <Dialog open={!!selectedPage} onOpenChange={(open) => { if (!open) setSelectedPage(null); }}>
          <DialogContent className="lg:hidden max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Análise SEO</DialogTitle></DialogHeader>
            <SuperPageSeoPanel data={{ content: selectedPage.content, title: selectedPage.title, metaTitle: selectedPage.meta_title, metaDescription: selectedPage.meta_description, focusKeyword: selectedPage.focus_keyword }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
