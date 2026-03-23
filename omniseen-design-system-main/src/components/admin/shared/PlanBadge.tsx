import React from 'react';

interface PlanBadgeProps {
  plan: string;
}

interface PlanStyle {
  color:  string;
  bg:     string;
  border: string;
  label:  string;
}

const PLAN_STYLES: Record<string, PlanStyle> = {
  free: {
    color:  '#94a3b8',
    bg:     'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.25)',
    label:  'FREE',
  },
  starter: {
    color:  '#0096ff',
    bg:     'rgba(0, 150, 255, 0.1)',
    border: 'rgba(0, 150, 255, 0.25)',
    label:  'STARTER',
  },
  pro: {
    color:  '#7c3aed',
    bg:     'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.25)',
    label:  'PRO',
  },
  enterprise: {
    color:  '#d4a017',
    bg:     'rgba(212, 160, 23, 0.1)',
    border: 'rgba(212, 160, 23, 0.3)',
    label:  'ENTERPRISE',
  },
};

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
  const normalizedPlan = plan?.toLowerCase() ?? 'free';
  const style = PLAN_STYLES[normalizedPlan] ?? {
    color:  '#94a3b8',
    bg:     'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.2)',
    label:  plan?.toUpperCase() ?? 'UNKNOWN',
  };

  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        padding:       '2px 8px',
        borderRadius:  '9999px',
        fontSize:      '10px',
        fontWeight:    700,
        letterSpacing: '0.08em',
        color:         style.color,
        background:    style.bg,
        border:        `1px solid ${style.border}`,
        whiteSpace:    'nowrap',
        fontFamily:    'var(--admin-font-mono)',
      }}
    >
      {normalizedPlan === 'enterprise' && (
        <span style={{ marginRight: 3 }}>★</span>
      )}
      {style.label}
    </span>
  );
};

export default PlanBadge;
