import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Client com token do USUÁRIO — para identificar quem está chamando
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  // Client de serviço — para escrever sem RLS
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // Pega o usuário autenticado
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se já existe um blog para esse user
    const { data: existing } = await admin
      .from("blogs")
      .select("id, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Já tem blog — retorna ele sem criar novo
      return new Response(JSON.stringify({ blog: existing, created: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monta nome e slug a partir do e-mail / metadata
    const email = user.email ?? "";
    const displayName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      email.split("@")[0] ||
      "Meu Blog";

    const slugBase = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const slug = `${slugBase}-${user.id.slice(0, 8)}`;

    // Cria o blog padrão
    const { data: newBlog, error: insertErr } = await admin
      .from("blogs")
      .insert({
        tenant_id: user.id,   // cada user é seu próprio tenant no plano free
        user_id: user.id,
        name: `${displayName}'s Blog`,
        slug,
        description: "",
        platform_subdomain: slug,
        language: "pt-BR",
        timezone: "America/Sao_Paulo",
        niche: "",
        target_audience: "",
        brand_voice: "",
      })
      .select("id, name")
      .single();

    if (insertErr) {
      console.error("Erro ao criar blog:", insertErr);
      return new Response(
        JSON.stringify({ error: "Falha ao criar blog: " + insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Blog criado para ${email}: ${newBlog.id}`);
    return new Response(JSON.stringify({ blog: newBlog, created: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ensure-blog-exists error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
