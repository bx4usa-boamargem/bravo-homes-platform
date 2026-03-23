import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_AGENT_COSTS } from "@/components/admin/shared/mockData";

export interface AgentCost {
  agent_name: string;
  calls_count: number;
  total_tokens: number;
  total_cost_usd: number;
  error_count: number;
  avg_duration_ms: number;
}

export function useAgentCosts() {
  const [data, setData] = useState<AgentCost[]>(MOCK_AGENT_COSTS);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data: rpcData, error } = await supabase.rpc("get_agent_costs_today");
    if (!error && rpcData && rpcData.length > 0) {
      setData(rpcData as AgentCost[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { data, loading, refetch: fetch };
}
