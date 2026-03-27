import React from 'react';

interface PartnerLeadsTabProps {
  leads: any[];
  loadingDb: boolean;
  expandedLead: string | null;
  setExpandedLead: (id: string | null) => void;
  getUrgencyColor: (u: string) => string;
  leadStatuses: string[];
  updateLeadStatus: (id: string, status: string) => void;
  leadNotes: Record<string, string>;
  setLeadNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveLeadNotes: (id: string) => void;
  deleteLead: (id: string) => void;
  canMove?: boolean;
  canEditNotes?: boolean;
  canDelete?: boolean;
  showToast?: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerLeadsTab({
  leads, loadingDb, expandedLead, setExpandedLead,
  getUrgencyColor, leadStatuses, updateLeadStatus,
  leadNotes, setLeadNotes, saveLeadNotes, deleteLead, 
  canMove = true, canEditNotes = true, canDelete = true, showToast
}: PartnerLeadsTabProps) {

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!canMove) {
      showToast?.('Acesso Negado', 'Você não tem permissão para mover fases deste lead.', 'error');
      return;
    }
    const leadId = e.dataTransfer.getData('leadId');
    
    // Map from Portuguese column name back to English db status
    const dbStatusMap: Record<string, string> = {
      'Novo': 'new',
      'Em Contato': 'contacted',
      'Reunião Agendada': 'scheduling',
      'Proposta Enviada': 'proposal',
      'Convertido': 'closed',
      'Perdido': 'lost'
    };
    const dbStatus = dbStatusMap[newStatus] || newStatus;

