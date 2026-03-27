import { useState } from 'react';
import { usePartnerProjects } from '../../hooks/usePartnerQueries';

interface PartnerProjectsTabProps {
  handleCreateProject: () => void;
  setSelectedProject: (proj: any) => void;
  setActiveTab: (tab: string) => void;
  leads?: any[];
}

export default function PartnerProjectsTab({
  handleCreateProject, setSelectedProject, setActiveTab, leads = []
}: PartnerProjectsTabProps) {
  const { data: projects = [], isLoading } = usePartnerProjects();

  const [filterClient, setFilterClient] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const filteredProjects = projects.filter((p: any) => {
    if (filterService && p.service_type !== filterService) return false;
    if (filterClient) {
      const selectedLead = leads.find((l: any) => l.name === filterClient);
      const matchByName = p.name?.toLowerCase().includes(filterClient.toLowerCase());
      const matchByLeadId = selectedLead && p.lead_id === selectedLead.id;
      const matchByClientId = selectedLead && p.client_id === selectedLead.id;
      
      if (!matchByName && !matchByLeadId && !matchByClientId) return false;
    }
    if (filterCity) {
      // Find a lead whose ID matches or name is contained in the project's name
      const relatedLead = leads.find((l: any) => p.lead_id === l.id || p.client_id === l.id || (l.name && p.name?.includes(l.name)));
      if (!relatedLead || !relatedLead.city?.toLowerCase().includes(filterCity.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="page active">
      <div className="u-section-header">
        <div><div className="u-mono-label-xs">{projects.length} projetos em andamento</div><div className="u-syne-title u-mt-3">Meus Projetos Ativos</div></div>
        <button className="btn gold" onClick={handleCreateProject}>Novo Projeto</button>
      </div>
      
      {projects.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px', background: 'var(--bg2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div>
            <label className="f-label" style={{ fontSize: '0.75rem', marginBottom: '5px' }}>Filtrar por Cliente</label>
            <select className="f-inp" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ padding: '8px' }}>
              <option value="">Todos os Clientes</option>
              {Array.from(new Set(leads.map((l: any) => l.name))).filter(Boolean).sort().map((clientName: any, idx: number) => (
                <option key={idx} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="f-label" style={{ fontSize: '0.75rem', marginBottom: '5px' }}>Filtrar por Serviço</label>
            <select className="f-inp" value={filterService} onChange={e => setFilterService(e.target.value)} style={{ padding: '8px' }}>
              <option value="">Todos os Serviços</option>
              <option value="Reforma Completa">Reforma Completa</option>
              <option value="Bathroom Remodel">Bathroom Remodel</option>
              <option value="Kitchen Remodel">Kitchen Remodel</option>
              <option value="Pintura e Acabamento">Pintura e Acabamento</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="f-label" style={{ fontSize: '0.75rem', marginBottom: '5px' }}>Filtrar por Cidade</label>
            <input type="text" className="f-inp" placeholder="Buscar cidade..." value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ padding: '8px' }} />
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <div className="empty-state" style={{padding: '20px', textAlign: 'center'}}>Nenhum projeto encontrado.</div>
      )}
      
      {filteredProjects.map((p: any) => (
        <div className="proj-card" key={p.id} onClick={() => { setSelectedProject(p); setActiveTab('stages'); }}>
          <div className="proj-header">
            <div><div className="proj-name">{p.name || 'Projeto sem nome'}</div><div className="proj-service">{p.service_type || 'Serviço'}</div></div>
            <span className={`status-badge ${p.status === 'active' ? 'active' : 'pending'}`}>{p.status || 'Ativo'}</span>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div>
          <div className="prog-info"><span>Progresso</span><span style={{color:'var(--gold)'}}>{p.progress || 0}%</span></div>
          <div className="proj-meta"><span>📅 Início: {p.start_date ? new Date(p.start_date + 'T12:00:00').toLocaleDateString() : (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/D')}</span><span>🏁 Entrega: {p.deadline ? new Date(p.deadline + 'T12:00:00').toLocaleDateString() : 'N/D'}</span><span style={{color:'var(--green)'}}>💰 ${p.contract_value ? Number(p.contract_value).toLocaleString() : '0'}</span></div>
        </div>
      ))}
    </div>
  );
}
