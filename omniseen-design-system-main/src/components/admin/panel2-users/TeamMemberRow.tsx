import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import type { TeamMember as AdminTeamMember } from '@/hooks/admin/useAdminTeam';

interface TeamMemberRowProps {
  member:    AdminTeamMember;
  onRemove:  () => void;
  onResend:  () => void;
}

const ROLE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  analyst:  { color: 'var(--admin-cyan)',   bg: 'rgba(0,212,255,0.1)',   label: 'Analista'   },
  support:  { color: 'var(--admin-green)',  bg: 'rgba(0,255,136,0.1)',   label: 'Suporte'    },
  finance:  { color: 'var(--admin-yellow)', bg: 'rgba(255,215,0,0.1)',   label: 'Financeiro' },
  tech_ops: { color: 'var(--admin-orange)', bg: 'rgba(255,107,0,0.1)',   label: 'Tech Ops'   },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)    return 'agora';
  if (mins < 60)   return `${mins}m atrás`;
  if (hours < 24)  return `${hours}h atrás`;
  if (days < 7)    return `${days}d atrás`;
  return formatDate(iso);
}

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, onRemove, onResend }) => {
  const roleStyle = ROLE_STYLES[member.role] ?? {
    color: 'var(--admin-muted)',
    bg:    'rgba(100,116,139,0.1)',
    label: member.role ?? 'Desconhecido',
  };

  const isAccepted = !!member.accepted_at;
  const isExpired  = !isAccepted && (member as any).invite_expires_at
    ? new Date((member as any).invite_expires_at) < new Date()
    : false;

  return (
    <tr>
      {/* Avatar + Name/Email */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width:          '36px',
              height:         '36px',
              borderRadius:   '50%',
              background:     roleStyle.bg,
              border:         `1px solid ${roleStyle.color}30`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontFamily:     'var(--admin-font-mono)',
              fontSize:       '13px',
              fontWeight:     700,
              color:          roleStyle.color,
              flexShrink:     0,
            }}
          >
            {(member.name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize:   '13px',
                color:      'var(--admin-text)',
              }}
            >
              {member.name}
            </div>
            <div
              style={{
                fontSize:   '11px',
                color:      'var(--admin-muted)',
                fontFamily: 'var(--admin-font-mono)',
              }}
            >
              {member.email}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td>
        <span
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            padding:       '2px 10px',
            borderRadius:  '9999px',
            fontSize:      '11px',
            fontWeight:    700,
            letterSpacing: '0.04em',
            color:         roleStyle.color,
            background:    roleStyle.bg,
            border:        `1px solid ${roleStyle.color}30`,
            whiteSpace:    'nowrap',
          }}
        >
          {roleStyle.label}
        </span>
      </td>

      {/* Status */}
      <td>
        {isAccepted ? (
          <span
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '5px',
              fontSize:     '11px',
              fontWeight:   600,
              color:        'var(--admin-green)',
            }}
          >
            <span
              style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   'var(--admin-green)',
                display:      'inline-block',
                boxShadow:    '0 0 4px var(--admin-green)',
              }}
            />
            Ativo
          </span>
        ) : isExpired ? (
          <span
            style={{
              display:    'inline-flex',
              alignItems: 'center',
              gap:        '5px',
              fontSize:   '11px',
              fontWeight: 600,
              color:      'var(--admin-red)',
            }}
          >
            <span
              style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   'var(--admin-red)',
                display:      'inline-block',
              }}
            />
            Expirado
          </span>
        ) : (
          <span
            style={{
              display:    'inline-flex',
              alignItems: 'center',
              gap:        '5px',
              fontSize:   '11px',
              fontWeight: 600,
              color:      'var(--admin-yellow)',
            }}
          >
            <span
              style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   'var(--admin-yellow)',
                display:      'inline-block',
              }}
            />
            Pendente
          </span>
        )}
      </td>

      {/* Accepted / Created */}
      <td>
        <div
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '11px',
            color:      'var(--admin-text2)',
          }}
        >
          {isAccepted ? formatDate(member.accepted_at) : formatDate(member.created_at)}
        </div>
      </td>

      {/* Last login */}
      <td>
        <div
          style={{
            fontFamily: 'var(--admin-font-mono)',
            fontSize:   '11px',
            color:      'var(--admin-muted)',
          }}
        >
          {formatRelative(member.last_login_at)}
        </div>
      </td>

      {/* Actions */}
      <td>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!isAccepted && (
            <button
              className="admin-btn admin-btn-outline"
              onClick={onResend}
              style={{ padding: '4px 8px', fontSize: '10px', gap: '4px' }}
              title="Reenviar convite"
            >
              <RefreshCw size={10} />
              Reenviar
            </button>
          )}
          <button
            className="admin-btn admin-btn-danger"
            onClick={onRemove}
            style={{ padding: '4px 8px' }}
            title="Remover membro"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TeamMemberRow;
