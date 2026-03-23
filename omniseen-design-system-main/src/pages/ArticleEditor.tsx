import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Save, ChevronDown, Loader2, Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Sparkles, RefreshCw, Upload, Wand2, Globe, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SeoScorePanel from "@/components/SeoScorePanel";
import { supabase } from "@/integrations/supabase/client";
import { useSeoScore } from "@/hooks/useSeoScore";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { AIImageBlock } from "@/components/editor/AIImageBlock";
import InternalLinkSuggestions from "@/components/editor/InternalLinkSuggestions";
import SchedulePublishDialog from "@/components/editor/SchedulePublishDialog";
import HumanizeTextDialog from "@/components/editor/HumanizeTextDialog";
import ExternalLinkSuggestions from "@/components/editor/ExternalLinkSuggestions";
import ContentScoreVsSerp from "@/components/editor/ContentScoreVsSerp";
import WordPressExportDialog from "@/components/editor/WordPressExportDialog";
import YouTubeEmbedDialog from "@/components/editor/YouTubeEmbedDialog";
import SyndicationDialog from "@/components/editor/SyndicationDialog";
import { useInternalLinks } from "@/hooks/useInternalLinks";
import { useExternalLinks } from "@/hooks/useExternalLinks";
import { cn } from "@/lib/utils";

const editorTabs = [
  { key: "content", label: "Conteúdo" },
  { key: "seo", label: "SEO" },
  { key: "settings", label: "Configurações" },
];

type ArticleStatus = "draft" | "scheduled" | "published";

interface ArticleUpdates {
  status?: ArticleStatus;
  published_at?: string | null;
}

