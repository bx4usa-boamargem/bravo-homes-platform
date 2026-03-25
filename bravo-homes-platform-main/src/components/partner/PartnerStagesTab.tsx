

interface PartnerStagesTabProps {
  projects: any[];
  selectedProject: any;
  setSelectedProject: (p: any) => void;
  projectStages: any[];
  newStageName: string;
  setNewStageName: (v: string) => void;
  addStage: () => void;
  toggleStage: (id: string, status: string) => void;
  deleteStage: (id: string) => void;
  showToast: (title: string, msg: string, type: string) => void;
  setUploadProjectId: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function PartnerStagesTab({
  projects, selectedProject, setSelectedProject, projectStages,
  newStageName, setNewStageName, addStage, toggleStage, deleteStage,
  showToast, setUploadProjectId, setActiveTab,
}: PartnerStagesTabProps) {
  return (
    <div className="page active">
      <div className="u-mb-16">
        <div className="u-mono-label-xs">Gerenciamento de Etapas</div>
        <div className="u-syne-title u-mt-3">Etapas de Execução</div>
      </div>

      <div className="u-mb-14">
        <div className="ch"><span className="ct">Selecionar Projeto</span></div>
        <div className="cb">
          <select
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--b)',borderRadius:6,padding:'10px 12px',color:'var(--text)',fontFamily:"'DM Sans',sans-serif",fontSize:'0.85rem',outline:'none'}}
            value={selectedProject?.id || ''}
            onChange={e => {
              const proj = projects.find(p => p.id === e.target.value);
              setSelectedProject(proj || null);
            }}
          >
            <option value="" disabled>-- Selecione --</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
          </select>
        </div>
      </div>

      {selectedProject && (
        <>
          <div className="card u-mb-14">
            <div className="ch"><span className="ct">📊 Progresso: {selectedProject.name}</span><span className="ca" style={{color:'var(--gold)'}}>{selectedProject.progress || 0}%</span></div>
            <div className="cb">
              <div className="prog-bar" style={{height:12,borderRadius:6,marginBottom:12}}><div className="prog-fill" style={{width:`${selectedProject.progress || 0}%`,borderRadius:6,transition:'width 0.3s'}}></div></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'var(--t3)'}}>
                <span>{projectStages.filter(s => s.status === 'completed').length} de {projectStages.length} etapas concluídas</span>
                <span>📅 Prazo: {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'Não definido'}</span>
              </div>
            </div>
          </div>

          <div className="card u-mb-14">
            <div className="ch"><span className="ct">➕ Adicionar Nova Etapa</span></div>
            <div className="cb">
              <div style={{display:'flex',gap:10}}>
                <input
                  type="text"
                  className="f-inp u-flex-1"
                  placeholder="Ex: Fundação, Alvenaria, Acabamento..."
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addStage()}
                />
                <button className="btn gold" onClick={addStage} style={{whiteSpace:'nowrap'}}>+ Adicionar</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><span className="ct">📋 Etapas do Projeto</span><span className="ca">{projectStages.length} etapas</span></div>
            <div className="cb" style={{padding:0}}>
              {projectStages.length === 0 && <div style={{padding:'25px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhuma etapa criada ainda. Adicione a primeira etapa acima!</div>}
              {projectStages.sort((a: any, b: any) => a.order_index - b.order_index).map((stg: any, idx: number) => (
                <div key={stg.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--b)',transition:'background 0.15s',cursor:'pointer'}} onClick={() => toggleStage(stg.id, stg.status)}>
                  <div style={{width:24,height:24,borderRadius:6,border: stg.status === 'completed' ? '2px solid var(--green)' : '2px solid var(--b)',background: stg.status === 'completed' ? 'var(--green)' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'#fff',flexShrink:0,transition:'all 0.2s'}}>{stg.status === 'completed' && '✓'}</div>
                  <div className="u-flex-1">
                    <div style={{fontWeight:600,fontSize:'0.88rem',textDecoration: stg.status === 'completed' ? 'line-through' : 'none',color: stg.status === 'completed' ? 'var(--t3)' : 'var(--text)',transition:'all 0.2s'}}>{idx + 1}. {stg.name}</div>
                    <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{stg.status === 'completed' ? 'Concluída ✓' : stg.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</div>
                  </div>
                  <button className="btn ghost" style={{fontSize:'0.7rem',padding:'4px 10px',color:'var(--red)'}} onClick={(e) => { e.stopPropagation(); deleteStage(stg.id); }}>🗑</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginTop:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn gold" onClick={() => showToast('Salvo', 'Progresso sincronizado com Bravo Homes!', 'success')}>💾 Salvar progresso</button>
            <button className="btn ghost" onClick={() => { if (selectedProject) setUploadProjectId(selectedProject.id); setActiveTab('uploads'); }}>📷 Enviar fotos desta etapa</button>
          </div>
        </>
      )}

      {!selectedProject && (
        <div className="card">
          <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
            <div className="u-emoji-icon">📋</div>
            <div style={{fontSize:'0.9rem',marginBottom:6}}>Selecione um projeto acima para gerenciar suas etapas</div>
            <div style={{fontSize:'0.75rem'}}>Ou clique em um projeto na aba <strong style={{color:'var(--gold)',cursor:'pointer'}} onClick={() => setActiveTab('projects')}>Projetos Ativos</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
