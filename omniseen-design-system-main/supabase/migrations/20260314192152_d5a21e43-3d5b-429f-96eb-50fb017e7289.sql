
-- 1. Create a SECURITY DEFINER function to check tenant membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_members
    WHERE tenant_id = _tenant_id
      AND user_id = _user_id
  )
$$;

-- 2. Replace the recursive tenant_members policy with a non-recursive one
DROP POLICY IF EXISTS "tenant_members_own" ON public.tenant_members;

CREATE POLICY "tenant_members_own"
ON public.tenant_members
FOR ALL
TO public
USING (user_id = auth.uid());

-- 3. Replace blogs policy to use the helper function
DROP POLICY IF EXISTS "blogs_member" ON public.blogs;

CREATE POLICY "blogs_member"
ON public.blogs
FOR ALL
TO public
USING (public.is_tenant_member(tenant_id, auth.uid()));