export default function ArticleEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("content");
  const [article, setArticle] = useState<Tables<"articles"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showHumanizeDialog, setShowHumanizeDialog] = useState(false);
  const [showWordPressDialog, setShowWordPressDialog] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [showSyndicationDialog, setShowSyndicationDialog] = useState(false);

  const { score: seoScore, loading: seoLoading, debouncedCalculate } = useSeoScore();

  // Internal linking hook
  const {
    suggestions: linkSuggestions,
    loading: linksLoading,
    debouncedAnalyze: debouncedAnalyzeLinks,
  } = useInternalLinks({
    blogId: article?.blog_id ?? "",
    currentArticleId: id ?? "",
  });

  // External linking hook
  const {
    suggestions: externalSuggestions,
    loading: externalLoading,
    debouncedAnalyze: debouncedAnalyzeExternal,
  } = useExternalLinks({
    blogId: article?.blog_id ?? "",
    focusKeyword: article?.focus_keyword ?? "",
  });

  const [title, setTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("");

  const articleRef = useRef<Tables<"articles"> | null>(null);
  const titleRef = useRef("");
  const metaTitleRef = useRef("");
  const metaDescRef = useRef("");
  const slugRef = useRef("");

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Comece a escrever seu artigo aqui..." }),
      CharacterCount,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      AIImageBlock,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[500px] p-6 focus:outline-none text-body-lg leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      scheduleAutoSave(html);
      scheduleSeoCalc(html);
      debouncedAnalyzeLinks(html);
      debouncedAnalyzeExternal(html);
    },
  });

  const scheduleSeoCalc = useCallback((htmlContent: string) => {
    if (!id || !articleRef.current) return;
    debouncedCalculate({
      article_id: id,
      title: titleRef.current,
      content: htmlContent,
      meta_title: metaTitleRef.current,
      meta_description: metaDescRef.current,
      focus_keyword: articleRef.current.focus_keyword,
      slug: slugRef.current,
    });
  }, [id, debouncedCalculate]);

  const scheduleAutoSave = useCallback((htmlContent: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!id) return;
      setSaving(true);
      const wordCount = htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
      const { error } = await supabase.from("articles").update({
        content: htmlContent,
        word_count: wordCount,
        reading_time_minutes: Math.max(1, Math.round(wordCount / 200)),
      }).eq("id", id);
      if (!error) {
        setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
      setSaving(false);
    }, 2000);
  }, [id]);

  // Sync refs with state so callbacks always have fresh values
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { metaTitleRef.current = metaTitle; }, [metaTitle]);
  useEffect(() => { metaDescRef.current = metaDesc; }, [metaDesc]);
  useEffect(() => { slugRef.current = slug; }, [slug]);
  useEffect(() => { articleRef.current = article; }, [article]);

  // Trigger SEO when meta fields change
  useEffect(() => {
    if (!loading && article && editor) {
      scheduleSeoCalc(editor.getHTML());
    }
  }, [title, metaTitle, metaDesc, slug]);

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      const { data, error } = await supabase.from("articles").select("*, blogs(platform_subdomain)").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Artigo não encontrado");
        navigate("/client/articles");
        return;
      }
      setArticle(data as unknown as Tables<"articles">);
      setTitle(data.title);
      setMetaTitle(data.meta_title);
      setMetaDesc(data.meta_description);
      setSlug(data.slug);
      setCategory(data.category ?? "");
      setTags(data.tags?.join(", ") ?? "");
      setAuthor(data.author);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  // Set editor content once article loads
  useEffect(() => {
    if (!loading && article && editor && article.content) {
      editor.commands.setContent(article.content);
    }
  }, [loading, article, editor]);

  const saveAll = useCallback(async () => {
    if (!id || !editor) return;
    setSaving(true);
    const htmlContent = editor.getHTML();
    const wordCount = htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    const { error } = await supabase.from("articles").update({
      title,
      content: htmlContent,
      meta_title: metaTitle,
      meta_description: metaDesc,
      slug,
      category: category || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author,
      word_count: wordCount,
      reading_time_minutes: Math.max(1, Math.round(wordCount / 200)),
    }).eq("id", id);
    if (error) toast.error("Erro ao salvar");
    else {
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      toast.success("Salvo com sucesso");
    }
    setSaving(false);
  }, [id, title, metaTitle, metaDesc, slug, category, tags, author, editor]);

  const improveContent = async (mode: "improve" | "rewrite") => {
    if (!editor || !article) return;
    const currentContent = editor.getHTML();
    const focusKeyword = article.focus_keyword ?? "";
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-article-pro", {
        body: {
          blog_id: article.blog_id,
          keyword: focusKeyword,
          mode,
          existing_content: currentContent,
          language: "pt-br",
          size: "medium",
          tone: "professional",
          include_faq: false,
          include_images: false,
          web_research: false,
        },
      });
      if (error) { toast.error("Erro ao processar conteúdo"); return; }
      if (data?.content) {
        editor.commands.setContent(data.content);
        toast.success(mode === "improve" ? "Conteúdo melhorado!" : "Conteúdo reescrito!");
      } else {
        toast.info("Processado — verifique o conteúdo");
      }
    } catch {
      toast.error("Erro ao processar conteúdo");
    } finally {
      setImproving(false);
    }
  };

  const publish = async (action: string) => {
    if (!id) return;
    const updates: ArticleUpdates = {};
    if (action === "publish") {
      updates.status = "published";
      updates.published_at = new Date().toISOString();
    } else if (action === "schedule") {
      updates.status = "scheduled";
    } else if (action === "unpublish") {
      updates.status = "draft";
      updates.published_at = null;
    }
    const { error } = await supabase.from("articles").update(updates).eq("id", id);
    if (error) { toast.error("Erro ao publicar"); return; }
    
    if (action === "publish" && article?.slug) {
      const publicUrl = `https://app.omniseen.app/blog/${article.slug}`;
      supabase.functions.invoke("notify-google-indexing", {
        body: { url: publicUrl, type: "URL_UPDATED" },
      }).catch(err => console.error("Erro ao notificar indexação: ", err));
    }

    toast.success(action === "publish" ? "Publicado!" : action === "schedule" ? "Agendado!" : "Despublicado");
    setArticle((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const currentStatus = article?.status ?? "draft";

  const statusLabel: Record<string, string> = {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
  };
  const statusClass: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-warning/10 text-warning border border-warning/20",
    published: "bg-success/10 text-success border border-success/20",
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 px-space-6 flex items-center gap-space-4 border-b border-border bg-card shrink-0">
          <button onClick={() => navigate("/client/articles")} title="Voltar para artigos" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-h3 font-semibold text-foreground bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground"
            placeholder="Título do artigo"
          />
          <span className={cn("text-tiny font-semibold px-2 py-0.5 rounded-full", statusClass[currentStatus])}>
            {statusLabel[currentStatus]}
          </span>
          <span className="text-caption text-muted-foreground hidden md:block whitespace-nowrap min-w-[120px]">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</span>
            ) : lastSaved ? `Salvo às ${lastSaved}` : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            title="Visualizar artigo publicado"
            onClick={() => {
              const previewSlug = slug || article?.slug;
              const subdomain = (article as any)?.blogs?.platform_subdomain || 'app';
              if (previewSlug) window.open(`/blog/${subdomain}/${previewSlug}`, "_blank");
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowWordPressDialog(true)} title="Exportar para WordPress">
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSyndicationDialog(true)} title="Syndication">
            <Send className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Publicar <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => publish("publish")}>Publicar Agora</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>Agendar Publicação</DropdownMenuItem>
              <DropdownMenuItem onClick={() => publish("unpublish")}>Despublicar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="h-12 px-space-6 flex items-center gap-1 border-b border-border bg-card shrink-0">
          {editorTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-1.5 text-body-sm font-medium rounded-md transition-colors",
                activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "content" && (
            <div className="h-full flex flex-col">
              {/* TipTap toolbar */}
              <div className="h-12 bg-card border-b border-border px-space-4 flex items-center gap-1 shrink-0">
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Negrito">
                  <Bold className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Itálico">
                  <Italic className="h-4 w-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="H2">
                  <Heading2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="H3">
                  <Heading3 className="h-4 w-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Lista">
                  <List className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Numerada">
                  <ListOrdered className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Citação">
                  <Quote className="h-4 w-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() => {
                    const url = prompt("URL do link:");
                    if (url) editor?.chain().focus().setLink({ href: url }).run();
                  }}
                  active={editor?.isActive("link")}
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => {
                    const url = prompt("URL da imagem:");
                    if (url) editor?.chain().focus().setImage({ src: url }).run();
                  }}
                  title="Imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </ToolbarBtn>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() => improveContent("improve")}
                  title="Melhorar com IA"
                >
                  {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => improveContent("rewrite")}
                  title="Reescrever com IA"
                >
                  <RefreshCw className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => setShowHumanizeDialog(true)}
                  title="Humanizar Texto"
                >
                  <Wand2 className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => setShowYouTubeDialog(true)}
                  title="Inserir Vídeo do YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </ToolbarBtn>
              </div>

              <div className="flex-1 overflow-auto">
                <EditorContent editor={editor} className="min-h-full" />
              </div>

              {/* Status bar */}
              <div className="h-10 border-t border-border px-space-6 flex items-center gap-space-4 text-caption text-muted-foreground shrink-0 bg-card">
                <span>{wordCount} palavras</span>
                <span>~{readTime} min de leitura</span>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="max-w-[800px] mx-auto p-space-6 space-y-space-6">
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                  Título SEO{" "}
                  <span className={cn("text-caption", metaTitle.length > 60 ? "text-error" : metaTitle.length >= 50 ? "text-success" : "text-muted-foreground")}>
                    ({metaTitle.length}/60)
                  </span>
                </label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder="Título SEO otimizado" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">
                  Meta Description{" "}
                  <span className={cn("text-caption", metaDesc.length > 160 ? "text-error" : metaDesc.length >= 150 ? "text-success" : "text-muted-foreground")}>
                    ({metaDesc.length}/160)
                  </span>
                </label>
                <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={170} rows={3} placeholder="Descrição para o Google (150-160 caracteres)" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">URL Slug</label>
                <div className="flex items-center gap-space-2">
                  <span className="text-body-sm text-muted-foreground font-mono whitespace-nowrap">/blog/</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Palavra-chave Foco</label>
                <Input value={article?.focus_keyword ?? ""} readOnly className="bg-muted cursor-not-allowed" />
              </div>
              {/* SERP Preview */}
              <div className="bg-card border border-border rounded-lg p-space-5">
                <p className="text-caption text-muted-foreground mb-space-3 uppercase tracking-widest font-medium">Pré-visualização Google</p>
                <p className="text-[18px] text-blue-400 leading-snug line-clamp-1">
                  {metaTitle || article?.title || "Título da página"}
                </p>
                <p className="text-caption text-green-600 font-mono mt-0.5">
                  https://{(article as any)?.blogs?.platform_subdomain || "app"}.omniseen.app/blog/{slug || article?.slug}
                </p>
                <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2">
                  {metaDesc || "Meta description aparecerá aqui após você preencher o campo acima..."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-[800px] mx-auto p-space-6 space-y-space-6">
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Categoria</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: SEO, Marketing Digital" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Tags</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separadas por vírgula: seo, marketing, google" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Autor</label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nome do autor" />
              </div>
              <div>
                <label className="text-body-sm font-medium text-foreground mb-space-2 block">Imagem Destacada</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !article) return;
                    setUploadingImage(true);
                    try {
                      const ext = file.name.split(".").pop() || "jpg";
                      const fileName = `covers/cover-${article.id}-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("article-images").upload(fileName, file, { contentType: file.type, upsert: false });
                      if (upErr) throw upErr;
                      const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(fileName);
                      await supabase.from("articles").update({ featured_image_url: urlData.publicUrl }).eq("id", article.id);
                      setArticle({ ...article, featured_image_url: urlData.publicUrl });
                      toast.success("Imagem enviada!");
                    } catch (err: any) {
                      toast.error("Erro ao enviar imagem: " + (err.message || ""));
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="h-[200px] bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-colors relative"
                >
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  {sanitizeImageUrl(article?.featured_image_url) ? (
                    <img
                      src={sanitizeImageUrl(article!.featured_image_url)!}
                      alt="Imagem destacada"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-body-sm">Clique para enviar imagem</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={generatingCover || !article}
                    onClick={async () => {
                      if (!article) return;
                      setGeneratingCover(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("generate-cover-image", {
                          body: { article_id: article.id },
                        });
                        if (error) throw error;
                        if (data?.image_url) {
                          setArticle({ ...article, featured_image_url: data.image_url });
                          toast.success("Imagem gerada com IA!");
                        }
                      } catch (err: any) {
                        toast.error("Erro ao gerar imagem: " + (err.message || ""));
                      } finally {
                        setGeneratingCover(false);
                      }
                    }}
                    className="text-xs"
                  >
                    {generatingCover ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Gerar com IA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO Score Panel + Internal Links */}
      <div className="hidden lg:block w-[380px] border-l border-border shrink-0 overflow-auto">
        <SeoScorePanel score={seoScore} loading={seoLoading} />
        <div className="border-t border-border">
          <InternalLinkSuggestions
            suggestions={linkSuggestions}
            loading={linksLoading}
            onInsertLink={(url, text) => {
              if (editor) {
                editor.chain().focus().insertContent(
                  `<a href="${url}">${text}</a> `
                ).run();
              }
            }}
          />
        </div>
        <div className="border-t border-border">
          <ExternalLinkSuggestions
            suggestions={externalSuggestions}
            loading={externalLoading}
            onInsertLink={(url, text) => {
              if (editor) {
                editor.chain().focus().insertContent(
                  `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a> `
                ).run();
              }
            }}
          />
        </div>
        {article && id && (
          <div className="border-t border-border">
            <ContentScoreVsSerp
              articleId={id}
              blogId={article.blog_id}
              focusKeyword={article.focus_keyword}
              currentScore={seoScore?.overall_score ?? 0}
              wordCount={editor?.storage.characterCount?.words() ?? 0}
            />
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      {showScheduleDialog && id && (
        <SchedulePublishDialog
          articleId={id}
          currentScheduledAt={article?.scheduled_at ?? null}
          onScheduled={(scheduledAt, status) => {
            setArticle((prev) =>
              prev ? { ...prev, scheduled_at: scheduledAt, status } as any : prev
            );
          }}
          onClose={() => setShowScheduleDialog(false)}
        />
      )}

      {/* Humanize Dialog */}
      {showHumanizeDialog && id && article && editor && (
        <HumanizeTextDialog
          articleId={id}
          blogId={article.blog_id}
          currentContent={editor.getHTML()}
          focusKeyword={article.focus_keyword}
          onApply={(newContent) => {
            editor.commands.setContent(newContent);
          }}
          onClose={() => setShowHumanizeDialog(false)}
        />
      )}

      {/* WordPress Export Dialog */}
      {showWordPressDialog && id && article && editor && (
        <WordPressExportDialog
          articleId={id}
          title={title}
          content={editor.getHTML()}
          metaTitle={metaTitle}
          metaDescription={metaDesc}
          slug={slug}
          featuredImageUrl={article.featured_image_url}
          onClose={() => setShowWordPressDialog(false)}
        />
      )}

      {/* YouTube Embed Dialog */}
      {showYouTubeDialog && article && editor && (
        <YouTubeEmbedDialog
          focusKeyword={article.focus_keyword}
          onInsertEmbed={(embedHtml) => {
            editor.chain().focus().insertContent(embedHtml).run();
          }}
          onClose={() => setShowYouTubeDialog(false)}
        />
      )}

      {/* Syndication Dialog */}
      {showSyndicationDialog && article && editor && id && (
        <SyndicationDialog
          blogId={article.blog_id}
          articleId={id}
          title={title}
          content={editor.getHTML()}
          canonicalUrl={article.slug ? `/blog/${article.slug}` : undefined}
          tags={article.secondary_keywords ?? []}
          onClose={() => setShowSyndicationDialog(false)}
        />
      )}
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded transition-colors shrink-0",
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
