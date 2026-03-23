-- =============================================================================
-- Migration: Enable Row Level Security on all tables
-- Project:   Omniseen V3
-- Date:      2026-03-14
--
-- Strategy:
--   • All tables are scoped to the authenticated user via the ownership chain:
--     auth.uid() → blogs.user_id → table.blog_id
--   • A helper function `public.user_owns_blog(uuid)` avoids repeating the join.
--   • Edge Functions that write on behalf of users MUST use the service_role key
--     (which bypasses RLS) — and must validate JWT + ownership themselves.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: check whether auth.uid() owns a given blog
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_owns_blog(p_blog_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blogs
    WHERE id = p_blog_id
      AND user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. blogs
--    Direct ownership: blogs.user_id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blogs: owner select"
  ON public.blogs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "blogs: owner insert"
  ON public.blogs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blogs: owner update"
  ON public.blogs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "blogs: owner delete"
  ON public.blogs FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. profiles
--    Direct ownership: profiles.user_id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner select"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. tenants
--    ownership: tenants.owner_user_id = auth.uid()
--    OR the user is a member (tenant_members join)
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants: owner select"
  ON public.tenants FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenants.id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "tenants: owner insert"
  ON public.tenants FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "tenants: owner update"
  ON public.tenants FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "tenants: owner delete"
  ON public.tenants FOR DELETE
  USING (owner_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. subscriptions
--    linked to tenant → user via tenants.owner_user_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: tenant owner select"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = subscriptions.tenant_id
        AND t.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "subscriptions: tenant owner update"
  ON public.subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = subscriptions.tenant_id
        AND t.owner_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. tenant_domains
--    linked to tenant → user via tenants.owner_user_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_domains: owner select"
  ON public.tenant_domains FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "tenant_domains: owner insert"
  ON public.tenant_domains FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "tenant_domains: owner update"
  ON public.tenant_domains FOR UPDATE
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "tenant_domains: owner delete"
  ON public.tenant_domains FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 6. tenant_members
--    The owner of the tenant OR the member themselves can read their row
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members: self or owner select"
  ON public.tenant_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_members.tenant_id
        AND t.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_members: owner insert"
  ON public.tenant_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_members.tenant_id
        AND t.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_members: owner delete"
  ON public.tenant_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_members.tenant_id
        AND t.owner_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. articles
--    linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "articles: owner select"
  ON public.articles FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "articles: owner insert"
  ON public.articles FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "articles: owner update"
  ON public.articles FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "articles: owner delete"
  ON public.articles FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 8. article_content_scores
--    linked via article_id → articles → blog → user
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_content_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_content_scores: owner select"
  ON public.article_content_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_scores.article_id
        AND public.user_owns_blog(a.blog_id)
    )
  );

CREATE POLICY "article_content_scores: owner insert"
  ON public.article_content_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_scores.article_id
        AND public.user_owns_blog(a.blog_id)
    )
  );

CREATE POLICY "article_content_scores: owner update"
  ON public.article_content_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_content_scores.article_id
        AND public.user_owns_blog(a.blog_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 9. article_opportunities
--    linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_opportunities: owner select"
  ON public.article_opportunities FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "article_opportunities: owner insert"
  ON public.article_opportunities FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "article_opportunities: owner update"
  ON public.article_opportunities FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "article_opportunities: owner delete"
  ON public.article_opportunities FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 10. article_queue
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_queue: owner select"
  ON public.article_queue FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "article_queue: owner insert"
  ON public.article_queue FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "article_queue: owner update"
  ON public.article_queue FOR UPDATE
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "article_queue: owner delete"
  ON public.article_queue FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 11. article_versions
--     linked via article_id → articles → blog → user
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_versions: owner select"
  ON public.article_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_versions.article_id
        AND public.user_owns_blog(a.blog_id)
    )
  );

CREATE POLICY "article_versions: owner insert"
  ON public.article_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_versions.article_id
        AND public.user_owns_blog(a.blog_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 12. brand_agent_config
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.brand_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_agent_config: owner select"
  ON public.brand_agent_config FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "brand_agent_config: owner insert"
  ON public.brand_agent_config FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "brand_agent_config: owner update"
  ON public.brand_agent_config FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 13. brand_agent_leads
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.brand_agent_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_agent_leads: owner select"
  ON public.brand_agent_leads FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "brand_agent_leads: owner update"
  ON public.brand_agent_leads FOR UPDATE
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "brand_agent_leads: owner delete"
  ON public.brand_agent_leads FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- Leads can be inserted by anonymous users (widget) but only for valid blogs.
-- The actual blog validation happens in the edge function.
-- Front-end client never inserts leads directly.

-- ---------------------------------------------------------------------------
-- 14. blog_automation
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.blog_automation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_automation: owner select"
  ON public.blog_automation FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "blog_automation: owner insert"
  ON public.blog_automation FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "blog_automation: owner update"
  ON public.blog_automation FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 15. cms_integrations
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_integrations: owner select"
  ON public.cms_integrations FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "cms_integrations: owner insert"
  ON public.cms_integrations FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "cms_integrations: owner update"
  ON public.cms_integrations FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "cms_integrations: owner delete"
  ON public.cms_integrations FOR DELETE
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 16. cms_publish_logs
--     linked via integration_id → cms_integrations → blog → user
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_publish_logs: owner select"
  ON public.cms_publish_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_integrations ci
      WHERE ci.id = cms_publish_logs.integration_id
        AND public.user_owns_blog(ci.blog_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 17. ai_usage_logs
--     linked to blog → user_owns_blog()
--     NOTE: inserts are performed by edge functions using service_role (bypass RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_logs: owner select"
  ON public.ai_usage_logs FOR SELECT
  USING (public.user_owns_blog(blog_id));

-- ---------------------------------------------------------------------------
-- 18. landing_pages
--     linked to blog → user_owns_blog()
-- ---------------------------------------------------------------------------
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_pages: owner select"
  ON public.landing_pages FOR SELECT
  USING (public.user_owns_blog(blog_id));

CREATE POLICY "landing_pages: owner insert"
  ON public.landing_pages FOR INSERT
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "landing_pages: owner update"
  ON public.landing_pages FOR UPDATE
  USING (public.user_owns_blog(blog_id))
  WITH CHECK (public.user_owns_blog(blog_id));

CREATE POLICY "landing_pages: owner delete"
  ON public.landing_pages FOR DELETE
  USING (public.user_owns_blog(blog_id));
