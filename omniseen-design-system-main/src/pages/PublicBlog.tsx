import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Calendar, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSubdomain } from "@/utils/subdomain";

type BlogInfo = { id: string; name: string; description: string; platform_subdomain: string };
type ArticleSummary = {
  id: string; title: string; slug: string; excerpt: string;
  featured_image_url: string | null; published_at: string | null;
  reading_time_minutes: number; category: string | null; author: string;
};

const PAGE_SIZE = 20;

export default function PublicBlog() {
  const { blogSlug: pathBlogSlug } = useParams<{ blogSlug: string }>();
  const blogSlug = getSubdomain() || pathBlogSlug;
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogInfo | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!blogSlug) return;
    const load = async () => {
      const { data: blogData } = await supabase
        .from("blogs")
        .select("id, name, description, platform_subdomain")
        .eq("platform_subdomain", blogSlug)
        .maybeSingle();

      if (!blogData) { setNotFound(true); setLoading(false); return; }
      setBlog(blogData);

      const { data: arts } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, featured_image_url, published_at, reading_time_minutes, category, author")
        .eq("blog_id", blogData.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE + 1);

      const fetched = arts ?? [];
      setHasMore(fetched.length > PAGE_SIZE);
      setArticles(fetched.slice(0, PAGE_SIZE));
      setLoading(false);
    };
    load();
  }, [blogSlug]);

  const loadMore = useCallback(async () => {
    if (!blog || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastArticle = articles[articles.length - 1];
    const { data: arts } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image_url, published_at, reading_time_minutes, category, author")
      .eq("blog_id", blog.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .lt("published_at", lastArticle.published_at!)
      .limit(PAGE_SIZE + 1);

    const fetched = arts ?? [];
    setHasMore(fetched.length > PAGE_SIZE);
    setArticles(prev => [...prev, ...fetched.slice(0, PAGE_SIZE)]);
    setLoadingMore(false);
  }, [blog, articles, loadingMore, hasMore]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-h1 mb-4">Blog não encontrado</h1>
      <p className="text-muted-foreground">Verifique o endereço e tente novamente.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-h1 text-foreground">{blog?.name}</h1>
          {blog?.description && <p className="text-body-lg text-muted-foreground mt-2">{blog.description}</p>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="space-y-8">
            {articles.map((art) => (
              <Link
                key={art.id}
                to={`/blog/${blogSlug}/${art.slug}`}
                className="group flex flex-col md:flex-row gap-6 p-6 bg-card border border-border rounded-xl hover:shadow-lg hover:border-primary/30 transition-all"
              >
                {art.featured_image_url && (
                  <div className="w-full md:w-56 h-40 md:h-36 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={art.featured_image_url}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                        }
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {art.category && <span className="text-tiny text-primary uppercase font-medium">{art.category}</span>}
                  <h2 className="text-h3 text-foreground group-hover:text-primary transition-colors mt-1 line-clamp-2">{art.title}</h2>
                  <p className="text-body-sm text-muted-foreground mt-2 line-clamp-2">{art.excerpt}</p>
                  <div className="flex items-center gap-4 mt-3 text-caption text-muted-foreground">
                    {art.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(art.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {art.reading_time_minutes} min
                    </span>
                    <span className="ml-auto text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-10">
            <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Carregar mais artigos
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-caption text-muted-foreground">
        Powered by <span className="font-semibold text-primary">Omniseen</span>
      </footer>
    </div>
  );
}
