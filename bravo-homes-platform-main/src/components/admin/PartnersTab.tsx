import React from 'react';

interface PartnersTabProps {
  partners: any[];
  projects: any[];
  loadingDb: boolean;
  setIsPartnerOpen: (v: boolean) => void;
  setSelectedPartner: (p: any) => void;
}

export default function PartnersTab({
  partners, projects, loadingDb, setIsPartnerOpen, setSelectedPartner,
}: PartnersTabProps) {
  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">Parceiros e Contratados</div>
        <button className="btn ghost" onClick={() => setIsPartnerOpen(true)}>Adicionar Parceiro</button>
      </div>
      <div className="card">
        <div className="u-p-0">
          <table className="tbl">
            <thead><tr><th>Nome / Cidade</th><th>Especialidade</th><th>Projetos</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {partners.length === 0 && !loadingDb && (
                <tr><td colSpan={5} className="u-empty-state">Nenhum parceiro encontrado.</td></tr>
              )}
              {partners.map((p: any) => (
                <tr key={p.id}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div className="av" style={{background:'var(--bg3)', border:'1px solid var(--b)', width:'32px', height:'32px'}}>{(p.name || p.full_name || 'N/A').substring(0,2).toUpperCase()}</div>
                      <div>
                        <b>{p.name || p.full_name || 'Sem nome'}</b>
                        <div className="u-mono-tiny">{p.city || 'Georgia'} • {p.phone || 'Sem contato'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.specialty || 'Empreiteiro Geral'}</td>
                  <td>{(projects.filter(proj => proj.partner_id === p.id).length) || 0}</td>
                  <td>{
                    (() => {
                      const st = p.state || 'available';
                      const map: Record<string,{label:string,cls:string}> = { available: {label:'Disponível',cls:'sb-active'}, busy: {label:'Em Projeto',cls:'sb-draft'}, inactive: {label:'Inativo',cls:'sb-red'} };
                      const s = map[st] || map.available;
                      return <span className={`status-b ${s.cls}`}>{s.label}</span>;
                    })()
                  }</td>
                  <td>
                    <div className="u-flex-gap-8">
                      <button className="u-btn-pill" onClick={() => setSelectedPartner(p)}>Ver Perfil</button>
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
