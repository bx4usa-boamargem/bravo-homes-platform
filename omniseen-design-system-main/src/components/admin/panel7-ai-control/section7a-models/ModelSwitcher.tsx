import React, { useState, useEffect } from 'react';
import { useAIConfig } from '@/hooks/admin/useAIConfig';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface ModelRow {
  functionName: string;
  label:        string;
  emoji:        string;
  options:      string[];
  fallbacks:    string[];
}

const MODEL_ROWS: ModelRow[] = [
  {
    functionName: 'outline',
    label:        'Outline / Architect',
    emoji:        '📐',
    options:      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    fallbacks:    ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'],
  },
  {
    functionName: 'writing',
    label:        'Writing / Scribe',
    emoji:        '✍',
    options:      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    fallbacks:    ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'],
  },
  {
    functionName: 'meta',
    label:        'Meta / Optimizer',
    emoji:        '🎯',
    options:      ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4o'],
    fallbacks:    ['gpt-3.5-turbo', 'gpt-4o-mini'],
  },
  {
    functionName: 'image',
    label:        'Image / Visionary',
    emoji:        '👁',
    options:      ['flux-pro', 'flux-schnell', 'flux-dev', 'sdxl'],
    fallbacks:    ['flux-schnell', 'sdxl'],
  },
];

// Cost per 1K tokens (for estimation)
const MODEL_COST_PER_1K: Record<string, number> = {
  'gpt-4o':          0.005,
  'gpt-4o-mini':     0.00015,
  'gpt-4-turbo':     0.01,
  'gpt-3.5-turbo':   0.0005,
  'flux-pro':        0.003,
  'flux-schnell':    0.001,
  'flux-dev':        0.002,
  'sdxl':            0.001,
};

function estimateArticleCost(selections: Record<string, string>): number {
  // Rough token estimates per function for one article
  const TOKEN_ESTIMATES: Record<string, number> = {
    outline: 3000,
    writing: 8000,
    meta:    500,
    image:   0, // image billed per call, not tokens
  };
  const IMAGE_COST_PER_CALL = MODEL_COST_PER_1K[selections['image'] ?? 'flux-schnell'] * 1000;

  let total = 0;
  for (const [fn, model] of Object.entries(selections)) {
    if (fn === 'image') {
      total += IMAGE_COST_PER_CALL;
    } else {
      const tokens = TOKEN_ESTIMATES[fn] ?? 0;
      const costPer1k = MODEL_COST_PER_1K[model] ?? 0;
      total += (tokens / 1000) * costPer1k;
    }
  }
  return total;
}

