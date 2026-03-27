import React from 'react';

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
  showToast: (title: string, msg: string, type: 'error' | 'success') => void;
  setUploadProjectId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  projectFiles?: any[];
  handleFileUpload?: (files: FileList | null, stageId?: string) => void;
  deleteFile?: (f: any) => void;
  isUploading?: boolean;
  canCreate?: boolean;
  canDone?: boolean;
  canDelete?: boolean;
  canUpload?: boolean;
}

export default function PartnerStagesTab({
  projects, selectedProject, setSelectedProject, projectStages,
  newStageName, setNewStageName, addStage, toggleStage, deleteStage,
  showToast, setUploadProjectId, setActiveTab,
  projectFiles = [], handleFileUpload, deleteFile, isUploading = false,
  canCreate = true, canDone = true, canDelete = true, canUpload = true
}: PartnerStagesTabProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="page active">
      <div className="u-mb-16" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div className="u-mono-label-xs">Gerenciamento de Etapas</div>
          <div className="u-syne-title u-mt-3">Etapas de Execução</div>
        </div>
        <button className="btn ghost" onClick={() => setActiveTab('projects')} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px'}}>
          <span>⬅</span> Voltar para Projetos
        </button>
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
                <span>📅 Prazo: {selectedProject.deadline ? new Date(selectedProject.deadline + 'T12:00:00').toLocaleDateString() : 'Não definido'}</span>
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
                <button className="btn gold" onClick={() => { if (canCreate) addStage(); else showToast?.('Acesso Negado', 'Permissão negada para criar etapa.', 'error'); }} style={{whiteSpace:'nowrap'}}>+ Adicionar</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><span className="ct">📋 Etapas do Projeto</span><span className="ca">{projectStages.length} etapas</span></div>
            <div className="cb" style={{padding:0}}>
              {projectStages.length === 0 && <div style={{padding:'25px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhuma etapa criada ainda. Adicione a primeira etapa acima!</div>}
              {projectStages.sort((a: any, b: any) => a.order_index - b.order_index).map((stg: any, idx: number) => {
                const stagePhotos = projectFiles.filter(f => f.stage_id === stg.id && f.file_type?.startsWith('image/'));
                return (
                <div key={stg.id} style={{borderBottom:'1px solid var(--b)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',transition:'background 0.15s',cursor:'pointer'}} onClick={() => toggleAccordion(stg.id)}>
                    <div style={{width:24,height:24,borderRadius:6,border: stg.status === 'completed' ? '2px solid var(--green)' : '2px solid var(--b)',background: stg.status === 'completed' ? 'var(--green)' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'#fff',flexShrink:0,transition:'all 0.2s', cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); if (canDone) toggleStage(stg.id, stg.status); else showToast?.('Acesso Negado', 'Sem permissão para alterar status.', 'error'); }}>{stg.status === 'completed' && '✓'}</div>
                    <div className="u-flex-1" style={{display:'flex', alignItems:'center', gap: 8}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:'0.88rem',textDecoration: stg.status === 'completed' ? 'line-through' : 'none',color: stg.status === 'completed' ? 'var(--t3)' : 'var(--text)',transition:'all 0.2s'}}>{idx + 1}. {stg.name}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{stg.status === 'completed' ? 'Concluída ✓' : stg.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</div>
                      </div>
                      <span style={{fontSize:'1.1rem', opacity:0.6, display:'inline-block', width: '16px', textAlign: 'center'}}>{expandedSections.has(stg.id) ? '−' : '+'}</span>
                    </div>
                    <button className="btn ghost" style={{fontSize:'0.7rem',padding:'4px 10px',color:'var(--red)'}} onClick={(e) => { e.stopPropagation(); if (canDelete) deleteStage(stg.id); else showToast?.('Acesso Negado', 'Sem permissão para excluir.', 'error'); }}>🗑</button>
                  </div>
                  {/* Stage-specific Photos Mini-Gallery */}
                  {expandedSections.has(stg.id) && (
                    <div style={{padding:'0 16px 16px 48px',display:'flex',flexDirection:'column',gap:10}}>
                      {stagePhotos.length > 0 && (
                        <div style={{display:'flex',gap:12,overflowX:'auto',padding:'6px 4px 6px 4px'}}>
                          {stagePhotos.map(photo => (
                            <div key={photo.id} style={{width:60,height:60,borderRadius:6,backgroundImage:`url(${photo.file_url})`,backgroundSize:'cover',backgroundPosition:'center',flexShrink:0,position:'relative'}}>
                               <button style={{position:'absolute',top:-6,right:-6,background:'var(--bg2)',border:'1px solid var(--red)',color:'var(--red)',width:20,height:20,borderRadius:'50%',fontSize:'0.65rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={(e) => { e.stopPropagation(); if (canUpload) deleteFile?.(photo); else showToast?.('Acesso Negado', 'Sem permissão para remover foto.', 'error'); }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <input type="file" multiple accept="image/*" id={`file_stage_${stg.id}`} className="u-hide" onChange={e => { if(e.target.files) handleFileUpload?.(e.target.files, stg.id); }} />
                        <button className="btn ghost" style={{fontSize:'0.7rem',padding:'4px 12px',opacity: isUploading ? 0.5 : 1}} disabled={isUploading} onClick={() => { if (canUpload) document.getElementById(`file_stage_${stg.id}`)?.click(); else showToast?.('Acesso Negado', 'Usuário sem permissão de anexo/upload.', 'error'); }}>
                           {isUploading ? '⌛ Enviando fotos...' : '📷 Anexar fotos nesta etapa'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>

          <div style={{marginTop:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn gold" onClick={() => showToast('Salvo', 'Progresso sincronizado com Bravo Homes!', 'success')}>💾 Salvar progresso de conclusão</button>
            <button className="btn ghost" onClick={() => { if (selectedProject) setUploadProjectId(selectedProject.id); setActiveTab('uploads'); }}>Ir para Galeria Geral Completa ➡️</button>
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
