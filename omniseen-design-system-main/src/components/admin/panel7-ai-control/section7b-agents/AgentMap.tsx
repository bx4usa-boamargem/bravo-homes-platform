import React, { useMemo } from 'react';
import AgentCard from './AgentCard';
import { useAgentCosts } from '@/hooks/admin/useAgentCosts';
import { AGENTS } from '../../shared/mockData';

// Generate seeded pseudo-random 24-hour sparkline
function generateSparkline(seed: number, maxVal: number): number[] {
  const data: number[] = [];
  let val = Math.floor(maxVal * 0.3);
  for (let i = 0; i < 24; i++) {
    // Pseudo-random walk with seed
    const rand = Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5;
    const delta = Math.floor((rand - 0.5) * maxVal * 0.25);
    val = Math.max(0, Math.min(maxVal, val + delta));
    // Peak hours (9-18)
    if (i >= 9 && i <= 18) val = Math.min(maxVal, val + Math.floor(maxVal * 0.15));
    data.push(val);
  }
  return data;
}

const AgentMap: React.FC = () => {
  const { data: agentCosts, loading, refetch: refresh } = useAgentCosts();

  // Total pipeline stats
  const totalCalls  = agentCosts.reduce((s, a) => s + a.calls_count, 0);
  const totalCost   = agentCosts.reduce((s, a) => s + a.total_cost_usd, 0);
  const totalErrors = agentCosts.reduce((s, a) => s + a.error_count, 0);

  // Sparklines per agent (memoized)
  const sparklines = useMemo(() => {
    return AGENTS.map((agent, i) => {
      const cost = agentCosts.find(c => c.agent_name === agent.agentName);
      const max  = Math.max(1, Math.floor((cost?.calls_count ?? 100) / 10));
      return generateSparkline(i + 1, max);
    });
  }, [agentCosts]);

  return (
    <div
      style={{
        background:   'var(--admin-card)',
        border:       '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        padding:      '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '16px',
        }}
      >
        <div className="admin-section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>
          🤖 MAPA DE AGENTES — ATIVIDADE 24H
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--admin-font-mono)',
                  fontSize:   '16px',
                  fontWeight: 700,
                  color:      'var(--admin-cyan)',
                }}
              >
                {totalCalls.toLocaleString()}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>
                Total Calls
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--admin-font-mono)',
                  fontSize:   '16px',
                  fontWeight: 700,
                  color:      totalCost < 20 ? 'var(--admin-green)' : 'var(--admin-yellow)',
                }}
              >
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>
                Custo Total
              </div>
            </div>
            {totalErrors > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--admin-font-mono)',
                    fontSize:   '16px',
                    fontWeight: 700,
                    color:      'var(--admin-red)',
                  }}
                >
                  {totalErrors}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'uppercase' }}>
                  Erros
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            className="admin-btn admin-btn-outline"
            onClick={refresh}
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            ↻ Atualizar
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="admin-spinner admin-spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      )}

      {/* Agents grid 4×2 */}
      {!loading && (
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 '12px',
          }}
        >
          {AGENTS.map((agent, i) => {
            const cost = agentCosts.find(c => c.agent_name === agent.agentName);
            return (
              <AgentCard
                key={agent.agentName}
                agent={agent}
                cost={cost}
                sparklineData={sparklines[i]}
              />
            );
          })}
        </div>
      )}

      {/* Responsive override */}
      <style>{`
        @media (max-width: 1280px) {
          .agent-map-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .agent-map-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AgentMap;
