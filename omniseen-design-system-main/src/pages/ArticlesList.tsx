import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, MoreVertical, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { sanitizeImageUrl } from "@/lib/sanitize";

const tabs = [
  { key: "all", label: "Todos" },
  { key: "draft", label: "Rascunhos" },
  { key: "scheduled", label: "Agendados" },
  { key: "published", label: "Publicados" },
  { key: "failed", label: "Falhas" },
];

const ITEMS_PER_PAGE = 12;

export default function ArticlesList() {
  const navigate = useNavigate();
  const { blog, loading: blogLoading } = useBlog();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [articles, setArticles] = useState<Tables<"articles">[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogLoading) return;
    if (!blog) { setLoading(false); return; }
    const fetchArticles = async () => {
      setLoading(true);
      let query = supabase
        .from("articles")
        .select("*", { count: "exact" })
        .eq("blog_id", blog.id)
        .order("created_at", { ascending: false });

      if (currentTab !== "all") {
        query = query.eq("status", currentTab);
      }
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, count, error } = await query;
      if (error) {
        toast.error("Erro ao carregar artigos");
      } else {
        setArticles(data ?? []);
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    };
    fetchArticles();
  }, [blog, blogLoading, currentTab, searchQuery, page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", tab);
    params.delete("page");
    setSearchParams(params);
  };

  const setSearch = (q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) params.set("search", q);
    else params.delete("search");
    params.delete("page");
    setSearchParams(params);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Artigo excluído");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleRetry = async (article: Tables<"articles">) => {
    const engine = (article as any).engine || "v1";
    const fnName = engine === "v2" ? "generate-article-pro" : "generate-article-structured";
    toast.info("Regenerando artigo...");
    const { error } = await supabase.functions.invoke(fnName, {
      body: {
        blog_id: article.blog_id,
        keyword: article.focus_keyword,
        size: "medium",
        tone: "professional",
        include_faq: true,
        include_images: true,
      },
    });
    if (error) toast.error("Erro ao regenerar artigo");
    else toast.success("Artigo regenerado com sucesso!");
  };

  return (
    <div className="p-space-6 max-w-content-list mx-auto">
      <div className="h-16 flex items-center justify-between mb-space-5">
        <h1 className="text-h1 text-foreground">Artigos</h1>
        <Button onClick={() => navigate("/client/articles/new")} className="gap-space-2">
          <Plus className="h-4 w-4" /> Criar Artigo
        </Button>
      </div>

      <div className="h-14 flex items-center justify-between mb-space-5 gap-space-4">
        <div className="flex gap-space-1 bg-muted rounded-md p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-space-4 py-space-2 rounded text-body-sm font-medium transition-colors ${
                currentTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar artigos..." value={searchQuery} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-space-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-space-8 text-muted-foreground">
          <FileText className="h-12 w-12 mb-space-4" />
          <p className="text-body-lg">Nenhum artigo encontrado</p>
          <Button className="mt-space-4" onClick={() => navigate("/client/articles/new")}>Criar Artigo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/client/articles/${article.id}`)}
              className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="h-44 bg-muted flex items-center justify-center relative overflow-hidden">
                {sanitizeImageUrl(article.featured_image_url) ? (
                  <img
                    src={sanitizeImageUrl(article.featured_image_url)!}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center';
                        fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground/40"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        target.parentElement.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-accent flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 omniseen-badge badge-${article.status}`}>
                  {article.status}
                </span>
                {(article as any).engine && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    {(article as any).engine}
                  </span>
                )}
                {article.reading_time_minutes && (
                  <span className="absolute bottom-3 left-3 text-[11px] font-medium text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    {article.reading_time_minutes} min
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                  {article.category || "Sem categoria"}
                </p>
                <h4 className="font-semibold text-foreground line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  {new Date(article.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-1">
                  {article.status === "failed" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetry(article); }}
                      className="text-xs flex items-center gap-1 text-destructive hover:text-destructive/80 font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                      title="Tentar novamente"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/client/articles/${article.id}`); }}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(article.id); }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="h-12 flex items-center justify-center gap-space-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-space-3 py-space-2 rounded-md text-body-sm border border-border hover:bg-accent disabled:opacity-40">‹</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-space-3 py-space-2 rounded-md text-body-sm ${page === i + 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"}`}
            >
              {i + 1}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-space-3 py-space-2 rounded-md text-body-sm border border-border hover:bg-accent disabled:opacity-40">›</button>
          <span className="text-body-sm text-muted-foreground ml-space-4">Página {page} de {totalPages}</span>
        </div>
      )}
    </div>
  );
}
