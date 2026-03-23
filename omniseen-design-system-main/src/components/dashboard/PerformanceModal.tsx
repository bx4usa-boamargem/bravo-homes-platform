import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Layout, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBlog } from "@/hooks/useBlog";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "super_page";
  status: string;
  seo_score?: number;
  word_count?: number;
  created_at: string;
}

interface PerformanceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PerformanceModal({ open, onClose }: PerformanceModalProps) {
  const { blog } = useBlog();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !blog) return;
    setLoading(true);

    const fetch = async () => {
      const [articlesRes, pagesRes] = await Promise.all([
        supabase
          .from("articles")
          .select("id, title, status, seo_score, word_count, created_at")
          .eq("blog_id", blog.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("landing_pages")
          .select("id, title, status, created_at")
          .eq("blog_id", blog.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const articles: ContentItem[] = (articlesRes.data ?? []).map((a) => ({
        ...a,
        type: "article" as const,
      }));

      const pages: ContentItem[] = (pagesRes.data ?? []).map((p) => ({
        ...p,
        type: "super_page" as const,
      }));

      const combined = [...articles, ...pages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(combined);
      setLoading(false);
    };

    fetch();
  }, [open, blog]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance de Conteúdo
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum conteúdo criado ainda.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-3 px-1 hover:bg-accent/50 rounded transition-colors"
              >
                <div className="shrink-0">
                  {item.type === "article" ? (
                    <FileText className="h-5 w-5 text-primary" />
                  ) : (
                    <Layout className="h-5 w-5 text-info" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="uppercase font-medium">
                      {item.type === "article" ? "Artigo" : "Super Page"}
                    </span>
                    <span className={`omniseen-badge badge-${item.status} !text-[10px] !py-0`}>
                      {item.status}
                    </span>
                    {item.word_count != null && item.word_count > 0 && (
                      <span>{item.word_count} palavras</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {item.seo_score != null && item.seo_score > 0 && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Eye className="h-3.5 w-3.5 text-success" />
                      <span className="text-success">{item.seo_score}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
