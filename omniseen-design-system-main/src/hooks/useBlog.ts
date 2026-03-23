import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Blog = Tables<"blogs">;
type Profile = Tables<"profiles">;
type Tenant = Tables<"tenants">;
type Subscription = Tables<"subscriptions">;

interface BlogContext {
  blog: Blog | null;
  profile: Profile | null;
  tenant: Tenant | null;
  subscription: Subscription | null;
  loading: boolean;
}

export function useBlog(): BlogContext {
  const { user, loading: authLoading } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (authLoading) return;

      if (!user) {
        if (cancelled) return;
        setBlog(null);
        setProfile(null);
        setTenant(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [blogRes, profileRes] = await Promise.all([
          supabase.from("blogs").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
          supabase.from("profiles").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
        ]);

        let resolvedBlog = blogRes.data ?? null;

        // Fallback 1: tenant membership (legacy/shared tenant scenarios)
        if (!resolvedBlog) {
          const { data: memberships, error: membershipsError } = await supabase
            .from("tenant_members")
            .select("tenant_id")
            .eq("user_id", user.id);

          if (membershipsError) {
            console.error("useBlog | memberships fetch error:", membershipsError);
          } else {
            const tenantIds = (memberships ?? []).map((m) => m.tenant_id).filter(Boolean);
            if (tenantIds.length > 0) {
              const { data: tenantBlog, error: tenantBlogError } = await supabase
                .from("blogs")
                .select("*")
                .in("tenant_id", tenantIds)
                .limit(1)
                .maybeSingle();

              if (tenantBlogError) {
                console.error("useBlog | tenant blog fetch error:", tenantBlogError);
              }

              resolvedBlog = tenantBlog ?? null;
            }
          }
        }

        // Fallback 2: auto-provision blog if still missing
        if (!resolvedBlog) {
          const { error: ensureError } = await supabase.functions.invoke("ensure-blog-exists");
          if (ensureError) {
            console.error("useBlog | ensure-blog-exists error:", ensureError);
          } else {
            const { data: ensuredBlog, error: ensuredBlogError } = await supabase
              .from("blogs")
              .select("*")
              .eq("user_id", user.id)
              .limit(1)
              .maybeSingle();

            if (ensuredBlogError) {
              console.error("useBlog | ensured blog fetch error:", ensuredBlogError);
            }

            resolvedBlog = ensuredBlog ?? null;
          }
        }

        if (cancelled) return;

        setBlog(resolvedBlog);
        setProfile(profileRes.data ?? null);

        if (resolvedBlog?.tenant_id) {
          const [tenantRes, subRes] = await Promise.all([
            supabase.from("tenants").select("*").eq("id", resolvedBlog.tenant_id).maybeSingle(),
            supabase.from("subscriptions").select("*").eq("tenant_id", resolvedBlog.tenant_id).maybeSingle(),
          ]);

          if (cancelled) return;
          setTenant(tenantRes.data ?? null);
          setSubscription(subRes.data ?? null);
        } else {
          setTenant(null);
          setSubscription(null);
        }
      } catch (error) {
        console.error("useBlog | unexpected error:", error);
        if (cancelled) return;
        setBlog(null);
        setProfile(null);
        setTenant(null);
        setSubscription(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { blog, profile, tenant, subscription, loading };
}