    if (leadId) {
      updateLeadStatus(leadId, dbStatus);
    }
  };

  const selectedLead = leads.find(l => l.id === expandedLead);

  return (
    <div className="page active">
      <div className="u-mb-16">
        <div className="u-mono-label-xs">{leads.length} leads atribuídos</div>
        <div className="u-syne-title u-mt-3">Leads Atribuídos</div>
      </div>
      
      {leads.length === 0 && !loadingDb && (
        <div className="card">
          <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
            <div className="u-emoji-icon">🎯</div>
            <div style={{fontSize:'0.9rem',marginBottom:6}}>Nenhum lead atribuído a você no momento</div>
            <div style={{fontSize:'0.75rem'}}>Quando a equipe Bravo encaminhar clientes potenciais, eles aparecerão aqui para você gerenciar</div>
          </div>
        </div>
      )}

      {leads.length > 0 && (() => {
        const normalizeStatus = (s: string) => {
          if (!s) return 'Novo';
          const lower = s.toLowerCase();
          if (lower === 'new') return 'Novo';
          if (lower === 'contacted') return 'Em Contato';
          if (lower === 'scheduling') return 'Reunião Agendada';
          if (lower === 'proposal') return 'Proposta Enviada';
          if (lower === 'closed') return 'Convertido';
          if (lower === 'lost') return 'Perdido';
          return s; // Fallback para o valor literal
        };

        return (
          <div className="kanban">
            {leadStatuses.map(statusGroup => {
              const colLeads = leads.filter(l => normalizeStatus(l.status) === statusGroup);
              
              return (
              <div 
                className="kol" 
                key={statusGroup}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, statusGroup)}
              >
                <div className="kol-h">
                  {statusGroup}
                  <span className="kol-n" style={
                    statusGroup === 'Convertido' ? { background: 'var(--green)', color: '#fff' } :
                    statusGroup === 'Perdido' ? { background: 'var(--red)', color: '#fff' } :
                    {}
                  }>
                    {colLeads.length}
                  </span>
                </div>
                
                {colLeads.map((l: any) => (
                  <div 
                    className="lead-c" 
                    draggable 
                    key={l.id}
                    onDragStart={(e) => handleDragStart(e, l.id)}
                    onClick={() => setExpandedLead(l.id)}
                  >
                    <div className="lc-name" style={{display:'flex', alignItems:'center', gap: 6}}>
                       <div style={{width:6,height:6,borderRadius:'50%',background:getUrgencyColor(l.urgency || ''),flexShrink:0}}></div>
                       {l.name || 'Sem nome'}
                    </div>
                    <div className="lc-srv">{l.service_type || 'Serviço'} · {l.city || 'Cidade n/d'}</div>
                    <div className="lc-foot">
                      <span className="lc-val">{l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : ''}</span>
                      {l.urgency === 'hot' || l.urgency === 'alta' ? <span className="urg hot">Alta</span> : null}
                      {l.urgency === 'warm' || l.urgency === 'media' ? <span className="urg warm">Média</span> : null}
                      {l.urgency === 'cool' || l.urgency === 'baixa' ? <span className="urg cool">Baixa</span> : null}
                    </div>
                  </div>
                ))}
                
                {colLeads.length === 0 && <div className="empty-state" style={{ fontSize: '0.8rem', padding: '10px' }}>Vazio</div>}
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* POPUP (MODAL) DO LEAD */}
      {selectedLead && (
        <div className="modal-overlay open" onClick={() => setExpandedLead(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title" style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:getUrgencyColor(selectedLead.urgency || '')}}></div>
                  {selectedLead.name || 'Sem nome'}
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)',marginTop:4}}>
                  {selectedLead.service_type || 'Serviço'} · {selectedLead.city || 'Cidade n/d'} · {selectedLead.source || 'Manual'}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)'}}>
                  {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('pt-BR') : ''}
                </span>
                <button aria-label="Fechar" style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'1.2rem'}} onClick={() => setExpandedLead(null)}>✕</button>
              </div>
            </div>
            
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Telefone</div>
                  <div style={{fontSize:'1rem',fontWeight:600}}>{selectedLead.phone || 'Não informado'}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>E-mail</div>
                  <div style={{fontSize:'1rem',fontWeight:600,wordBreak:'break-all'}}>{selectedLead.email || 'Não informado'}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Urgência</div>
                  <div style={{fontSize:'0.9rem',fontWeight:600,color:getUrgencyColor(selectedLead.urgency || '')}}>
                    {selectedLead.urgency === 'alta' || selectedLead.urgency === 'hot' ? '🔴 Alta' : selectedLead.urgency === 'media' || selectedLead.urgency === 'warm' ? '🟠 Média' : '🟢 Baixa'}
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Serviço</div>
                  <div style={{fontSize:'0.9rem',fontWeight:600}}>{selectedLead.service_type || 'N/D'}</div>
                </div>
              </div>
              
              <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
                  {selectedLead.phone && <a href={`sms:${selectedLead.phone}`} className="btn gold u-btn-link">💬 SMS</a>}
                  {selectedLead.phone && <a href={`tel:${selectedLead.phone}`} className="btn ghost u-btn-link">📞 Call</a>}
                  {selectedLead.phone && <a href={`https://wa.me/1${selectedLead.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn ghost u-btn-link">📱 WhatsApp</a>}
                  {selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="btn ghost u-btn-link">✉️ E-mail</a>}
              </div>
              
              <div className="u-mb-14">
                  <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:6}}>Observações</label>
                  <textarea className="f-inp" style={{resize:'vertical',minHeight:90}} placeholder="Anote informações sobre este lead..." value={leadNotes[selectedLead.id] !== undefined ? leadNotes[selectedLead.id] : (selectedLead.notes || '')} onChange={e => setLeadNotes(prev => ({...prev, [selectedLead.id]: e.target.value}))}></textarea>
                  {leadNotes[selectedLead.id] !== undefined && leadNotes[selectedLead.id] !== (selectedLead.notes || '') && (
                    <button className="btn gold" style={{marginTop:8,fontSize:'0.75rem',padding:'6px 16px'}} onClick={() => { if (canEditNotes) saveLeadNotes(selectedLead.id); else showToast?.('Acesso Negado', 'Sem permissão para editar observações.', 'error'); }}>💾 Salvar observações</button>
                  )}
              </div>
            </div>
            
            <div className="modal-foot" style={{justifyContent:'flex-end'}}>
                <button className="btn ghost" style={{fontSize:'0.75rem',padding:'6px 14px',color:'var(--red)'}} onClick={() => {
                  if (!canDelete) { showToast?.('Acesso Negado', 'Sem permissão para remover lead.', 'error'); return; }
                  deleteLead(selectedLead.id);
                  setExpandedLead(null);
                }}>🗑 Remover lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
