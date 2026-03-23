import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, Calendar, Clock, ArrowLeft, User, ArrowUp, Share2, Facebook, Twitter, Linkedin, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSubdomain } from "@/utils/subdomain";

type FullArticle = {
  id: string; title: string; slug: string; content: string; excerpt: string;
  featured_image_url: string | null; published_at: string | null;
  reading_time_minutes: number; word_count: number; category: string | null;
  author: string; meta_title: string; meta_description: string;
  tags: string[]; faq: any;
};

export default function PublicArticle() {
  const { blogSlug, articleSlug } = useParams();
  const [article, setArticle] = useState<FullArticle | null>(null);
  const [blogName, setBlogName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!blogSlug || !articleSlug) return;
    const load = async () => {
      const { data: blogData } = await supabase
        .from("blogs")
        .select("id, name")
        .eq("platform_subdomain", blogSlug)
        .maybeSingle();

      if (!blogData) { setNotFound(true); setLoading(false); return; }
      setBlogName(blogData.name);

      const { data: art, error: artError } = await supabase
        .from("articles")
        .select("id, title, slug, content, excerpt, featured_image_url, published_at, reading_time_minutes, word_count, category, author, meta_title, meta_description, tags, faq")
        .eq("blog_id", blogData.id)
        .eq("slug", articleSlug)
        .eq("status", "published")
        .maybeSingle();

      console.log("PublicArticle query:", { blogId: blogData.id, articleSlug, art, artError });

      if (!art) { setNotFound(true); setLoading(false); return; }
      setArticle(art);

      // Dynamic page title
      document.title = art.meta_title || art.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", art.meta_description || art.excerpt);

      // JSON-LD structured data
      const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: art.title,
        description: art.meta_description || art.excerpt,
        ...(art.featured_image_url && { image: art.featured_image_url }),
        author: { "@type": "Person", name: art.author || blogData.name },
        publisher: { "@type": "Organization", name: blogData.name },
        datePublished: art.published_at,
        wordCount: art.word_count,
        mainEntityOfPage: { "@type": "WebPage", "@id": window.location.href },
      };

      const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: blogData.name, item: `${window.location.origin}/blog/${blogSlug}` },
          { "@type": "ListItem", position: 2, name: art.title, item: window.location.href },
        ],
      };

      // Inject JSON-LD scripts
      const injectJsonLd = (data: object, id: string) => {
        let el = document.getElementById(id);
        if (!el) { el = document.createElement("script"); el.id = id; el.setAttribute("type", "application/ld+json"); document.head.appendChild(el); }
        el.textContent = JSON.stringify(data);
      };
      injectJsonLd(articleJsonLd, "jsonld-article");
      injectJsonLd(breadcrumbJsonLd, "jsonld-breadcrumb");

      // FAQPage Schema when article has FAQ
      if (art.faq && Array.isArray(art.faq) && art.faq.length > 0) {
        const faqJsonLd = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (art.faq as { question: string; answer: string }[]).map(item => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        };
        injectJsonLd(faqJsonLd, "jsonld-faq");
      }

      setLoading(false);
    };
    load();
  }, [blogSlug, articleSlug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-h1 mb-4">Artigo não encontrado</h1>
      <p className="text-muted-foreground mb-6">Este artigo pode ter sido removido ou não está publicado.</p>
      <Link to={`/blog/${blogSlug}`} className="text-primary hover:underline flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar ao blog
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to={`/blog/${blogSlug}`} className="text-body font-semibold text-foreground hover:text-primary transition-colors">
            {blogName}
          </Link>
          <Link to={`/blog/${blogSlug}`} className="text-body-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Todos os artigos
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        {/* Category */}
        {article?.category && (
          <span className="inline-block text-tiny text-primary uppercase font-semibold tracking-wider mb-4">{article.category}</span>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
          {article?.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-body-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          {article?.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {article.author}
            </span>
          )}
          {article?.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(article.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {article?.reading_time_minutes} min de leitura
          </span>
        </div>

        {/* Cover Image */}
        {article?.featured_image_url && (
          <div className="rounded-xl overflow-hidden mb-10 shadow-lg">
            <img src={article.featured_image_url} alt={article.title} className="w-full h-auto" />
          </div>
        )}

        {/* Content — strip leading figure + any <h1> from AI content */}
        <div
          className="article-prose-premium max-w-none"
          dangerouslySetInnerHTML={{
            __html: (() => {
              let html = article?.content || "";
              // Remove leading <figure> that duplicates the featured cover image
              if (article?.featured_image_url) {
                html = html.replace(/^\s*<figure[^>]*>[\s\S]*?<\/figure>\s*/i, "");
              }
              // Strip any <h1> tags from AI content (title is rendered by React above)
              html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/gi, "");
              return html;
            })()
          }}
        />

        {/* Tags */}
        {article?.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-muted text-muted-foreground text-caption rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* FAQ */}
        {article?.faq && Array.isArray(article.faq) && article.faq.length > 0 && (
          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="text-h2 text-foreground mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {(article.faq as { question: string; answer: string }[]).map((item, i) => (
                <details key={i} className="group bg-card border border-border rounded-lg">
                  <summary className="px-5 py-4 cursor-pointer text-body font-medium text-foreground hover:text-primary transition-colors">
                    {item.question}
                  </summary>
                  <div className="px-5 pb-4 text-body-sm text-muted-foreground">{item.answer}</div>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-caption text-muted-foreground">
        Powered by <span className="font-semibold text-primary">Omniseen</span>
      </footer>
    </div>
  );
}