const ModelSwitcher: React.FC = () => {
  const { configs, loading, updateConfig } = useAIConfig();

  const [selections, setSelections]   = useState<Record<string, string>>({});
  const [fallbacks, setFallbacks]     = useState<Record<string, string>>({});
  const [isEconomy, setIsEconomy]     = useState(false);
  const [isPremium, setIsPremium]     = useState(false);
  const [saving, setSaving]           = useState(false);

  // Populate from loaded config
  useEffect(() => {
    if (configs.length === 0) return;
    const sel: Record<string, string>  = {};
    const fall: Record<string, string> = {};
    for (const cfg of configs) {
      sel[cfg.function_name]  = cfg.model_name;
      fall[cfg.function_name] = cfg.fallback_model ?? '';
      if (cfg.is_economy_mode) setIsEconomy(true);
      if (cfg.is_premium_mode) setIsPremium(true);
    }
    setSelections(sel);
    setFallbacks(fall);
  }, [configs]);

  const handleEconomy = (checked: boolean) => {
    setIsEconomy(checked);
    if (checked) {
      setIsPremium(false);
      // Force mini everywhere except outline
      setSelections(prev => ({
        ...prev,
        writing: 'gpt-4o-mini',
        meta:    'gpt-4o-mini',
        image:   'flux-schnell',
      }));
    }
  };

  const handlePremium = (checked: boolean) => {
    setIsPremium(checked);
    if (checked) {
      setIsEconomy(false);
      // Force gpt-4o everywhere applicable
      setSelections(prev => ({
        ...prev,
        outline: 'gpt-4o',
        writing: 'gpt-4o',
        meta:    'gpt-4o',
        image:   'flux-pro',
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        configs.map(cfg =>
          updateConfig(cfg.id, {
            model_name: selections[cfg.function_name] ?? cfg.model_name,
            fallback_model: fallbacks[cfg.function_name] ?? cfg.fallback_model,
            is_economy_mode: isEconomy,
            is_premium_mode: isPremium,
          }),
        ),
      );
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const estimatedCost = estimateArticleCost(selections);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="admin-spinner" />
      </div>
    );
  }

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
      <div className="admin-section-title">🤖 MODELOS AI</div>

      {/* Mode toggles */}
      <div
        style={{
          display:      'flex',
          gap:          '12px',
          marginBottom: '20px',
          flexWrap:     'wrap',
        }}
      >
        {/* Economy mode */}
        <label
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '8px',
            cursor:        'pointer',
            padding:       '8px 14px',
            borderRadius:  'var(--admin-radius)',
            border:        `1px solid ${isEconomy ? 'var(--admin-green)' : 'var(--admin-border)'}`,
            background:    isEconomy ? 'rgba(0,255,136,0.08)' : 'transparent',
            transition:    'all 0.2s',
            fontSize:      '12px',
            color:         isEconomy ? 'var(--admin-green)' : 'var(--admin-muted)',
            fontWeight:    600,
            userSelect:    'none',
          }}
        >
          <label className="admin-toggle" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={isEconomy}
              onChange={e => handleEconomy(e.target.checked)}
            />
            <span className="admin-toggle-slider" />
          </label>
          💰 Modo Econômico
        </label>

        {/* Premium mode */}
        <label
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            cursor:       'pointer',
            padding:      '8px 14px',
            borderRadius: 'var(--admin-radius)',
            border:       `1px solid ${isPremium ? 'var(--admin-purple)' : 'var(--admin-border)'}`,
            background:   isPremium ? 'rgba(124,58,237,0.08)' : 'transparent',
            transition:   'all 0.2s',
            fontSize:     '12px',
            color:        isPremium ? 'var(--admin-purple)' : 'var(--admin-muted)',
            fontWeight:   600,
            userSelect:   'none',
          }}
        >
          <label className="admin-toggle" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={isPremium}
              onChange={e => handlePremium(e.target.checked)}
            />
            <span className="admin-toggle-slider" />
          </label>
          ⭐ Modo Premium
        </label>
      </div>

      {/* Model rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MODEL_ROWS.map(row => (
          <div
            key={row.functionName}
            style={{
              background:   'var(--admin-card2)',
              border:       '1px solid var(--admin-border2)',
              borderRadius: 'var(--admin-radius)',
              padding:      '12px 14px',
            }}
          >
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{row.emoji}</span>
              <span
                style={{
                  fontSize:   '12px',
                  fontWeight: 600,
                  color:      'var(--admin-text)',
                }}
              >
                {row.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Primary model */}
              <div>
                <div
                  style={{
                    fontSize:      '10px',
                    color:         'var(--admin-muted)',
                    letterSpacing: '0.08em',
                    marginBottom:  '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Modelo Principal
                </div>
                <select
                  className="admin-select"
                  value={selections[row.functionName] ?? row.options[0]}
                  onChange={e =>
                    setSelections(prev => ({ ...prev, [row.functionName]: e.target.value }))
                  }
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  {row.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Fallback model */}
              <div>
                <div
                  style={{
                    fontSize:      '10px',
                    color:         'var(--admin-muted)',
                    letterSpacing: '0.08em',
                    marginBottom:  '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Fallback
                </div>
                <select
                  className="admin-select"
                  value={fallbacks[row.functionName] ?? row.fallbacks[0]}
                  onChange={e =>
                    setFallbacks(prev => ({ ...prev, [row.functionName]: e.target.value }))
                  }
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  <option value="">— nenhum —</option>
                  {row.fallbacks.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated cost */}
      <div
        style={{
          marginTop:    '16px',
          padding:      '10px 14px',
          background:   'rgba(0,212,255,0.05)',
          border:       '1px solid rgba(0,212,255,0.15)',
          borderRadius: 'var(--admin-radius)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
          💡 Custo estimado / artigo:
        </span>
        <span
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '14px',
            fontWeight: 700,
            color:      estimatedCost < 0.05 ? 'var(--admin-green)' : estimatedCost < 0.10 ? 'var(--admin-yellow)' : 'var(--admin-red)',
          }}
        >
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(estimatedCost)}
        </span>
      </div>

      {/* Save button */}
      <button
        className="admin-btn admin-btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{
          width:     '100%',
          marginTop: '16px',
          justifyContent: 'center',
          opacity:   saving ? 0.7 : 1,
        }}
      >
        <Save size={14} />
        {saving ? 'Salvando...' : 'Salvar Configuração'}
      </button>
    </div>
  );
};

export default ModelSwitcher;
