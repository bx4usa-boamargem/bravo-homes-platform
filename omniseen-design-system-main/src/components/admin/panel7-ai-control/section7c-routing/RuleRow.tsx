import React from 'react';
import { Trash2 } from 'lucide-react';
import type { RoutingRule } from '@/hooks/admin/useRoutingRules';

interface RuleRowProps {
  rule:     RoutingRule;
  onDelete: () => void;
  onToggle: () => void;
}

const CONDITION_LABELS: Record<string, string> = {
  plan:     'Plano',
  hour:     'Hora do dia',
  sections: 'Nº de seções',
};

const OPERATOR_LABELS: Record<string, string> = {
  equals:       '=',
  not_equals:   '≠',
  less_than:    '<',
  greater_than: '>',
  contains:     'contém',
};

const ACTION_LABELS: Record<string, string> = {
  force_model: 'FORÇAR MODELO',
  set_mode:    'DEFINIR MODO',
  skip_agent:  'PULAR AGENTE',
};

const RuleRow: React.FC<RuleRowProps> = ({ rule, onDelete, onToggle }) => {
  const condLabel  = CONDITION_LABELS[rule.condition_field]  ?? rule.condition_field;
  const opLabel    = OPERATOR_LABELS[rule.condition_operator] ?? rule.condition_operator;
  const actionLabel = ACTION_LABELS[rule.action_type] ?? rule.action_type;

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        padding:      '10px 14px',
        background:   rule.is_active ? 'var(--admin-card2)' : 'transparent',
        border:       `1px solid ${rule.is_active ? 'var(--admin-border)' : 'var(--admin-border2)'}`,
        borderRadius: 'var(--admin-radius)',
        opacity:      rule.is_active ? 1 : 0.5,
        transition:   'all 0.2s ease',
      }}
    >
      {/* Toggle */}
      <label className="admin-toggle" style={{ flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={rule.is_active}
          onChange={onToggle}
        />
        <span className="admin-toggle-slider" />
      </label>

      {/* Priority badge */}
      <span
        style={{
          fontFamily:    'var(--admin-font-mono)',
          fontSize:      '10px',
          fontWeight:    700,
          color:         'var(--admin-muted)',
          background:    'var(--admin-card)',
          border:        '1px solid var(--admin-border2)',
          borderRadius:  '4px',
          padding:       '2px 6px',
          flexShrink:    0,
          minWidth:      '28px',
          textAlign:     'center',
        }}
      >
        #{rule.priority}
      </span>

      {/* Rule description */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>SE</span>

        <span
          style={{
            fontFamily:    'var(--admin-font-mono)',
            fontSize:      '11px',
            fontWeight:    600,
            color:         'var(--admin-cyan)',
            background:    'rgba(0,212,255,0.08)',
            border:        '1px solid rgba(0,212,255,0.2)',
            borderRadius:  '4px',
            padding:       '1px 6px',
          }}
        >
          {condLabel}
        </span>

        <span
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '12px',
            fontWeight: 700,
            color:      'var(--admin-yellow)',
          }}
        >
          {opLabel}
        </span>

        <span
          style={{
            fontFamily:   'var(--admin-font-mono)',
            fontSize:     '11px',
            fontWeight:   600,
            color:        'var(--admin-text)',
            background:   'var(--admin-card)',
            border:       '1px solid var(--admin-border)',
            borderRadius: '4px',
            padding:      '1px 6px',
          }}
        >
          {rule.condition_value}
        </span>

        <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>→</span>

        <span
          style={{
            fontFamily:    'var(--admin-font-mono)',
            fontSize:      '11px',
            fontWeight:    700,
            color:         'var(--admin-orange)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {actionLabel}
        </span>

        <span
          style={{
            fontFamily:   'var(--admin-font-mono)',
            fontSize:     '11px',
            fontWeight:   600,
            color:        'var(--admin-purple)',
            background:   'rgba(124,58,237,0.08)',
            border:       '1px solid rgba(124,58,237,0.2)',
            borderRadius: '4px',
            padding:      '1px 6px',
          }}
        >
          {rule.action_value}
        </span>
      </div>

      {/* Created date */}
      <span
        style={{
          fontSize:  '10px',
          color:     'var(--admin-muted)',
          flexShrink: 0,
          fontFamily: 'var(--admin-font-mono)',
        }}
      >
        {rule.priority ?? '—'}
      </span>

      {/* Delete button */}
      <button
        className="admin-btn admin-btn-danger"
        onClick={onDelete}
        style={{ padding: '4px 8px', flexShrink: 0 }}
        title="Remover regra"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

export default RuleRow;
