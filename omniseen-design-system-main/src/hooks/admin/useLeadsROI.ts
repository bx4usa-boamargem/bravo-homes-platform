import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientROI {
  client_id: string;
  client_name: string;
  plan: string;
  mrr_value: number;
  total_leads: number;
  converted_leads: number;
  total_deal_value: number;
  ai_cost_usd: number;
  roi_ratio: number;
  subcontas_count: number;
  articles_count: number;
  last_active_at: string | null;
}

export function useLeadsROI() {
  const [clients, setClients] = useState<ClientROI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.rpc("get_client_roi_summary");
    if (data) setClients(data as ClientROI[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);
  return { clients, loading, refetch: fetch };
}
