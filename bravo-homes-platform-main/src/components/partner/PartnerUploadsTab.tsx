import React from 'react';

interface PartnerUploadsTabProps {
  projects: any[];
  projectStages?: any[];
  uploadProjectId: string;
  setUploadProjectId: (id: string) => void;
  projectFiles: any[];
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (files: FileList | null, targetStageId?: string | null) => void;
  deleteFile: (f: any) => void;
  getFileIcon: (type: string) => string;
  t: (key: string) => string;
  canUpload?: boolean;
  canDelete?: boolean;
  showToast?: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerUploadsTab({
  projects, projectStages = [], uploadProjectId, setUploadProjectId, projectFiles,
  isUploading, fileInputRef, handleFileUpload, deleteFile, getFileIcon, t,
  canUpload = true, canDelete = true, showToast
}: PartnerUploadsTabProps) {
  const [expandedStages, setExpandedStages] = React.useState<Set<string>>(new Set());
  const [showGeneral, setShowGeneral] = React.useState(false);
  const [showStagePicker, setShowStagePicker] = React.useState(false);
  const [selectedStageId, setSelectedStageId] = React.useState<string | null>(null);

  const toggleStage = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeStages = projectStages.filter(s => s.project_id === uploadProjectId).sort((a,b) => a.order_index - b.order_index);
  const generalFiles = projectFiles.filter(f => !f.stage_id);

  const openStagePicker = () => {
    setShowStagePicker(true);
  };

  const handleStageSelect = (stageId: string | null) => {
    setSelectedStageId(stageId);
    setShowStagePicker(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await handleFileUpload(files, selectedStageId);
    setSelectedStageId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelStagePicker = () => {
    setShowStagePicker(false);
    setSelectedStageId(null);
  };
  
  return (
    <div className="page active">
      <div className="u-section-header">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>{t('photosDocuments')}</div>
      </div>

      <div className="u-mb-14">
        <div className="ch"><span className="ct">{t('selectProject')}</span></div>
        <div className="cb">
          <select
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--b)',borderRadius:6,padding:'10px 12px',color:'var(--text)',fontFamily:"'DM Sans',sans-serif",fontSize:'0.85rem',outline:'none'}}
            value={uploadProjectId}
            onChange={e => setUploadProjectId(e.target.value)}
          >
            <option value="" disabled>{t('selectProfile')}</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
          </select>
        </div>
      </div>

      {/* STAGE PICKER POPUP */}
      {showStagePicker && (
        <div className="stage-picker-overlay" onClick={cancelStagePicker}>
          <div className="stage-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="stage-picker-header">
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem'}}>{t('selectStage')}</span>
              <button className="stage-picker-close" onClick={cancelStagePicker}>✕</button>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.75rem',color:'var(--t3)',textAlign:'center',padding:'20px 0'}}>
              {t('noPhotosDocsStage')}
            </div>
            <div className="stage-picker-list">
              <button className="stage-picker-option general" onClick={() => handleStageSelect(null)}>
                <span className="stage-picker-icon">📁</span>
                <div className="stage-picker-info">
                  <div className="stage-picker-name">{t('generalFiles')}</div>
                  <div className="stage-picker-desc">{t('noLinkedStage')}</div>
                </div>
              </button>
              {activeStages.map((stg, idx) => (
                <button key={stg.id} className="stage-picker-option" onClick={() => handleStageSelect(stg.id)}>
                  <span className="stage-picker-icon">🏗️</span>
                  <div className="stage-picker-info">
                    <div className="stage-picker-name">{t('stagePrefix')} {idx + 1}: {stg.name}</div>
                    <div className="stage-picker-desc">
                      {stg.status === 'completed' ? t('completedStage') : stg.status === 'in_progress' ? t('inProgressStage') : t('pendingStage')}
                    </div>
                  </div>
                  <span className="stage-picker-arrow">→</span>
                </button>
              ))}
            </div>
            <div style={{padding:'12px 20px 16px',display:'flex',justifyContent:'flex-end'}}>
              <button className="btn ghost" onClick={cancelStagePicker} style={{fontSize:'0.78rem'}}>{t('cancelBtn')}</button>
            </div>
          </div>
        </div>
      )}

      {uploadProjectId && (
        <>
          <div className="card u-mb-14">
            <div className="ch"><span className="ct">{t('sendPhotosDocs')}</span></div>
            <div className="cb">
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="u-hide" onChange={e => onFilesSelected(e.target.files)} />
              <div
                className="upload-zone"
                onClick={() => { if (canUpload) openStagePicker(); else showToast?.('Acesso Negado', 'Sem permissão para upload de arquivos.', 'error'); }}
                onDragOver={e => { e.preventDefault(); if (canUpload) e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; if(canUpload) { openStagePicker(); } else { showToast?.('Acesso Negado', 'Sem permissão para upload de arquivos.', 'error'); } }}
                style={{cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.6 : 1}}
              >
                <div className="upload-icon">{isUploading ? '⏳' : '📸'}</div>
                <div className="upload-text">{isUploading ? t('sendingFiles') : t('clickDragPhotos')}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',marginTop:6}}>{t('popupWillAppear')}</div>
              </div>
            </div>
          </div>

          {/* STAGE-SPECIFIC GALLERIES */}
          {activeStages.map((stg, idx) => {
            const stgFiles = projectFiles.filter(f => f.stage_id === stg.id);
            if (stgFiles.length === 0) return null;
            const imgs = stgFiles.filter(f => f.file_type?.startsWith('image/'));
            const docs = stgFiles.filter(f => !f.file_type?.startsWith('image/'));
            return (
              <div key={stg.id} className="card u-mb-14" style={{borderLeft: '4px solid var(--gold)'}}>
                <div className="ch" style={{cursor:'pointer', userSelect:'none'}} onClick={() => toggleStage(stg.id)}>
                  <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    <span style={{fontSize:'1rem', fontWeight:700, opacity:0.7, width:18, textAlign:'center', transition:'all 0.2s'}}>{expandedStages.has(stg.id) ? '−' : '+'}</span>
                    <span className="ct">{t('stagePrefix')} {idx + 1}: {stg.name}</span>
                  </div>
                  <span className="ca">{stgFiles.length} {t('attachedFiles')}</span>
                </div>
                {expandedStages.has(stg.id) && (
                  <div className="cb">
                    {imgs.length > 0 && (
                      <div className="photo-grid u-mb-14">
                        {imgs.map((f: any) => (
                          <div key={f.id} className="photo-thumb" style={{backgroundImage: `url(${f.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'}}>
                            <div style={{position:'absolute',top:4,right:4,display:'flex',gap:4}}>
                              <a href={f.file_url} target="_blank" rel="noreferrer" style={{background:'rgba(0,0,0,0.6)',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',textDecoration:'none'}} onClick={e => e.stopPropagation()}>🔍</a>
                              <button style={{background:'rgba(200,0,0,0.7)',border:'none',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',cursor:'pointer'}} onClick={e => { e.stopPropagation(); if (canDelete) deleteFile(f); else showToast?.('Acesso Negado', 'Permissão negada para excluir arquivos.', 'error'); }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {docs.length > 0 && docs.map((f: any) => (
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderTop: '1px solid var(--b)'}}>
                        <span style={{fontSize:'1.2rem'}}>{getFileIcon(f.file_type)}</span>
                        <div className="u-flex-1">
                          <div style={{fontSize:'0.82rem',fontWeight:600}}>{f.file_name}</div>
                        </div>
                        <a href={f.file_url} target="_blank" rel="noreferrer" className="btn ghost" style={{fontSize:'0.65rem',padding:'4px 8px',textDecoration:'none'}}>{t('viewBtn')}</a>
                        <button className="btn ghost" style={{fontSize:'0.65rem',padding:'4px 8px',color:'var(--red)'}} onClick={() => { if (canDelete) deleteFile(f); else showToast?.('Acesso Negado', 'Permissão negada para excluir.', 'error'); }}>🗑</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* GENERAL FILES GALLERY */}
          {generalFiles.length > 0 && (
            <div className="card u-mb-14">
              <div className="ch" style={{cursor:'pointer', userSelect:'none'}} onClick={() => setShowGeneral(!showGeneral)}>
                <div style={{display:'flex', alignItems:'center', gap: 8}}>
                  <span style={{fontSize:'1rem', fontWeight:700, opacity:0.7, width:18, textAlign:'center', transition:'all 0.2s'}}>{showGeneral ? '−' : '+'}</span>
                  <span className="ct">{t('generalFiles')}</span>
                </div>
                <span className="ca">{generalFiles.length} {t('files')}</span>
              </div>
              {showGeneral && (
                <div className="cb">
                  {generalFiles.filter(f => f.file_type?.startsWith('image/')).length > 0 && (
                    <div className="photo-grid u-mb-14">
                      {generalFiles.filter(f => f.file_type?.startsWith('image/')).map((f: any) => (
                        <div key={f.id} className="photo-thumb" style={{backgroundImage: `url(${f.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'}}>
                          <div style={{position:'absolute',top:4,right:4,display:'flex',gap:4}}>
                            <a href={f.file_url} target="_blank" rel="noreferrer" style={{background:'rgba(0,0,0,0.6)',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',textDecoration:'none'}} onClick={e => e.stopPropagation()}>🔍</a>
                            <button style={{background:'rgba(200,0,0,0.7)',border:'none',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',cursor:'pointer'}} onClick={e => { e.stopPropagation(); if (canDelete) deleteFile(f); else showToast?.('Acesso Negado', 'Permissão negada.', 'error'); }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {generalFiles.filter(f => !f.file_type?.startsWith('image/')).map((f: any) => (
                    <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderTop: '1px solid var(--b)'}}>
                      <span style={{fontSize:'1.2rem'}}>{getFileIcon(f.file_type)}</span>
                      <div className="u-flex-1">
                        <div style={{fontSize:'0.82rem',fontWeight:600}}>{f.file_name}</div>
                      </div>
                      <a href={f.file_url} target="_blank" rel="noreferrer" className="btn ghost" style={{fontSize:'0.65rem',padding:'4px 8px',textDecoration:'none'}}>{t('viewBtn')}</a>
                      <button className="btn ghost" style={{fontSize:'0.65rem',padding:'4px 8px',color:'var(--red)'}} onClick={() => { if (canDelete) deleteFile(f); else showToast?.('Acesso Negado', 'Permissão negada.', 'error'); }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!uploadProjectId && (
        <div className="card">
          <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
            <div className="u-emoji-icon">📁</div>
            <div style={{fontSize:'0.9rem'}}>{t('selectProjectToManageFiles')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
