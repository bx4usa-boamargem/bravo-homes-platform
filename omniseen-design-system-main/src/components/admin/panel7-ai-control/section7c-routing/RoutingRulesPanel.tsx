import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RuleRow from './RuleRow';
import { useRoutingRules, type RoutingRule } from '@/hooks/admin/useRoutingRules';
type NewRoutingRule = Omit<RoutingRule, 'id' | 'is_active' | 'priority'>;

const CONDITION_FIELDS = [
  { value: 'plan',     label: 'Plano do cliente' },
  { value: 'hour',     label: 'Hora do dia (0-23)' },
  { value: 'sections', label: 'Nº de seções' },
  { value: 'word_count', label: 'Contagem de palavras' },
  { value: 'user_tier', label: 'Tier do usuário' },
];

const CONDITION_OPERATORS = [
  { value: 'equals',       label: 'igual a (=)' },
  { value: 'not_equals',   label: 'diferente de (≠)' },
  { value: 'less_than',    label: 'menor que (<)' },
  { value: 'greater_than', label: 'maior que (>)' },
  { value: 'contains',     label: 'contém' },
];

const ACTION_TYPES = [
  { value: 'force_model', label: 'Forçar modelo' },
  { value: 'set_mode',    label: 'Definir modo' },
  { value: 'skip_agent',  label: 'Pular agente' },
];

const ACTION_VALUES: Record<string, { value: string; label: string }[]> = {
  force_model: [
    { value: 'gpt-4o',       label: 'GPT-4o' },
    { value: 'gpt-4o-mini',  label: 'GPT-4o-mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'flux-pro',     label: 'FLUX Pro' },
    { value: 'flux-schnell', label: 'FLUX Schnell' },
  ],
  set_mode: [
    { value: 'economy',  label: 'Modo Econômico' },
    { value: 'premium',  label: 'Modo Premium' },
    { value: 'standard', label: 'Modo Padrão' },
  ],
  skip_agent: [
    { value: 'visionary',        label: 'Visionary (imagens)' },
    { value: 'optimizer',        label: 'Optimizer (meta)' },
    { value: 'territory_mapper', label: 'Territory Mapper' },
  ],
};

const EMPTY_RULE: NewRoutingRule = {
  condition_field:    'plan',
  condition_operator: 'equals',
  condition_value:    '',
  action_type:        'force_model',
  action_value:       'gpt-4o-mini',
};

const RoutingRulesPanel: React.FC = () => {
  const { rules, loading, addRule, deleteRule, toggleRule } = useRoutingRules();
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule]   = useState<NewRoutingRule>({ ...EMPTY_RULE });
  const [adding, setAdding]     = useState(false);

  const handleAdd = async () => {
    if (!newRule.condition_value.trim()) return;
    setAdding(true);
    try {
      await addRule({ ...newRule, is_active: true, priority: rules.length + 1 });
      setNewRule({ ...EMPTY_RULE });
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const currentActionValues = ACTION_VALUES[newRule.action_type] ?? [];

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
          ⚡ REGRAS DE ROTEAMENTO
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowForm(v => !v)}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Plus size={13} />
          Adicionar Regra
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div
          style={{
            background:   'var(--admin-card2)',
            border:       '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            padding:      '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize:      '11px',
              fontWeight:    700,
              letterSpacing: '0.08em',
              color:         'var(--admin-cyan)',
              textTransform: 'uppercase',
              marginBottom:  '12px',
            }}
          >
            Nova Regra
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap:     '8px',
              alignItems: 'end',
            }}
          >
            {/* Condition field */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--admin-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Condição
              </div>
              <select
                className="admin-select"
                value={newRule.condition_field}
                onChange={e => setNewRule(r => ({ ...r, condition_field: e.target.value }))}
                style={{ fontSize: '12px' }}
              >
                {CONDITION_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--admin-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Operador
              </div>
              <select
                className="admin-select"
                value={newRule.condition_operator}
                onChange={e => setNewRule(r => ({ ...r, condition_operator: e.target.value }))}
                style={{ fontSize: '12px' }}
              >
                {CONDITION_OPERATORS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--admin-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Valor
              </div>
              <input
                className="admin-input"
                type="text"
                placeholder="ex: free, pro, 22..."
                value={newRule.condition_value}
                onChange={e => setNewRule(r => ({ ...r, condition_value: e.target.value }))}
                style={{ fontSize: '12px' }}
              />
            </div>

            {/* Action type */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--admin-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Ação
              </div>
              <select
                className="admin-select"
                value={newRule.action_type}
                onChange={e => {
                  const type = e.target.value;
                  const firstVal = ACTION_VALUES[type]?.[0]?.value ?? '';
                  setNewRule(r => ({ ...r, action_type: type, action_value: firstVal }));
                }}
                style={{ fontSize: '12px' }}
              >
                {ACTION_TYPES.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Action value */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--admin-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Para
              </div>
              <select
                className="admin-select"
                value={newRule.action_value}
                onChange={e => setNewRule(r => ({ ...r, action_value: e.target.value }))}
                style={{ fontSize: '12px' }}
              >
                {currentActionValues.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleAdd}
              disabled={adding || !newRule.condition_value.trim()}
              style={{ opacity: adding ? 0.7 : 1 }}
            >
              {adding ? 'Adicionando...' : '+ Adicionar'}
            </button>
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div className="admin-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : rules.length === 0 ? (
        <div className="admin-empty">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
          <div>Nenhuma regra de roteamento configurada.</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--admin-muted)' }}>
            Adicione regras para controlar como os agentes processam conteúdo.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {rules.map(rule => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onDelete={() => deleteRule(rule.id)}
              onToggle={() => toggleRule(rule.id, !rule.is_active)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoutingRulesPanel;
