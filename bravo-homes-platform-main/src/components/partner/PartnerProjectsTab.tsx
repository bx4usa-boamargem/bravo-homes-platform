import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { usePartnerProjects } from '../../hooks/usePartnerQueries';

interface PartnerProjectsTabProps {
  handleCreateProject: () => void;
  setSelectedProject: (proj: any) => void;
  setActiveTab: (tab: string) => void;
  leads?: any[];
  canCreate?: boolean;
  canDelete?: boolean;
  showToast?: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerProjectsTab({
  handleCreateProject, setSelectedProject, setActiveTab, leads = [], canCreate = true, canDelete = true, showToast
}: PartnerProjectsTabProps) {
  const { data: projects = [], isLoading } = usePartnerProjects();
  const queryClient = useQueryClient();
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  const handleDeleteProject = (e: any, p: any) => {
    e.stopPropagation();
    setProjectToDelete(p);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
    if (error) {
      alert("Erro ao excluir o projeto: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['partner-projects'] });
      setProjectToDelete(null);
    }
  };

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
        <button className="btn gold" onClick={() => { if (canCreate) handleCreateProject(); else showToast?.('Acesso Negado', 'Você não tem permissão para criar projetos.', 'error'); }}>Novo Projeto</button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`status-badge ${p.status === 'active' ? 'active' : 'pending'}`}>{p.status || 'Ativo'}</span>
                <button 
                  onClick={(e) => { if (canDelete) handleDeleteProject(e, p); else { e.stopPropagation(); showToast?.('Acesso Negado', 'Permissão negada.', 'error'); } }}
                  title="Excluir Projeto"
                  style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>
                  🗑️
                </button>
            </div>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div>
          <div className="prog-info"><span>Progresso</span><span style={{color:'var(--gold)'}}>{p.progress || 0}%</span></div>
          <div className="proj-meta"><span>📅 Início: {p.start_date ? new Date(p.start_date + 'T12:00:00').toLocaleDateString() : (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/D')}</span><span>🏁 Entrega: {p.deadline ? new Date(p.deadline + 'T12:00:00').toLocaleDateString() : 'N/D'}</span><span style={{color:'var(--green)'}}>💰 ${p.contract_value ? Number(p.contract_value).toLocaleString() : '0'}</span></div>
        </div>
      ))}

      {projectToDelete && (
        <div className="modal-overlay open" onClick={() => setProjectToDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 20px' }}>
             <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
             <div className="modal-title" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Excluir Projeto?</div>
             <div style={{ color: 'var(--t2)', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
               Você está prestes a apagar definitivamente o projeto <strong style={{color: '#fff'}}>"{projectToDelete.name}"</strong>.<br/><br/>Esta ação é irreversível e apagará todas as etapas e fotos vinculadas a este projeto no banco de dados.
             </div>
             <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
               <button className="btn btn-ghost" style={{ flex: 1, padding: '12px' }} onClick={() => setProjectToDelete(null)}>Cancelar</button>
               <button className="btn" style={{ flex: 1, padding: '12px', background: '#ff4d4f', color: '#fff' }} onClick={confirmDelete}>Excluir</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
