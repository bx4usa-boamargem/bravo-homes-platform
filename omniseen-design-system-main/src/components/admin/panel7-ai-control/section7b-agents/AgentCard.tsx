import React from 'react';
import { toast } from 'sonner';
import { Pause } from 'lucide-react';
import StatusDot from '../../shared/StatusDot';
import AgentSparkline from '../../shared/AgentSparkline';
import CostBadge from '../../shared/CostBadge';
import type { AgentCostData, AgentMeta } from '../../shared/mockData';

interface AgentCardProps {
  agent:         AgentMeta;
  cost?:         AgentCostData;
  sparklineData: number[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, cost, sparklineData }) => {
  const isActive    = (cost?.calls_count ?? 0) > 0;
  const hasErrors   = (cost?.error_count ?? 0) > 0;
  const status      = hasErrors && (cost?.error_count ?? 0) > 5
    ? 'error'
    : isActive
      ? 'active'
      : 'idle';

  const handlePause = () => {
    toast.info(`⏸ Função de pausar "${agent.name}" ainda não implementada.`);
  };

  return (
    <div
      style={{
        background:   'var(--admin-card)',
        border:       '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        padding:      '16px',
        display:      'flex',
        flexDirection: 'column',
        gap:          '12px',
        transition:   'box-shadow 0.2s ease',
        position:     'relative',
        overflow:     'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 0 24px ${agent.color}22`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position:  'absolute',
          top:       0,
          left:      0,
          right:     0,
          height:    '2px',
          background: agent.color,
          opacity:   0.6,
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Agent avatar */}
        <div
          className="agent-avatar"
          style={{
            '--agent-color': agent.color,
            width:           '44px',
            height:          '44px',
            fontSize:        '22px',
          } as React.CSSProperties}
        >
          {agent.emoji}
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span
              style={{
                fontFamily:  'var(--admin-font-mono)',
                fontSize:    '12px',
                fontWeight:  700,
                color:       'var(--admin-text)',
                letterSpacing: '0.04em',
                overflow:    'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:  'nowrap',
              }}
            >
              {agent.name}
            </span>
            <StatusDot status={status} pulse={status === 'active'} />
          </div>
          <div
            style={{
              fontSize:  '10px',
              color:     agent.color,
              fontWeight: 500,
              opacity:   0.8,
            }}
          >
            {agent.specialty}
          </div>
        </div>

        {/* Pause button */}
        <button
          className="admin-btn admin-btn-ghost"
          onClick={handlePause}
          style={{
            padding:  '4px 8px',
            fontSize: '10px',
            gap:      '4px',
          }}
          title="Pausar agente"
        >
          <Pause size={10} />
          Pausar
        </button>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {/* Calls */}
        <div
          style={{
            background:   'var(--admin-card2)',
            borderRadius: 'var(--admin-radius)',
            padding:      '8px',
            textAlign:    'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '16px',
              fontWeight: 700,
              color:      agent.color,
              lineHeight: 1,
            }}
          >
            {(cost?.calls_count ?? 0).toLocaleString()}
          </div>
          <div
            style={{
              fontSize:      '9px',
              color:         'var(--admin-muted)',
              marginTop:     '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Calls
          </div>
        </div>

        {/* Duration */}
        <div
          style={{
            background:   'var(--admin-card2)',
            borderRadius: 'var(--admin-radius)',
            padding:      '8px',
            textAlign:    'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '16px',
              fontWeight: 700,
              color:      'var(--admin-text)',
              lineHeight: 1,
            }}
          >
            {formatDuration(cost?.avg_duration_ms ?? 0)}
          </div>
          <div
            style={{
              fontSize:      '9px',
              color:         'var(--admin-muted)',
              marginTop:     '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Avg Time
          </div>
        </div>

        {/* Errors */}
        <div
          style={{
            background:   (cost?.error_count ?? 0) > 0 ? 'rgba(255,45,85,0.08)' : 'var(--admin-card2)',
            borderRadius: 'var(--admin-radius)',
            padding:      '8px',
            textAlign:    'center',
            border:       (cost?.error_count ?? 0) > 0 ? '1px solid rgba(255,45,85,0.2)' : '1px solid transparent',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '16px',
              fontWeight: 700,
              color:      (cost?.error_count ?? 0) > 0 ? 'var(--admin-red)' : 'var(--admin-muted)',
              lineHeight: 1,
            }}
          >
            {cost?.error_count ?? 0}
          </div>
          <div
            style={{
              fontSize:      '9px',
              color:         'var(--admin-muted)',
              marginTop:     '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Erros
          </div>
        </div>
      </div>

      {/* Cost */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '8px',
        }}
      >
        <span
          style={{
            fontSize:  '11px',
            color:     'var(--admin-muted)',
          }}
        >
          Custo hoje:
        </span>
        <CostBadge cost={cost?.total_cost_usd ?? 0} />
      </div>

      {/* Sparkline */}
      <div>
        <div
          style={{
            fontSize:      '9px',
            color:         'var(--admin-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom:  '4px',
          }}
        >
          24h Activity
        </div>
        <AgentSparkline data={sparklineData} color={agent.color} height={36} />
      </div>
    </div>
  );
};

export default AgentCard;
