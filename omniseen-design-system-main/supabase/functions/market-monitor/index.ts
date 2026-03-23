import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { blog_id } = await req.json()

    if (!blog_id) {
       return new Response(JSON.stringify({ error: 'Missing blog_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Get blog and automation settings
    const { data: blog, error: blogError } = await supabaseClient
      .from('blogs')
      .select('*, automation_settings(*)')
      .eq('id', blog_id)
      .single()

    if (blogError || !blog) {
      throw new Response(JSON.stringify({ error: 'Blog not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // 2. Scan for opportunities that can be auto-generated
    // Logic: Look for opportunities created recently or filtered by a specific threshold
    const { data: opportunities, error: oppError } = await supabaseClient
      .from('article_opportunities')
      .select('*')
      .eq('blog_id', blog_id)
      .eq('status', 'open')
      .order('relevance_score', { ascending: false })
      .limit(1) // Start with 1 for safety

    if (oppError) throw oppError

    const results = []

    if (opportunities && opportunities.length > 0 && blog.automation_settings?.auto_generate_articles) {
      for (const opp of opportunities) {
        // Here we would call the internal logic to generate the article
        // For "The Eye", we promote it to Ghost Writer
        console.log(`Promoting opportunity to Ghost Writer: ${opp.title}`)
        
        // Mark as processing
        await supabaseClient
          .from('article_opportunities')
          .update({ status: 'processing' })
          .eq('id', opp.id)

        // Trigger ghost-writer (generate-article-pro)
        // Note: In an edge function calling another edge function is possible
        const writerResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-article-pro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            blog_id: blog_id,
            title: opp.title,
            keywords: opp.keywords || blog.niche,
            opportunity_id: opp.id
          })
        })

        const writerData = await writerResponse.json()
        results.push({ opp_id: opp.id, status: 'promoted', writer_data: writerData })
      }
    }

    return new Response(JSON.stringify({ status: 'monitoring_complete', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in market-monitor:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
