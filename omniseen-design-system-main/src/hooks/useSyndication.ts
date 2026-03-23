// ── useSyndication ─────────────────────────────────────────────────────────────
// Hook para gerenciar configurações de syndication e distribuir artigos
// para múltiplas plataformas (Medium, LinkedIn, Dev.to, Blogger, Hashnode).

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SyndicationPlatform = "medium" | "linkedin" | "devto" | "blogger" | "hashnode";

export interface PlatformConfig {
  platform: SyndicationPlatform;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
  token: string;
  extraConfig: Record<string, string>;
  /** Fields required for this platform */
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

export interface SyndicationResult {
  platform: SyndicationPlatform;
  status: "pending" | "publishing" | "success" | "error";
  url?: string;
  error?: string;
}

const DEFAULT_PLATFORMS: PlatformConfig[] = [
  {
    platform: "medium",
    label: "Medium",
    icon: "📝",
    description: "Publicar como artigo no Medium",
    enabled: false,
    token: "",
    extraConfig: {},
    fields: [
      { key: "token", label: "Integration Token", placeholder: "Obtenha em medium.com/me/settings/security" },
    ],
  },
  {
    platform: "devto",
    label: "Dev.to",
    icon: "👩‍💻",
    description: "Publicar como artigo no Dev.to",
    enabled: false,
    token: "",
    extraConfig: {},
    fields: [
      { key: "token", label: "API Key", placeholder: "Obtenha em dev.to/settings/extensions" },
    ],
  },
  {
    platform: "hashnode",
    label: "Hashnode",
    icon: "📘",
    description: "Publicar como artigo no Hashnode",
    enabled: false,
    token: "",
    extraConfig: {},
    fields: [
      { key: "token", label: "Personal Access Token", placeholder: "Obtenha em hashnode.com/settings/developer" },
      { key: "publicationId", label: "Publication ID", placeholder: "ID da sua publicação no Hashnode" },
    ],
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    description: "Compartilhar como artigo no LinkedIn",
    enabled: false,
    token: "",
    extraConfig: {},
    fields: [
      { key: "token", label: "Access Token", placeholder: "OAuth 2.0 Access Token" },
      { key: "authorId", label: "Author URN", placeholder: "urn:li:person:XXXXXX" },
    ],
  },
  {
    platform: "blogger",
    label: "Blogger",
    icon: "🅱️",
    description: "Publicar no Google Blogger",
    enabled: false,
    token: "",
    extraConfig: {},
    fields: [
      { key: "token", label: "OAuth Token", placeholder: "Google OAuth 2.0 Token" },
      { key: "blogId", label: "Blog ID", placeholder: "ID numérico do blog" },
    ],
  },
];

export interface SyndicateArticleParams {
  articleId: string;
  title: string;
  content: string;
  canonicalUrl?: string;
  tags?: string[];
}

export function useSyndication(blogId: string) {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(DEFAULT_PLATFORMS);
  const [results, setResults] = useState<SyndicationResult[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved configs from localStorage (or could be Supabase)
  useEffect(() => {
    const saved = localStorage.getItem(`omniseen_syndication_${blogId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<PlatformConfig>[];
        setPlatforms((prev) =>
          prev.map((p) => {
            const savedP = parsed.find((sp) => sp.platform === p.platform);
            if (savedP) {
              return {
                ...p,
                enabled: savedP.enabled ?? false,
                token: savedP.token ?? "",
                extraConfig: savedP.extraConfig ?? {},
              };
            }
            return p;
          }),
        );
      } catch {
        // Ignore malformed data
      }
    }
    setLoaded(true);
  }, [blogId]);

  // Save configs
  const saveConfigs = useCallback(
    (updatedPlatforms: PlatformConfig[]) => {
      setPlatforms(updatedPlatforms);
      const toSave = updatedPlatforms.map((p) => ({
        platform: p.platform,
        enabled: p.enabled,
        token: p.token,
        extraConfig: p.extraConfig,
      }));
      localStorage.setItem(`omniseen_syndication_${blogId}`, JSON.stringify(toSave));
    },
    [blogId],
  );

  const updatePlatform = useCallback(
    (platform: SyndicationPlatform, updates: Partial<PlatformConfig>) => {
      const updated = platforms.map((p) =>
        p.platform === platform ? { ...p, ...updates } : p,
      );
      saveConfigs(updated);
    },
    [platforms, saveConfigs],
  );

  // Syndicate article to all enabled platforms
  const syndicate = useCallback(
    async (params: SyndicateArticleParams) => {
      const enabledPlatforms = platforms.filter((p) => p.enabled && p.token);
      if (enabledPlatforms.length === 0) {
        toast.error("Nenhuma plataforma configurada e habilitada");
        return;
      }

      setPublishing(true);
      const newResults: SyndicationResult[] = enabledPlatforms.map((p) => ({
        platform: p.platform,
        status: "pending" as const,
      }));
      setResults(newResults);

      for (let i = 0; i < enabledPlatforms.length; i++) {
        const platform = enabledPlatforms[i];
        setResults((prev) =>
          prev.map((r) =>
            r.platform === platform.platform ? { ...r, status: "publishing" as const } : r,
          ),
        );

        try {
          const { data, error } = await supabase.functions.invoke("syndicate-article", {
            body: {
              platform: platform.platform,
              token: platform.token,
              extra_config: platform.extraConfig,
              article_id: params.articleId,
              title: params.title,
              content: params.content,
              canonical_url: params.canonicalUrl,
              tags: params.tags,
            },
          });

          if (error) throw new Error(error.message);

          setResults((prev) =>
            prev.map((r) =>
              r.platform === platform.platform
                ? { ...r, status: "success" as const, url: data?.url }
                : r,
            ),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          setResults((prev) =>
            prev.map((r) =>
              r.platform === platform.platform
                ? { ...r, status: "error" as const, error: msg }
                : r,
            ),
          );
        }
      }

      setPublishing(false);
      toast.success("Syndication concluída!");
    },
    [platforms],
  );

  const enabledCount = platforms.filter((p) => p.enabled && p.token).length;

  return {
    platforms,
    results,
    publishing,
    loaded,
    enabledCount,
    updatePlatform,
    syndicate,
  };
}
