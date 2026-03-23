import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ArticlePreviewData = Pick<Tables<"articles">, "id" | "title" | "content" | "status" | "published_at" | "created_at" | "slug">;

export default function ArticlePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<ArticlePreviewData | null>(null);
  const { blog } = useBlog();

  useEffect(() => {
    if (!id) {
      navigate("/client/articles");
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, content, status, published_at, created_at, slug")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Artigo não encontrado");
        navigate("/client/articles");
        return;
      }

      setArticle(data);
      setLoading(false);
    };

    void fetchArticle();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="max-w-content-form mx-auto p-space-6">
      <div className="flex items-center justify-between mb-space-6">
        <Button variant="ghost" onClick={() => navigate(`/client/articles/${article.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-space-2" />
          Voltar ao editor
        </Button>
        <div className="flex items-center gap-space-3">
          {article.status === "published" && blog?.platform_subdomain && (
            <Button variant="outline" size="sm" onClick={() => window.open(`/blog/${blog.platform_subdomain}/${article.slug}`, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-1" /> Ver no Blog
            </Button>
          )}
          <span className={`omniseen-badge badge-${article.status}`}>{article.status}</span>
        </div>
      </div>

      <article className="bg-card border border-border rounded-lg p-space-6 shadow-sm">
        <h1 className="text-h1 text-foreground mb-space-5">{article.title}</h1>
        <div className="text-caption text-muted-foreground mb-space-6">
          {article.status === "published" && article.published_at
            ? `Publicado em ${new Date(article.published_at).toLocaleString("pt-BR")}`
            : `Rascunho salvo em ${new Date(article.created_at).toLocaleString("pt-BR")}`}
        </div>
        <div
          className="article-preview-content max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: article.content || "<p>Sem conteúdo.</p>" }}
        />
      </article>
    </div>
  );
}
