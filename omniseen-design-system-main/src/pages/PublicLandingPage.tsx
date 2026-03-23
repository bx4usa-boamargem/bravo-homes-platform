import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PublicLandingPage() {
  const { pageSlug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!pageSlug) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", pageSlug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPage(data);
      setLoading(false);

      // Inject SEO meta
      if (data.meta_title) document.title = data.meta_title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.meta_description) metaDesc.setAttribute("content", data.meta_description);
    };
    load();
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground">Página não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="article-preview-content max-w-4xl mx-auto px-6 py-12"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
