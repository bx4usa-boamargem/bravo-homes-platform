import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIConfigRow {
  id: string;
  function_name: string;
  model_name: string;
  fallback_model: string | null;
  is_economy_mode: boolean | null;
  is_premium_mode: boolean | null;
}

export function useAIConfig() {
  const [configs, setConfigs] = useState<AIConfigRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from("ai_config").select("*");
    if (data) setConfigs(data as AIConfigRow[]);
    setLoading(false);
  };

  const updateConfig = async (id: string, updates: Partial<AIConfigRow>) => {
    const { error } = await supabase.from("ai_config").update(updates).eq("id", id);
    if (error) toast.error("Erro ao salvar config");
    else { toast.success("Config salva!"); fetch(); }
  };

  useEffect(() => { fetch(); }, []);
  return { configs, loading, updateConfig, refetch: fetch };
}
