import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useAdminTeam } from '@/hooks/admin/useAdminTeam';

interface InviteModalProps {
  onClose: () => void;
}

const ROLES = [
  {
    value:       'analyst',
    label:       'Analista',
    description: 'Acesso de leitura a métricas, logs e relatórios.',
    color:       'var(--admin-cyan)',
  },
  {
    value:       'support',
    label:       'Suporte',
    description: 'Gerencia tickets de clientes e visualiza dados de usuários.',
    color:       'var(--admin-green)',
  },
  {
    value:       'finance',
    label:       'Financeiro',
    description: 'Acesso a relatórios de custos, ROI e faturamento.',
    color:       'var(--admin-yellow)',
  },
  {
    value:       'tech_ops',
    label:       'Tech Ops',
    description: 'Acesso completo a configurações de AI e infra.',
    color:       'var(--admin-orange)',
  },
];

const InviteModal: React.FC<InviteModalProps> = ({ onClose }) => {
  const { invite } = useAdminTeam();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('analyst');
  const [sending, setSending] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name  = 'Nome é obrigatório';
    if (!email.trim()) e.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'E-mail inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await invite(name.trim(), email.trim(), role);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role);

  return (
    /* Backdrop */
    <div
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.7)',
        backdropFilter:  'blur(4px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          2000,
        padding:         '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        style={{
          background:   'var(--admin-card)',
          border:       '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius-xl)',
          padding:      '28px',
          width:        '100%',
          maxWidth:     '460px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
          animation:    'fade-in 0.2s ease both',
        }}
      >
        {/* Header */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width:          '36px',
                height:         '36px',
                borderRadius:   'var(--admin-radius)',
                background:     'rgba(0,212,255,0.1)',
                border:         '1px solid rgba(0,212,255,0.2)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'var(--admin-cyan)',
              }}
            >
              <UserPlus size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: '15px' }}>
                Convidar Membro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
                Enviar convite para a equipe admin
              </div>
            </div>
          </div>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={onClose}
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display:       'block',
                fontSize:      '11px',
                fontWeight:    600,
                color:         'var(--admin-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom:  '6px',
              }}
            >
              Nome completo
            </label>
            <input
              className="admin-input"
              type="text"
              placeholder="ex: João Silva"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: '' })); }}
              style={errors.name ? { borderColor: 'var(--admin-red)' } : {}}
              autoFocus
            />
            {errors.name && (
              <div style={{ fontSize: '11px', color: 'var(--admin-red)', marginTop: '4px' }}>
                {errors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display:       'block',
                fontSize:      '11px',
                fontWeight:    600,
                color:         'var(--admin-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom:  '6px',
              }}
            >
              E-mail
            </label>
            <input
              className="admin-input"
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '' })); }}
              style={errors.email ? { borderColor: 'var(--admin-red)' } : {}}
            />
            {errors.email && (
              <div style={{ fontSize: '11px', color: 'var(--admin-red)', marginTop: '4px' }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Role */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display:       'block',
                fontSize:      '11px',
                fontWeight:    600,
                color:         'var(--admin-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom:  '8px',
              }}
            >
              Função
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    padding:       '10px 12px',
                    borderRadius:  'var(--admin-radius)',
                    border:        `1px solid ${role === r.value ? r.color : 'var(--admin-border)'}`,
                    background:    role === r.value ? `${r.color}12` : 'var(--admin-card2)',
                    cursor:        'pointer',
                    textAlign:     'left',
                    transition:    'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize:   '12px',
                      fontWeight: 600,
                      color:      role === r.value ? r.color : 'var(--admin-text)',
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize:   '10px',
                      color:      'var(--admin-muted)',
                      marginTop:  '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {r.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Role info */}
          {selectedRole && (
            <div
              style={{
                padding:      '10px 12px',
                background:   `${selectedRole.color}0a`,
                border:       `1px solid ${selectedRole.color}20`,
                borderRadius: 'var(--admin-radius)',
                fontSize:     '12px',
                color:        selectedRole.color,
                marginBottom: '20px',
              }}
            >
              <strong>{selectedRole.label}:</strong> {selectedRole.description}
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--admin-muted)' }}>
                O convite expira em 7 dias.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={sending}
              style={{ flex: 1, justifyContent: 'center', opacity: sending ? 0.7 : 1 }}
            >
              <UserPlus size={14} />
              {sending ? 'Enviando...' : 'Enviar Convite'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
