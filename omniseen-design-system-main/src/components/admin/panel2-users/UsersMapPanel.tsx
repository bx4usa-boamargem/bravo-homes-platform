import React from 'react';
import UsersTable from './UsersTable';
import TeamInvitePanel from './TeamInvitePanel';

const UsersMapPanel: React.FC = () => {
  return (
    <div className="admin-panel anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontFamily:    'var(--admin-font-mono)',
            fontSize:      '22px',
            fontWeight:    800,
            color:         'var(--admin-text)',
            letterSpacing: '0.06em',
            marginBottom:  '4px',
          }}
        >
          👤 GESTÃO DE USUÁRIOS
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--admin-muted)' }}>
          Clientes ativos, planos, conteúdo gerado e equipe administrativa.
        </p>
      </div>

      {/* Top: Clients table */}
      <div style={{ marginBottom: '16px' }}>
        <UsersTable />
      </div>

      {/* Bottom: Team invite panel */}
      <div>
        <TeamInvitePanel />
      </div>
    </div>
  );
};

export default UsersMapPanel;
