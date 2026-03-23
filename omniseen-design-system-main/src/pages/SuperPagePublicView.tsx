import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, ChevronRight, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type SuperPage = Tables<"super_pages">;

interface TocItem { id: string; label: string; }
interface FaqItem { q: string; a: string; }
interface CtaItem { text: string; anchor: string; }
interface AutorItem { nome: string; bio: string; data_publicacao: string; }

function parseJsonArray<T>(val: Json | null, fallback: T[] = []): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val as T[];
  return fallback;
}

function parseJsonObj<T>(val: Json | null, fallback: T): T {
  if (!val || typeof val !== "object" || Array.isArray(val)) return fallback;
  return val as unknown as T;
}

export default function SuperPagePublicView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SuperPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("super_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        setPage(data);
        setLoading(false);
      });
  }, [slug]);

  const toc = useMemo(() => parseJsonArray<TocItem>(page?.toc), [page]);
  const faq = useMemo(() => parseJsonArray<FaqItem>(page?.faq), [page]);
  const keyTakeaways = useMemo(() => parseJsonArray<string>(page?.key_takeaways), [page]);
  const ctaPrimary = useMemo(() => parseJsonObj<CtaItem | null>(page?.cta_primary, null), [page]);
  const autor = useMemo(() => parseJsonObj<AutorItem | null>(page?.autor, null), [page]);
  const readingTime = page?.word_count ? Math.ceil(page.word_count / 200) : 5;

  // IntersectionObserver for TOC highlight
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return;
    const headings = contentRef.current.querySelectorAll("h2[id], h3[id]");
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [page, toc]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">Esta Super Page não existe ou não está publicada.</p>
        <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const initials = autor?.nome
    ? autor.nome.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "SP";

  const formattedDate = autor?.data_publicacao
    ? new Date(autor.data_publicacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : page.created_at
    ? new Date(page.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <>
      <Helmet>
        <title>{page.meta_title || page.title}</title>
        <meta name="description" content={page.meta_description || ""} />
        {page.schema_article && (
          <script type="application/ld+json">{JSON.stringify(page.schema_article)}</script>
        )}
        {page.schema_faqpage && (
          <script type="application/ld+json">{JSON.stringify(page.schema_faqpage)}</script>
        )}
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        <header className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="hover:text-primary">Blog</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground truncate max-w-[200px]">{page.title}</span>
            </nav>

            {/* Badge */}
            {page.focus_keyword && (
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                {page.focus_keyword}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
              {page.meta_title || page.title}
            </h1>

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {initials}
                </div>
                <div>
                  <p className="font-medium text-foreground">{autor?.nome || "Equipe Editorial"}</p>
                  {autor?.bio && <p className="text-xs text-muted-foreground line-clamp-1">{autor.bio}</p>}
                </div>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>{formattedDate}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {readingTime} min de leitura
              </span>
              {page.word_count ? (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{page.word_count.toLocaleString("pt-BR")} palavras</span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">
          {/* Article Content */}
          <main className="flex-1 min-w-0">
            {/* Key Takeaways */}
            {keyTakeaways.length > 0 && (
              <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6 mb-10">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  O que você vai aprender
                </h2>
                <ul className="space-y-2">
                  {keyTakeaways.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span>{String(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mobile TOC */}
            {toc.length > 0 && (
              <div className="lg:hidden mb-8 bg-card border border-border rounded-lg">
                <button
                  onClick={() => setTocOpen(!tocOpen)}
                  className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground"
                >
                  <span>📑 Sumário</span>
                  {tocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {tocOpen && (
                  <nav className="px-4 pb-4 space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setTocOpen(false)}
                        className={`block text-sm py-1 px-2 rounded transition-colors ${
                          activeId === item.id
                            ? "text-primary font-medium bg-primary/5"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Markdown Content */}
            <div ref={contentRef} className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-table:border prose-th:bg-muted prose-th:p-3 prose-td:p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                {page.content_markdown || ""}
              </ReactMarkdown>
            </div>

            {/* FAQ Section */}
            {faq.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
                <Accordion type="multiple" className="space-y-2">
                  {faq.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                      <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* CTA Banner */}
            {ctaPrimary && (
              <section className="mt-12 bg-primary rounded-xl p-8 text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-4">
                  {ctaPrimary.text || "Entre em contato"}
                </h3>
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                  onClick={() => {
                    if (ctaPrimary.anchor) {
                      const el = document.getElementById(ctaPrimary.anchor);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {ctaPrimary.text || "Saiba mais"}
                </Button>
              </section>
            )}
          </main>

          {/* Desktop TOC Sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="sticky top-24 bg-card border border-border rounded-lg p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">Neste artigo</h4>
                <ul className="space-y-1">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block text-sm py-1.5 px-2 rounded transition-colors ${
                          activeId === item.id
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          <p>Gerado por <span className="font-semibold text-primary">Omniseen</span> — Motor de Super Pages com IA</p>
        </footer>
      </div>
    </>
  );
}
