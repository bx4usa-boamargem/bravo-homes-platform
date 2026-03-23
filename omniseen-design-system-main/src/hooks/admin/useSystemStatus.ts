import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemStatus {
  totalArticles: number;
  totalSuperPages: number;
  totalBlogs: number;
  totalLeads: number;
  activeAgents: number;
  uptime: number;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    totalArticles: 0, totalSuperPages: 0, totalBlogs: 0, totalLeads: 0, activeAgents: 0, uptime: 99.97,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [articles, pages, blogs, leads, agentLogs] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("landing_pages").select("id", { count: "exact", head: true }),
        supabase.from("blogs").select("id", { count: "exact", head: true }),
        supabase.from("brand_agent_leads").select("id", { count: "exact", head: true }),
        supabase.from("agent_logs").select("status").gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString()),
      ]);

      const totalLogs = agentLogs.data?.length || 0;
      const successLogs = agentLogs.data?.filter(l => l.status === "success").length || 0;
      const uptime = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 10000) / 100 : 99.97;

      // Active agents = distinct agent_names in last 2h
      const { data: recentAgents } = await supabase
        .from("agent_logs")
        .select("agent_name")
        .gte("created_at", new Date(Date.now() - 2*60*60*1000).toISOString());
      const activeAgents = new Set(recentAgents?.map(a => a.agent_name) || []).size;

      setStatus({
        totalArticles: articles.count || 0,
        totalSuperPages: pages.count || 0,
        totalBlogs: blogs.count || 0,
        totalLeads: leads.count || 0,
        activeAgents,
        uptime,
      });
      setLoading(false);
    })();
  }, []);

  return { status, loading };
}
