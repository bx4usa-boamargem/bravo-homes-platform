import React from 'react';

interface ClientsTabProps {
  clients: any[];
  loadingDb: boolean;
  setIsNewLeadOpen: (v: boolean) => void;
  showToast: (msg: string) => void;
  handleDeleteClient: (id: string) => void;
}

export default function ClientsTab({
  clients, loadingDb, setIsNewLeadOpen, showToast, handleDeleteClient,
}: ClientsTabProps) {
  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">Clientes da Bravo Homes</div>
        <button className="btn gold" onClick={() => setIsNewLeadOpen(true)}>+ Novo Cliente</button>
      </div>
      <div className="card">
        <div className="u-p-0">
          <table className="tbl">
            <thead><tr>
              <th style={{width: '20%'}}>Nome do Cliente</th>
              <th style={{width: '20%'}}>Email</th>
              <th style={{width: '15%'}}>Telefone</th>
              <th style={{width: '20%'}}>Endereço / Cidade</th>
              <th style={{width: '10%'}}>Criado</th>
              <th style={{width: '15%', textAlign: 'center'}}>Ações</th>
            </tr></thead>
            <tbody>
              {clients.length === 0 && !loadingDb && <tr><td colSpan={6} className="u-empty-state">Nenhum cliente cadastrado.</td></tr>}
              {clients.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.email}</td>
                  <td style={{color: 'var(--t2)', fontSize: '0.85rem'}}>{c.phone || '-'}</td>
                  <td>{c.address}<div className="u-mono-tiny">{c.city}, {c.state}</div></td>
                  <td><div style={{fontSize:'0.7rem',color:'var(--t3)'}}>{new Date(c.created_at).toLocaleDateString('pt-BR')} - {new Date(c.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div></td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{display:'flex', alignItems: 'center', justifyContent: 'center', gap:'16px'}}>
                      <button className="u-btn-pill" onClick={() => showToast('O Perfil Completo e Histórico de CRM do cliente estará disponível nas próximas atualizações.')}>Ver Histórico</button>
                      <button className="btn ghost" style={{padding:'3px 6px',fontSize:'.65rem', color: 'var(--red)', borderColor: 'rgba(231,76,60,0.3)', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1}} onClick={() => handleDeleteClient(c.id)} title="Excluir Cliente">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
