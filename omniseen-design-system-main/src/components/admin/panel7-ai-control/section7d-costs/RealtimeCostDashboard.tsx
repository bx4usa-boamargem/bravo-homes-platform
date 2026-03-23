import React, { useState } from 'react';
import { useAgentCosts } from '@/hooks/admin/useAgentCosts';
import { MOCK_DAILY_COST } from '../../shared/mockData';
import CostBadge from '../../shared/CostBadge';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtInt = (n: number) => n.toLocaleString('pt-BR');

const RealtimeCostDashboard: React.FC = () => {
  const { data: agentCosts } = useAgentCosts();
  const [mrr, setMrr]        = useState(3000); // Editável
  const [editingMrr, setEditingMrr] = useState(false);
  const [mrrInput, setMrrInput]     = useState('3000');

  // Use mock daily cost (would come from RPC in production)
  const daily = MOCK_DAILY_COST;

  // Compute real total from agent costs if available
  const realTotal = agentCosts.length > 0
    ? agentCosts.reduce((s, a) => s + a.total_cost_usd, 0)
    : null;

  const displayTotal   = realTotal ?? daily.total;
  const monthlyProj    = +(displayTotal * 30).toFixed(0);
  const margin         = mrr - monthlyProj;
  const marginPct      = mrr > 0 ? ((margin / mrr) * 100).toFixed(1) : '0';
  const marginColor    = margin > 0
    ? 'var(--admin-green)'
    : 'var(--admin-red)';

  const handleMrrSave = () => {
    const val = parseFloat(mrrInput);
    if (!isNaN(val) && val > 0) setMrr(val);
    setEditingMrr(false);
  };

  return (
    <div
      style={{
        background:   'var(--admin-card)',
        border:       '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        padding:      '20px',
        height:       '100%',
      }}
    >
      <div className="admin-section-title">💰 CUSTOS EM TEMPO REAL</div>

      {/* Big metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:     '12px',
          marginBottom: '16px',
        }}
      >
        {/* OpenAI */}
        <div
          style={{
            background:   'rgba(0,212,255,0.05)',
            border:       '1px solid rgba(0,212,255,0.15)',
            borderRadius: 'var(--admin-radius)',
            padding:      '14px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            🤖 OpenAI — Tokens
          </div>
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '22px',
              fontWeight: 800,
              color:      'var(--admin-cyan)',
              lineHeight: 1,
            }}
          >
            {(daily.openai_tokens / 1_000_000).toFixed(1)}M
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Custo:</span>
            <CostBadge cost={daily.openai_cost} />
          </div>
        </div>

        {/* fal.ai */}
        <div
          style={{
            background:   'rgba(255,45,136,0.05)',
            border:       '1px solid rgba(255,45,136,0.15)',
            borderRadius: 'var(--admin-radius)',
            padding:      '14px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            👁 fal.ai — Imagens
          </div>
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '22px',
              fontWeight: 800,
              color:      '#ff2d88',
              lineHeight: 1,
            }}
          >
            {fmtInt(daily.fal_images)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Custo:</span>
            <CostBadge cost={daily.fal_cost} />
          </div>
        </div>

        {/* Serper */}
        <div
          style={{
            background:   'rgba(0,150,255,0.05)',
            border:       '1px solid rgba(0,150,255,0.15)',
            borderRadius: 'var(--admin-radius)',
            padding:      '14px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            📡 Serper.dev — Calls
          </div>
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '22px',
              fontWeight: 800,
              color:      '#0096ff',
              lineHeight: 1,
            }}
          >
            {fmtInt(daily.serper_calls)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Custo:</span>
            <CostBadge cost={daily.serper_cost} />
          </div>
        </div>

        {/* Google Places */}
        <div
          style={{
            background:   'rgba(0,180,150,0.05)',
            border:       '1px solid rgba(0,180,150,0.15)',
            borderRadius: 'var(--admin-radius)',
            padding:      '14px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            🗺 Google Places — Calls
          </div>
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '22px',
              fontWeight: 800,
              color:      'var(--admin-teal)',
              lineHeight: 1,
            }}
          >
            {fmtInt(daily.places_calls)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Custo:</span>
            <CostBadge cost={daily.places_cost} />
          </div>
        </div>
      </div>

      <hr className="admin-divider" />

      {/* Total today — large highlight */}
      <div
        style={{
          background:   displayTotal >= 20
            ? 'rgba(255,45,85,0.08)'
            : 'rgba(0,212,255,0.06)',
          border:       `1px solid ${displayTotal >= 20 ? 'rgba(255,45,85,0.2)' : 'rgba(0,212,255,0.2)'}`,
          borderRadius: 'var(--admin-radius)',
          padding:      '16px',
          textAlign:    'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
          💸 Custo Total Hoje
        </div>
        <div
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '36px',
            fontWeight: 900,
            color:      displayTotal >= 20 ? 'var(--admin-red)' : 'var(--admin-cyan)',
            lineHeight: 1,
          }}
        >
          {fmt(displayTotal)}
        </div>
      </div>

      {/* Monthly projection */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '10px 14px',
          background:     'var(--admin-card2)',
          border:         '1px solid var(--admin-border2)',
          borderRadius:   'var(--admin-radius)',
          marginBottom:   '10px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
          📅 Projeção mensal
        </span>
        <span
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '16px',
            fontWeight: 700,
            color:      'var(--admin-yellow)',
          }}
        >
          ~{fmt(monthlyProj)}
        </span>
      </div>

      {/* MRR editável */}
      <div
        style={{
          padding:      '12px 14px',
          background:   'var(--admin-card2)',
          border:       '1px solid var(--admin-border2)',
          borderRadius: 'var(--admin-radius)',
        }}
      >
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   '8px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            📈 MRR (editável)
          </span>
          {!editingMrr ? (
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => { setMrrInput(String(mrr)); setEditingMrr(true); }}
              style={{ padding: '2px 8px', fontSize: '10px' }}
            >
              ✏ Editar
            </button>
          ) : (
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleMrrSave}
              style={{ padding: '2px 8px', fontSize: '10px' }}
            >
              ✓ Salvar
            </button>
          )}
        </div>

        {editingMrr ? (
          <input
            className="admin-input"
            type="number"
            value={mrrInput}
            onChange={e => setMrrInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleMrrSave()}
            style={{ fontSize: '14px', fontFamily: 'var(--admin-font-mono)' }}
            autoFocus
          />
        ) : (
          <div
            style={{
              fontFamily: 'var(--admin-font-mono)',
              fontSize:   '20px',
              fontWeight: 700,
              color:      'var(--admin-green)',
            }}
          >
            {fmt(mrr)}
          </div>
        )}

        {/* Margin */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginTop:      '10px',
            padding:        '8px 0',
            borderTop:      '1px solid var(--admin-border2)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
            Margem estimada:
          </span>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: 'var(--admin-font-mono)',
                fontSize:   '14px',
                fontWeight: 700,
                color:      marginColor,
                display:    'block',
              }}
            >
              {fmt(margin)}
            </span>
            <span
              style={{
                fontFamily: 'var(--admin-font-mono)',
                fontSize:   '11px',
                color:      marginColor,
                opacity:    0.8,
              }}
            >
              ({marginPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeCostDashboard;
