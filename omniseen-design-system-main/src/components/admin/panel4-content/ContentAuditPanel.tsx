import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: "article" | "super_page";
  status: string;
  created_at: string;
  blog_name?: string;
}

export default function ContentAuditPanel() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: articles }, { data: pages }] = await Promise.all([
        supabase.from("articles").select("id, title, status, created_at, blog_id").order("created_at", { ascending: false }).limit(20),
        supabase.from("landing_pages").select("id, title, status, created_at, blog_id").order("created_at", { ascending: false }).limit(20),
      ]);
      const all: ContentItem[] = [
        ...(articles || []).map(a => ({ ...a, type: "article" as const })),
        ...(pages || []).map(p => ({ ...p, type: "super_page" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
      setItems(all);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--admin-cyan)" }} /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: "var(--admin-cyan)" }}>📄 Conteúdo Gerado</h2>
      <div className="admin-card space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 px-3" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.type === "article" ? "📝" : "🚀"}</span>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{item.title}</div>
                <div className="text-xs" style={{ color: "var(--admin-muted)" }}>
                  {new Date(item.created_at).toLocaleDateString("pt-BR")} · {item.type === "article" ? "Artigo" : "Super Page"}
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{
              background: item.status === "published" ? "var(--admin-green)" : "var(--admin-orange)",
              color: "#fff",
            }}>{item.status}</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--admin-muted)" }}>Nenhum conteúdo gerado ainda.</p>
        )}
      </div>
    </div>
  );
}
