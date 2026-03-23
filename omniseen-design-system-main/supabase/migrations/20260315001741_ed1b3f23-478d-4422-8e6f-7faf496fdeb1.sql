-- Allow anonymous/public SELECT on blogs (limited to basic info for public pages)
CREATE POLICY "blogs_public_read"
ON public.blogs
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anonymous/public SELECT on published articles only
CREATE POLICY "articles_public_read"
ON public.articles
FOR SELECT
TO anon, authenticated
USING (status = 'published');