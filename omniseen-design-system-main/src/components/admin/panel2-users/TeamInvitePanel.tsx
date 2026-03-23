import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAdminTeam } from '@/hooks/admin/useAdminTeam';
import TeamMemberRow from './TeamMemberRow';
import InviteModal from './InviteModal';

const TeamInvitePanel: React.FC = () => {
  const { members, loading, remove } = useAdminTeam();
  const [showModal, setShowModal] = useState(false);

  const activeCount  = members.filter(m => !!m.accepted_at).length;
  const pendingCount = members.filter(m => !m.accepted_at).length;

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
        <div>
          <div className="admin-section-title" style={{ marginBottom: '4px', borderBottom: 'none' }}>
            👥 EQUIPE ADMIN
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
            {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            {pendingCount > 0 && ` · ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowModal(true)}
          style={{ gap: '6px' }}
        >
          <UserPlus size={14} />
          Convidar Membro
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div className="admin-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : members.length === 0 ? (
        <div className="admin-empty">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <div>Nenhum membro na equipe ainda.</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Convide membros para colaborar na administração.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Função</th>
                <th>Status</th>
                <th>Data</th>
                <th>Último Login</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  onRemove={() => remove(member.id)}
                  onResend={() => {}}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showModal && <InviteModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default TeamInvitePanel;
