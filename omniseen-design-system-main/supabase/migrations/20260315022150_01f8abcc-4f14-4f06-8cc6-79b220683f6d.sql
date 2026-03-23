CREATE POLICY "landing_pages_public_read" ON public.landing_pages
FOR SELECT TO anon, authenticated
USING (status = 'published');