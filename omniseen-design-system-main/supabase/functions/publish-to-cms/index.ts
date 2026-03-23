import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Option request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      wpUrl,      // Ex: https://meusite.com.br
      wpUser,     // O nome do usuário (ou email) do admin WP
      wpAppPass,  // A Senha de Aplicativo (sem espaços)
      title, 
      contentHtml, 
      status = 'draft', // 'publish' or 'draft'
      slug
    } = body;

    if (!wpUrl || !wpUser || !wpAppPass || !title || !contentHtml) {
      throw new Error('Parâmetros ausentes obligatórios. Verifique WP Url, User, AppPass e conteúdo.');
    }

    const cleanUrl = wpUrl.replace(/\/$/, ""); // remove trailing slash
    const wpApiEndpoint = `${cleanUrl}/wp-json/wp/v2/posts`;

    // Auth base64 para Basic Auth do WordPress
    const credentialsBase64 = btoa(`${wpUser}:${wpAppPass}`);

    const wpResponse = await fetch(wpApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentialsBase64}`
      },
      body: JSON.stringify({
        title: title,
        content: contentHtml,
        status: status,
        slug: slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
      })
    });

    const wpData = await wpResponse.json();

    if (!wpResponse.ok) {
      console.error("Erro no WP:", wpData);
      throw new Error(`WordPress rejeitou o post: ${wpData.message || wpResponse.statusText}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      postUrl: wpData.link, 
      postId: wpData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro em publish-to-wordpress:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
