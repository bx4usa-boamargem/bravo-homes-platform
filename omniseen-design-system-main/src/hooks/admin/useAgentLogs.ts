import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentLog {
  id:              string;
  agent_name:      string | null;
  pipeline_type:   string | null;
  pipeline_run_id: string | null;
  user_id:         string | null;
  blog_id:         string | null;
  article_id:      string | null;
  duration_ms:     number | null;
  tokens_used:     number | null;
  cost_usd:        number | null;
  model_used:      string | null;
  status:          string | null;
  error_message:   string | null;
  metadata:        Record<string, unknown> | null;
  created_at:      string;
}

interface UseAgentLogsResult {
  logs:    AgentLog[];
  loading: boolean;
}

export function useAgentLogs(): UseAgentLogsResult {
  const [logs, setLogs]       = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[useAgentLogs] Error fetching logs:', error.message);
        return;
      }

      setLogs((data ?? []) as AgentLog[]);
    } catch (err) {
      console.warn('[useAgentLogs] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel('admin-agent-logs')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'agent_logs',
        },
        payload => {
          const newLog = payload.new as AgentLog;
          setLogs(prev => {
            // Keep only last 50
            const updated = [newLog, ...prev];
            return updated.slice(0, 50);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'agent_logs',
        },
        payload => {
          const updatedLog = payload.new as AgentLog;
          setLogs(prev =>
            prev.map(l => (l.id === updatedLog.id ? updatedLog : l)),
          );
        },
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.debug('[useAgentLogs] Realtime channel subscribed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return { logs, loading };
}
