

interface PartnerDailyLogTabProps {
  projects: any[];
  logs: any[];
  logForm: any;
  setLogForm: (form: any) => void;
  submitLog: () => void;
  isSavingLog: boolean;
  getProjectName: (id: string) => string;
  deleteLog: (id: string) => void;
  logPhotos?: any[];
  handleFileUpload?: (files: FileList | null, stageId?: string | null, logId?: string | null, projectId?: string | null) => void;
  deleteFile?: (f: any) => void;
  isUploading?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  showToast?: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerDailyLogTab({
  projects, logs, logForm, setLogForm, submitLog, isSavingLog, getProjectName, deleteLog,
  logPhotos = [], handleFileUpload, deleteFile, isUploading = false,
  canCreate = true, canDelete = true, showToast
}: PartnerDailyLogTabProps) {
  return (
    <div className="page active">
      <div className="u-mb-16">
        <div className="u-mono-label-xs">Registro diário de atividades</div>
        <div className="u-syne-title u-mt-3">Log Diário de Atividades</div>
      </div>

      {/* Form */}
      <div className="card u-mb-14">
        <div className="ch"><span className="ct">📝 Registrar hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        <div className="cb">
          <div style={{marginBottom:12}}>
            <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Projeto *</label>
            <select className="f-inp" value={logForm.project_id} onChange={e => setLogForm({...logForm, project_id: e.target.value})}>
              <option value="" disabled>-- Selecione --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
            </select>
          </div>
          {logForm.project_id && (
            <>
              <div style={{marginBottom:12}}>
                <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>O que foi feito hoje? *</label>
                <textarea className="f-inp" style={{resize:'vertical',minHeight:100}} placeholder="Descreva as atividades realizadas hoje na obra..." value={logForm.log_text} onChange={e => setLogForm({...logForm, log_text: e.target.value})}></textarea>
              </div>
              <div className="u-mb-14">
                <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Materiais utilizados</label>
                <input className="f-inp" type="text" placeholder="Ex: 40 azulejos 60x60, argamassa, rejunte..." value={logForm.materials} onChange={e => setLogForm({...logForm, materials: e.target.value})} />
              </div>
              <button className="btn gold" onClick={() => { if (canCreate) submitLog(); else showToast?.('Acesso Negado', 'Permissão negada para postar atualização.', 'error'); }} disabled={isSavingLog} style={{opacity: isSavingLog ? 0.6 : 1}}>
                {isSavingLog ? '⏳ Salvando...' : '💾 Salvar log do dia'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* History */}
      {logForm.project_id && (() => {
        const filteredLogs = logs.filter((l: any) => l.project_id === logForm.project_id);
        return (
          <div className="card">
            <div className="ch"><span className="ct">📚 Histórico de Logs</span><span className="ca">{filteredLogs.length} registro(s)</span></div>
            <div className="cb" style={{padding: filteredLogs.length === 0 ? undefined : 0}}>
              {filteredLogs.length === 0 && <div style={{padding:'20px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhum log submetido para este projeto ainda. Registre suas atividades diárias acima.</div>}
              {filteredLogs.map((log: any) => (
                <div key={log.id} style={{padding:'14px 16px',borderBottom:'1px solid var(--b)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',flexShrink:0}}></div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--gold)'}}>
                    {new Date(log.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' • '}
                    {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {log.project_id && <span style={{fontSize:'0.65rem',background:'var(--gd)',color:'var(--gold)',borderRadius:4,padding:'2px 8px',fontWeight:600}}>{getProjectName(log.project_id)}</span>}
                </div>
                <button className="btn ghost" style={{fontSize:'0.65rem',padding:'3px 8px',color:'var(--red)'}} onClick={() => { if (canDelete) deleteLog(log.id); else showToast?.('Acesso Negado', 'Sem permissão para excluir registro.', 'error'); }}>🗑</button>
              </div>
              <div style={{fontSize:'0.85rem',color:'var(--text)',lineHeight:1.6,whiteSpace:'pre-wrap',paddingLeft:16}}>{log.log_text}</div>
              
              {/* Stage-specific Photos Mini-Gallery */}
              {(() => {
                 const currentLogPhotos = logPhotos?.filter((p: any) => p.log_id === log.id && (p.file_type?.startsWith('image/') || !p.file_type || p.file_name?.match(/\.(jpg|jpeg|png|gif|heic|webp)$/i))) || [];
                 return (
                   <div style={{paddingLeft:16, marginTop:8}}>
                      {currentLogPhotos.length > 0 && (
                        <div style={{display:'flex',gap:12,overflowX:'auto',padding:'6px 4px 6px 4px'}}>
                          {currentLogPhotos.map((photo: any) => (
                            <div key={photo.id} style={{width:60,height:60,borderRadius:6,backgroundImage:`url(${photo.file_url})`,backgroundSize:'cover',backgroundPosition:'center',flexShrink:0,position:'relative'}}>
                               <button style={{position:'absolute',top:-6,right:-6,background:'var(--bg2)',border:'1px solid var(--red)',color:'var(--red)',width:20,height:20,borderRadius:'50%',fontSize:'0.65rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={(e) => { e.stopPropagation(); if (canDelete) deleteFile?.(photo); else showToast?.('Acesso Negado', 'Acesso Negado', 'error'); }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{marginTop: currentLogPhotos.length > 0 ? 4 : 4}}>
                        <input type="file" multiple accept="image/*" id={`file_log_${log.id}`} className="u-hide" onChange={e => { if(e.target.files) handleFileUpload?.(e.target.files, null, log.id, log.project_id); }} />
                        <button className="btn ghost" style={{fontSize:'0.7rem',padding:'4px 12px',opacity: isUploading ? 0.5 : 1}} disabled={isUploading} onClick={() => { if (canCreate) document.getElementById(`file_log_${log.id}`)?.click(); else showToast?.('Acesso Negado', 'Permissão Negada.', 'error'); }}>
                           {isUploading ? '⌛ Enviando fotos...' : '📷 Anexar fotos nesta vistoria'}
                        </button>
                      </div>
                   </div>
                 );
              })()}

            </div>
          ))}
        </div>
      </div>
      );
      })()}
    </div>
  );
}
